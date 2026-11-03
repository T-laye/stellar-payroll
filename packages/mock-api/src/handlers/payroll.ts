import { read, update, type Asset, type MockDb, type MockLineItem, type MockRun, type MockTransaction } from "../db";
import { livePayments, retotal, retryTransaction, startRun } from "../engine";
import { notifyRun } from "../notify";
import { effectivePermissions } from "../permissions";
import { HttpError, NO_CONTENT, me, need, ok, paged, route, type Ctx } from "../router";
import { MAX_ATTEMPTS, employeeWallet, found, isRetryable, required, requireTimestamp, str, txDto } from "../present";
import { iso, money, uuid } from "../util";

/**
 * /payroll/*, /transactions/*, as frontend-integration.md describes them: the run lifecycle
 * DRAFT → APPROVED → PROCESSING → COMPLETED | FAILED (FAILED → RETRYING → …, CANCELLED before
 * payment), line items, the review, approval checks, payments and retries.
 */

const audit = (db: MockDb, ctx: Ctx, action: string, resourceId: string) => {
	db.auditLogs.unshift({
		id: uuid(),
		company_id: me(ctx).company_id,
		user_id: me(ctx).id,
		action,
		resource_type: "payroll_run",
		resource_id: resourceId,
		created_at: iso(Date.now()),
	});
};

const runIn = (db: MockDb, ctx: Ctx) =>
	found(
		db.runs.find((r) => r.id === ctx.params.id && r.company_id === me(ctx).company_id),
		"payroll run",
	);

/** A line item for one employee, at their salary (or the amount given) and current wallet. */
function lineItem(
	db: MockDb,
	run: MockRun,
	employeeId: string,
	amount?: unknown,
	notes?: unknown,
	walletAddress?: unknown,
): MockLineItem {
	const employee = found(
		db.employees.find((e) => e.id === employeeId && e.company_id === run.company_id),
		"employee",
	);
	if (db.lineItems.some((i) => i.payroll_run_id === run.id && i.employee_id === employeeId)) {
		throw new HttpError(409, `${employee.first_name} ${employee.last_name} is already in this run`);
	}
	const value = amount === undefined ? Number(employee.salary_amount) : Number(amount);
	if (!(value > 0)) throw new HttpError(422, "amount must be greater than zero");
	return {
		id: uuid(),
		company_id: run.company_id,
		payroll_run_id: run.id,
		employee_id: employee.id,
		amount: money(value),
		currency: run.currency,
		wallet_address: str(walletAddress) || employeeWallet(db, employee.id)?.stellar_address || "",
		notes: str(notes),
		status: "PENDING",
		transaction_id: null,
		created_at: iso(Date.now()),
	};
}

function withEmployee(db: MockDb, item: MockLineItem) {
	const e = db.employees.find((x) => x.id === item.employee_id);
	return {
		...item,
		employee_name: e ? `${e.first_name} ${e.last_name}` : "",
		employee_email: e?.email ?? "",
		employee_number: e?.employee_number ?? "",
	};
}

/** Runs carry their headcount and how their payments stand, so a progress bar needs no second call. */
function runDto(db: MockDb, run: MockRun) {
	const txs = livePayments(db).filter((t) => t.payroll_run_id === run.id);
	return {
		...run,
		employee_count: db.lineItems.filter((i) => i.payroll_run_id === run.id).length,
		payments: {
			confirmed: txs.filter((t) => t.status === "CONFIRMED").length,
			pending: txs.filter((t) => t.status === "PENDING" || t.status === "SUBMITTED").length,
			failed: txs.filter((t) => t.status === "FAILED").length,
		},
	};
}

/** What stops a line item being paid: no wallet, or an employee who isn't active. */
function issueOf(db: MockDb, item: MockLineItem) {
	const e = db.employees.find((x) => x.id === item.employee_id);
	if (!item.wallet_address) return "No wallet linked";
	if (e && e.status !== "ACTIVE") return e.status === "PENDING" ? "Employee is pending" : "Employee is not active";
	if (!(Number(item.amount) > 0)) return "Amount must be greater than zero";
	return null;
}

function issues(db: MockDb, run: MockRun) {
	const people: { employee_id?: string; employee_name?: string; reason: string }[] = db.lineItems
		.filter((i) => i.payroll_run_id === run.id)
		.map((i) => ({ item: i, reason: issueOf(db, i) }))
		.filter((x) => x.reason)
		.map(({ item, reason }) => ({ employee_id: item.employee_id, employee_name: withEmployee(db, item).employee_name, reason: reason! }));
	const canPay = db.wallets.some((w) => w.owner_type === "COMPANY" && w.owner_id === run.company_id && w.wallet_type === "OPERATIONAL");
	return canPay ? people : [...people, { reason: "Company has no operational wallet. Create or import one with its secret key before paying." }];
}

