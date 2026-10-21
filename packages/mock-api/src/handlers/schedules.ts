import { read, update, type Asset, type MockDb, type MockSchedule, type PayCycle } from "../db";
import { DRAFT_LEAD, draftRun, rollForward, upcomingDates } from "../engine";
import { HttpError, me, need, ok, route, type Ctx } from "../router";
import { found, required, str } from "../present";
import { iso, money, uuid } from "../util";

/**
 * Proposed (docs/PLAN.md §6): /payroll/schedules. A schedule names the people, the asset and the
 * frequency; a few days before each pay date it drafts a run for an admin to review and approve.
 * Nothing is paid without that approval.
 */

const FREQUENCIES: PayCycle[] = ["WEEKLY", "BIWEEKLY", "MONTHLY"];

const scheduleIn = (db: MockDb, ctx: Ctx) =>
	found(
		db.schedules.find((s) => s.id === ctx.params.id && s.company_id === me(ctx).company_id),
		"payroll schedule",
	);

function scheduleDto(db: MockDb, s: MockSchedule, detail = false) {
	const people = db.employees.filter((e) => s.employee_ids.includes(e.id));
	const active = people.filter((e) => e.status === "ACTIVE");
	const runs = db.runs.filter((r) => r.schedule_id === s.id).sort((a, b) => b.scheduled_at.localeCompare(a.scheduled_at));
	const upcoming =
		s.status === "CANCELLED"
			? []
			: upcomingDates(s, 3).map((at) => {
					const run = runs.find((r) => Date.parse(r.scheduled_at) === at);
					return {
						date: iso(at),
						/** When the draft run for this date is (or was) created. */
						drafts_at: iso(at - DRAFT_LEAD),
						run_id: run?.id ?? null,
						run_status: run?.status ?? null,
						employee_count: active.length,
						amount: money(active.reduce((sum, e) => sum + Number(e.salary_amount), 0)),
					};
				});
	return {
		id: s.id,
		name: s.name,
		frequency: s.frequency,
		asset: s.asset,
		status: s.status,
		next_run_at: s.status === "CANCELLED" ? null : s.next_run_at,
		employee_ids: s.employee_ids,
		employee_count: active.length,
		amount_per_cycle: money(active.reduce((sum, e) => sum + Number(e.salary_amount), 0)),
		created_by: s.created_by,
		created_at: s.created_at,
		updated_at: s.updated_at,
		upcoming,
		...(detail
			? {
					employees: people.map((e) => ({
						id: e.id,
						name: `${e.first_name} ${e.last_name}`,
						email: e.email,
						job_title: e.job_title,
						salary_amount: e.salary_amount,
						salary_currency: e.salary_currency,
						status: e.status,
						has_wallet: db.wallets.some((w) => w.owner_type === "EMPLOYEE" && w.owner_id === e.id),
					})),
					runs: runs.map((r) => ({
						id: r.id,
						name: r.name,
						status: r.status,
						scheduled_at: r.scheduled_at,
						total_amount: r.total_amount,
						currency: r.currency,
					})),
				}
			: {}),
	};
}

function validEmployees(db: MockDb, ctx: Ctx, ids: unknown) {
	const list = Array.isArray(ids) ? ids.map(String) : [];
	if (list.length === 0) throw new HttpError(422, "select at least one employee");
	const companyEmployees = new Set(db.employees.filter((e) => e.company_id === me(ctx).company_id).map((e) => e.id));
	if (list.some((id) => !companyEmployees.has(id))) throw new HttpError(422, "employee_ids contains an unknown employee");
	return [...new Set(list)];
}

function validNextDate(value: unknown) {
	const at = Date.parse(str(value));
	if (Number.isNaN(at)) throw new HttpError(422, "next_run_at must be an RFC3339 timestamp");
	if (at <= Date.now()) throw new HttpError(422, "next_run_at must be in the future");
	return at;
}

route("GET", "/payroll/schedules", "user", (ctx) => {
	need(ctx, "payroll:read");
	const db = read();
	const order = { ACTIVE: 0, PAUSED: 1, CANCELLED: 2 };
	return ok(
		db.schedules
			.filter((s) => s.company_id === me(ctx).company_id)
			.sort((a, b) => order[a.status] - order[b.status] || a.next_run_at.localeCompare(b.next_run_at))
			.map((s) => scheduleDto(db, s)),
	);
});

