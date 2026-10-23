import type {
	Asset,
	MockAuditLog,
	MockDb,
	MockEmployee,
	MockGroup,
	MockLineItem,
	MockRole,
	MockRun,
	MockSchedule,
	MockTransaction,
	MockUser,
	MockWallet,
	RunStatus,
} from "./db";
import { notify } from "./notify";
import { SYSTEM_ROLES } from "./permissions";
import { DAY, USDC_ISSUER, day, hex, iso, money, random, stellarAddress, stellarSecret, uuid } from "./util";

/**
 * The demo company, built relative to the first run so it always looks current: a year of
 * people, three pay groups, past runs that paid out, one run with a failed (retryable) payment,
 * and upcoming draft / approved runs.
 */

export const DEMO_PASSWORD = "Password1";
export const DEMO_ACCOUNTS = {
	owner: "demo@payorbit.com",
	hr: "hr@payorbit.com",
	employee: "employee@payorbit.com",
	/** PayOrbit staff: the admin console (apps/admin). */
	platformAdmin: "admin@payorbit.com",
} as const;
/**
 * Test accounts for the team: each owns its own company, as POST /auth/register would make it, with
 * a funded operational wallet and a monthly USDC pay group but no employees, so the PRD's test tasks
 * (add an employee, create and pay a payroll, …) start from a clean workspace. `admin@payorbit.com` is
 * PayOrbit staff (platform admin, for apps/admin); Northwind Traders starts suspended.
 */
export const TEST_ACCOUNTS = [
	{
		email: "stellardev002@gmail.com",
		password: "Test@1234",
		first: "Stellar",
		last: "Developer",
		role: "owner",
		platformAdmin: false,
		active: true,
		company: "Stellar Dev Studio",
		slug: "stellar-dev-studio",
		country: "Nigeria",
		timezone: "Africa/Lagos",
	},
	{
		email: "tlayefaah@gmail.com",
		password: "Test@1234",
		first: "Tubo",
		last: "Layefa",
		role: "admin",
		// Mirrors live, where this account is a platform admin.
		platformAdmin: true,
		active: true,
		company: "Layefa Technologies",
		slug: "layefa-technologies",
		country: "Nigeria",
		timezone: "Africa/Lagos",
	},
	{
		email: "admin@payorbit.com",
		password: "Password1",
		first: "Ola",
		last: "Adeyemi",
		role: "owner",
		platformAdmin: true,
		active: true,
		company: "PayOrbit",
		slug: "payorbit-hq",
		country: "Nigeria",
		timezone: "Africa/Lagos",
	},
	{
		// A suspended customer, so the admin console has one to reactivate.
		email: "owner@northwind.example",
		password: "Password1",
		first: "Grace",
		last: "Mensah",
		role: "owner",
		platformAdmin: false,
		active: false,
		company: "Northwind Traders",
		slug: "northwind",
		country: "Ghana",
		timezone: "Africa/Accra",
	},
] as const;
/** The employee demo account's wallet PIN. */
export const DEMO_PIN = "1234";
/**
 * Invite tokens for `POST /auth/complete-profile`: "invite-" + the first 8 characters of the
 * employee id (the handlers use the same rule). Emily was added this month and hasn't accepted hers.
 */
export const inviteToken = (employeeId: string) => `invite-${employeeId.slice(0, 8)}`;

type Person = {
	first: string;
	last: string;
	department: string;
	title: string;
	country: string;
	type: MockEmployee["employment_type"];
	salary: number;
	group: "core" | "contractors" | "support";
	/** Months since joining (negative = this month). */
	tenure: number;
	wallet: "custodial" | "external" | null;
	status?: MockEmployee["status"];
};

