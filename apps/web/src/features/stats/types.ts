export interface StatsResponse<T> {
	data: T;
	message: string;
	statusCode: number;
}

export interface ComplianceStats {
	audit_logs_last_30_days: number;
	checks_failed: number;
	checks_passed: number;
	last_checked_at: string | null;
	tax_reports_generated: number;
	tax_reports_pending: number;
}

export interface EmployeeCountByCountry {
	count: number;
	country: string;
}

export interface EmployeeCountByDepartment {
	count: number;
	department: string;
}

export interface EmployeeStats {
	by_country: EmployeeCountByCountry[];
	by_department: EmployeeCountByDepartment[];
	by_employment_type: Record<string, number>;
	onboarded_this_month: number;
	without_wallet: number;
}

export interface OverviewEmployeeStats {
	active: number;
	inactive: number;
	terminated: number;
	total: number;
}

export interface OverviewPayrollStats {
	completed_runs: number;
	pending_runs: number;
	total_disbursed_all_time: string;
	total_disbursed_this_month: string;
}

export interface OverviewTransactionStats {
	pending_retry: number;
	total_confirmed: number;
	total_failed: number;
	/** Proposed. */
	total_pending?: number;
	/** Proposed (docs/PLAN.md §7). */
	employees_paid_all_time?: number;
	employees_paid_this_month?: number;
}

export interface OverviewWalletStats {
	employees_with_wallet: number;
	employees_without_wallet: number;
	total_company_wallets: number;
}

export interface OverviewStats {
	employees: OverviewEmployeeStats;
	payroll: OverviewPayrollStats;
	transactions: OverviewTransactionStats;
	wallets: OverviewWalletStats;
}

export interface MyStats {
	last_payment_at: string | null;
	total_payments_received: number;
	total_received_all_time: string;
	total_received_this_month: string;
	transactions_by_status: Record<string, number>;
}

export interface DisbursedByMonth {
	amount: string;
	month: string;
}

export interface NextScheduledRun {
	id: string;
	scheduled_at: string;
	status: string;
	total_amount: string;
}

export interface PayrollStats {
	average_run_amount: string;
	disbursed_by_month: DisbursedByMonth[];
	next_scheduled_run: NextScheduledRun | null;
	runs_by_status: Record<string, number>;
}

export interface VolumeByAsset {
	amount: string;
	asset: string;
	count: number;
}

export interface TransactionStats {
	by_status: Record<string, number>;
	failed_needing_retry: number;
	success_rate: number;
	volume_by_asset: VolumeByAsset[];
}

export interface EmployeeWalletCoverage {
	total_employees: number;
	with_wallet: number;
	without_wallet: number;
}

export interface WalletStats {
	company_wallets_by_type: Record<string, number>;
	employee_wallet_coverage: EmployeeWalletCoverage;
	funded_wallets: number;
	unfunded_wallets: number;
}
