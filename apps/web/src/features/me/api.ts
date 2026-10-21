import { api } from "@/lib/api/request";
import type { Transaction } from "@/features/payroll/types";

/**
 * The signed-in employee's own payments. Proposed endpoints (docs/PLAN.md §2): the live API has
 * no employee-scoped transaction list yet; the mock serves these.
 */
export const ME_ENDPOINTS = {
	transactions: "/users/me/transactions",
	transaction: (id: string) => `/users/me/transactions/${id}`,
} as const;

export const getMyTransactions = () => api.get<Transaction[]>(ME_ENDPOINTS.transactions);
export const getMyTransaction = (id: string) => api.get<Transaction>(ME_ENDPOINTS.transaction(id));