route("GET", "/payroll/schedules/:id", "user", (ctx) => {
	need(ctx, "payroll:read");
	const db = read();
	return ok(scheduleDto(db, scheduleIn(db, ctx), true));
});

route("POST", "/payroll/schedules", "user", (ctx) => {
	need(ctx, "payroll:create");
	required(ctx.body, "name", "frequency", "asset", "next_run_at");
	const frequency = str(ctx.body.frequency) as PayCycle;
	if (!FREQUENCIES.includes(frequency)) throw new HttpError(422, "frequency must be WEEKLY, BIWEEKLY or MONTHLY");
	const next = validNextDate(ctx.body.next_run_at);
	const result = update((db) => {
		const now = iso(Date.now());
		const s: MockSchedule = {
			id: uuid(),
			company_id: me(ctx).company_id,
			name: str(ctx.body.name),
			frequency,
			asset: (str(ctx.body.asset) === "XLM" ? "XLM" : "USDC") as Asset,
			employee_ids: validEmployees(db, ctx, ctx.body.employee_ids),
			next_run_at: iso(next),
			status: "ACTIVE",
			last_drafted_for: null,
			created_by: me(ctx).id,
			created_at: now,
			updated_at: now,
		};
		db.schedules.push(s);
		// A first pay date inside the draft window gets its run straight away.
		if (next - Date.now() <= DRAFT_LEAD) draftRun(db, s);
		return scheduleDto(db, s, true);
	});
	return ok(result, "payroll schedule created", 201);
});

route("PATCH", "/payroll/schedules/:id", "user", (ctx) => {
	need(ctx, "payroll:update", "payroll:create");
	const result = update((db) => {
		const s = scheduleIn(db, ctx);
		if (s.status === "CANCELLED") throw new HttpError(409, "a cancelled schedule can't be changed");
		if (ctx.body.name !== undefined) s.name = str(ctx.body.name) || s.name;
		if (ctx.body.frequency !== undefined) {
			const frequency = str(ctx.body.frequency) as PayCycle;
			if (!FREQUENCIES.includes(frequency)) throw new HttpError(422, "frequency must be WEEKLY, BIWEEKLY or MONTHLY");
			s.frequency = frequency;
		}
		if (ctx.body.asset !== undefined) s.asset = str(ctx.body.asset) === "XLM" ? "XLM" : "USDC";
		if (ctx.body.employee_ids !== undefined) s.employee_ids = validEmployees(db, ctx, ctx.body.employee_ids);
		if (ctx.body.next_run_at !== undefined) s.next_run_at = iso(validNextDate(ctx.body.next_run_at));
		s.updated_at = iso(Date.now());
		return scheduleDto(db, s, true);
	});
	return ok(result, "payroll schedule updated");
});

const PAST = { pause: "paused", resume: "resumed", cancel: "cancelled" } as const;

const transition = (action: "pause" | "resume" | "cancel") =>
	route("POST", `/payroll/schedules/:id/${action}`, "user", (ctx) => {
		need(ctx, "payroll:update", "payroll:create");
		const result = update((db) => {
			const s = scheduleIn(db, ctx);
			const now = Date.now();
			if (action === "pause") {
				if (s.status !== "ACTIVE") throw new HttpError(409, "only an active schedule can be paused");
				s.status = "PAUSED";
			} else if (action === "resume") {
				if (s.status !== "PAUSED") throw new HttpError(409, "only a paused schedule can be resumed");
				s.status = "ACTIVE";
				// Pay dates missed while paused are skipped, not paid late.
				s.next_run_at = iso(rollForward(Date.parse(s.next_run_at), s.frequency, now));
			} else {
				if (s.status === "CANCELLED") throw new HttpError(409, "this schedule is already cancelled");
				s.status = "CANCELLED";
			}
			s.updated_at = iso(now);
			db.auditLogs.unshift({
				id: uuid(),
				company_id: s.company_id,
				user_id: me(ctx).id,
				action: `payroll_schedule.${PAST[action]}`,
				resource_type: "payroll_schedule",
				resource_id: s.id,
				created_at: iso(now),
			});
			return scheduleDto(db, s, true);
		});
		return ok(result, `payroll schedule ${PAST[action]}`);
	});

transition("pause");
transition("resume");
transition("cancel");
