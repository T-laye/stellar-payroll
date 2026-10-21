import { read, type MockDb } from "../db";
import { companyOf, me, need, ok, route } from "../router";
import { employeeOfUser } from "../present";
import { DAY, money } from "../util";

/** /companies/{id}/stats/* and /users/me/stats, computed from the data so they always agree with the lists. */

const sum = (values: string[]) => values.reduce((total, v) => total + Number(v), 0);
const thisMonth = (date: string | null) => !!date && date.slice(0, 7) === new Date().toISOString().slice(0, 7);
const countBy = <T>(list: T[], key: (item: T) => string) =>
	list.reduce<Record<string, number>>((acc, item) => {
		acc[key(item)] = (acc[key(item)] ?? 0) + 1;
		return acc;
	}, {});

function scope(db: MockDb, companyId: string) {
	return {
		employees: db.employees.filter((e) => e.company_id === companyId),
		runs: db.runs.filter((r) => r.company_id === companyId),
		txs: db.transactions.filter((t) => t.company_id === companyId),
		companyWallets: db.wallets.filter((w) => w.owner_type === "COMPANY" && w.owner_id === companyId),
		employeeWallets: db.wallets.filter((w) => w.owner_type === "EMPLOYEE" && w.company_id === companyId),
	};
}

const hasWallet = (db: MockDb, employeeId: string) =>
	db.wallets.some((w) => w.owner_type === "EMPLOYEE" && w.owner_id === employeeId);

route("GET", "/companies/:id/stats/overview", "user", (ctx) => {
	const id = companyOf(ctx);
	const db = read();
	const { employees, runs, txs, companyWallets } = scope(db, id);
	const confirmed = txs.filter((t) => t.status === "CONFIRMED");
	const current = employees.filter((e) => e.status !== "TERMINATED");
	return ok({
		employees: {
			total: employees.length,
			active: employees.filter((e) => e.status === "ACTIVE").length,
			inactive: employees.filter((e) => e.status === "INACTIVE").length,
			terminated: employees.filter((e) => e.status === "TERMINATED").length,
		},
		payroll: {
			completed_runs: runs.filter((r) => r.status === "COMPLETED").length,
			pending_runs: runs.filter((r) => r.status === "DRAFT" || r.status === "APPROVED").length,
			total_disbursed_all_time: money(sum(confirmed.map((t) => t.amount))),
			total_disbursed_this_month: money(sum(confirmed.filter((t) => thisMonth(t.confirmed_at)).map((t) => t.amount))),
		},
		transactions: {
			total_confirmed: confirmed.length,
			/** Proposed. */
			total_pending: txs.filter((t) => t.status === "PENDING" || t.status === "SUBMITTED").length,
			/** Proposed (docs/PLAN.md §7): distinct people paid. */
			employees_paid_all_time: new Set(confirmed.map((t) => t.employee_id)).size,
			employees_paid_this_month: new Set(confirmed.filter((t) => thisMonth(t.confirmed_at)).map((t) => t.employee_id)).size,
			total_failed: txs.filter((t) => t.status === "FAILED").length,
			pending_retry: txs.filter((t) => t.status === "FAILED" && t.retry_count < 3).length,
		},
		wallets: {
			total_company_wallets: companyWallets.length,
			employees_with_wallet: current.filter((e) => hasWallet(db, e.id)).length,
			employees_without_wallet: current.filter((e) => !hasWallet(db, e.id)).length,
		},
	});
});

route("GET", "/companies/:id/stats/employees", "user", (ctx) => {
	const id = companyOf(ctx);
	need(ctx, "employees:read", "reports:read");
	const db = read();
	const current = scope(db, id).employees.filter((e) => e.status !== "TERMINATED");
	return ok({
		by_country: Object.entries(countBy(current, (e) => e.country)).map(([country, count]) => ({ country, count })),
		by_department: Object.entries(countBy(current, (e) => e.department)).map(([department, count]) => ({ department, count })),
		by_employment_type: countBy(current, (e) => e.employment_type),
		onboarded_this_month: current.filter((e) => thisMonth(e.start_date)).length,
		without_wallet: current.filter((e) => !hasWallet(db, e.id)).length,
	});
});

