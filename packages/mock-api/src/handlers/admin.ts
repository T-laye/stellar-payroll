import { read, update, type MockDb, type MockUser } from "../db";
import { livePayments } from "../engine";
import { HttpError, me, needPlatformAdmin, ok, paged, route, type Ctx } from "../router";
import { found, txDto, userDto } from "../present";
import { iso, money, uuid } from "../util";

/**
 * /admin/*: PayOrbit's platform console, across every company. Platform admins only. Shapes follow the
 * live API (checked 2026-10-23): companies and users as their tenant routes return them, audit logs
 * with `actor_id` and `metadata`, grant/revoke answering the updated admin list.
 */

const companyDto = (db: MockDb, id: string) => {
	const c = found(
		db.companies.find((x) => x.id === id),
		"company",
	);
	const { phone: _phone, website: _website, logo_url: _logo, ...rest } = c;
	return rest;
};

const adminDto = (db: MockDb, u: MockUser) => ({
	user_id: u.id,
	email: u.email,
	first_name: u.first_name,
	last_name: u.last_name,
	granted_by: u.platform_admin_granted_by ?? undefined,
	created_at: u.platform_admin_granted_at ?? u.created_at,
});

const admins = (db: MockDb) => db.users.filter((u) => u.is_platform_admin).map((u) => adminDto(db, u));

const userIn = (db: MockDb, id: string | undefined) =>
	found(
		db.users.find((u) => u.id === id),
		"user",
	);

function audit(db: MockDb, ctx: Ctx, action: string, resource_type: string, resource_id: string, company_id: string, metadata = {}) {
	db.auditLogs.unshift({ id: uuid(), company_id, user_id: me(ctx).id, action, resource_type, resource_id, metadata, created_at: iso(Date.now()) });
}

const flag = (value: string | null) => (value === "true" ? true : value === "false" ? false : null);
const text = (value: string | null) => value?.trim().toLowerCase() ?? "";

route("GET", "/admin/stats/overview", "user", (ctx) => {
	needPlatformAdmin(ctx);
	const db = read();
	const confirmed = livePayments(db).filter((t) => t.status === "CONFIRMED");
	return ok({
		total_companies: db.companies.length,
		active_companies: db.companies.filter((c) => c.is_active).length,
		suspended_companies: db.companies.filter((c) => !c.is_active).length,
		total_users: db.users.length,
		total_transactions: db.transactions.length,
		total_disbursed_all_time: money(confirmed.reduce((sum, t) => sum + Number(t.amount), 0)),
	});
});

// ---- Companies ----

route("GET", "/admin/companies", "user", (ctx) => {
	needPlatformAdmin(ctx);
	const db = read();
	const q = text(ctx.query.get("search"));
	const active = flag(ctx.query.get("is_active"));
	const country = text(ctx.query.get("country"));
	const list = db.companies
		.filter((c) => active === null || c.is_active === active)
		.filter((c) => !country || c.country.toLowerCase() === country)
		.filter((c) => !q || `${c.name} ${c.slug} ${c.email}`.toLowerCase().includes(q))
		.sort((a, b) => b.created_at.localeCompare(a.created_at))
		.map((c) => companyDto(db, c.id));
	return paged(ctx, list, {}, 20);
});

route("GET", "/admin/companies/:id", "user", (ctx) => {
	needPlatformAdmin(ctx);
	return ok(companyDto(read(), ctx.params.id!));
});

for (const [action, active] of [
	["suspend", false],
	["reactivate", true],
] as const) {
	route("PATCH", `/admin/companies/:id/${action}`, "user", (ctx) => {
		needPlatformAdmin(ctx);
		const company = update((db) => {
			const c = found(
				db.companies.find((x) => x.id === ctx.params.id),
				"company",
			);
			if (!active && c.id === me(ctx).company_id) throw new HttpError(409, "you can't suspend your own company");
			c.is_active = active;
			c.updated_at = iso(Date.now());
			audit(db, ctx, `company.${action}`, "company", c.id, c.id);
			return companyDto(db, c.id);
		});
		return ok(company, `company ${active ? "reactivated" : "suspended"}`);
	});
}

// ---- Users ----