/** Approve and execute refuse an incomplete run: 409 with `data.issues[]`. */
function requireComplete(db: MockDb, run: MockRun) {
	const found = issues(db, run);
	if (found.length) {
		throw new HttpError(409, "payroll run has incomplete payment information", { issues: found });
	}
}

const draftOnly = (run: MockRun) => {
	if (run.status !== "DRAFT") throw new HttpError(409, "only DRAFT runs can be changed");
};

/** `?status=DRAFT,APPROVED`, or the friendly aliases. */
function runStatuses(raw: string | null) {
	const aliases: Record<string, string[]> = { pending: ["DRAFT"], scheduled: ["APPROVED"], processing: ["PROCESSING", "RETRYING"] };
	return (raw?.split(",").filter(Boolean) ?? []).flatMap((s) => aliases[s.toLowerCase()] ?? [s.toUpperCase()]);
}

// ---- Runs ----

route("GET", "/payroll/runs", "user", (ctx) => {
	need(ctx, "payroll:read");
	const db = read();
	const statuses = runStatuses(ctx.query.get("status"));
	return paged(
		ctx,
		db.runs
			.filter((r) => r.company_id === me(ctx).company_id && (statuses.length === 0 || statuses.includes(r.status)))
			.sort((a, b) => b.created_at.localeCompare(a.created_at))
			.map((r) => runDto(db, r)),
	);
});

/** A run created with `group_id` does not get that group's employees: the client adds line items. */
route("POST", "/payroll/runs", "user", (ctx) => {
	need(ctx, "payroll:create");
	required(ctx.body, "currency", "period_start", "period_end", "scheduled_at");
	requireTimestamp(ctx.body, "period_start", "period_end", "scheduled_at");
	const scheduledAt = Date.parse(str(ctx.body.scheduled_at));
	if (Number.isNaN(scheduledAt)) throw new HttpError(400, "scheduled_at must be an RFC3339 timestamp");
	if (scheduledAt <= Date.now()) throw new HttpError(400, "scheduled_at must be in the future");
	const run = update((db) => {
		const now = iso(Date.now());
		const r: MockRun = {
			id: uuid(),
			company_id: me(ctx).company_id,
			name: str(ctx.body.name),
			group_id: str(ctx.body.group_id),
			schedule_id: null,
			currency: str(ctx.body.currency) as Asset,
			notes: str(ctx.body.notes),
			period_start: str(ctx.body.period_start),
			period_end: str(ctx.body.period_end),
			scheduled_at: iso(scheduledAt),
			status: "DRAFT",
			stellar_memo: null,
			total_amount: money(0),
			created_by: me(ctx).id,
			approved_by: null,
			approved_at: null,
			executed_at: null,
			completed_at: null,
			created_at: now,
			updated_at: now,
		};
		r.stellar_memo = `PO-${r.id.slice(0, 8).toUpperCase()}`;
		db.runs.push(r);
		audit(db, ctx, "payroll_run.created", r.id);
		notifyRun(db, r, "review", Date.now(), me(ctx).id);
		return runDto(db, r);
	});
	return ok(run, "payroll run created", 201);
});

route("GET", "/payroll/runs/:id", "user", (ctx) => {
	need(ctx, "payroll:read");
	const db = read();
	return ok(runDto(db, runIn(db, ctx)));
});

route("PATCH", "/payroll/runs/:id", "user", (ctx) => {
	need(ctx, "payroll:update", "payroll:create");
	const run = update((db) => {
		const r = runIn(db, ctx);
		draftOnly(r);
		if (ctx.body.name !== undefined) r.name = str(ctx.body.name);
		if (ctx.body.notes !== undefined) r.notes = str(ctx.body.notes);
		if (ctx.body.scheduled_at !== undefined) {
			const at = Date.parse(str(ctx.body.scheduled_at));
			if (Number.isNaN(at) || at <= Date.now()) throw new HttpError(400, "scheduled_at must be in the future");
			r.scheduled_at = iso(at);
		}
		r.updated_at = iso(Date.now());
		return runDto(db, r);
	});
	return ok(run, "payroll run updated");
});

