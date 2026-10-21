import { read, update, type Asset, type MockEmployee, type MockGroup, type MockRole } from "../db";
import { ALL_PERMISSIONS, effectivePermissions } from "../permissions";
import { HttpError, companyOf, me, need, ok, route, type Ctx } from "../router";
import { employeeDto, employeeWallet, employeeWalletDetail, found, required, str, walletSummary } from "../present";
import { inviteToken, wallet } from "../seed";
import { iso, money, random, uuid } from "../util";

/** /companies/{id}: the company, its people, pay groups, roles and permissions, payment requests, audit log. */

const audit = (ctx: Ctx, action: string, resource_type: string, resource_id: string | null) =>
	update((db) => {
		db.auditLogs.unshift({
			id: uuid(),
			company_id: me(ctx).company_id,
			user_id: me(ctx).id,
			action,
			resource_type,
			resource_id,
			created_at: iso(Date.now()),
		});
	});

// ---- Company ----

route("GET", "/companies/:id", "user", (ctx) => {
	const id = companyOf(ctx);
	return ok(
		found(
			read().companies.find((c) => c.id === id),
			"company",
		),
	);
});

route("PATCH", "/companies/:id", "user", (ctx) => {
	const id = companyOf(ctx);
	need(ctx, "company:update");
	const company = update((db) => {
		const c = found(
			db.companies.find((x) => x.id === id),
			"company",
		);
		for (const key of ["name", "phone", "timezone", "website", "logo_url", "default_currency"] as const) {
			if (ctx.body[key] !== undefined) c[key] = str(ctx.body[key]);
		}
		c.updated_at = iso(Date.now());
		return c;
	});
	audit(ctx, "company.updated", "company", id);
	return ok(company, "company updated");
});

// ---- Employees ----

route("GET", "/companies/:id/employees", "user", (ctx) => {
	const id = companyOf(ctx);
	need(ctx, "employees:read");
	const db = read();
	return ok(db.employees.filter((e) => e.company_id === id).map((e) => employeeDto(db, e)));
});

route("GET", "/companies/:id/employees/:empId", "user", (ctx) => {
	const id = companyOf(ctx);
	need(ctx, "employees:read");
	const db = read();
	return ok(
		employeeDto(
			db,
			found(
				db.employees.find((e) => e.id === ctx.params.empId && e.company_id === id),
				"employee",
			),
		),
	);
});

route("POST", "/companies/:id/employees", "user", (ctx) => {
	const id = companyOf(ctx);
	need(ctx, "employees:create");
	const b = ctx.body;
	required(b, "first_name", "last_name", "email", "country", "employment_type", "salary_amount", "salary_currency", "start_date");
	if (read().employees.some((e) => e.company_id === id && e.email.toLowerCase() === str(b.email).toLowerCase())) {
		throw new HttpError(409, "an employee with this email already exists");
	}
	const now = iso(Date.now());
	const employee = update((db) => {
		const department = str(b.department) || "General";
		const prefix = department.slice(0, 3).toUpperCase();
		const count = db.employees.filter((e) => e.company_id === id && e.employee_number.startsWith(`${prefix}-`)).length + 1;
		const e: MockEmployee = {
			id: uuid(),
			company_id: id,
			user_id: null,
			employee_number: `${prefix}-${String(count).padStart(3, "0")}`,
			first_name: str(b.first_name),
			last_name: str(b.last_name),
			email: str(b.email).toLowerCase(),
			phone: str(b.phone),
			country: str(b.country),
			department,
			job_title: str(b.job_title),
			employment_type: str(b.employment_type) as MockEmployee["employment_type"],
			external_id: str(b.external_id),
			group_id: str(b.group_id) || null,
			role_slug: str(b.role_slug) || "employee",
			salary_amount: money(Number(b.salary_amount) || 0),
			salary_currency: (str(b.salary_currency) || "USDC") as Asset,
			pay_frequency: (str(b.pay_frequency) ||
				db.groups.find((g) => g.id === str(b.group_id))?.pay_cycle ||
				"MONTHLY") as MockEmployee["pay_frequency"],
			start_date: str(b.start_date),
			end_date: null,
			status: "ACTIVE",
			created_at: now,
			updated_at: now,
		};
		db.employees.push(e);
		// The live API emails an invite; here the account waits, inactive, for POST /auth/complete-profile.
		const role =
			db.roles.find((r) => r.company_id === id && r.slug === e.role_slug) ??
			db.roles.find((r) => r.company_id === id && r.slug === "employee")!;
		const user = {
			id: uuid(),
			company_id: id,
			email: e.email,
			password: "",
			first_name: e.first_name,
			last_name: e.last_name,
			role_id: role.id,
			is_active: false,
			email_verified_at: null,
			last_login_at: null,
			invite_token: inviteToken(e.id),
			wallet_pin: null,
			created_at: now,
			updated_at: now,
		};
		db.users.push(user);
		e.user_id = user.id;
		return employeeDto(db, e);
	});
	audit(ctx, "employee.created", "employee", employee.id);
	return ok(employee, "employee created", 201);
});

