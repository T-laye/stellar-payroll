import { buildSeed } from "./seed";

/**
 * The mock backend's data: one JSON document in localStorage, shaped like the PayOrbit API's
 * records (Swagger at payorbit-production.up.railway.app/docs). Reads return deep copies so
 * handlers never mutate state by accident; `update` is the only way to write. `resetMockDb()`
 * restores the seed.
 */

export type Asset = "USDC" | "XLM";
export type TxStatus = "PENDING" | "SUBMITTED" | "CONFIRMED" | "FAILED";
export type RunStatus = "DRAFT" | "APPROVED" | "PROCESSING" | "COMPLETED" | "FAILED" | "RETRYING";
export type PayCycle = "WEEKLY" | "BIWEEKLY" | "MONTHLY";
/** Proposed (docs/PLAN.md §8): why a payment failed, as a code the UI can act on. */
export type FailureCode = "INVALID_WALLET" | "NO_TRUSTLINE" | "INSUFFICIENT_BALANCE" | "NETWORK_ERROR" | "TRANSACTION_FAILED";

export interface MockCompany {
	id: string;
	name: string;
	slug: string;
	country: string;
	timezone: string;
	default_currency: string;
	email: string;
	phone: string | null;
	website: string | null;
	logo_url: string | null;
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

export interface MockRole {
	id: string;
	company_id: string;
	name: string;
	slug: string;
	description: string;
	permissions: string[];
	is_system: boolean;
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

export interface MockUser {
	id: string;
	company_id: string;
	email: string;
	password: string;
	first_name: string;
	last_name: string;
	role_id: string;
	is_active: boolean;
	email_verified_at: string | null;
	last_login_at: string | null;
	/** Single-use token from the employee invite email (`POST /auth/complete-profile`). */
	invite_token: string | null;
	wallet_pin: string | null;
	created_at: string;
	updated_at: string;
}

export interface MockOverride {
	id: string;
	company_id: string;
	user_id: string;
	permission: string;
	type: "GRANT" | "REVOKE";
	granted_by: string;
	created_at: string;
}

export interface MockEmployee {
	id: string;
	company_id: string;
	/** The employee's PayOrbit account, once invited. */
	user_id: string | null;
	employee_number: string;
	first_name: string;
	last_name: string;
	email: string;
	phone: string;
	country: string;
	department: string;
	job_title: string;
	employment_type: "FULL_TIME" | "PART_TIME" | "CONTRACTOR";
	external_id: string;
	group_id: string | null;
	role_slug: string;
	salary_amount: string;
	salary_currency: Asset;
	/** Proposed (docs/PLAN.md §9): the API only has the pay group's `pay_cycle`. */
	pay_frequency: PayCycle;
	start_date: string;
	end_date: string | null;
	status: "ACTIVE" | "INACTIVE" | "TERMINATED";
	created_at: string;
	updated_at: string;
}

export interface MockBalance {
	asset: string;
	amount: string;
}

export interface MockWallet {
	id: string;
	company_id: string;
	owner_type: "COMPANY" | "EMPLOYEE";
	/** Company id or employee id. */
	owner_id: string;
	wallet_type: "OPERATIONAL" | "ESCROW" | "EXTERNAL" | "CUSTODIAL";
	network: "TESTNET";
	stellar_address: string;
	/** Custodial wallets only. Never returned except by the private-key export. */
	secret_key: string | null;
	is_funded: boolean;
	/** One entry per asset the account trusts (XLM always). */
	balances: MockBalance[];
	created_at: string;
	updated_at: string;
}

export interface MockGroup {
	id: string;
	company_id: string;
	name: string;
	description: string;
	currency: Asset;
	pay_cycle: PayCycle;
	timezone: string;
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

export interface MockRun {
	id: string;
	company_id: string;
	/** Proposed: the cycle's display name ("October 2026 payroll"). The API only has `notes`. */
	name: string;
	group_id: string;
	/** Proposed (docs/PLAN.md §6): the recurring schedule that drafted this run. */
	schedule_id: string | null;
	currency: Asset;
	notes: string;
	period_start: string;
	period_end: string;
	scheduled_at: string;
	status: RunStatus;
	stellar_memo: string | null;
	total_amount: string;
	created_by: string;
	approved_by: string | null;
	approved_at: string | null;
	executed_at: string | null;
	created_at: string;
	updated_at: string;
}

export interface MockLineItem {
	id: string;
	company_id: string;
	payroll_run_id: string;
	employee_id: string;
	amount: string;
	currency: Asset;
	wallet_address: string;
	notes: string;
	status: TxStatus;
	transaction_id: string | null;
	created_at: string;
}

export interface MockTransaction {
	id: string;
	company_id: string;
	payroll_run_id: string;
	line_item_id: string;
	employee_id: string;
	amount: string;
	asset: Asset;
	from_address: string;
	to_address: string;
	status: TxStatus;
	stellar_tx_hash: string | null;
	ledger_sequence: number | null;
	fee_amount: string | null;
	error_message: string | null;
	/** Proposed (docs/PLAN.md §8). */
	failure_code: FailureCode | null;
	retry_count: number;
	/** Proposed (docs/PLAN.md §8): every try, so a retry keeps the earlier failure on record. */
	attempts: MockAttempt[];
	created_at: string;
	submitted_at: string | null;
	confirmed_at: string | null;
	/** Engine only: when (ms) this transaction takes its next step. */
	next_at: number | null;
}

export interface MockAttempt {
	attempt: number;
	status: "CONFIRMED" | "FAILED";
	stellar_tx_hash: string | null;
	error_message: string | null;
	failure_code: FailureCode | null;
	at: string;
}

/** Proposed (docs/PLAN.md §6): a recurring payroll. It drafts a run before each pay date; an admin still approves it. */
export interface MockSchedule {
	id: string;
	company_id: string;
	name: string;
	frequency: PayCycle;
	asset: Asset;
	employee_ids: string[];
	/** The next pay date. */
	next_run_at: string;
	status: "ACTIVE" | "PAUSED" | "CANCELLED";
	/** The pay date whose draft run has already been created (engine only). */
	last_drafted_for: string | null;
	created_by: string;
	created_at: string;
	updated_at: string;
}

/** Proposed (docs/PLAN.md §10): an in-app notification for one user. */
export interface MockNotification {
	id: string;
	company_id: string;
	user_id: string;
	kind: string;
	title: string;
	body: string;
	resource_type: "payroll_run" | "transaction" | "schedule" | "employee" | null;
	resource_id: string | null;
	tone: "info" | "success" | "warning" | "error";
	read_at: string | null;
	created_at: string;
}

export interface MockPaymentRequest {
	id: string;
	company_id: string;
	employee_id: string;
	amount: string;
	currency: Asset;
	note: string;
	status: "PENDING" | "APPROVED" | "REJECTED" | "PAID";
	review_note: string | null;
	reviewed_by: string | null;
	created_at: string;
	updated_at: string;
}

export interface MockAuditLog {
	id: string;
	company_id: string;
	user_id: string | null;
	action: string;
	resource_type: string;
	resource_id: string | null;
	created_at: string;
}

export interface MockComplianceCheck {
	id: string;
	payroll_run_id: string;
	status: "PASSED" | "FAILED";
	checks: { name: string; status: "PASSED" | "FAILED"; details: string }[];
	checked_at: string;
}

export interface MockDb {
	version: number;
	seededAt: string;
	companies: MockCompany[];
	roles: MockRole[];
	users: MockUser[];
	overrides: MockOverride[];
	employees: MockEmployee[];
	wallets: MockWallet[];
	groups: MockGroup[];
	runs: MockRun[];
	lineItems: MockLineItem[];
	transactions: MockTransaction[];
	paymentRequests: MockPaymentRequest[];
	auditLogs: MockAuditLog[];
	complianceChecks: MockComplianceCheck[];
	schedules: MockSchedule[];
	notifications: MockNotification[];
}

const KEY = "payorbit-mock-db";
const VERSION = 3;

let memory: MockDb | null = null;

function storage(): Storage | null {
	try {
		return typeof window === "undefined" ? null : window.localStorage;
	} catch {
		return null;
	}
}

function load(): MockDb {
	if (memory) return memory;
	const raw = storage()?.getItem(KEY);
	if (raw) {
		try {
			const parsed = JSON.parse(raw) as MockDb;
			if (parsed.version === VERSION) return (memory = parsed);
		} catch {
			// Corrupt or older document: fall through to a fresh seed.
		}
	}
	memory = buildSeed(VERSION);
	save(memory);
	return memory;
}

function save(db: MockDb) {
	memory = db;
	try {
		storage()?.setItem(KEY, JSON.stringify(db));
	} catch {
		// Private mode or quota: keep working from memory.
	}
}

/** A deep copy of the current data. */
export function read(): MockDb {
	return structuredClone(load());
}

/** Applies a change and persists it. */
export function update<T>(change: (db: MockDb) => T): T {
	const db = structuredClone(load());
	const result = change(db);
	save(db);
	return result;
}

/** Back to the seed (the demo's "Reset demo data"). */
export function resetMockDb() {
	memory = null;
	storage()?.removeItem(KEY);
	load();
}