/** Drives the review screen: totals, per-employee issues, the network estimate, and whether it can be approved. */
route("GET", "/payroll/runs/:id/review", "user", (ctx) => {
	need(ctx, "payroll:read");
	const db = read();
	const run = runIn(db, ctx);
	const items = db.lineItems.filter((i) => i.payroll_run_id === run.id).map((i) => ({ ...withEmployee(db, i), issue: issueOf(db, i) }));
	const found = issues(db, run);
	return ok({
		run_id: run.id,
		employee_count: items.length,
		total_amount: money(items.reduce((sum, i) => sum + Number(i.amount), 0)),
		asset: run.currency,
		items,
		estimated_transactions: Math.max(1, Math.ceil(items.length / 100)),
		estimated_fee_xlm: (items.length * 0.00001).toFixed(7),
		issues: found,
		ready: items.length > 0 && found.length === 0,
	});
});

/**
 * Four-eyes: a run's creator can't approve it when another active user can; a company with a
 * single approver can self-approve.
 */
function requireFourEyes(db: MockDb, ctx: Ctx, run: MockRun) {
	if (run.created_by !== me(ctx).id) return;
	const otherApprover = db.users.some((u) => {
		if (u.id === me(ctx).id || u.company_id !== run.company_id || !u.is_active) return false;
		const permissions = effectivePermissions(db, u.id);
		return permissions.includes("*") || permissions.includes("payroll:approve");
	});
	if (otherApprover) throw new HttpError(403, "you created this run, so another approver must approve it");
}

route("POST", "/payroll/runs/:id/approve", "user", (ctx) => {
	need(ctx, "payroll:approve");
	const run = update((db) => {
		const r = runIn(db, ctx);
		if (r.status !== "DRAFT") throw new HttpError(404, "payroll run not found or not in DRAFT state");
		if (!db.lineItems.some((i) => i.payroll_run_id === r.id)) throw new HttpError(409, "add at least one employee before approving");
		requireFourEyes(db, ctx, r);
		requireComplete(db, r);
		r.status = "APPROVED";
		r.approved_by = me(ctx).id;
		r.approved_at = iso(Date.now());
		r.updated_at = r.approved_at;
		audit(db, ctx, "payroll_run.approved", r.id);
		return runDto(db, r);
	});
	return ok(run, "payroll run approved");
});

/** Cancels a run that hasn't started paying (DRAFT or APPROVED) → CANCELLED, 204. */
route("POST", "/payroll/runs/:id/cancel", "user", (ctx) => {
	need(ctx, "payroll:cancel");
	update((db) => {
		const r = runIn(db, ctx);
		if (r.status !== "DRAFT" && r.status !== "APPROVED") throw new HttpError(404, "payroll run not found or already processing");
		r.status = "CANCELLED";
		r.updated_at = iso(Date.now());
		audit(db, ctx, "payroll_run.cancelled", r.id);
	});
	return NO_CONTENT;
});

route("POST", "/payroll/runs/:id/execute", "user", (ctx) => {
	need(ctx, "payroll:execute");
	const run = update((db) => {
		const r = runIn(db, ctx);
		if (r.status !== "APPROVED") throw new HttpError(409, "run is not in APPROVED state");
		requireComplete(db, r);
		startRun(db, r);
		audit(db, ctx, "payroll_run.executed", r.id);
		return r;
	});
	return ok({ id: run.id, status: run.status }, "payroll run is processing");
});

route("GET", "/payroll/runs/:id/transactions", "user", (ctx) => {
	need(ctx, "payroll:read");
	const db = read();
	const run = runIn(db, ctx);
	return ok(
		livePayments(db)
			.filter((t) => t.payroll_run_id === run.id)
			.sort((a, b) => a.created_at.localeCompare(b.created_at))
			.map((t) => txDto(db, t)),
	);
});

/** DRAFT and APPROVED runs still to come, soonest first. */
route("GET", "/payroll/schedule", "user", (ctx) => {
	need(ctx, "payroll:read");
	const now = Date.now();
	return ok(
		read()
			.runs.filter(
				(r) =>
					r.company_id === me(ctx).company_id &&
					(r.status === "DRAFT" || r.status === "APPROVED") &&
					Date.parse(r.scheduled_at) > now,
			)
			.sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at)),
	);
});

// ---- Line items ----

route("GET", "/payroll/runs/:id/line-items", "user", (ctx) => {
	need(ctx, "payroll:read");
	const db = read();
	const run = runIn(db, ctx);
	return ok(db.lineItems.filter((i) => i.payroll_run_id === run.id).map((i) => withEmployee(db, i)));
});