const PEOPLE: Person[] = [
	{
		first: "Amara",
		last: "Okafor",
		department: "Engineering",
		title: "Senior Backend Engineer",
		country: "Nigeria",
		type: "FULL_TIME",
		salary: 5200,
		group: "core",
		tenure: 14,
		wallet: "custodial",
	},
	{
		first: "Lucas",
		last: "Ferreira",
		department: "Engineering",
		title: "Frontend Engineer",
		country: "Brazil",
		type: "FULL_TIME",
		salary: 4800,
		group: "core",
		tenure: 11,
		wallet: "external",
	},
	{
		first: "Priya",
		last: "Raman",
		department: "Engineering",
		title: "DevOps Engineer",
		country: "India",
		type: "FULL_TIME",
		salary: 4500,
		group: "core",
		tenure: 9,
		wallet: "custodial",
	},
	{
		first: "Jonas",
		last: "Weber",
		department: "Product",
		title: "Product Designer",
		country: "Germany",
		type: "FULL_TIME",
		salary: 5000,
		group: "core",
		tenure: 8,
		wallet: "external",
	},
	{
		first: "Wanjiru",
		last: "Kamau",
		department: "Product",
		title: "Product Manager",
		country: "Kenya",
		type: "FULL_TIME",
		salary: 5400,
		group: "core",
		tenure: 12,
		wallet: "custodial",
	},
	{
		first: "Kofi",
		last: "Mensah",
		department: "Finance",
		title: "Finance Analyst",
		country: "Ghana",
		type: "PART_TIME",
		salary: 2600,
		group: "core",
		tenure: 7,
		wallet: "custodial",
	},
	{
		first: "Oliver",
		last: "Hughes",
		department: "Finance",
		title: "Accountant",
		country: "United Kingdom",
		type: "FULL_TIME",
		salary: 4300,
		group: "core",
		tenure: 10,
		wallet: "custodial",
		status: "INACTIVE",
	},
	{
		first: "Emily",
		last: "Carter",
		department: "Operations",
		title: "Operations Coordinator",
		country: "Canada",
		type: "FULL_TIME",
		salary: 4200,
		group: "core",
		tenure: -1,
		wallet: null,
	},
	{
		first: "Sofia",
		last: "Alvarez",
		department: "Marketing",
		title: "Content Strategist",
		country: "Mexico",
		type: "CONTRACTOR",
		salary: 1800,
		group: "contractors",
		tenure: 6,
		wallet: "custodial",
	},
	{
		first: "Mateo",
		last: "Silva",
		department: "Engineering",
		title: "Smart Contract Auditor",
		country: "Portugal",
		type: "CONTRACTOR",
		salary: 2200,
		group: "contractors",
		tenure: 5,
		wallet: "external",
	},
	{
		first: "Ana",
		last: "Costa",
		department: "Marketing",
		title: "Growth Marketer",
		country: "Portugal",
		type: "CONTRACTOR",
		salary: 1600,
		group: "contractors",
		tenure: 9,
		wallet: "custodial",
		status: "TERMINATED",
	},
	{
		first: "Thandiwe",
		last: "Nkosi",
		department: "Support",
		title: "Support Lead",
		country: "South Africa",
		type: "FULL_TIME",
		salary: 950,
		group: "support",
		tenure: 8,
		wallet: "custodial",
	},
	{
		first: "Rafael",
		last: "Cruz",
		department: "Support",
		title: "Support Specialist",
		country: "Philippines",
		type: "FULL_TIME",
		salary: 720,
		group: "support",
		tenure: 4,
		wallet: "custodial",
	},
];

