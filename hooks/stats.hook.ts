"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useStatsStore } from "@/lib/stores/stats-store";
import {
	getComplianceStats,
	getEmployeeStats,
	getOverviewStats,
	getPayrollStats,
	getTransactionStats,
	getWalletStats,
} from "@/services/stats.service";

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

	const query = useQuery({
		queryKey: ["stats", "compliance", resolvedCompanyId],
		queryFn: () => getComplianceStats(requireCompanyId(resolvedCompanyId)),
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

	const query = useQuery({
		queryKey: ["stats", "employees", resolvedCompanyId],
		queryFn: () => getEmployeeStats(requireCompanyId(resolvedCompanyId)),
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

export function useCompanyOverviewStats(companyId?: string) {
	const resolvedCompanyId = useResolvedCompanyId(companyId);
	const setOverviewStats = useStatsStore((state) => state.setOverviewStats);

	const query = useQuery({
		queryKey: ["stats", "overview", resolvedCompanyId],
		queryFn: () => getOverviewStats(requireCompanyId(resolvedCompanyId)),
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

export function useCompanyPayrollStats(companyId?: string) {
	const resolvedCompanyId = useResolvedCompanyId(companyId);
	const setPayrollStats = useStatsStore((state) => state.setPayrollStats);

	const query = useQuery({
		queryKey: ["stats", "payroll", resolvedCompanyId],
		queryFn: () => getPayrollStats(requireCompanyId(resolvedCompanyId)),
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

	const query = useQuery({
		queryKey: ["stats", "transactions", resolvedCompanyId],
		queryFn: () => getTransactionStats(requireCompanyId(resolvedCompanyId)),
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

	const query = useQuery({
		queryKey: ["stats", "wallets", resolvedCompanyId],
		queryFn: () => getWalletStats(requireCompanyId(resolvedCompanyId)),
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