route("GET", "/payroll/runs/:id/line-items/:itemId", "user", (ctx) => {
	need(ctx, "payroll:read");
	const db = read();
	const run = runIn(db, ctx);
	return ok(
		withEmployee(
			db,
			found(
				db.lineItems.find((i) => i.id === ctx.params.itemId && i.payroll_run_id === run.id),
				"line item",
			),
		),
	);
});

route("POST", "/payroll/runs/:id/line-items", "user", (ctx) => {
	need(ctx, "payroll:create");
	required(ctx.body, "employee_id", "amount");
	const item = update((db) => {
		const run = runIn(db, ctx);
		draftOnly(run);
		const i = lineItem(db, run, str(ctx.body.employee_id), ctx.body.amount, ctx.body.notes, ctx.body.wallet_address);
		db.lineItems.push(i);
		retotal(db, run);
		return withEmployee(db, i);
	});
	return ok(item, "line item added", 201);
});

route("POST", "/payroll/runs/:id/line-items/bulk", "user", (ctx) => {
	need(ctx, "payroll:create");
	const items = Array.isArray(ctx.body.items) ? (ctx.body.items as Record<string, unknown>[]) : [];
	if (items.length === 0 || items.length > 100) throw new HttpError(422, "items must contain 1 to 100 line items");
	const added = update((db) => {
		const run = runIn(db, ctx);
		draftOnly(run);
		// Atomic: build them all first, so one bad item adds none.
		const built = items.map((i) => lineItem(db, run, str(i.employee_id), i.amount, i.notes, i.wallet_address));
		if (new Set(built.map((i) => i.employee_id)).size !== built.length) throw new HttpError(409, "duplicate employee in items");
		db.lineItems.push(...built);
		retotal(db, run);
		return built.map((i) => withEmployee(db, i));
	});
	return ok(added, "line items added", 201);
});

route("PATCH", "/payroll/runs/:id/line-items/:itemId", "user", (ctx) => {
	need(ctx, "payroll:update", "payroll:create");
	const item = update((db) => {
		const run = runIn(db, ctx);
		draftOnly(run);
		const i = found(
			db.lineItems.find((x) => x.id === ctx.params.itemId && x.payroll_run_id === run.id),
			"line item",
		);
		if (ctx.body.amount !== undefined) {
			if (!(Number(ctx.body.amount) > 0)) throw new HttpError(422, "amount must be greater than zero");
			i.amount = money(Number(ctx.body.amount));
		}
		if (ctx.body.notes !== undefined) i.notes = str(ctx.body.notes);
		if (ctx.body.wallet_address !== undefined) i.wallet_address = str(ctx.body.wallet_address);
		retotal(db, run);
		return withEmployee(db, i);
	});
	return ok(item, "line item updated");
});

route("DELETE", "/payroll/runs/:id/line-items/:itemId", "user", (ctx) => {
	need(ctx, "payroll:update", "payroll:create");
	update((db) => {
		const run = runIn(db, ctx);
		draftOnly(run);
		found(
			db.lineItems.find((x) => x.id === ctx.params.itemId && x.payroll_run_id === run.id),
			"line item",
		);
		db.lineItems = db.lineItems.filter((x) => x.id !== ctx.params.itemId);
		retotal(db, run);
	});
	return NO_CONTENT;
});

// ---- Compliance check (kept; the review route covers the same ground) ----

function check(db: MockDb, run: MockRun) {
	const items = db.lineItems.filter((i) => i.payroll_run_id === run.id);
	const missing = items.filter((i) => !i.wallet_address).map((i) => withEmployee(db, i).employee_name);
	const nonPositive = items.filter((i) => !(Number(i.amount) > 0)).length;
	const checks = [
		{
			name: "wallet_addresses_present",
			status: missing.length ? ("FAILED" as const) : ("PASSED" as const),
			details: missing.length ? `Missing a Stellar wallet: ${missing.join(", ")}.` : "Every line item has a Stellar wallet address.",
		},
		{
			name: "amounts_positive",
			status: nonPositive ? ("FAILED" as const) : ("PASSED" as const),
			details: nonPositive ? `${nonPositive} line item(s) have no amount.` : "Every line item amount is greater than zero.",
		},
	];
	return {
		id: uuid(),
		payroll_run_id: run.id,
		status: checks.every((c) => c.status === "PASSED") ? ("PASSED" as const) : ("FAILED" as const),
		checks,
		checked_at: iso(Date.now()),
	};
}

route("POST", "/payroll/runs/:id/compliance-check", "user", (ctx) => {
	need(ctx, "compliance:run", "payroll:approve");
	const result = update((db) => {
		const run = runIn(db, ctx);
		const c = check(db, run);
		db.complianceChecks = db.complianceChecks.filter((x) => x.payroll_run_id !== run.id);
		db.complianceChecks.push(c);
		return c;
	});
	return ok(result, "compliance check complete");
});