route("GET", "/companies/:id/stats/payroll", "user", (ctx) => {
	const id = companyOf(ctx);
	need(ctx, "payroll:read", "reports:read");
	const db = read();
	const { runs, txs } = scope(db, id);
	const completed = runs.filter((r) => r.status === "COMPLETED");
	const months = Array.from({ length: 6 }, (_, i) => {
		const d = new Date();
		d.setUTCDate(1);
		d.setUTCMonth(d.getUTCMonth() - (5 - i));
		return d.toISOString().slice(0, 7);
	});
	const next = runs
		.filter((r) => (r.status === "DRAFT" || r.status === "APPROVED") && Date.parse(r.scheduled_at) > Date.now())
		.sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))[0];
	return ok({
		average_run_amount: money(completed.length ? sum(completed.map((r) => r.total_amount)) / completed.length : 0),
		disbursed_by_month: months.map((month) => ({
			month,
			amount: money(sum(txs.filter((t) => t.status === "CONFIRMED" && t.confirmed_at?.startsWith(month)).map((t) => t.amount))),
		})),
		next_scheduled_run: next
			? { id: next.id, scheduled_at: next.scheduled_at, status: next.status, total_amount: next.total_amount }
			: null,
		runs_by_status: countBy(runs, (r) => r.status),
	});
});

route("GET", "/companies/:id/stats/transactions", "user", (ctx) => {
	const id = companyOf(ctx);
	need(ctx, "payroll:read", "reports:read");
	const { txs } = scope(read(), id);
	const confirmed = txs.filter((t) => t.status === "CONFIRMED");
	const settled = confirmed.length + txs.filter((t) => t.status === "FAILED").length;
	return ok({
		by_status: countBy(txs, (t) => t.status),
		failed_needing_retry: txs.filter((t) => t.status === "FAILED" && t.retry_count < 3).length,
		success_rate: settled ? Math.round((confirmed.length / settled) * 1000) / 10 : 0,
		volume_by_asset: Object.entries(countBy(confirmed, (t) => t.asset)).map(([asset, count]) => ({
			asset,
			count,
			amount: money(sum(confirmed.filter((t) => t.asset === asset).map((t) => t.amount))),
		})),
	});
});

route("GET", "/companies/:id/stats/wallets", "user", (ctx) => {
	const id = companyOf(ctx);
	need(ctx, "wallets:read", "reports:read");
	const db = read();
	const { employees, companyWallets, employeeWallets } = scope(db, id);
	const current = employees.filter((e) => e.status !== "TERMINATED");
	const all = [...companyWallets, ...employeeWallets];
	return ok({
		company_wallets_by_type: countBy(companyWallets, (w) => w.wallet_type),
		employee_wallet_coverage: {
			total_employees: current.length,
			with_wallet: current.filter((e) => hasWallet(db, e.id)).length,
			without_wallet: current.filter((e) => !hasWallet(db, e.id)).length,
		},
		funded_wallets: all.filter((w) => w.is_funded).length,
		unfunded_wallets: all.filter((w) => !w.is_funded).length,
	});
});

route("GET", "/companies/:id/stats/compliance", "user", (ctx) => {
	const id = companyOf(ctx);
	const db = read();
	const runIds = new Set(db.runs.filter((r) => r.company_id === id).map((r) => r.id));
	const checks = db.complianceChecks.filter((c) => runIds.has(c.payroll_run_id));
	const last = [...checks].sort((a, b) => b.checked_at.localeCompare(a.checked_at))[0];
	return ok({
		audit_logs_last_30_days: db.auditLogs.filter((l) => l.company_id === id && Date.parse(l.created_at) > Date.now() - 30 * DAY)
			.length,
		checks_passed: checks.filter((c) => c.status === "PASSED").length,
		checks_failed: checks.filter((c) => c.status === "FAILED").length,
		last_checked_at: last?.checked_at ?? null,
		tax_reports_generated: 2,
		tax_reports_pending: 0,
	});
});

route("GET", "/users/me/stats", "user", (ctx) => {
	const db = read();
	const employee = employeeOfUser(db, me(ctx));
	const txs = employee ? db.transactions.filter((t) => t.employee_id === employee.id) : [];
	const confirmed = txs
		.filter((t) => t.status === "CONFIRMED")
		.sort((a, b) => (b.confirmed_at ?? "").localeCompare(a.confirmed_at ?? ""));
	return ok({
		total_payments_received: confirmed.length,
		total_received_all_time: money(sum(confirmed.map((t) => t.amount))),
		total_received_this_month: money(sum(confirmed.filter((t) => thisMonth(t.confirmed_at)).map((t) => t.amount))),
		last_payment_at: confirmed[0]?.confirmed_at ?? null,
		transactions_by_status: countBy(txs, (t) => t.status),
	});
});