route("GET", "/admin/users", "user", (ctx) => {
	needPlatformAdmin(ctx);
	const db = read();
	const q = text(ctx.query.get("search"));
	const active = flag(ctx.query.get("is_active"));
	const role = text(ctx.query.get("role"));
	const companyId = ctx.query.get("company_id");
	const list = db.users
		.filter((u) => !companyId || u.company_id === companyId)
		.filter((u) => active === null || u.is_active === active)
		.map((u) => userDto(db, u))
		.filter((u) => !role || u.role_name.toLowerCase().replace(/\s+/g, "-") === role)
		.filter((u) => !q || `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(q))
		.sort((a, b) => b.created_at.localeCompare(a.created_at));
	return paged(ctx, list, {}, 20);
});

route("GET", "/admin/users/:id", "user", (ctx) => {
	needPlatformAdmin(ctx);
	const db = read();
	return ok(userDto(db, userIn(db, ctx.params.id)));
});

for (const [action, active] of [
	["deactivate", false],
	["reactivate", true],
] as const) {
	route("PATCH", `/admin/users/:id/${action}`, "user", (ctx) => {
		needPlatformAdmin(ctx);
		const user = update((db) => {
			const u = userIn(db, ctx.params.id);
			if (!active && u.id === me(ctx).id) throw new HttpError(409, "you can't deactivate your own account");
			u.is_active = active;
			u.updated_at = iso(Date.now());
			audit(db, ctx, `user.${action}`, "user", u.id, u.company_id);
			return userDto(db, u);
		});
		return ok(user, `user ${active ? "reactivated" : "deactivated"}`);
	});
}

// ---- Transactions ----

const boundary = (value: string | null) => {
	if (!value) return null;
	const ms = Date.parse(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00Z` : value);
	if (Number.isNaN(ms)) throw new HttpError(400, `invalid date: ${value}`);
	return ms;
};

route("GET", "/admin/transactions", "user", (ctx) => {
	needPlatformAdmin(ctx);
	const db = read();
	const q = ctx.query;
	const statuses = q.get("status")?.split(",").filter(Boolean) ?? [];
	const from = boundary(q.get("from"));
	const to = boundary(q.get("to"));
	const list = db.transactions
		.filter((t) => !q.get("company_id") || t.company_id === q.get("company_id"))
		.filter((t) => statuses.length === 0 || statuses.includes(t.status))
		.filter((t) => (from === null || Date.parse(t.created_at) >= from) && (to === null || Date.parse(t.created_at) < to))
		.sort((a, b) => b.created_at.localeCompare(a.created_at))
		.map((t) => txDto(db, t));
	return paged(ctx, list, {}, 20);
});

route("GET", "/admin/transactions/:id", "user", (ctx) => {
	needPlatformAdmin(ctx);
	const db = read();
	return ok(
		txDto(
			db,
			found(
				db.transactions.find((t) => t.id === ctx.params.id),
				"transaction",
			),
			{ attempts: true },
		),
	);
});

// ---- Audit logs ----

route("GET", "/admin/audit-logs", "user", (ctx) => {
	needPlatformAdmin(ctx);
	const q = ctx.query;
	const list = read()
		.auditLogs.filter((l) => !q.get("company_id") || l.company_id === q.get("company_id"))
		.filter((l) => !q.get("action") || l.action.startsWith(q.get("action")!))
		.filter((l) => !q.get("resource_type") || l.resource_type === q.get("resource_type"))
		.sort((a, b) => b.created_at.localeCompare(a.created_at))
		.map(({ user_id, metadata, ...rest }) => ({ ...rest, actor_id: user_id, metadata: metadata ?? {} }));
	return paged(ctx, list, {}, 20);
});

// ---- Platform admins ----

route("GET", "/admin/platform-admins", "user", (ctx) => {
	needPlatformAdmin(ctx);
	return ok(admins(read()));
});

route("POST", "/admin/platform-admins", "user", (ctx) => {
	needPlatformAdmin(ctx);
	const list = update((db) => {
		const u = userIn(db, String(ctx.body.user_id ?? ""));
		if (u.is_platform_admin) throw new HttpError(409, "user is already a platform admin");
		u.is_platform_admin = true;
		u.platform_admin_granted_at = iso(Date.now());
		u.platform_admin_granted_by = me(ctx).id;
		audit(db, ctx, "platform_admin.grant", "user", u.id, u.company_id);
		return admins(db);
	});
	return ok(list, "platform admin granted");
});

route("DELETE", "/admin/platform-admins/:userId", "user", (ctx) => {
	needPlatformAdmin(ctx);
	const list = update((db) => {
		const u = userIn(db, ctx.params.userId);
		if (!u.is_platform_admin) throw new HttpError(404, "user is not a platform admin");
		if (db.users.filter((x) => x.is_platform_admin).length === 1) throw new HttpError(409, "cannot remove the last remaining platform admin");
		u.is_platform_admin = false;
		u.platform_admin_granted_at = null;
		u.platform_admin_granted_by = null;
		audit(db, ctx, "platform_admin.revoke", "user", u.id, u.company_id);
		return admins(db);
	});
	return ok(list, "platform admin revoked");
});