route("PATCH", "/companies/:id/employees/:empId", "user", (ctx) => {
	const id = companyOf(ctx);
	need(ctx, "employees:update");
	const employee = update((db) => {
		const e = found(
			db.employees.find((x) => x.id === ctx.params.empId && x.company_id === id),
			"employee",
		);
		const fields = [
			"first_name",
			"last_name",
			"phone",
			"department",
			"job_title",
			"employment_type",
			"external_id",
			"salary_currency",
			"status",
			"role_slug",
			"pay_frequency",
		] as const;
		for (const key of fields) if (ctx.body[key] !== undefined) Object.assign(e, { [key]: str(ctx.body[key]) });
		if (ctx.body.salary_amount !== undefined) e.salary_amount = money(Number(ctx.body.salary_amount) || 0);
		if (ctx.body.group_id !== undefined) e.group_id = str(ctx.body.group_id) || null;
		if (ctx.body.end_date !== undefined) e.end_date = str(ctx.body.end_date) || null;
		e.updated_at = iso(Date.now());
		return employeeDto(db, e);
	});
	audit(ctx, "employee.updated", "employee", employee.id);
	return ok(employee, "employee updated");
});

/** Terminates (the record stays for payroll history). */
route("DELETE", "/companies/:id/employees/:empId", "user", (ctx) => {
	const id = companyOf(ctx);
	need(ctx, "employees:delete", "employees:update");
	update((db) => {
		const e = found(
			db.employees.find((x) => x.id === ctx.params.empId && x.company_id === id),
			"employee",
		);
		e.status = "TERMINATED";
		e.end_date = iso(Date.now()).slice(0, 10);
		e.updated_at = iso(Date.now());
	});
	audit(ctx, "employee.terminated", "employee", ctx.params.empId ?? null);
	return ok(null, "employee terminated");
});

route("POST", "/companies/:id/employees/:empId/wallet", "user", (ctx) => {
	const id = companyOf(ctx);
	const address = str(ctx.body.stellar_address);
	if (address && !/^G[A-Z2-7]{55}$/.test(address))
		throw new HttpError(422, "stellar_address must be a 56-character Stellar public key starting with G");
	const result = update((db) => {
		const e = found(
			db.employees.find((x) => x.id === ctx.params.empId && x.company_id === id),
			"employee",
		);
		const self = e.email.toLowerCase() === me(ctx).email.toLowerCase();
		const isAdmin = ctx.permissions.includes("*") || ctx.permissions.includes("employees:update");
		const existing = employeeWallet(db, e.id);
		if (!isAdmin && (!self || existing)) throw new HttpError(403, "only an admin can change an existing wallet");
		if (!address && !isAdmin) throw new HttpError(403, "only an admin can generate a custodial wallet");
		const now = iso(Date.now());
		if (existing) {
			existing.stellar_address = address || existing.stellar_address;
			existing.updated_at = now;
			return { ...walletSummary(existing), public_key: existing.stellar_address };
		}
		const w = wallet(id, "EMPLOYEE", e.id, address ? "EXTERNAL" : "CUSTODIAL", random(Date.now()), now, uuid, [
			{ asset: "XLM", amount: "0.00" },
			{ asset: "USDC", amount: "0.00" },
		]);
		if (address) w.stellar_address = address;
		db.wallets.push(w);
		// Drafts waiting on this wallet pick it up, so the review clears without rebuilding the run.
		const drafts = new Set(db.runs.filter((r) => r.status === "DRAFT").map((r) => r.id));
		for (const item of db.lineItems)
			if (item.employee_id === e.id && !item.wallet_address && drafts.has(item.payroll_run_id))
				item.wallet_address = w.stellar_address;
		return { ...walletSummary(w), public_key: w.stellar_address };
	});
	audit(ctx, "employee.wallet_linked", "employee", ctx.params.empId ?? null);
	return ok(result, "wallet linked", 201);
});