export function buildSeed(version: number): MockDb {
	const rand = random(20261020);
	const id = () => uuid(rand);
	const now = Date.now();
	const at = (ms: number) => iso(ms);
	const created = at(now - 400 * DAY);

	const db: MockDb = {
		version,
		seededAt: at(now),
		companies: [],
		roles: [],
		users: [],
		overrides: [],
		employees: [],
		wallets: [],
		groups: [],
		runs: [],
		lineItems: [],
		transactions: [],
		paymentRequests: [],
		auditLogs: [],
		complianceChecks: [],
		schedules: [],
		notifications: [],
	};

	const company = {
		id: id(),
		name: "Orbit Labs",
		slug: "orbit-labs",
		country: "Nigeria",
		timezone: "Africa/Lagos",
		default_currency: "USD",
		email: "finance@orbitlabs.example",
		phone: "+234 801 234 5678",
		website: "https://orbitlabs.example",
		logo_url: null,
		is_active: true,
		created_at: created,
		updated_at: created,
	};
	db.companies.push(company);
	db.roles.push(...systemRoles(company.id, created, id));
	const role = (slug: string) => db.roles.find((r) => r.slug === slug)!.id;

	const user = (email: string, first: string, last: string, roleSlug: string, extra: Partial<MockUser> = {}): MockUser => ({
		id: id(),
		company_id: company.id,
		email,
		password: DEMO_PASSWORD,
		first_name: first,
		last_name: last,
		role_id: role(roleSlug),
		is_active: true,
		email_verified_at: created,
		last_login_at: at(now - 2 * DAY),
		invite_token: null,
		wallet_pin: null,
		created_at: created,
		updated_at: created,
		...extra,
	});
	const owner = user(DEMO_ACCOUNTS.owner, "Jordan", "Lee", "owner");
	const hr = user(DEMO_ACCOUNTS.hr, "Chidi", "Eze", "hr-manager");
	db.users.push(owner, hr);

	// Company treasury.
	const operational = wallet(company.id, "COMPANY", company.id, "OPERATIONAL", rand, created, id, [
		{ asset: "XLM", amount: "12500.00" },
		{ asset: "USDC", amount: "48250.00" },
	]);
	const escrow = wallet(company.id, "COMPANY", company.id, "ESCROW", rand, created, id, [
		{ asset: "XLM", amount: "2500.00" },
		{ asset: "USDC", amount: "10000.00" },
	]);
	db.wallets.push(operational, escrow);

	const groups: Record<Person["group"], MockGroup> = {
		core: group(
			company.id,
			"Core team — monthly",
			"Full-time and part-time staff, paid on the last day of the month.",
			"USDC",
			"MONTHLY",
			"Africa/Lagos",
			created,
			id,
		),
		contractors: group(
			company.id,
			"Contractors — bi-weekly",
			"Independent contractors, paid every other Friday.",
			"USDC",
			"BIWEEKLY",
			"UTC",
			created,
			id,
		),
		support: group(
			company.id,
			"Support — weekly",
			"Customer support team, paid weekly in XLM.",
			"XLM",
			"WEEKLY",
			"Africa/Johannesburg",
			created,
			id,
		),
	};
	db.groups.push(...Object.values(groups));

	// People, their wallets and (for two of them) their PayOrbit accounts.
	const departmentCounts: Record<string, number> = {};
	for (const p of PEOPLE) {
		const start = p.tenure < 0 ? now - 6 * DAY : now - p.tenure * 30 * DAY;
		const prefix = p.department.slice(0, 3).toUpperCase();
		departmentCounts[prefix] = (departmentCounts[prefix] ?? 0) + 1;
		const employee: MockEmployee = {
			id: id(),
			company_id: company.id,
			user_id: null,
			employee_number: `${prefix}-${String(departmentCounts[prefix]).padStart(3, "0")}`,
			first_name: p.first,
			last_name: p.last,
			email: `${p.first}.${p.last}@orbitlabs.example`.toLowerCase(),
			phone: `+1 555 01${String(db.employees.length).padStart(2, "0")}`,
			country: p.country,
			department: p.department,
			job_title: p.title,
			employment_type: p.type,
			external_id: `HRIS-${1000 + db.employees.length}`,
			group_id: groups[p.group].id,
			role_slug: "employee",
			salary_amount: money(p.salary),
			salary_currency: groups[p.group].currency,
			pay_frequency: groups[p.group].pay_cycle,
			start_date: day(start),
			end_date: p.status === "TERMINATED" ? day(now - 45 * DAY) : null,
			// PENDING until a wallet is linked.
			status: p.status ?? (p.wallet ? "ACTIVE" : "PENDING"),
			created_at: at(start - 5 * DAY),
			updated_at: at(start - 5 * DAY),
		};
		db.employees.push(employee);
		if (p.wallet) {
			const type = p.wallet === "custodial" ? "CUSTODIAL" : "EXTERNAL";
			db.wallets.push(
				wallet(company.id, "EMPLOYEE", employee.id, type, rand, employee.created_at, id, [
					{ asset: "XLM", amount: "25.00" },
					{ asset: "USDC", amount: "0.00" },
				]),
			);
		}
	}
	const byName = (first: string) => db.employees.find((e) => e.first_name === first)!;

	// The employee demo account is Amara; Emily has a pending invite.
	const amara = byName("Amara");
	const amaraUser = user(DEMO_ACCOUNTS.employee, amara.first_name, amara.last_name, "employee", { wallet_pin: DEMO_PIN });
	amara.user_id = amaraUser.id;
	const emily = byName("Emily");
	const emilyUser = user(emily.email, emily.first_name, emily.last_name, "employee", {
		is_active: false,
		email_verified_at: null,
		last_login_at: null,
		invite_token: inviteToken(emily.id),
		created_at: emily.created_at,
		updated_at: emily.created_at,
	});
	emily.user_id = emilyUser.id;
	db.users.push(amaraUser, emilyUser);

	// ---- Payroll history ----
	let ledger = 1_482_000;
	const walletOf = (employeeId: string) => db.wallets.find((w) => w.owner_type === "EMPLOYEE" && w.owner_id === employeeId);
	const audit = (
		action: string,
		resource_type: string,
		resource_id: string | null,
		when: number,
		by: string | null = owner.id,
	) => {
		const log: MockAuditLog = {
			id: id(),
			company_id: company.id,
			user_id: by,
			action,
			resource_type,
			resource_id,
			created_at: at(when),
		};
		db.auditLogs.push(log);
	};

	/** A run in `status`, paid (or not) at `payAt`, for the group's people employed by then. */
	const addRun = (
		name: string,
		g: MockGroup,
		periodStart: number,
		periodEnd: number,
		payAt: number,
		status: RunStatus,
		failFirst?: string,
	) => {
		const run: MockRun = {
			id: id(),
			company_id: company.id,
			name,
			group_id: g.id,
			schedule_id: null,
			currency: g.currency,
			notes: "",
			period_start: day(periodStart),
			period_end: day(periodEnd),
			scheduled_at: at(payAt),
			status,
			stellar_memo: null,
			total_amount: "0.00",
			created_by: status === "DRAFT" ? hr.id : owner.id,
			approved_by: status === "DRAFT" ? null : owner.id,
			// Upcoming runs were drafted and approved in the past, never "in 6 days".
			approved_at: status === "DRAFT" ? null : at(Math.min(payAt - 2 * DAY, now - 3 * 3_600_000)),
			executed_at: status === "COMPLETED" || status === "FAILED" ? at(payAt) : null,
			completed_at: status === "COMPLETED" ? at(payAt + 60_000) : null,
			created_at: at(Math.min(payAt - 4 * DAY, now - DAY)),
			updated_at: at(Math.min(payAt, now)),
		};
		run.stellar_memo = `PO-${run.id.slice(0, 8).toUpperCase()}`;
		const paid = run.executed_at !== null;
		const people = db.employees.filter((e) => {
			if (e.group_id !== g.id) return false;
			if (Date.parse(e.start_date) > periodEnd) return false;
			if (paid) return !e.end_date || Date.parse(e.end_date) >= periodStart;
			// Unpaid runs carry active and pending people; pending ones (no wallet) show up in the review.
			return e.status === "ACTIVE" || e.status === "PENDING";
		});
		let total = 0;
		people.forEach((e, i) => {
			const w = walletOf(e.id);
			const item: MockLineItem = {
				id: id(),
				company_id: company.id,
				payroll_run_id: run.id,
				employee_id: e.id,
				amount: e.salary_amount,
				currency: g.currency,
				wallet_address: w?.stellar_address ?? "",
				notes: "",
				status: "PENDING",
				transaction_id: null,
				created_at: run.created_at,
			};
			total += Number(e.salary_amount);
			db.lineItems.push(item);
			if (!paid) return;
			const failed = failFirst !== undefined && e.first_name === failFirst;
			const tx: MockTransaction = {
				id: id(),
				company_id: company.id,
				payroll_run_id: run.id,
				line_item_id: item.id,
				employee_id: e.id,
				amount: item.amount,
				asset: g.currency,
				from_address: operational.stellar_address,
				to_address: item.wallet_address,
				status: failed ? "FAILED" : "CONFIRMED",
				stellar_tx_hash: failed ? null : hex(64, rand),
				ledger_sequence: failed ? null : ledger++,
				fee_amount: failed ? null : "0.00001",
				error_message: failed ? FAILURES.network : null,
				failure_code: failed ? "NETWORK_ERROR" : null,
				retry_count: 0,
				attempts: [],
				superseded_by: null,
				created_at: at(payAt + i * 1000),
				submitted_at: at(payAt + i * 1000 + 2000),
				confirmed_at: failed ? null : at(payAt + i * 1000 + 7000),
				next_at: null,
			};
			tx.attempts.push({
				attempt: 1,
				status: failed ? "FAILED" : "CONFIRMED",
				stellar_tx_hash: tx.stellar_tx_hash,
				error: tx.error_message,
				failure_code: tx.failure_code,
				at: tx.confirmed_at ?? tx.submitted_at ?? tx.created_at,
			});
			item.status = tx.status;
			item.transaction_id = tx.id;
			db.transactions.push(tx);
			if (!failed && w) credit(w, g.currency, Number(item.amount) * 0.35);
		});
		run.total_amount = money(total);
		db.runs.push(run);
		audit("payroll_run.created", "payroll_run", run.id, Date.parse(run.created_at), run.created_by);
		if (run.approved_at) audit("payroll_run.approved", "payroll_run", run.id, Date.parse(run.approved_at));
		if (run.executed_at) {
			audit("payroll_run.executed", "payroll_run", run.id, payAt);
			db.complianceChecks.push({
				id: id(),
				payroll_run_id: run.id,
				status: "PASSED",
				checks: [
					{ name: "wallet_addresses_present", status: "PASSED", details: "Every line item has a Stellar wallet address." },
					{ name: "amounts_positive", status: "PASSED", details: "Every line item amount is greater than zero." },
				],
				checked_at: at(payAt - DAY),
			});
		}
		return run;
	};

	// Core team: the last five month-ends paid, this month's run drafted.
	const today = new Date(now);
	const month = (ms: number) => new Date(ms).toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
	const short = (ms: number) => new Date(ms).toLocaleString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

	// Core team: the last five month-ends paid, this month's run drafted.
	const coreRuns: MockRun[] = [];
	for (let k = 5; k >= 1; k--) {
		const start = Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - k, 1);
		const end = Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - k + 1, 0);
		coreRuns.push(addRun(`${month(start)} payroll`, groups.core, start, end, end + 9 * 3_600_000, "COMPLETED"));
	}
	const monthStart = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1);
	const monthEnd = Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0);
	const corePayAt = Math.max(monthEnd + 9 * 3_600_000, now + 3 * DAY);
	const coreDraft = addRun(`${month(monthStart)} payroll`, groups.core, monthStart, monthEnd, corePayAt, "DRAFT");
	coreDraft.notes = "Emily joins this cycle.";
	coreRuns.push(coreDraft);

	// Contractors: every 14 days; the most recent one had a payment fail.
	const lastFriday = now - 6 * DAY;
	const contractorRuns: MockRun[] = [];
	for (let k = 4; k >= 1; k--) {
		const payAt = lastFriday - k * 14 * DAY;
		contractorRuns.push(
			addRun(`Contractors · ${short(payAt)}`, groups.contractors, payAt - 14 * DAY, payAt - DAY, payAt, "COMPLETED"),
		);
	}
	const failedRun = addRun(
		`Contractors · ${short(lastFriday)}`,
		groups.contractors,
		lastFriday - 14 * DAY,
		lastFriday - DAY,
		lastFriday,
		"FAILED",
		"Mateo",
	);
	const contractorNext = lastFriday + 14 * DAY;
	contractorRuns.push(
		failedRun,
		addRun(
			`Contractors · ${short(contractorNext)}`,
			groups.contractors,
			lastFriday,
			contractorNext - DAY,
			contractorNext,
			"APPROVED",
		),
	);

	// Support: weekly in XLM; next one approved and due in a few days.
	const supportRuns: MockRun[] = [];
	for (let k = 6; k >= 1; k--) {
		const payAt = now - k * 7 * DAY + 2 * DAY;
		supportRuns.push(addRun(`Support · ${short(payAt)}`, groups.support, payAt - 7 * DAY, payAt - DAY, payAt, "COMPLETED"));
	}
	const supportNext = now + 3 * DAY;
	supportRuns.push(addRun(`Support · ${short(supportNext)}`, groups.support, now - 5 * DAY, now + DAY, supportNext, "APPROVED"));

	// ---- Recurring schedules (proposed): each group's runs came from one ----
	const schedule = (
		name: string,
		g: MockGroup | null,
		frequency: MockSchedule["frequency"],
		asset: Asset,
		next: number,
		status: MockSchedule["status"],
		runs: MockRun[],
		people: string[] = [],
	) => {
		const members = g
			? db.employees.filter((e) => e.group_id === g.id && (e.status === "ACTIVE" || e.status === "PENDING"))
			: db.employees.filter((e) => people.includes(e.first_name));
		const s: MockSchedule = {
			id: id(),
			company_id: company.id,
			name,
			frequency,
			asset,
			employee_ids: members.map((e) => e.id),
			next_run_at: at(next),
			status,
			last_drafted_for: runs.length ? at(next) : null,
			created_by: owner.id,
			created_at: created,
			updated_at: created,
		};
		for (const r of runs) r.schedule_id = s.id;
		db.schedules.push(s);
		return s;
	};
	schedule("Core team payroll", groups.core, "MONTHLY", "USDC", corePayAt, "ACTIVE", coreRuns);
	schedule("Contractors payroll", groups.contractors, "BIWEEKLY", "USDC", contractorNext, "ACTIVE", contractorRuns);
	schedule("Support team payroll", groups.support, "WEEKLY", "XLM", supportNext, "ACTIVE", supportRuns);
	schedule("Advisory retainers", null, "MONTHLY", "USDC", corePayAt + 5 * DAY, "PAUSED", [], ["Jonas", "Kofi"]);

	// Employees' requests for missed or extra payments.
	const request = (
		e: MockEmployee,
		amount: number,
		note: string,
		status: "PENDING" | "APPROVED" | "REJECTED",
		ago: number,
		reviewNote: string | null = null,
	) => {
		db.paymentRequests.push({
			id: id(),
			company_id: company.id,
			employee_id: e.id,
			amount: money(amount),
			currency: e.salary_currency,
			note,
			status,
			review_note: reviewNote,
			reviewed_by: status === "PENDING" ? null : owner.id,
			created_at: at(now - ago * DAY),
			updated_at: at(now - ago * DAY + (status === "PENDING" ? 0 : DAY)),
		});
	};
	request(amara, 340, "Conference travel reimbursement (Lagos → Nairobi).", "PENDING", 2);
	request(amara, 150, "Home office internet, August.", "APPROVED", 40, "Added to the next core payroll.");
	request(byName("Rafael"), 120, "Overtime during the October launch weekend.", "PENDING", 1);
	request(byName("Sofia"), 600, "Extra article batch not in the contract.", "REJECTED", 20, "Covered by the September invoice.");

	// ---- Notifications (proposed): what each demo account would already have been told ----
	const admins = [owner.id, hr.id];
	const fmt = (amount: string, asset: string) =>
		`${Number(amount).toLocaleString("en-US", { minimumFractionDigits: 2 })} ${asset}`;
	const told = (
		to: string[],
		when: number,
		kind: string,
		title: string,
		body: string,
		tone: "info" | "success" | "warning" | "error",
		resource_type: "payroll_run" | "transaction",
		resource_id: string,
		read: boolean,
	) => {
		notify(db, company.id, to, { kind, title, body, tone, resource_type, resource_id }, when);
		if (read) for (const n of db.notifications.slice(0, to.length)) n.read_at = at(when + 3_600_000);
	};
	const amaraPaid = db.transactions
		.filter((t) => t.employee_id === amara.id && t.status === "CONFIRMED")
		.sort((a, b) => a.created_at.localeCompare(b.created_at));
	amaraPaid.forEach((t, i) =>
		told(
			[amaraUser.id],
			Date.parse(t.confirmed_at!),
			"employee.payment_completed",
			"Payment received",
			`Your payment of ${fmt(t.amount, t.asset)} has been received.`,
			"success",
			"transaction",
			t.id,
			i < amaraPaid.length - 1,
		),
	);
	for (const r of [coreRuns[coreRuns.length - 2]!, supportRuns[supportRuns.length - 2]!]) {
		told(
			admins,
			Date.parse(r.scheduled_at) + 60_000,
			"payroll.completed",
			"Payroll completed",
			`Every payment in ${r.name} was received (${fmt(r.total_amount, r.currency)}).`,
			"success",
			"payroll_run",
			r.id,
			true,
		);
	}
	const mateoTx = db.transactions.find((t) => t.payroll_run_id === failedRun.id && t.status === "FAILED");
	if (mateoTx) {
		told(
			admins,
			lastFriday + 30_000,
			"payment.failed",
			"Payment failed",
			`${fmt(mateoTx.amount, mateoTx.asset)} to Mateo Silva in ${failedRun.name} failed. Review the reason and retry.`,
			"error",
			"transaction",
			mateoTx.id,
			false,
		);
	}
	told(
		admins,
		lastFriday + 60_000,
		"payroll.failed",
		"Payroll finished with failures",
		`Some payments in ${failedRun.name} failed. Retry them from the payroll details.`,
		"error",
		"payroll_run",
		failedRun.id,
		false,
	);
	told(
		admins,
		Date.parse(coreDraft.created_at),
		"payroll.ready_for_review",
		"Payroll ready for review",
		`${coreDraft.name} (${fmt(coreDraft.total_amount, coreDraft.currency)}) is waiting for review and approval.`,
		"warning",
		"payroll_run",
		coreDraft.id,
		false,
	);
	db.notifications.sort((a, b) => b.created_at.localeCompare(a.created_at));

	for (const e of db.employees) audit("employee.created", "employee", e.id, Date.parse(e.created_at), hr.id);
	audit("wallet.created", "wallet", operational.id, Date.parse(created));
	for (const t of TEST_ACCOUNTS) seedTestCompany(db, t, rand, at(now - DAY), id);

	db.auditLogs.sort((a, b) => b.created_at.localeCompare(a.created_at));

	return db;
}

