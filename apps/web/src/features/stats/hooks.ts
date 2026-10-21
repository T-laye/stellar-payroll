"use client";

import { useQuery } from "@tanstack/react-query";
import {
	getComplianceStats,
	getEmployeeStats,
	getMyStats,
	getOverviewStats,
	getPayrollStats,
	getTransactionStats,
	getWalletStats,
} from "@/features/stats/api";
import { useCompanyId } from "@/features/payroll/hooks";

/** Company stats (`/companies/{id}/stats/*`) and the employee's own (`/users/me/stats`). Each returns the envelope. */

function useCompanyStats<T>(name: string, fetcher: (companyId: string) => Promise<T>, enabled = true) {
	const companyId = useCompanyId();
	return useQuery({
		queryKey: ["stats", name, companyId],
		queryFn: () => fetcher(companyId!),
		enabled: !!companyId && enabled,
		staleTime: 30_000,
	});
}

export const useCompanyOverviewStats = (enabled = true) => useCompanyStats("overview", getOverviewStats, enabled);
export const useCompanyPayrollStats = (enabled = true) => useCompanyStats("payroll", getPayrollStats, enabled);
export const useCompanyTransactionStats = (enabled = true) => useCompanyStats("transactions", getTransactionStats, enabled);
export const useCompanyEmployeeStats = (enabled = true) => useCompanyStats("employees", getEmployeeStats, enabled);
export const useCompanyWalletStats = (enabled = true) => useCompanyStats("wallets", getWalletStats, enabled);
export const useCompanyComplianceStats = (enabled = true) => useCompanyStats("compliance", getComplianceStats, enabled);

export function useMyStats() {
	return useQuery({ queryKey: ["stats", "me"], queryFn: getMyStats, staleTime: 30_000 });
}
