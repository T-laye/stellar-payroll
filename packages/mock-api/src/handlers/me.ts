import { read, update, type MockPaymentRequest } from "../db";
import { HttpError, me, ok, route } from "../router";
import { employeeOfUser, found, required, str, txDto, userDto } from "../present";
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

/** Proposed endpoint (docs/PLAN.md §2): the employee's own payments, newest first. */
route("GET", "/users/me/transactions", "user", (ctx) => {
	const db = read();
	const employee = employeeOfUser(db, me(ctx));
	if (!employee) return ok([]);
	return ok(
		db.transactions
			.filter((t) => t.employee_id === employee.id)
			.sort((a, b) => b.created_at.localeCompare(a.created_at))
			.map((t) => ({ ...txDto(t), payroll_run_name: db.runs.find((r) => r.id === t.payroll_run_id)?.name ?? "" })),
	);
});

route("GET", "/users/me/transactions/:id", "user", (ctx) => {
	const db = read();
	const employee = employeeOfUser(db, me(ctx));
	const tx = found(
		db.transactions.find((t) => t.id === ctx.params.id && t.employee_id === employee?.id),
		"transaction",
	);
	return ok({ ...txDto(tx), payroll_run_name: db.runs.find((r) => r.id === tx.payroll_run_id)?.name ?? "" });
});