route("GET", "/employees/:empId/wallet", "user", (ctx) => {
	const db = read();
	const e = found(
		db.employees.find((x) => x.id === ctx.params.empId && x.company_id === me(ctx).company_id),
		"employee",
	);
	if (e.email.toLowerCase() !== me(ctx).email.toLowerCase()) need(ctx, "employees:read");
	const w = found(employeeWallet(db, e.id), "wallet");
	return ok(employeeWalletDetail(db, w, e.id));
});

// ---- Pay groups ----

route("GET", "/companies/:id/groups", "user", (ctx) => {
	const id = companyOf(ctx);
	need(ctx, "payroll:read", "company:read");
	return ok(read().groups.filter((g) => g.company_id === id));
});

route("POST", "/companies/:id/groups", "user", (ctx) => {
	const id = companyOf(ctx);
	need(ctx, "company:update", "payroll:create");
	required(ctx.body, "name", "currency", "pay_cycle");
	const now = iso(Date.now());
	const group: MockGroup = {
		id: uuid(),
		company_id: id,
		name: str(ctx.body.name),
		description: str(ctx.body.description),
		currency: str(ctx.body.currency) as Asset,
		pay_cycle: str(ctx.body.pay_cycle) as MockGroup["pay_cycle"],
		timezone: str(ctx.body.timezone) || "UTC",
		is_active: true,
		created_at: now,
		updated_at: now,
	};
	update((db) => {
		db.groups.push(group);
	});
	audit(ctx, "payroll_group.created", "payroll_group", group.id);
	return ok(group, "payroll group created", 201);
});

route("PATCH", "/companies/:id/groups/:groupId", "user", (ctx) => {
	const id = companyOf(ctx);
	need(ctx, "company:update", "payroll:update");
	const group = update((db) => {
		const g = found(
			db.groups.find((x) => x.id === ctx.params.groupId && x.company_id === id),
			"payroll group",
		);
		for (const key of ["name", "description", "currency", "pay_cycle", "timezone"] as const) {
			if (ctx.body[key] !== undefined) Object.assign(g, { [key]: str(ctx.body[key]) });
		}
		if (ctx.body.is_active !== undefined) g.is_active = Boolean(ctx.body.is_active);
		g.updated_at = iso(Date.now());
		return g;
	});
	return ok(group, "payroll group updated");
});

route("DELETE", "/companies/:id/groups/:groupId", "user", (ctx) => {
	const id = companyOf(ctx);
	need(ctx, "company:update", "payroll:update");
	update((db) => {
		found(
			db.groups.find((x) => x.id === ctx.params.groupId && x.company_id === id),
			"payroll group",
		);
		if (
			db.runs.some((r) => r.group_id === ctx.params.groupId && ["DRAFT", "APPROVED", "PROCESSING", "RETRYING"].includes(r.status))
		) {
			throw new HttpError(409, "this group has payroll runs in progress");
		}
		db.groups = db.groups.filter((g) => g.id !== ctx.params.groupId);
		for (const e of db.employees) if (e.group_id === ctx.params.groupId) e.group_id = null;
	});
	return ok(null, "payroll group deleted");
});

// ---- Roles & permissions ----

route("GET", "/permissions", "user", () => ok(ALL_PERMISSIONS));

