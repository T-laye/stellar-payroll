import type { MockDb, MockEmployee, MockTransaction, MockUser, MockWallet } from "./db";
import { HttpError } from "./router";

/** Records as the API returns them: internal fields (secrets, engine state) stripped. */

export function walletDto(w: MockWallet) {
	const { secret_key: _secret, company_id: _company, ...rest } = w;
	return rest;
}

export function walletSummary(w: MockWallet | undefined) {
	return w ? { id: w.id, is_funded: w.is_funded, network: w.network, stellar_address: w.stellar_address } : null;
}

export const employeeWallet = (db: MockDb, employeeId: string) =>
	db.wallets.find((w) => w.owner_type === "EMPLOYEE" && w.owner_id === employeeId);

export function employeeDto(db: MockDb, e: MockEmployee) {
	const { user_id: _user, ...rest } = e;
	const account = db.users.find((u) => u.id === e.user_id);
	return {
		...rest,
		wallet: walletSummary(employeeWallet(db, e.id)),
		/** Proposed (docs/PLAN.md §9): whether the employee has accepted their invite. */
		invite_status: !account ? "NOT_INVITED" : account.is_active ? "ACCEPTED" : "PENDING",
	};
}

export function txDto(tx: MockTransaction) {
	const { next_at: _next, ...rest } = tx;
	return rest;
}

export function userDto(db: MockDb, u: MockUser) {
	const role = db.roles.find((r) => r.id === u.role_id);
	return {
		id: u.id,
		company_id: u.company_id,
		email: u.email,
		first_name: u.first_name,
		last_name: u.last_name,
		role_id: u.role_id,
		role_name: role?.name ?? "Employee",
		is_active: u.is_active,
		email_verified_at: u.email_verified_at,
		last_login_at: u.last_login_at,
		created_at: u.created_at,
	};
}

/** The employee record behind a signed-in user (self-service routes). */
export function employeeOfUser(db: MockDb, user: MockUser) {
	return db.employees.find((e) => e.user_id === user.id || e.email.toLowerCase() === user.email.toLowerCase());
}

/** Wallet detail with the last confirmed payment and the payment count. */
export function employeeWalletDetail(db: MockDb, w: MockWallet, employeeId: string) {
	const paid = db.transactions
		.filter((t) => t.employee_id === employeeId && t.status === "CONFIRMED")
		.sort((a, b) => (b.confirmed_at ?? "").localeCompare(a.confirmed_at ?? ""));
	const last = paid[0];
	return {
		...walletDto(w),
		total_payments_received: paid.length,
		last_payment: last
			? {
					amount: last.amount,
					asset: last.asset,
					confirmed_at: last.confirmed_at,
					from_address: last.from_address,
					stellar_tx_hash: last.stellar_tx_hash,
					transaction_id: last.id,
				}
			: null,
	};
}

export function found<T>(value: T | undefined | null, what: string): T {
	if (value === undefined || value === null) throw new HttpError(404, `${what} not found`);
	return value;
}

export function required(body: Record<string, unknown>, ...fields: string[]) {
	for (const field of fields) {
		const value = body[field];
		if (value === undefined || value === null || String(value).trim() === "") throw new HttpError(422, `${field} is required`);
	}
}

export const str = (value: unknown) => (value === undefined || value === null ? "" : String(value).trim());
