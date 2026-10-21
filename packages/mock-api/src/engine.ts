import type { FailureCode, MockDb, MockLineItem, MockRun, MockSchedule, MockTransaction, PayCycle } from "./db";
import { notifyPayment, notifyRun } from "./notify";
import { FAILURES, credit } from "./seed";
import { DAY, day, hex, iso, money, uuid } from "./util";

/**
 * The payout engine: what the backend's scheduler and Stellar worker do, on a short clock so a
 * demo run settles in seconds. A transaction goes PENDING → SUBMITTED (broadcast, ~2.5 s) →
 * CONFIRMED (in a ledger, ~4 s later) or FAILED (with a reason). A run is COMPLETED when every
 * payment confirmed, FAILED when any failed. APPROVED runs start on their own at `scheduled_at`,
 * like the live scheduler. Recurring schedules (proposed) draft a run a few days before each pay
 * date and never approve it: an admin does. `settle()` runs before every mock request.
 */

const SUBMIT_AFTER = 2500;
const CONFIRM_AFTER = 4000;
const STAGGER = 700;
/** How far ahead of a pay date a schedule drafts its run. */
export const DRAFT_LEAD = 3 * DAY;
/** When admins hear that a scheduled run is coming up. */
const APPROACHING = 2 * DAY;

let ledger = 1_490_000;

const operationalWallet = (db: MockDb, companyId: string) =>
	db.wallets.find((w) => w.owner_type === "COMPANY" && w.owner_id === companyId && w.wallet_type === "OPERATIONAL");

const employeeWallet = (db: MockDb, employeeId: string) =>
	db.wallets.find((w) => w.owner_type === "EMPLOYEE" && w.owner_id === employeeId);

/** Why this payment would fail right now, or null if it would go through. */
function failureFor(db: MockDb, tx: MockTransaction): { code: FailureCode; message: string } | null {
	const destination = employeeWallet(db, tx.employee_id);
	if (!destination || !tx.to_address) return { code: "INVALID_WALLET", message: FAILURES.noWallet };
	if (!destination.balances.some((b) => b.asset === tx.asset)) return { code: "NO_TRUSTLINE", message: FAILURES.noTrust };
	const source = db.wallets.find((w) => w.stellar_address === tx.from_address);
	const available = Number(source?.balances.find((b) => b.asset === tx.asset)?.amount ?? 0);
	if (available < Number(tx.amount)) return { code: "INSUFFICIENT_BALANCE", message: FAILURES.underfunded };
	return null;
}

/** Starts paying a run: one PENDING transaction per line item. */
export function startRun(db: MockDb, run: MockRun, now = Date.now()) {
	const source = operationalWallet(db, run.company_id);
	run.status = "PROCESSING";
	run.executed_at = iso(now);
	run.updated_at = iso(now);
	const items = db.lineItems.filter((i) => i.payroll_run_id === run.id);
	items.forEach((item, index) => {
		const tx: MockTransaction = {
			id: uuid(),
			company_id: run.company_id,
			payroll_run_id: run.id,
			line_item_id: item.id,
			employee_id: item.employee_id,
			amount: item.amount,
			asset: run.currency,
			from_address: source?.stellar_address ?? "",
			to_address: item.wallet_address,
			status: "PENDING",
			stellar_tx_hash: null,
			ledger_sequence: null,
			fee_amount: null,
			error_message: null,
			failure_code: null,
			retry_count: 0,
			attempts: [],
			created_at: iso(now),
			submitted_at: null,
			confirmed_at: null,
			next_at: now + SUBMIT_AFTER + index * STAGGER,
		};
		db.transactions.push(tx);
		item.transaction_id = tx.id;
		item.status = "PENDING";
	});
	if (items.length === 0) run.status = "COMPLETED";
	notifyRun(db, run, "processing", now);
}

/** Puts a FAILED payment back in the queue (POST /transactions/{id}/retry). */
export function retryTransaction(db: MockDb, tx: MockTransaction, now = Date.now()) {
	const destination = employeeWallet(db, tx.employee_id);
	// The admin may have fixed the cause (linked a wallet) since the failure.
	tx.to_address = destination?.stellar_address ?? tx.to_address;
	tx.status = "PENDING";
	tx.retry_count += 1;
	tx.error_message = null;
	tx.failure_code = null;
	tx.stellar_tx_hash = null;
	tx.submitted_at = null;
	tx.next_at = now + SUBMIT_AFTER;
	const item = db.lineItems.find((i) => i.id === tx.line_item_id);
	if (item) {
		item.status = "PENDING";
		item.wallet_address = tx.to_address;
	}
	const run = db.runs.find((r) => r.id === tx.payroll_run_id);
	if (run && run.status === "FAILED") {
		run.status = "RETRYING";
		run.updated_at = iso(now);
	}
}

