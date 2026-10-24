/** /admin/* shapes, as the live API returns them (checked 2026-10-23). */

export interface PageMeta {
	page: number;
	page_size: number;
	limit: number;
	total: number;
	total_pages: number;
}

export interface PlatformOverview {
	total_companies: number;
	active_companies: number;
	suspended_companies: number;
	total_users: number;
	total_transactions: number;
	/** Decimal string; adds every asset together without conversion. */
	total_disbursed_all_time: string;
}

export interface Company {
	id: string;
	name: string;
	slug: string;
	email: string;
	country: string;
	timezone: string;
	default_currency: string;
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

export interface PlatformUser {
	id: string;
	company_id: string;
	first_name: string;
	last_name: string;
	email: string;
	role_id: string;
	role_name: string;
	is_active: boolean;
	email_verified_at?: string | null;
	last_login_at?: string | null;
	created_at: string;
}

export interface PlatformTransaction {
	id: string;
	company_id: string;
	payroll_run_id: string;
	payroll_run_name?: string;
	line_item_id: string;
	employee_id?: string;
	employee_name?: string;
	amount: string;
	asset: string;
	status: "PENDING" | "SUBMITTED" | "CONFIRMED" | "FAILED";
	stellar_tx_hash?: string | null;
	explorer_url?: string | null;
	from_address?: string;
	to_address?: string;
	ledger_sequence?: number | null;
	fee_amount?: string | null;
	error_message?: string | null;
	failure_code?: string | null;
	retry_count?: number;
	attempt?: number;
	attempts?: {
		attempt: number;
		status: string;
		error?: string | null;
		failure_code?: string | null;
		stellar_tx_hash?: string | null;
		at: string;
	}[];
	created_at: string;
	submitted_at?: string | null;
	confirmed_at?: string | null;
}

export interface AuditLog {
	id: string;
	company_id: string;
	actor_id: string | null;
	action: string;
	resource_type: string;
	resource_id: string | null;
	metadata?: Record<string, unknown>;
	ip_address?: string;
	user_agent?: string;
	created_at: string;
}

export interface PlatformAdmin {
	user_id: string;
	email: string;
	first_name: string;
	last_name: string;
	granted_by?: string;
	created_at: string;
}

export interface CompanyFilters {
	page?: number;
	limit?: number;
	search?: string;
	is_active?: "true" | "false" | "";
	country?: string;
}

export interface UserFilters {
	page?: number;
	limit?: number;
	search?: string;
	role?: string;
	is_active?: "true" | "false" | "";
	company_id?: string;
}

export interface TransactionFilters {
	page?: number;
	limit?: number;
	company_id?: string;
	status?: string;
	from?: string;
	to?: string;
}

export interface AuditFilters {
	page?: number;
	limit?: number;
	company_id?: string;
	action?: string;
	resource_type?: string;
}