route("GET", "/companies/:id/permissions", "user", (ctx) => {
	companyOf(ctx);
	return ok(ALL_PERMISSIONS);
});

route("GET", "/companies/:id/roles", "user", (ctx) => {
	const id = companyOf(ctx);
	need(ctx, "roles:read", "roles:manage", "employees:read");
	return ok(read().roles.filter((r) => r.company_id === id));
});

route("GET", "/companies/:id/roles/:roleId", "user", (ctx) => {
	const id = companyOf(ctx);
	need(ctx, "roles:read", "roles:manage");
	return ok(
		found(
			read().roles.find((r) => r.id === ctx.params.roleId && r.company_id === id),
			"role",
		),
	);
});

route("POST", "/companies/:id/roles", "user", (ctx) => {
	const id = companyOf(ctx);
	need(ctx, "roles:manage");
	required(ctx.body, "name", "slug");
	const slug = str(ctx.body.slug).toLowerCase();
	if (read().roles.some((r) => r.company_id === id && r.slug === slug))
		throw new HttpError(409, "a role with this slug already exists");
	const now = iso(Date.now());
	const role: MockRole = {
		id: uuid(),
		company_id: id,
		name: str(ctx.body.name),
		slug,
		description: str(ctx.body.description),
		permissions: Array.isArray(ctx.body.permissions) ? (ctx.body.permissions as string[]) : [],
		is_system: false,
		is_active: true,
		created_at: now,
		updated_at: now,
	};
	update((db) => {
		db.roles.push(role);
	});
	audit(ctx, "role.created", "role", role.id);
	return ok(role, "role created", 201);
});

route("PATCH", "/companies/:id/roles/:roleId", "user", (ctx) => {
	const id = companyOf(ctx);
	need(ctx, "roles:manage");
	const role = update((db) => {
		const r = found(
			db.roles.find((x) => x.id === ctx.params.roleId && x.company_id === id),
			"role",
		);
		if (r.is_system && r.slug === "owner") throw new HttpError(409, "the owner role cannot be changed");
		if (ctx.body.name !== undefined) r.name = str(ctx.body.name);
		if (ctx.body.description !== undefined) r.description = str(ctx.body.description);
		if (ctx.body.is_active !== undefined) r.is_active = Boolean(ctx.body.is_active);
		if (Array.isArray(ctx.body.permissions)) r.permissions = ctx.body.permissions as string[];
		r.updated_at = iso(Date.now());
		return r;
	});
	return ok(role, "role updated");
});

route("DELETE", "/companies/:id/roles/:roleId", "user", (ctx) => {
	const id = companyOf(ctx);
	need(ctx, "roles:manage");
	update((db) => {
		const r = found(
			db.roles.find((x) => x.id === ctx.params.roleId && x.company_id === id),
			"role",
		);
		if (r.is_system) throw new HttpError(409, "system roles cannot be deleted");
		if (db.users.some((u) => u.role_id === r.id)) throw new HttpError(409, "this role is still assigned to users");
		db.roles = db.roles.filter((x) => x.id !== r.id);
	});
	return ok(null, "role deleted");
});

function userPermissions(companyId: string, userId: string) {
	const db = read();
	const user = found(
		db.users.find((u) => u.id === userId && u.company_id === companyId),
		"user",
	);
	const role = db.roles.find((r) => r.id === user.role_id);
	return {
		user_id: user.id,
		role_id: user.role_id,
		role_name: role?.name ?? "",
		role_permissions: role?.permissions ?? [],
		overrides: db.overrides.filter((o) => o.user_id === user.id),
		effective_permissions: effectivePermissions(db, user.id),
	};
}

route("GET", "/companies/:id/users/:userId/permissions", "user", (ctx) => {
	const id = companyOf(ctx);
	if (ctx.params.userId !== me(ctx).id) need(ctx, "roles:read", "roles:manage");
	return ok(userPermissions(id, ctx.params.userId!));
});

