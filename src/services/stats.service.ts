import { axiosInstance } from "@/config/axios";
import { getStoredAuthHeaders } from "@/lib/auth/session";

export const STATS_ENDPOINTS = {
	compliance: (companyId: string) => `/companies/${companyId}/stats/compliance`,
	employees: (companyId: string) => `/companies/${companyId}/stats/employees`,
	my: "/users/me/stats",
	overview: (companyId: string) => `/companies/${companyId}/stats/overview`,
	payroll: (companyId: string) => `/companies/${companyId}/stats/payroll`,
	transactions: (companyId: string) =>
		`/companies/${companyId}/stats/transactions`,
	wallets: (companyId: string) => `/companies/${companyId}/stats/wallets`,
} as const;

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

function getAuthOptions() {
	return {
		headers: getStoredAuthHeaders(),
	};
}

export async function getComplianceStats(companyId: string) {
	const response = await axiosInstance.get<StatsResponse<ComplianceStats>>(
		STATS_ENDPOINTS.compliance(companyId),
		getAuthOptions(),
	);
	return response.data;
}

export async function getEmployeeStats(companyId: string) {
	const response = await axiosInstance.get<StatsResponse<EmployeeStats>>(
		STATS_ENDPOINTS.employees(companyId),
		getAuthOptions(),
	);
	return response.data;
}

export async function getMyStats() {
	const response = await axiosInstance.get<StatsResponse<MyStats>>(
		STATS_ENDPOINTS.my,
		getAuthOptions(),
	);
	return response.data;
}

export async function getOverviewStats(companyId: string) {
	const response = await axiosInstance.get<StatsResponse<OverviewStats>>(
		STATS_ENDPOINTS.overview(companyId),
		getAuthOptions(),
	);
	return response.data;
}

export async function getPayrollStats(companyId: string) {
	const response = await axiosInstance.get<StatsResponse<PayrollStats>>(
		STATS_ENDPOINTS.payroll(companyId),
		getAuthOptions(),
	);
	return response.data;
}

export async function getTransactionStats(companyId: string) {
	const response = await axiosInstance.get<StatsResponse<TransactionStats>>(
		STATS_ENDPOINTS.transactions(companyId),
		getAuthOptions(),
	);
	return response.data;
}

export async function getWalletStats(companyId: string) {
	const response = await axiosInstance.get<StatsResponse<WalletStats>>(
		STATS_ENDPOINTS.wallets(companyId),
		getAuthOptions(),
	);
	return response.data;
}
