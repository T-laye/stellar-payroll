import { axiosInstance } from "@/lib/api/client";
import { getStoredAuthHeaders } from "@/features/auth/session";
import type {
	StatsResponse,
	ComplianceStats,
	EmployeeStats,
	OverviewStats,
	MyStats,
	PayrollStats,
	TransactionStats,
	WalletStats,
} from "@/features/stats/types";

export const STATS_ENDPOINTS = {
	compliance: (companyId: string) => `/companies/${companyId}/stats/compliance`,
	employees: (companyId: string) => `/companies/${companyId}/stats/employees`,
	my: "/users/me/stats",
	overview: (companyId: string) => `/companies/${companyId}/stats/overview`,
	payroll: (companyId: string) => `/companies/${companyId}/stats/payroll`,
	transactions: (companyId: string) => `/companies/${companyId}/stats/transactions`,
	wallets: (companyId: string) => `/companies/${companyId}/stats/wallets`,
} as const;

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
	const response = await axiosInstance.get<StatsResponse<EmployeeStats>>(STATS_ENDPOINTS.employees(companyId), getAuthOptions());
	return response.data;
}

export async function getMyStats() {
	const response = await axiosInstance.get<StatsResponse<MyStats>>(STATS_ENDPOINTS.my, getAuthOptions());
	return response.data;
}

export async function getOverviewStats(companyId: string) {
	const response = await axiosInstance.get<StatsResponse<OverviewStats>>(STATS_ENDPOINTS.overview(companyId), getAuthOptions());
	return response.data;
}

export async function getPayrollStats(companyId: string) {
	const response = await axiosInstance.get<StatsResponse<PayrollStats>>(STATS_ENDPOINTS.payroll(companyId), getAuthOptions());
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
	const response = await axiosInstance.get<StatsResponse<WalletStats>>(STATS_ENDPOINTS.wallets(companyId), getAuthOptions());
	return response.data;
}