function mirror(db: MockDb, tx: MockTransaction) {
	const item: MockLineItem | undefined = db.lineItems.find((i) => i.id === tx.line_item_id);
	if (item) item.status = tx.status;
}

/** Advances every payment, run and schedule whose time has come. Returns true if anything changed. */
export function settle(db: MockDb, now = Date.now()) {
	let changed = false;

	for (const schedule of db.schedules) changed = advanceSchedule(db, schedule, now) || changed;

	for (const run of db.runs) {
		if (run.status === "APPROVED" && Date.parse(run.scheduled_at) <= now) {
			startRun(db, run, now);
			changed = true;
		}
	}

	for (const tx of db.transactions) {
		// Catch up on every step that has come due since the last request.
		while (tx.next_at !== null && tx.next_at <= now) step(db, tx);
		changed ||= tx.status !== "PENDING" && tx.status !== "SUBMITTED";
	}

	for (const run of db.runs) {
		if (run.status !== "PROCESSING" && run.status !== "RETRYING") continue;
		const txs = db.transactions.filter((t) => t.payroll_run_id === run.id);
		if (txs.some((t) => t.status === "PENDING" || t.status === "SUBMITTED")) continue;
		run.status = txs.every((t) => t.status === "CONFIRMED") ? "COMPLETED" : "FAILED";
		run.updated_at = iso(now);
		notifyRun(db, run, run.status === "COMPLETED" ? "completed" : "failed", now);
		changed = true;
	}

	// Remind admins once about each run due within two days.
	for (const run of db.runs) {
		if (run.status !== "DRAFT" && run.status !== "APPROVED") continue;
		const due = Date.parse(run.scheduled_at);
		if (due <= now || due - now > APPROACHING) continue;
		if (db.notifications.some((n) => n.kind === "payroll.approaching" && n.resource_id === run.id)) continue;
		notifyRun(db, run, "approaching", now);
		changed = true;
	}

	return changed;
}

/** One step of a payment: PENDING → SUBMITTED | FAILED, or SUBMITTED → CONFIRMED. */
function step(db: MockDb, tx: MockTransaction) {
	if (tx.next_at === null) return;
	const at = tx.next_at;
	if (tx.status === "PENDING") {
		const failure = failureFor(db, tx);
		tx.submitted_at = iso(at);
		if (failure) {
			tx.status = "FAILED";
			tx.error_message = failure.message;
			tx.failure_code = failure.code;
			tx.next_at = null;
			tx.attempts.push({
				attempt: tx.retry_count + 1,
				status: "FAILED",
				stellar_tx_hash: null,
				error_message: failure.message,
				failure_code: failure.code,
				at: iso(at),
			});
		} else {
			tx.status = "SUBMITTED";
			tx.stellar_tx_hash = hex(64);
			tx.next_at = at + CONFIRM_AFTER;
		}
	} else if (tx.status === "SUBMITTED") {
		tx.status = "CONFIRMED";
		tx.confirmed_at = iso(at);
		tx.ledger_sequence = ledger++;
		tx.fee_amount = "0.00001";
		tx.next_at = null;
		tx.attempts.push({
			attempt: tx.retry_count + 1,
			status: "CONFIRMED",
			stellar_tx_hash: tx.stellar_tx_hash,
			error_message: null,
			failure_code: null,
			at: iso(at),
		});
		const source = db.wallets.find((w) => w.stellar_address === tx.from_address);
		if (source) credit(source, tx.asset, -Number(tx.amount));
		const destination = employeeWallet(db, tx.employee_id);
		if (destination) credit(destination, tx.asset, Number(tx.amount));
	} else {
		tx.next_at = null;
	}
	mirror(db, tx);
	notifyPayment(db, tx, at);
}

/** Recomputes a run's total from its line items. */
export function retotal(db: MockDb, run: MockRun) {
	run.total_amount = money(db.lineItems.filter((i) => i.payroll_run_id === run.id).reduce((sum, i) => sum + Number(i.amount), 0));
}

// ---- Recurring schedules (proposed) ----

/**
 * `from` moved by whole months. Month-end stays month-end (Oct 31 → Nov 30 → Dec 31); other days
 * keep their day, clamped to short months (Jan 30 → Feb 28 → Mar 30).
 */
