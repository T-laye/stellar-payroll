import type { MockDb, MockNotification, MockRun, MockTransaction } from "./db";
import { effectivePermissions } from "./permissions";
import { iso, uuid } from "./util";

/**
 * In-app notifications (proposed, docs/PLAN.md §10). Admins hear about payroll moving through its
 * lifecycle and about failed payments; employees hear about their own payment. Copy keeps the
 * blockchain detail out of the headline, as the rest of the app does.
 */

type Draft = Pick<MockNotification, "kind" | "title" | "body" | "resource_type" | "resource_id" | "tone">;

/** People who run payroll: anyone in the company who can read it. */
export function payrollAdmins(db: MockDb, companyId: string) {
	return db.users
		.filter((u) => u.company_id === companyId && u.is_active)
		.filter((u) => {
			const permissions = effectivePermissions(db, u.id);
			return permissions.includes("*") || permissions.includes("payroll:read");
		})
		.map((u) => u.id);
}

/** The signed-in account behind an employee record, if they've accepted their invite. */
export function employeeUser(db: MockDb, employeeId: string) {
	const employee = db.employees.find((e) => e.id === employeeId);
	const user = db.users.find((u) => u.id === employee?.user_id);
	return user?.is_active ? user.id : null;
}

export function notify(db: MockDb, companyId: string, userIds: (string | null)[], draft: Draft, at = Date.now()) {
	for (const userId of new Set(userIds)) {
		if (!userId) continue;
		db.notifications.unshift({
			id: uuid(),
			company_id: companyId,
			user_id: userId,
			read_at: null,
			created_at: iso(at),
			...draft,
		});
	}
}

export const fmt = (amount: string, asset: string) =>
	`${Number(amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${asset}`;

export const runLabel = (run: MockRun) => run.name || "Payroll run";

export const employeeName = (db: MockDb, employeeId: string) => {
	const e = db.employees.find((x) => x.id === employeeId);
	return e ? `${e.first_name} ${e.last_name}` : "an employee";
};

export function notifyPayment(db: MockDb, tx: MockTransaction, at: number) {
	const run = db.runs.find((r) => r.id === tx.payroll_run_id);
	const employee = employeeUser(db, tx.employee_id);
	const amount = fmt(tx.amount, tx.asset);
	const link = { resource_type: "transaction" as const, resource_id: tx.id };
	if (tx.status === "SUBMITTED") {
		notify(
			db,
			tx.company_id,
			[employee],
			{
				kind: "payment.processing",
				title: "Payment processing",
				body: `Your payment of ${amount} is being processed.`,
				tone: "info",
				...link,
			},
			at,
		);
	} else if (tx.status === "CONFIRMED") {
		notify(
			db,
			tx.company_id,
			[employee],
			{
				kind: "payment.completed",
				title: "Payment received",
				body: `Your payment of ${amount} has been received.`,
				tone: "success",
				...link,
			},
			at,
		);
	} else if (tx.status === "FAILED") {
		notify(
			db,
			tx.company_id,
			[employee],
			{
				kind: "payment.failed",
				title: "Payment failed",
				body: `Your payment of ${amount} didn't go through. Your employer has been notified.`,
				tone: "error",
				...link,
			},
			at,
		);
		notify(
			db,
			tx.company_id,
			payrollAdmins(db, tx.company_id),
			{
				kind: "payment.failed",
				title: "Payment failed",
				body: `${amount} to ${employeeName(db, tx.employee_id)}${run ? ` in ${runLabel(run)}` : ""} failed. Review the reason and retry.`,
				tone: "error",
				...link,
			},
			at,
		);
	}
}

export function notifyRun(
	db: MockDb,
	run: MockRun,
	kind: "processing" | "completed" | "failed" | "review" | "approaching",
	at: number,
	exclude?: string,
) {
	const admins = payrollAdmins(db, run.company_id).filter((id) => id !== exclude);
	const link = { resource_type: "payroll_run" as const, resource_id: run.id };
	const total = fmt(run.total_amount, run.currency);
	const drafts: Record<typeof kind, Draft> = {
		review: {
			kind: "payroll.review",
			title: "Payroll ready for review",
			body: `${runLabel(run)} (${total}) is waiting for review and approval.`,
			tone: "warning",
			...link,
		},
		processing: {
			kind: "payroll.processing",
			title: "Payroll processing",
			body: `${runLabel(run)} is being paid out (${total}).`,
			tone: "info",
			...link,
		},
		completed: {
			kind: "payroll.completed",
			title: "Payroll completed",
			body: `Every payment in ${runLabel(run)} was received (${total}).`,
			tone: "success",
			...link,
		},
		failed: {
			kind: "payroll.failed",
			title: "Payroll finished with failures",
			body: `Some payments in ${runLabel(run)} failed. Retry them from the payroll details.`,
			tone: "error",
			...link,
		},
		approaching: {
			kind: "payroll.approaching",
			title: "Scheduled payroll approaching",
			body:
				run.status === "APPROVED"
					? `${runLabel(run)} (${total}) is approved and will be paid on ${new Date(run.scheduled_at).toDateString()}.`
					: `${runLabel(run)} (${total}) is due on ${new Date(run.scheduled_at).toDateString()} and still needs approval.`,
			tone: "warning",
			...link,
		},
	};
	notify(db, run.company_id, admins, drafts[kind], at);
	if (kind === "processing") {
		// Employees can't open the run, so their notification points at their own payment.
		for (const item of db.lineItems.filter((i) => i.payroll_run_id === run.id)) {
			notify(
				db,
				run.company_id,
				[employeeUser(db, item.employee_id)],
				{
					kind: "payroll.initiated",
					title: "Payroll initiated",
					body: `${runLabel(run)} has started. Your payment of ${fmt(item.amount, item.currency)} is on its way.`,
					tone: "info",
					resource_type: item.transaction_id ? "transaction" : null,
					resource_id: item.transaction_id,
				},
				at,
			);
		}
	}
}
