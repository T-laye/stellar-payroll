"use client";

import { useQuery } from "@tanstack/react-query";
import { getMyTransaction, getMyTransactions } from "@/features/me/api";
import type { Transaction } from "@/features/payroll/types";

const settling = (list: Transaction[]) => list.some((t) => t.status === "PENDING" || t.status === "SUBMITTED");

export function useMyTransactions() {
	return useQuery({
		queryKey: ["me", "transactions"],
		queryFn: getMyTransactions,
		select: (response) => response.data,
		refetchInterval: (query) => (settling(query.state.data?.data ?? []) ? 2000 : 30_000),
	});
}

export function useMyTransaction(id?: string) {
	return useQuery({
		queryKey: ["me", "transactions", id],
		queryFn: () => getMyTransaction(id!),
		enabled: !!id,
		select: (response) => response.data,
		refetchInterval: (query) => (query.state.data && settling([query.state.data.data]) ? 1500 : false),
	});
}