route("GET", "/payroll/runs/:id/compliance-check", "user", (ctx) => {
	need(ctx, "payroll:read");
	const db = read();
	const run = runIn(db, ctx);
	return ok(
		found(
			db.complianceChecks.find((c) => c.payroll_run_id === run.id),
			"compliance check",
		),
	);
});

// ---- Transactions ----

/** `from` / `to` take YYYY-MM-DD (midnight UTC) or RFC 3339; `to` is exclusive. */
const boundary = (value: string | null) => {
	if (!value) return null;
	const ms = Date.parse(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00Z` : value);
	if (Number.isNaN(ms)) throw new HttpError(400, `invalid date: ${value}`);
	return ms;
};

/**
 * `status` (comma list), `employee_id`, `payroll_run_id`, `from`, `to` (exclusive), `q` (the start of
 * the Stellar hash, or part of the employee's name), `page`, `page_size`. Retried-away attempts are
 * left out; they live in the new payment's `attempts`.
 */
route("GET", "/transactions", "user", (ctx) => {
	need(ctx, "payroll:read");
	const q = ctx.query;
	const db = read();
	const statuses = q.get("status")?.split(",").filter(Boolean) ?? [];
	const from = boundary(q.get("from"));
	const to = boundary(q.get("to"));
	const search = q.get("q")?.trim().toLowerCase();
	const list = livePayments(db)
		.filter(
			(t) =>
				t.company_id === me(ctx).company_id &&
				(statuses.length === 0 || statuses.includes(t.status)) &&
				(!q.get("employee_id") || t.employee_id === q.get("employee_id")) &&
				(!q.get("payroll_run_id") || t.payroll_run_id === q.get("payroll_run_id")) &&
				(from === null || Date.parse(t.created_at) >= from) &&
				(to === null || Date.parse(t.created_at) < to),
		)
		.map((t) => txDto(db, t))
		.filter((t) => !search || (t.stellar_tx_hash ?? "").toLowerCase().startsWith(search) || t.employee_name.toLowerCase().includes(search))
		.sort((a, b) => b.created_at.localeCompare(a.created_at));
	return paged(ctx, list);
});

route("GET", "/transactions/:id", "user", (ctx) => {
	need(ctx, "payroll:read");
	const db = read();
	const tx = found(
		db.transactions.find((t) => t.id === ctx.params.id && t.company_id === me(ctx).company_id),
		"transaction",
	);
	return ok(txDto(db, tx, { attempts: true }));
});

/** One failed payment → a new attempt (new id and hash), 202. */
function retry(db: MockDb, tx: MockTransaction | undefined) {
	if (!tx || tx.status !== "FAILED" || tx.superseded_by) throw new HttpError(404, "transaction not found or not in FAILED state");
	if (!isRetryable(tx)) throw new HttpError(409, `this payment has used all ${MAX_ATTEMPTS} attempts`);
	return retryTransaction(db, tx);
}

route("POST", "/transactions/:id/retry", "user", (ctx) => {
	need(ctx, "payroll:execute");
	const next = update((db) => retry(db, db.transactions.find((x) => x.id === ctx.params.id && x.company_id === me(ctx).company_id)));
	return ok({ id: next.id, status: next.status, retried_from: ctx.params.id }, "payment queued for retry", 202);
});

route("POST", "/payroll/runs/:id/line-items/:itemId/retry", "user", (ctx) => {
	need(ctx, "payroll:execute");
	const next = update((db) => {
		const run = runIn(db, ctx);
		const item = found(
			db.lineItems.find((i) => i.id === ctx.params.itemId && i.payroll_run_id === run.id),
			"line item",
		);
		return retry(db, db.transactions.find((t) => t.id === item.transaction_id));
	});
	return ok({ id: next.id, status: next.status }, "payment queued for retry", 202);
});

/** Every retryable failed payment in the run. */
route("POST", "/payroll/runs/:id/retry-failed", "user", (ctx) => {
	need(ctx, "payroll:execute");
	const retried = update((db) => {
		const run = runIn(db, ctx);
		const failed = livePayments(db).filter((t) => t.payroll_run_id === run.id && isRetryable(t));
		if (failed.length === 0) throw new HttpError(409, "no failed payments can be retried");
		return failed.map((t) => retryTransaction(db, t).id);
	});
	return ok({ retried: retried.length, transaction_ids: retried }, "failed payments queued for retry", 202);
});
