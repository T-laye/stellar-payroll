"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	getAuditLogs,
	getCompanies,
	getCompany,
	getOverview,
	getPlatformAdmins,
	getTransaction,
	getTransactions,
	getUser,
	getUsers,
	grantPlatformAdmin,
	revokePlatformAdmin,
	setCompanyActive,
	setUserActive,
} from "@/features/admin/api";
import type { AuditFilters, CompanyFilters, TransactionFilters, UserFilters } from "@/features/admin/types";

/** Lists keep the previous page on screen while the next loads. */
const list = { placeholderData: keepPreviousData, staleTime: 15_000 } as const;

export const useOverview = () => useQuery({ queryKey: ["admin", "overview"], queryFn: getOverview, select: (r) => r.data });

export const useCompanies = (filters: CompanyFilters) => useQuery({ queryKey: ["admin", "companies", filters], queryFn: () => getCompanies(filters), ...list });
export const useCompany = (id?: string) =>
	useQuery({ queryKey: ["admin", "company", id], queryFn: () => getCompany(id!), enabled: !!id, select: (r) => r.data });

export const useUsers = (filters: UserFilters, enabled = true) =>
	useQuery({ queryKey: ["admin", "users", filters], queryFn: () => getUsers(filters), enabled, ...list });
export const useUser = (id?: string) => useQuery({ queryKey: ["admin", "user", id], queryFn: () => getUser(id!), enabled: !!id, select: (r) => r.data });

export const useTransactions = (filters: TransactionFilters) =>
	useQuery({ queryKey: ["admin", "transactions", filters], queryFn: () => getTransactions(filters), ...list, retry: false });
export const useTransaction = (id?: string) =>
	useQuery({ queryKey: ["admin", "transaction", id], queryFn: () => getTransaction(id!), enabled: !!id, select: (r) => r.data });

export const useAuditLogs = (filters: AuditFilters, enabled = true) =>
	useQuery({ queryKey: ["admin", "audit", filters], queryFn: () => getAuditLogs(filters), enabled, ...list });

export const usePlatformAdmins = () => useQuery({ queryKey: ["admin", "admins"], queryFn: getPlatformAdmins, select: (r) => r.data });

function useRefresh() {
	const client = useQueryClient();
	return () => client.invalidateQueries({ queryKey: ["admin"] });
}

export function useSetCompanyActive() {
	const refresh = useRefresh();
	return useMutation({
		mutationFn: ({ id, active, key }: { id: string; active: boolean; key?: string }) => setCompanyActive(id, active, key),
		onSuccess: refresh,
	});
}

export function useSetUserActive() {
	const refresh = useRefresh();
	return useMutation({
		mutationFn: ({ id, active, key }: { id: string; active: boolean; key?: string }) => setUserActive(id, active, key),
		onSuccess: refresh,
	});
}

export function useGrantPlatformAdmin() {
	const refresh = useRefresh();
	return useMutation({ mutationFn: ({ userId, key }: { userId: string; key?: string }) => grantPlatformAdmin(userId, key), onSuccess: refresh });
}

export function useRevokePlatformAdmin() {
	const refresh = useRefresh();
	return useMutation({ mutationFn: (userId: string) => revokePlatformAdmin(userId), onSuccess: refresh });
}
