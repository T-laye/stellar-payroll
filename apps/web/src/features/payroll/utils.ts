import type { PayrollGroup, PayrollRun } from "@/features/payroll/types";

/** A run's display name: its own, else "<Month Year> payroll" from `period_start`. */
export function runName(run: Pick<PayrollRun, "name" | "period_start" | "group_id">, groups?: PayrollGroup[]) {
	if (run.name) return run.name;
	const month = new Date(run.period_start).toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
	const group = groups?.find((g) => g.id === run.group_id);
	return group ? `${group.name} · ${month}` : `${month} payroll`;
}

/** "PO-1A2B3C4D", the memo the run's payments carry, or a short id. */
export const runReference = (run: Pick<PayrollRun, "stellar_memo" | "id">) =>
	run.stellar_memo ?? `PO-${run.id.slice(0, 8).toUpperCase()}`;

/**
 * The pay date after `from` (ms). Mirrors the scheduler: month-end stays month-end
 * (Oct 31 → Nov 30 → Dec 31), other days keep their day, clamped to short months.
 */
export function nextPayDate(from: number, frequency: string) {
	if (frequency === "WEEKLY") return from + 7 * 86_400_000;
	if (frequency === "BIWEEKLY") return from + 14 * 86_400_000;
	const d = new Date(from);
	const lastDayOf = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
	const wasMonthEnd = d.getDate() === lastDayOf(d.getFullYear(), d.getMonth());
	const day = d.getDate();
	d.setDate(1);
	d.setMonth(d.getMonth() + 1);
	const last = lastDayOf(d.getFullYear(), d.getMonth());
	d.setDate(wasMonthEnd ? last : Math.min(day, last));
	return d.getTime();
}

export function payDates(first: number, frequency: string, count: number) {
	const dates = [first];
	while (dates.length < count) dates.push(nextPayDate(dates[dates.length - 1]!, frequency));
	return dates;
}

/** How far ahead of a pay date a schedule drafts its run (proposed scheduler behaviour). */
export const DRAFT_LEAD_DAYS = 3;