function override(ctx: Ctx, type: "GRANT" | "REVOKE") {
	const id = companyOf(ctx);
	need(ctx, "roles:manage");
	const permissions = Array.isArray(ctx.body.permissions) ? (ctx.body.permissions as string[]) : [];
	if (permissions.length === 0) throw new HttpError(422, "permissions is required");
	update((db) => {
		found(
			db.users.find((u) => u.id === ctx.params.userId && u.company_id === id),
			"user",
		);
		db.overrides = db.overrides.filter((o) => !(o.user_id === ctx.params.userId && permissions.includes(o.permission)));
		for (const permission of permissions) {
			db.overrides.push({
				id: uuid(),
				company_id: id,
				user_id: ctx.params.userId!,
				permission,
				type,
				granted_by: me(ctx).id,
				created_at: iso(Date.now()),
			});
		}
	});
	return ok(userPermissions(id, ctx.params.userId!), type === "GRANT" ? "permissions granted" : "permissions revoked");
}

route("POST", "/companies/:id/users/:userId/permissions/grant", "user", (ctx) => override(ctx, "GRANT"));
route("POST", "/companies/:id/users/:userId/permissions/revoke", "user", (ctx) => override(ctx, "REVOKE"));

route("DELETE", "/companies/:id/users/:userId/permissions/:perm", "user", (ctx) => {
	const id = companyOf(ctx);
	need(ctx, "roles:manage");
	update((db) => {
		db.overrides = db.overrides.filter((o) => !(o.user_id === ctx.params.userId && o.permission === ctx.params.perm));
	});
	return ok(userPermissions(id, ctx.params.userId!), "override removed");
});

route("POST", "/companies/:id/users/:userId/make-owner", "user", (ctx) => {
	const id = companyOf(ctx);
	need(ctx, "*");
	update((db) => {
		const u = found(
			db.users.find((x) => x.id === ctx.params.userId && x.company_id === id),
			"user",
		);
		u.role_id = db.roles.find((r) => r.company_id === id && r.slug === "owner")!.id;
	});
	return ok(userPermissions(id, ctx.params.userId!), "owner assigned");
});

// ---- Payment requests (admin review) ----

route("GET", "/companies/:id/payment-requests", "user", (ctx) => {
	const id = companyOf(ctx);
	need(ctx, "payroll:read", "payroll:approve");
	const status = ctx.query.get("status");
	return ok(
		read()
			.paymentRequests.filter((r) => r.company_id === id && (!status || r.status === status))
			.sort((a, b) => b.created_at.localeCompare(a.created_at)),
	);
});

route("PATCH", "/companies/:id/payment-requests/:reqId", "user", (ctx) => {
	const id = companyOf(ctx);
	need(ctx, "payroll:approve");
	const status = str(ctx.body.status);
	if (status !== "APPROVED" && status !== "REJECTED") throw new HttpError(422, "status must be APPROVED or REJECTED");
	const request = update((db) => {
		const r = found(
			db.paymentRequests.find((x) => x.id === ctx.params.reqId && x.company_id === id),
			"payment request",
		);
		if (r.status !== "PENDING") throw new HttpError(409, "this request has already been reviewed");
		r.status = status;
		r.review_note = str(ctx.body.review_note) || null;
		r.reviewed_by = me(ctx).id;
		r.updated_at = iso(Date.now());
		return r;
	});
	audit(ctx, `payment_request.${status.toLowerCase()}`, "payment_request", request.id);
	return ok(request, "payment request reviewed");
});

// ---- Audit log & exports ----

route("GET", "/companies/:id/audit-logs", "user", (ctx) => {
	const id = companyOf(ctx);
	need(ctx, "audit:read");
	const page = Math.max(1, Number(ctx.query.get("page")) || 1);
	const limit = Math.max(1, Number(ctx.query.get("limit")) || 20);
	const logs = read().auditLogs.filter((l) => l.company_id === id);
	return { ...ok(logs.slice((page - 1) * limit, page * limit)), meta: { page, limit, total: logs.length } };
});

route("GET", "/companies/:id/exports/payroll", "user", (ctx) => {
	const id = companyOf(ctx);
	need(ctx, "reports:export");
	return ok({ company_id: id }, "export queued");
});