/** The failure reasons the payout engine produces, worded like Horizon result codes. */
export const FAILURES = {
	noWallet: "invalid destination: the employee has no Stellar wallet (op_no_destination)",
	noTrust: "the destination account does not trust this asset (op_no_trust)",
	underfunded: "insufficient balance in the operational wallet (op_underfunded)",
	network: "network error: Horizon timed out before the transaction was included in a ledger (tx_too_late)",
};

function systemRoles(companyId: string, created: string, id: () => string): MockRole[] {
	return SYSTEM_ROLES.map((r) => ({
		...r,
		id: id(),
		company_id: companyId,
		is_system: true,
		is_active: true,
		created_at: created,
		updated_at: created,
	}));
}

function group(
	companyId: string,
	name: string,
	description: string,
	currency: Asset,
	pay_cycle: MockGroup["pay_cycle"],
	timezone: string,
	created: string,
	id: () => string,
): MockGroup {
	return {
		id: id(),
		company_id: companyId,
		name,
		description,
		currency,
		pay_cycle,
		timezone,
		is_active: true,
		created_at: created,
		updated_at: created,
	};
}

export function wallet(
	companyId: string,
	owner_type: MockWallet["owner_type"],
	owner_id: string,
	wallet_type: MockWallet["wallet_type"],
	rand: () => number,
	created: string,
	id: () => string,
	balances: MockWallet["balances"],
): MockWallet {
	const custodial = wallet_type !== "EXTERNAL";
	return {
		id: id(),
		company_id: companyId,
		owner_type,
		owner_id,
		wallet_type,
		network: "TESTNET",
		stellar_address: stellarAddress(rand),
		secret_key: custodial ? stellarSecret(rand) : null,
		is_funded: true,
		balances,
		created_at: created,
		updated_at: created,
	};
}

