"use client";

import { useQuery } from "@tanstack/react-query";
import { getMyEmployee, getMyPaymentsSummary, getMyTransaction, getMyTransactions } from "@/features/me/api";
import type { Transaction } from "@/features/payroll/types";

const settling = (list: Transaction[]) => list.some((t) => t.status === "PENDING" || t.status === "SUBMITTED");

export function useMyTransactions() {
	return useQuery({
		queryKey: ["me", "transactions"],
		queryFn: getMyTransactions,
		select: (response) => response.data,
		refetchInterval: (query) => (settling(query.state.data?.data ?? []) ? 3000 : 30_000),
	});
}

export function useMyTransaction(id?: string) {
	return useQuery({
		queryKey: ["me", "transactions", id],
		queryFn: () => getMyTransaction(id!),
		enabled: !!id,
		select: (response) => response.data,
		refetchInterval: (query) => (query.state.data && settling([query.state.data.data]) ? 3000 : false),
	});
}

/** Totals per asset, the latest payment and where it stands: the employee home's cards. */
export function useMyPaymentsSummary() {
	return useQuery({
		queryKey: ["me", "summary"],
		queryFn: getMyPaymentsSummary,
		select: (response) => response.data,
		refetchInterval: (query) => {
			const status = query.state.data?.data.current_status;
			return status === "PENDING" || status === "SUBMITTED" ? 3000 : 30_000;
		},
	});
}

/** The employee's own record: salary, asset, frequency, wallet. */
export function useMyEmployee() {
	return useQuery({ queryKey: ["me", "employee"], queryFn: getMyEmployee, select: (response) => response.data, retry: false });
}
