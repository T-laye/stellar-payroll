import { read, update } from "../db";
import { HttpError, companyOf, me, need, ok, route, type Ctx } from "../router";
import { employeeOfUser, employeeWallet, employeeWalletDetail, found, required, str, walletDto } from "../present";
import { credit, wallet } from "../seed";
import { hex, iso, money, random, uuid } from "../util";

/** Company treasury wallets (/companies/{id}/wallets) and the signed-in employee's own wallet (/users/me/wallet*). */

// ---- Company wallets ----

route("GET", "/companies/:id/wallets", "user", (ctx) => {
	const id = companyOf(ctx);
	need(ctx, "wallets:read", "wallets:manage");
	return ok(
		read()
			.wallets.filter((w) => w.owner_type === "COMPANY" && w.owner_id === id)
			.map((w) => {
				const { balances: _balances, ...rest } = walletDto(w);
				return rest;
			}),
	);
});

route("GET", "/companies/:id/wallets/:walletId", "user", (ctx) => {
	const id = companyOf(ctx);
	need(ctx, "wallets:read", "wallets:manage");
	return ok(
		walletDto(
			found(
				read().wallets.find((w) => w.id === ctx.params.walletId && w.owner_type === "COMPANY" && w.owner_id === id),
				"wallet",
			),
		),
	);
});

route("POST", "/companies/:id/wallets", "user", (ctx) => {
	const id = companyOf(ctx);
	need(ctx, "wallets:create", "wallets:manage");
	const type = str(ctx.body.wallet_type);
	if (!["OPERATIONAL", "ESCROW", "EXTERNAL"].includes(type))
		throw new HttpError(422, "wallet_type must be OPERATIONAL, ESCROW or EXTERNAL");
	const address = str(ctx.body.stellar_address);
	if (type === "EXTERNAL" && !/^G[A-Z2-7]{55}$/.test(address))
		throw new HttpError(422, "an EXTERNAL wallet needs a valid stellar_address");
	const created = update((db) => {
		const w = wallet(
			id,
			"COMPANY",
			id,
			type as "OPERATIONAL" | "ESCROW" | "EXTERNAL",
			random(Date.now()),
			iso(Date.now()),
			uuid,
			[
				// Friendbot funds new Testnet accounts with 10,000 XLM.
				{ asset: "XLM", amount: "10000.00" },
			],
		);
		if (address) w.stellar_address = address;
		if (str(ctx.body.secret_key)) w.secret_key = str(ctx.body.secret_key);
		db.wallets.push(w);
		db.auditLogs.unshift({
			id: uuid(),
			company_id: id,
			user_id: me(ctx).id,
			action: "wallet.created",
			resource_type: "wallet",
			resource_id: w.id,
			created_at: iso(Date.now()),
		});
		return walletDto(w);
	});
	return ok(created, "wallet created", 201);
});

route("POST", "/companies/:id/wallets/:walletId/trustlines", "user", (ctx) => {
	const id = companyOf(ctx);
	need(ctx, "wallets:manage", "wallets:create");
	required(ctx.body, "asset_code", "asset_issuer");
	const result = update((db) => {
		const w = found(
			db.wallets.find((x) => x.id === ctx.params.walletId && x.owner_type === "COMPANY" && x.owner_id === id),
			"wallet",
		);
		const asset = str(ctx.body.asset_code).toUpperCase();
		if (w.balances.some((b) => b.asset === asset)) throw new HttpError(409, `this wallet already trusts ${asset}`);
		credit(w, asset, 0);
		w.updated_at = iso(Date.now());
		return walletDto(w);
	});
	return ok(result, "trustline added", 201);
});

// ---- My wallet ----

function myWallet(ctx: Ctx) {
	const db = read();
	const employee = found(employeeOfUser(db, me(ctx)), "wallet");
	return { db, employee, wallet: found(employeeWallet(db, employee.id), "wallet") };
}

route("GET", "/users/me/wallet", "user", (ctx) => {
	const { db, employee, wallet: w } = myWallet(ctx);
	return ok(employeeWalletDetail(db, w, employee.id));
});

route("DELETE", "/users/me/wallet", "user", (ctx) => {
	const { wallet: w } = myWallet(ctx);
	update((db) => {
		db.wallets = db.wallets.filter((x) => x.id !== w.id);
	});
	return ok(null, "wallet deleted");
});

route("POST", "/users/me/wallet-pin", "user", (ctx) => {
	required(ctx.body, "pin");
	if (!/^\d{4,6}$/.test(str(ctx.body.pin))) throw new HttpError(422, "pin must be 4 to 6 digits");
	if (me(ctx).wallet_pin) throw new HttpError(409, "a wallet PIN is already set");
	update((db) => {
		db.users.find((u) => u.id === me(ctx).id)!.wallet_pin = str(ctx.body.pin);
	});
	return ok(null, "wallet PIN set", 201);
});

route("PATCH", "/users/me/wallet-pin", "user", (ctx) => {
	required(ctx.body, "current_pin", "new_pin");
	if (me(ctx).wallet_pin !== str(ctx.body.current_pin)) throw new HttpError(401, "current PIN is incorrect");
	if (!/^\d{4,6}$/.test(str(ctx.body.new_pin))) throw new HttpError(422, "pin must be 4 to 6 digits");
	update((db) => {
		db.users.find((u) => u.id === me(ctx).id)!.wallet_pin = str(ctx.body.new_pin);
	});
	return ok(null, "wallet PIN changed");
});

route("POST", "/users/me/wallet-pin/verify", "user", (ctx) => {
	required(ctx.body, "pin");
	if (!me(ctx).wallet_pin) throw new HttpError(404, "no wallet PIN set");
	if (me(ctx).wallet_pin !== str(ctx.body.pin)) throw new HttpError(401, "incorrect PIN");
	return ok({ verified: true }, "PIN verified");
});

route("GET", "/users/me/wallet/private-key", "user", (ctx) => {
	const { wallet: w } = myWallet(ctx);
	if (!w.secret_key) throw new HttpError(400, "external wallets have no stored private key");
	return ok({ private_key: w.secret_key, stellar_address: w.stellar_address }, "handle with care");
});

route("POST", "/users/me/wallet/transfer", "user", (ctx) => {
	required(ctx.body, "amount", "asset", "destination");
	const amount = Number(ctx.body.amount);
	if (!(amount > 0)) throw new HttpError(422, "amount must be greater than zero");
	const destination = str(ctx.body.destination);
	if (!/^G[A-Z2-7]{55}$/.test(destination)) throw new HttpError(422, "destination must be a Stellar public key");
	if (!me(ctx).wallet_pin) throw new HttpError(403, "set a wallet PIN before transferring");
	const { wallet: w } = myWallet(ctx);
	const asset = str(ctx.body.asset).toUpperCase();
	const balance = Number(w.balances.find((b) => b.asset === asset)?.amount ?? 0);
	if (balance < amount) throw new HttpError(400, `insufficient ${asset} balance`);
	update((db) => {
		credit(
			db.wallets.find((x) => x.id === w.id)!,
			asset,
			-amount,
		);
	});
	return ok({ stellar_tx_hash: hex(64), amount: money(amount), asset, destination }, "transfer submitted");
});
