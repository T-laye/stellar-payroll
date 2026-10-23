import { read, update, type MockPaymentRequest } from "../db";
import { HttpError, me, ok, paged, route } from "../router";
import { employeeOfUser, employeeWallet, found, myTxDto, required, str, userDto } from "../present";
import { livePayments } from "../engine";
import { iso, money, uuid } from "../util";

/** /users/me*: the signed-in user's profile, payment requests and payment history. */

route("GET", "/users/me", "user", (ctx) => ok(userDto(read(), me(ctx))));

route("PATCH", "/users/me", "user", (ctx) => {
	const user = update((db) => {
		const u = db.users.find((x) => x.id === me(ctx).id)!;
		if (ctx.body.first_name !== undefined) u.first_name = str(ctx.body.first_name);
		if (ctx.body.last_name !== undefined) u.last_name = str(ctx.body.last_name);
		u.updated_at = iso(Date.now());
		return userDto(db, u);
	});
	return ok(user, "profile updated");
});

route("GET", "/users/me/payment-requests", "user", (ctx) => {
	const db = read();
	const employee = employeeOfUser(db, me(ctx));
	if (!employee) return ok([]);
	return ok(
		db.paymentRequests.filter((r) => r.employee_id === employee.id).sort((a, b) => b.created_at.localeCompare(a.created_at)),
	);
});

route("POST", "/users/me/payment-requests", "user", (ctx) => {
	required(ctx.body, "amount", "currency");
	if (!(Number(ctx.body.amount) > 0)) throw new HttpError(422, "amount must be greater than zero");
	const employee = employeeOfUser(read(), me(ctx));
	if (!employee) throw new HttpError(403, "only employees can submit payment requests");
	const now = iso(Date.now());
	const request: MockPaymentRequest = {
		id: uuid(),
		company_id: employee.company_id,
		employee_id: employee.id,
		amount: money(Number(ctx.body.amount)),
		currency: str(ctx.body.currency) === "XLM" ? "XLM" : "USDC",
		note: str(ctx.body.note),
		status: "PENDING",
		review_note: null,
		reviewed_by: null,
		created_at: now,
		updated_at: now,
	};
	update((db) => {
		db.paymentRequests.push(request);
	});
	return ok(request, "payment request submitted", 201);
});

/** The signed-in employee's payments, newest first; retried-away attempts are left out. */
route("GET", "/users/me/transactions", "user", (ctx) => {
	const db = read();
	const employee = employeeOfUser(db, me(ctx));
	const list = employee
		? livePayments(db)
				.filter((t) => t.employee_id === employee.id)
				.sort((a, b) => b.created_at.localeCompare(a.created_at))
				.map((t) => myTxDto(db, t))
		: [];
	return paged(ctx, list);
});

route("GET", "/users/me/transactions/:id", "user", (ctx) => {
	const db = read();
	const employee = employeeOfUser(db, me(ctx));
	const tx = found(
		db.transactions.find((t) => t.id === ctx.params.id && t.employee_id === employee?.id),
		"transaction",
	);
	return ok(myTxDto(db, tx, { attempts: true }));
});

/** The employee's own pay record, in the live portal's flat shape (404 for users without one). */
route("GET", "/users/me/employee", "user", (ctx) => {
	const db = read();
	const e = found(employeeOfUser(db, me(ctx)), "employee record");
	return ok({
		employee_id: e.id,
		name: `${e.first_name} ${e.last_name}`,
		email: e.email,
		role: e.job_title,
		status: e.status,
		salary_amount: e.salary_amount,
		payment_asset: e.salary_currency,
		pay_frequency: e.pay_frequency,
		wallet_address: employeeWallet(db, e.id)?.stellar_address ?? "",
	});
});

/** The employee dashboard's cards: totals per asset, the latest payment, and where it stands. */
route("GET", "/users/me/payments/summary", "user", (ctx) => {
	const db = read();
	const employee = employeeOfUser(db, me(ctx));
	const mine = employee ? livePayments(db).filter((t) => t.employee_id === employee.id) : [];
	const confirmed = mine.filter((t) => t.status === "CONFIRMED");
	const assets = [...new Set(confirmed.map((t) => t.asset))];
	const latest = [...mine].sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
	return ok({
		total_received: assets.map((asset) => {
			const list = confirmed.filter((t) => t.asset === asset);
			return { asset, amount: money(list.reduce((sum, t) => sum + Number(t.amount), 0)), count: list.length };
		}),
		latest_payment: latest ? myTxDto(db, latest) : null,
		current_status: latest?.status ?? null,
	});
});