/** Adds to a wallet's balance of `asset` (opening the trustline if needed). */
export function credit(w: MockWallet, asset: string, amount: number) {
	const balance = w.balances.find((b) => b.asset === asset);
	if (balance) balance.amount = money(Number(balance.amount) + amount);
	else w.balances.push({ asset, amount: money(amount) });
}

export { USDC_ISSUER };

/** One test company: owner (signed in with their own password), roles, a funded wallet, a pay group. */
function seedTestCompany(db: MockDb, t: (typeof TEST_ACCOUNTS)[number], rand: () => number, created: string, id: () => string) {
	const companyId = id();
	db.companies.push({
		id: companyId,
		name: t.company,
		slug: t.slug,
		country: t.country,
		timezone: t.timezone,
		default_currency: "USD",
		email: t.email,
		phone: null,
		website: null,
		logo_url: null,
		is_active: t.active,
		created_at: created,
		updated_at: created,
	});
	db.roles.push(...systemRoles(companyId, created, id));
	db.users.push({
		is_platform_admin: t.platformAdmin,
		platform_admin_granted_at: t.platformAdmin ? created : null,
		platform_admin_granted_by: null,
		id: id(),
		company_id: companyId,
		email: t.email,
		password: t.password,
		first_name: t.first,
		last_name: t.last,
		role_id: db.roles.find((r) => r.company_id === companyId && r.slug === t.role)!.id,
		is_active: true,
		email_verified_at: created,
		last_login_at: null,
		invite_token: null,
		wallet_pin: null,
		created_at: created,
		updated_at: created,
	});
	db.wallets.push(
		wallet(companyId, "COMPANY", companyId, "OPERATIONAL", rand, created, id, [
			{ asset: "XLM", amount: money(10000) },
			{ asset: "USDC", amount: money(50000) },
		]),
	);
	db.groups.push(group(companyId, "Team — monthly", "Everyone paid at the end of the month.", "USDC", "MONTHLY", t.timezone, created, id));
}
