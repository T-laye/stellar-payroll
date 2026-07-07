"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useStatsStore } from "@/lib/stores/stats-store";
import useAxiosAuth from "@/hooks/useAxiosAuth";

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

function useResolvedCompanyId(companyId?: string) {
	const currentCompanyId = useAuthStore((state) => state.user?.company_id);
	return companyId ?? currentCompanyId ?? null;
}

function requireCompanyId(companyId: string | null) {
	if (!companyId) {
		throw new Error("Company ID is required");
	}
	return companyId;
}

export function useCompanyComplianceStats(companyId?: string) {
	const resolvedCompanyId = useResolvedCompanyId(companyId);
	const setComplianceStats = useStatsStore((state) => state.setComplianceStats);
	const axiosAuth = useAxiosAuth();

	const query = useQuery({
		queryKey: ["stats", "compliance", resolvedCompanyId],
		queryFn: async () => {
			const res = await axiosAuth.get<StatsResponse<ComplianceStats>>(
				STATS_ENDPOINTS.compliance(requireCompanyId(resolvedCompanyId))
			);
			return res.data;
		},
		enabled: Boolean(resolvedCompanyId),
		staleTime: 60_000,
	});

	useEffect(() => {
		if (query.data?.data) {
			setComplianceStats(query.data.data);
		}
	}, [query.data, setComplianceStats]);

	return query;
}

export function useCompanyEmployeeStats(companyId?: string) {
	const resolvedCompanyId = useResolvedCompanyId(companyId);
	const setEmployeeStats = useStatsStore((state) => state.setEmployeeStats);
	const axiosAuth = useAxiosAuth();

	const query = useQuery({
		queryKey: ["stats", "employees", resolvedCompanyId],
		queryFn: async () => {
			const res = await axiosAuth.get<StatsResponse<EmployeeStats>>(
				STATS_ENDPOINTS.employees(requireCompanyId(resolvedCompanyId))
			);
			return res.data;
		},
		enabled: Boolean(resolvedCompanyId),
		staleTime: 60_000,
	});

	useEffect(() => {
		if (query.data?.data) {
			setEmployeeStats(query.data.data);
		}
	}, [query.data, setEmployeeStats]);

	return query;
}

export function useCompanyOverviewStats(companyId: string) {
	const resolvedCompanyId = useResolvedCompanyId(companyId);
	const setOverviewStats = useStatsStore((state) => state.setOverviewStats);
	const axiosAuth = useAxiosAuth();

	const query = useQuery({
		queryKey: ["stats", "overview", resolvedCompanyId],
		queryFn: async () => {
			const res = await axiosAuth.get<StatsResponse<OverviewStats>>(
				STATS_ENDPOINTS.overview(requireCompanyId(resolvedCompanyId))
			);
			return res.data;
		},
		enabled: Boolean(resolvedCompanyId),
		staleTime: 60_000,
	});

	useEffect(() => {
		if (query.data?.data) {
			setOverviewStats(query.data.data);
		}
	}, [query.data, setOverviewStats]);

	return query;
}

export function useMyStats() {
	const setMyStats = useStatsStore((state) => state.setMyStats);
	const axiosAuth = useAxiosAuth();

	const query = useQuery({
		queryKey: ["stats", "me"],
		queryFn: async () => {
			const res = await axiosAuth.get<StatsResponse<MyStats>>(STATS_ENDPOINTS.my);
			return res.data;
		},
		staleTime: 60_000,
	});

	useEffect(() => {
		if (query.data?.data) {
			setMyStats(query.data.data);
		}
	}, [query.data, setMyStats]);

	return query;
}

export function useCompanyPayrollStats(companyId?: string) {
	const resolvedCompanyId = useResolvedCompanyId(companyId);
	const setPayrollStats = useStatsStore((state) => state.setPayrollStats);
	const axiosAuth = useAxiosAuth();

	const query = useQuery({
		queryKey: ["stats", "payroll", resolvedCompanyId],
		queryFn: async () => {
			const res = await axiosAuth.get<StatsResponse<PayrollStats>>(
				STATS_ENDPOINTS.payroll(requireCompanyId(resolvedCompanyId))
			);
			return res.data;
		},
		enabled: Boolean(resolvedCompanyId),
		staleTime: 60_000,
	});

	useEffect(() => {
		if (query.data?.data) {
			setPayrollStats(query.data.data);
		}
	}, [query.data, setPayrollStats]);

	return query;
}

export function useCompanyTransactionStats(companyId?: string) {
	const resolvedCompanyId = useResolvedCompanyId(companyId);
	const setTransactionStats = useStatsStore(
		(state) => state.setTransactionStats,
	);
	const axiosAuth = useAxiosAuth();

	const query = useQuery({
		queryKey: ["stats", "transactions", resolvedCompanyId],
		queryFn: async () => {
			const res = await axiosAuth.get<StatsResponse<TransactionStats>>(
				STATS_ENDPOINTS.transactions(requireCompanyId(resolvedCompanyId))
			);
			return res.data;
		},
		enabled: Boolean(resolvedCompanyId),
		staleTime: 60_000,
	});

	useEffect(() => {
		if (query.data?.data) {
			setTransactionStats(query.data.data);
		}
	}, [query.data, setTransactionStats]);

	return query;
}

export function useCompanyWalletStats(companyId?: string) {
	const resolvedCompanyId = useResolvedCompanyId(companyId);
	const setWalletStats = useStatsStore((state) => state.setWalletStats);
	const axiosAuth = useAxiosAuth();

	const query = useQuery({
		queryKey: ["stats", "wallets", resolvedCompanyId],
		queryFn: async () => {
			const res = await axiosAuth.get<StatsResponse<WalletStats>>(
				STATS_ENDPOINTS.wallets(requireCompanyId(resolvedCompanyId))
			);
			return res.data;
		},
		enabled: Boolean(resolvedCompanyId),
		staleTime: 60_000,
	});

	useEffect(() => {
		if (query.data?.data) {
			setWalletStats(query.data.data);
		}
	}, [query.data, setWalletStats]);

	return query;
}
