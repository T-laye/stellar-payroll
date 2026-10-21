import { read, update, type Asset, type MockDb, type MockLineItem, type MockRun, type MockTransaction } from "../db";
import { retotal, retryTransaction, startRun } from "../engine";
import { notifyRun } from "../notify";
import { HttpError, me, need, ok, route, type Ctx } from "../router";
import { employeeWallet, found, required, str, txDto } from "../present";
import { iso, money, uuid } from "../util";

/**
 * /payroll/*, /transactions/*: the run lifecycle DRAFT → APPROVED → PROCESSING → COMPLETED | FAILED
 * (FAILED → RETRYING → …), line items, the pre-payment compliance check, and payments.
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

/** A line item for one employee, at their salary and current wallet. */
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

/** Proposed: runs also say how many people they pay and how their payments stand. */
function runDto(db: MockDb, run: MockRun) {
	const txs = db.transactions.filter((t) => t.payroll_run_id === run.id);
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

/**
 * Proposed (docs/PLAN.md §2, item 4): approving or executing refuses a run that would fail for
 * missing information, naming who needs fixing.
 */
function requireComplete(db: MockDb, run: MockRun) {
	const missing = db.lineItems
		.filter((i) => i.payroll_run_id === run.id && !i.wallet_address)
		.map((i) => withEmployee(db, i).employee_name);
	if (missing.length)
		throw new HttpError(
			409,
			`${missing.length} employee${missing.length === 1 ? " has" : "s have"} no wallet: ${missing.join(", ")}. Add their wallets or remove them from this run.`,
		);
}

const draftOnly = (run: MockRun) => {
	if (run.status !== "DRAFT") throw new HttpError(409, "only DRAFT runs can be changed");
};

// ---- Runs ----

route("GET", "/payroll/runs", "user", (ctx) => {
	need(ctx, "payroll:read");
	const db = read();
	// Proposed filter (docs/PLAN.md §2): one status or a comma-separated list.
	const statuses = ctx.query.get("status")?.split(",").filter(Boolean) ?? [];
	return ok(
		db.runs
			.filter((r) => r.company_id === me(ctx).company_id && (statuses.length === 0 || statuses.includes(r.status)))
			.sort((a, b) => b.scheduled_at.localeCompare(a.scheduled_at))
			.map((r) => runDto(db, r)),
	);
});

/**
 * Assumption (docs/PLAN.md, open question): a run created for a group starts with a line item for
 * each ACTIVE employee in it. The live API may need them added through /line-items.
 */
route("POST", "/payroll/runs", "user", (ctx) => {
	need(ctx, "payroll:create");
	required(ctx.body, "currency", "period_start", "period_end", "scheduled_at");
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
			total_amount: "0.00",
			created_by: me(ctx).id,
			approved_by: null,
			approved_at: null,
			executed_at: null,
			created_at: now,
			updated_at: now,
		};
		r.stellar_memo = `PO-${r.id.slice(0, 8).toUpperCase()}`;
		for (const e of db.employees.filter((x) => x.group_id === r.group_id && x.group_id && x.status === "ACTIVE")) {
			db.lineItems.push(lineItem(db, r, e.id));
		}
		retotal(db, r);
		db.runs.push(r);
		audit(db, ctx, "payroll_run.created", r.id);
		notifyRun(db, r, "review", Date.now(), me(ctx).id);
		return r;
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
		return r;
	});
	return ok(run, "payroll run updated");
});

route("POST", "/payroll/runs/:id/approve", "user", (ctx) => {
	need(ctx, "payroll:approve");
	const run = update((db) => {
		const r = runIn(db, ctx);
		if (r.status !== "DRAFT") throw new HttpError(404, "payroll run not found or not in DRAFT state");
		if (!db.lineItems.some((i) => i.payroll_run_id === r.id))
			throw new HttpError(409, "add at least one employee before approving");
		requireComplete(db, r);
		r.status = "APPROVED";
		r.approved_by = me(ctx).id;
		r.approved_at = iso(Date.now());
		r.updated_at = r.approved_at;
		audit(db, ctx, "payroll_run.approved", r.id);
		return r;
	});
	return ok(run, "payroll run approved");
});

