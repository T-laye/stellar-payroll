export type Asset = "USDC" | "XLM";
export type PayCycle = "WEEKLY" | "BIWEEKLY" | "MONTHLY";
export type RunStatus = "DRAFT" | "APPROVED" | "PROCESSING" | "COMPLETED" | "FAILED" | "RETRYING" | "CANCELLED";
export type PaymentStatus = "PENDING" | "SUBMITTED" | "CONFIRMED" | "FAILED";

export interface PayrollGroup {
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

export interface PayrollRun {
	id: string;
	company_id: string;
	/** May be empty; `runName` derives "October 2026 payroll" from `period_start`. */
	name?: string;
	group_id: string;
	/** Proposed (docs/PLAN.md §6). */
	schedule_id?: string | null;
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
	completed_at?: string | null;
	created_at: string;
	updated_at: string;
	employee_count?: number;
	/** How the run's payments stand, so a progress bar needs no second call. */
	payments?: { confirmed: number; pending: number; failed: number };
}

export interface LineItem {
	id: string;
	payroll_run_id: string;
	employee_id: string;
	employee_name: string;
	employee_email: string;
	employee_number: string;
	amount: string;
	currency: Asset;
	wallet_address: string;
	notes: string;
	status: PaymentStatus;
	transaction_id: string | null;
	created_at: string;
}

export interface PaymentAttempt {
	attempt: number;
	status: "CONFIRMED" | "FAILED";
	stellar_tx_hash: string | null;
	error: string | null;
	failure_code: string | null;
	at: string;
}

export interface Transaction {
	id: string;
	company_id: string;
	payroll_run_id: string;
	line_item_id: string;
	employee_id?: string;
	amount: string;
	asset: Asset;
	from_address: string;
	to_address: string;
	status: PaymentStatus;
	stellar_tx_hash: string | null;
	ledger_sequence: number | null;
	fee_amount: string | null;
	/** Withheld from employees' own view, like `failure_code` and `retryable`. */
	error_message?: string | null;
	failure_code?: string | null;
	/** Show Retry only when true; false after 5 attempts. */
	retryable?: boolean;
	retry_count: number;
	/** Detail only: every try, oldest first. */
	attempts?: PaymentAttempt[];
	/** Set once CONFIRMED. */
	explorer_url?: string | null;
	created_at: string;
	submitted_at: string | null;
	confirmed_at: string | null;
	employee_name?: string;
	payroll_run_name?: string;
}

export interface ComplianceCheck {
	id: string;
	payroll_run_id: string;
	status: "PASSED" | "FAILED";
	checks: { name: string; status: "PASSED" | "FAILED"; details: string }[];
	checked_at: string;
}

export interface CreateRunPayload {
	name?: string;
	group_id?: string;
	currency: Asset;
	period_start: string;
	period_end: string;
	scheduled_at: string;
	notes?: string;
}

export interface LineItemInput {
	employee_id: string;
	amount?: string;
	notes?: string;
}

export interface TransactionFilters {
	status?: string;
	employee_id?: string;
	payroll_run_id?: string;
	from?: string;
	to?: string;
	q?: string;
	page?: number;
	page_size?: number;
}

export type { PageMeta } from "@/lib/api/request";

/** GET /payroll/runs/{id}/review: everything the review screen shows, and whether it can be approved. */
export interface RunReview {
	run_id?: string;
	employee_count: number;
	total_amount: string;
	asset: Asset;
	items: (LineItem & { issue?: string | null })[];
	estimated_transactions: number;
	estimated_fee_xlm: string;
	/** Without `employee_name` the issue is about the run itself (e.g. "Payroll run has no pending payments."). */
	issues: { line_item_id?: string; employee_id?: string; employee_name?: string; reason: string }[];
	ready: boolean;
}

export interface UpcomingCycle {
	date: string;
	drafts_at: string;
	run_id: string | null;
	run_status: RunStatus | null;
	employee_count: number;
	amount: string;
}

export interface PayrollSchedule {
	id: string;
	name: string;
	frequency: PayCycle;
	asset: Asset;
	status: "ACTIVE" | "PAUSED" | "CANCELLED";
	next_run_at: string | null;
	employee_ids: string[];
	employee_count: number;
	amount_per_cycle: string;
	created_by: string;
	created_at: string;
	updated_at: string;
	upcoming: UpcomingCycle[];
	employees?: {
		id: string;
		name: string;
		email: string;
		job_title: string;
		salary_amount: string;
		salary_currency: Asset;
		status: string;
		has_wallet: boolean;
	}[];
	runs?: { id: string; name: string; status: RunStatus; scheduled_at: string; total_amount: string; currency: Asset }[];
}

/** PATCH renames a schedule or replaces its employees. */
export type ScheduleUpdate = { name?: string; employee_ids?: string[] };

export interface SchedulePayload {
	name: string;
	frequency: PayCycle;
	asset: Asset;
	employee_ids: string[];
	next_run_at: string;
}
