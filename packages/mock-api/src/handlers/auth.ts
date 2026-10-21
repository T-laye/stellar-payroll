import { read, update, type MockUser } from "../db";
import { SYSTEM_ROLES } from "../permissions";
import { HttpError, accessToken, me, ok, route } from "../router";
import { required, str } from "../present";
import { iso, uuid } from "../util";

/** /auth/*: register, login, verification, password reset, invite acceptance. */

const findByEmail = (email: unknown) => read().users.find((u) => u.email.toLowerCase() === str(email).toLowerCase());

/** The login response: a dual-token session plus who the user is (POST /auth/login in the Swagger). */
function session(userId: string) {
	return update((db) => {
		const user = db.users.find((u) => u.id === userId)!;
		user.last_login_at = iso(Date.now());
		const company = db.companies.find((c) => c.id === user.company_id)!;
		const role = db.roles.find((r) => r.id === user.role_id)!;
		const token = accessToken(db, user);
		db.auditLogs.unshift({
			id: uuid(),
			company_id: company.id,
			user_id: user.id,
			action: "user.login",
			resource_type: "user",
			resource_id: user.id,
			created_at: iso(Date.now()),
		});
		return {
			session: { access_token: token, pay_token: uuid(), role: role.slug, permissions: role.permissions },
			company_id: company.id,
			company_slug: company.slug,
			redirect_url: `https://${company.slug}.payorbit.com`,
			user: {
				id: user.id,
				email: user.email,
				first_name: user.first_name,
				last_name: user.last_name,
				role_slug: role.slug,
				role_name: role.name,
				company_id: company.id,
				company_name: company.name,
				company_slug: company.slug,
			},
		};
	});
}

route("POST", "/auth/login", "public", ({ body }) => {
	if (str(body.password).length < 6) throw new HttpError(422, "password must be at least 6 characters");
	const user = findByEmail(body.email);
	if (!user || user.password !== body.password) throw new HttpError(401, "invalid email or password");
	if (!user.is_active) throw new HttpError(401, "this account is not active");
	if (!user.email_verified_at) throw new HttpError(403, "please verify your email address before signing in");
	return ok(session(user.id), "login successful");
});

route("POST", "/auth/register", "public", ({ body }) => {
	required(
		body,
		"email",
		"password",
		"first_name",
		"last_name",
		"company_name",
		"company_slug",
		"company_country",
		"company_timezone",
		"role_slug",
	);
	if (findByEmail(body.email)) throw new HttpError(409, "an account with this email already exists");
	const slug = str(body.company_slug).toLowerCase();
	if (read().companies.some((c) => c.slug === slug)) throw new HttpError(409, "this company slug is taken");
	const now = iso(Date.now());
	const user = update((db) => {
		const companyId = uuid();
		db.companies.push({
			id: companyId,
			name: str(body.company_name),
			slug,
			country: str(body.company_country),
			timezone: str(body.company_timezone),
			default_currency: "USD",
			email: str(body.email),
			phone: null,
			website: null,
			logo_url: null,
			is_active: true,
			created_at: now,
			updated_at: now,
		});
		for (const r of SYSTEM_ROLES)
			db.roles.push({
				...r,
				id: uuid(),
				company_id: companyId,
				is_system: true,
				is_active: true,
				created_at: now,
				updated_at: now,
			});
		const created: MockUser = {
			id: uuid(),
			company_id: companyId,
			email: str(body.email).toLowerCase(),
			password: str(body.password),
			first_name: str(body.first_name),
			last_name: str(body.last_name),
			role_id:
				db.roles.find((r) => r.company_id === companyId && r.slug === str(body.role_slug))?.id ??
				db.roles.find((r) => r.company_id === companyId && r.slug === "owner")!.id,
			is_active: true,
			email_verified_at: null,
			last_login_at: null,
			invite_token: null,
			wallet_pin: null,
			created_at: now,
			updated_at: now,
		};
		db.users.push(created);
		return created;
	});
	return ok(
		{ user: { id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name } },
		"registration successful: check your email to verify your account",
		201,
	);
});

/** No inbox in the demo: the link carries the email, and any token verifies it. */
route("POST", "/auth/verify-email", "public", ({ body }) => {
	required(body, "token");
	const email = str(body.email);
	const done = update((db) => {
		const user = email
			? db.users.find((u) => u.email.toLowerCase() === email.toLowerCase())
			: [...db.users].reverse().find((u) => !u.email_verified_at);
		if (!user) return false;
		user.email_verified_at ??= iso(Date.now());
		return true;
	});
	if (!done) throw new HttpError(400, "invalid or expired verification token");
	return ok(null, "email verified");
});

route("POST", "/auth/resend-verification", "public", ({ body }) => {
	required(body, "email");
	return ok(null, "verification email sent");
});

/** Not in the live API yet (docs/PLAN.md); the verification page offers it. */
route("PATCH", "/auth/change-verification-email", "public", ({ body }) => {
	required(body, "email");
	return ok({ email: str(body.email) }, "verification email updated");
});

route("POST", "/auth/forgot-password", "public", ({ body }) => {
	required(body, "email");
	return ok(null, "if an account exists for this email, a reset link has been sent");
});

route("POST", "/auth/reset-password", "public", ({ body }) => {
	required(body, "token", "password");
	if (str(body.password).length < 6) throw new HttpError(422, "password must be at least 6 characters");
	const email = str(body.email);
	const done = update((db) => {
		const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
		if (!user) return false;
		user.password = str(body.password);
		user.updated_at = iso(Date.now());
		return true;
	});
	if (!done) throw new HttpError(400, "invalid or expired reset token");
	return ok(null, "password reset successful");
});

route("POST", "/auth/complete-profile", "public", ({ body }) => {
	required(body, "token", "password");
	const user = read().users.find((u) => u.invite_token === str(body.token) && !u.is_active);
	if (!user) throw new HttpError(400, "invalid or expired invite token");
	update((db) => {
		const u = db.users.find((x) => x.id === user.id)!;
		u.password = str(body.password);
		u.is_active = true;
		u.invite_token = null;
		u.email_verified_at = iso(Date.now());
	});
	return ok(session(user.id), "profile completed");
});

route("PATCH", "/auth/change-password", "user", (ctx) => {
	required(ctx.body, "current_password", "new_password");
	if (me(ctx).password !== ctx.body.current_password) throw new HttpError(400, "current password is incorrect");
	update((db) => {
		db.users.find((u) => u.id === me(ctx).id)!.password = str(ctx.body.new_password);
	});
	return ok(null, "password changed");
});

// Public so signing out still succeeds after "Reset demo data" invalidated the session.
route("POST", "/auth/logout", "public", () => ok(null, "logged out"));