/** The live API sets a cancelled run to FAILED. */
route("POST", "/payroll/runs/:id/cancel", "user", (ctx) => {
	need(ctx, "payroll:cancel");
	const run = update((db) => {
		const r = runIn(db, ctx);
		if (r.status !== "DRAFT" && r.status !== "APPROVED") throw new HttpError(409, "only DRAFT or APPROVED runs can be cancelled");
		r.status = "FAILED";
		r.notes = r.notes ? `${r.notes} (cancelled)` : "Cancelled before payment.";
		r.updated_at = iso(Date.now());
		audit(db, ctx, "payroll_run.cancelled", r.id);
		return r;
	});
	return ok(run, "payroll run cancelled");
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
		db.transactions
			.filter((t) => t.payroll_run_id === run.id)
			.sort((a, b) => a.created_at.localeCompare(b.created_at))
			.map((t) => txRow(db, t)),
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
	required(ctx.body, "employee_id");
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
	return ok(null, "line item removed");
});

// ---- Compliance check ----

function check(db: MockDb, run: MockRun) {
	const items = db.lineItems.filter((i) => i.payroll_run_id === run.id);
	const missing = items.filter((i) => !i.wallet_address).map((i) => withEmployee(db, i).employee_name);
	const nonPositive = items.filter((i) => !(Number(i.amount) > 0)).length;
	const checks = [
		{
			name: "wallet_addresses_present",
			status: missing.length ? ("FAILED" as const) : ("PASSED" as const),
			details: missing.length
				? `Missing a Stellar wallet: ${missing.join(", ")}.`
				: "Every line item has a Stellar wallet address.",
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

/** Proposed (docs/PLAN.md §2): who and which run a payment belongs to, for lists. */
function txRow(db: MockDb, t: MockTransaction) {
	const e = db.employees.find((x) => x.id === t.employee_id);
	const run = db.runs.find((r) => r.id === t.payroll_run_id);
	return { ...txDto(t), employee_name: e ? `${e.first_name} ${e.last_name}` : "", payroll_run_name: run?.name ?? "" };
}

/**
 * Filters and pagination are a proposal (docs/PLAN.md §2); the live endpoint returns the latest 50.
 * `status` takes a comma-separated list; `from` / `to` are dates (YYYY-MM-DD, inclusive); `q`
 * matches the transaction hash or the employee's name.
 */
route("GET", "/transactions", "user", (ctx) => {
	need(ctx, "payroll:read");
	const q = ctx.query;
	const db = read();
	const statuses = q.get("status")?.split(",").filter(Boolean) ?? [];
	const from = q.get("from");
	const to = q.get("to");
	const search = q.get("q")?.trim().toLowerCase();
	const list = db.transactions
		.filter(
			(t) =>
				t.company_id === me(ctx).company_id &&
				(statuses.length === 0 || statuses.includes(t.status)) &&
				(!q.get("employee_id") || t.employee_id === q.get("employee_id")) &&
				(!q.get("payroll_run_id") || t.payroll_run_id === q.get("payroll_run_id")) &&
				(!from || t.created_at.slice(0, 10) >= from) &&
				(!to || t.created_at.slice(0, 10) <= to),
		)
		.map((t) => txRow(db, t))
		.filter(
			(t) =>
				!search || (t.stellar_tx_hash ?? "").toLowerCase().includes(search) || t.employee_name.toLowerCase().includes(search),
		)
		.sort((a, b) => b.created_at.localeCompare(a.created_at));
	const page = Math.max(1, Number(q.get("page")) || 1);
	const pageSize = Math.min(100, Math.max(1, Number(q.get("page_size")) || 50));
	return { ...ok(list.slice((page - 1) * pageSize, page * pageSize)), meta: { page, page_size: pageSize, total: list.length } };
});

route("GET", "/transactions/:id", "user", (ctx) => {
	need(ctx, "payroll:read");
	const db = read();
	return ok(
		txRow(
			db,
			found(
				db.transactions.find((t) => t.id === ctx.params.id && t.company_id === me(ctx).company_id),
				"transaction",
			),
		),
	);
});

route("POST", "/transactions/:id/retry", "user", (ctx) => {
	need(ctx, "payroll:execute");
	const tx = update((db) => {
		const t = db.transactions.find((x) => x.id === ctx.params.id && x.company_id === me(ctx).company_id && x.status === "FAILED");
		if (!t) throw new HttpError(404, "transaction not found or not in FAILED state");
		if (t.retry_count >= 3) throw new HttpError(409, "this payment has used all 3 retries");
		retryTransaction(db, t);
		return t;
	});
	return ok({ id: tx.id, status: tx.status }, "transaction queued for retry");
});
