import type { Envelope } from "@/lib/api/request";
import type { PayrollSchedule, RunReview, Transaction } from "@/features/payroll/types";

/**
 * The live API and the mock agree on meaning but not always on field names; these fill the gaps so
 * components see one shape. Each note says what the live API sends (checked 2026-10-23).
 */

const DAY = 86_400_000;
const DRAFT_LEAD_DAYS = 3;

type Loose<T> = Partial<T> & Record<string, unknown>;

/** Review items: live sends `line_item_id` (not `id`) and no per-item currency or email. */
export function normalizeReview(response: Envelope<RunReview>): Envelope<RunReview> {
	const review = response.data;
	const items = (review.items as Loose<RunReview["items"][number]>[]).map((item) => ({
		...item,
		id: (item.id ?? item.line_item_id) as string,
		currency: item.currency ?? review.asset,
		employee_email: (item.employee_email as string | undefined) ?? "",
		issue: item.issue ?? null,
	})) as RunReview["items"];
	return { ...response, data: { ...review, items } };
}

/**
 * Schedules: live `upcoming` cycles carry no draft date or run, and members are `{ id, name, amount, status }`.
 * The draft date follows the scheduler's rule (3 days before the pay date).
 */
export function normalizeSchedule(schedule: PayrollSchedule): PayrollSchedule {
	const s = schedule as unknown as Loose<PayrollSchedule>;
	return {
		...schedule,
		upcoming: (schedule.upcoming ?? []).map((c) => ({
			...c,
			drafts_at: c.drafts_at ?? new Date(Date.parse(c.date) - DRAFT_LEAD_DAYS * DAY).toISOString(),
			run_id: c.run_id ?? null,
			run_status: c.run_status ?? null,
		})),
		employees: (s.employees as Loose<NonNullable<PayrollSchedule["employees"]>[number]>[] | undefined)?.map((e) => ({
			id: e.id as string,
			name: e.name as string,
			email: (e.email as string | undefined) ?? "",
			job_title: (e.job_title as string | undefined) ?? "",
			salary_amount: (e.salary_amount ?? e.amount) as string,
			salary_currency: e.salary_currency ?? schedule.asset,
			status: e.status as string,
			// PENDING means no wallet yet; the API refuses ACTIVE without one (as `hasWallet` in lib/status).
			has_wallet: e.has_wallet ?? e.status !== "PENDING",
		})),
		runs: schedule.runs ?? [],
	};
}

export const normalizeScheduleResponse = (response: Envelope<PayrollSchedule>) => ({
	...response,
	data: normalizeSchedule(response.data),
});
export const normalizeSchedulesResponse = <M>(response: Envelope<PayrollSchedule[], M>) => ({
	...response,
	data: response.data.map(normalizeSchedule),
});

/**
 * Live lists every attempt of a retried payment as its own row (each with an `attempt` number); the
 * latest attempt is the payment. Keeps the highest attempt per line item, in the original order.
 */
export function latestAttempts<M>(response: Envelope<Transaction[], M>): Envelope<Transaction[], M> {
	const best = new Map<string, Transaction>();
	for (const t of response.data) {
		const key = t.line_item_id || t.id;
		const current = best.get(key);
		const attempt = (t as Transaction & { attempt?: number }).attempt ?? t.retry_count + 1;
		const currentAttempt = current ? ((current as Transaction & { attempt?: number }).attempt ?? current.retry_count + 1) : -1;
		if (!current || attempt > currentAttempt) best.set(key, t);
	}
	const keep = new Set([...best.values()].map((t) => t.id));
	return { ...response, data: response.data.filter((t) => keep.has(t.id)) };
}