function shiftMonths(from: number, months: number) {
	const d = new Date(from);
	const lastDayOf = (y: number, m: number) => new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
	const wasMonthEnd = d.getUTCDate() === lastDayOf(d.getUTCFullYear(), d.getUTCMonth());
	const day = d.getUTCDate();
	d.setUTCDate(1);
	d.setUTCMonth(d.getUTCMonth() + months);
	const last = lastDayOf(d.getUTCFullYear(), d.getUTCMonth());
	d.setUTCDate(wasMonthEnd ? last : Math.min(day, last));
	return d.getTime();
}

/** The pay date after `from` for a frequency. */
export function nextDate(from: number, frequency: PayCycle) {
	if (frequency === "WEEKLY") return from + 7 * DAY;
	if (frequency === "BIWEEKLY") return from + 14 * DAY;
	return shiftMonths(from, 1);
}

/** The pay date before `from` (the start of that cycle's period). */
function previousDate(from: number, frequency: PayCycle) {
	if (frequency === "WEEKLY") return from - 7 * DAY;
	if (frequency === "BIWEEKLY") return from - 14 * DAY;
	return shiftMonths(from, -1);
}

/** The next `count` pay dates from the schedule's next one. */
export function upcomingDates(schedule: Pick<MockSchedule, "next_run_at" | "frequency">, count: number) {
	const dates = [Date.parse(schedule.next_run_at)];
	while (dates.length < count) dates.push(nextDate(dates[dates.length - 1]!, schedule.frequency));
	return dates;
}

/** Moves a pay date forward until it is in the future (after a pause, or a date that passed). */
export function rollForward(at: number, frequency: PayCycle, now = Date.now()) {
	let next = at;
	while (next <= now) next = nextDate(next, frequency);
	return next;
}

const monthName = (ms: number) => new Date(ms).toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });

/** Creates the DRAFT run for a schedule's next pay date. Exported for "draft now" in the handlers. */
export function draftRun(db: MockDb, schedule: MockSchedule, now = Date.now()) {
	const payAt = Date.parse(schedule.next_run_at);
	const periodStart = previousDate(payAt, schedule.frequency);
	const run: MockRun = {
		id: uuid(),
		company_id: schedule.company_id,
		name: schedule.frequency === "MONTHLY" ? `${schedule.name} · ${monthName(payAt)}` : `${schedule.name} · ${day(payAt)}`,
		group_id: "",
		schedule_id: schedule.id,
		currency: schedule.asset,
		notes: "Drafted by the recurring schedule. Review and approve it before the pay date.",
		period_start: day(periodStart),
		period_end: day(payAt - DAY),
		scheduled_at: iso(payAt),
		status: "DRAFT",
		stellar_memo: null,
		total_amount: "0.00",
		created_by: schedule.created_by,
		approved_by: null,
		approved_at: null,
		executed_at: null,
		created_at: iso(now),
		updated_at: iso(now),
	};
	run.stellar_memo = `PO-${run.id.slice(0, 8).toUpperCase()}`;
	for (const employee of db.employees.filter((e) => schedule.employee_ids.includes(e.id) && e.status === "ACTIVE")) {
		db.lineItems.push({
			id: uuid(),
			company_id: run.company_id,
			payroll_run_id: run.id,
			employee_id: employee.id,
			amount: employee.salary_amount,
			currency: run.currency,
			wallet_address: employeeWallet(db, employee.id)?.stellar_address ?? "",
			notes: "",
			status: "PENDING",
			transaction_id: null,
			created_at: iso(now),
		});
	}
	retotal(db, run);
	db.runs.push(run);
	schedule.last_drafted_for = schedule.next_run_at;
	notifyRun(db, run, "review", now);
	return run;
}

function advanceSchedule(db: MockDb, schedule: MockSchedule, now: number) {
	if (schedule.status !== "ACTIVE") return false;
	let changed = false;
	// A pay date that has passed: the cycle is over, look at the next one.
	if (Date.parse(schedule.next_run_at) <= now) {
		schedule.next_run_at = iso(rollForward(Date.parse(schedule.next_run_at), schedule.frequency, now));
		changed = true;
	}
	if (schedule.last_drafted_for !== schedule.next_run_at && Date.parse(schedule.next_run_at) - now <= DRAFT_LEAD) {
		draftRun(db, schedule, now);
		changed = true;
	}
	return changed;
}
