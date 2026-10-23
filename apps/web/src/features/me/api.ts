import { FULL_PAGE, api, type PageMeta } from "@/lib/api/request";
import type { Asset, Transaction } from "@/features/payroll/types";

/**
 * The signed-in employee's own data (frontend-integration.md §3, employee portal). Payments here
 * withhold `error_message`, `failure_code` and `retryable`; company endpoints answer 403.
 */
export const ME_ENDPOINTS = {
	employee: "/users/me/employee",
	summary: "/users/me/payments/summary",
	transactions: "/users/me/transactions",
	transaction: (id: string) => `/users/me/transactions/${id}`,
} as const;

/** GET /users/me/employee: the employee's pay record as the portal sees it. `wallet_address` is "" until linked. */
export interface MyPayProfile {
	employee_id: string;
	name: string;
	email: string;
	/** Job title. */
	role: string;
	status: string;
	salary_amount: string;
	payment_asset: Asset;
	pay_frequency: string;
	wallet_address: string;
}

export interface MyPaymentsSummary {
	total_received: { asset: Asset; amount: string; count?: number }[];
	latest_payment: Transaction | null;
	current_status: Transaction["status"] | null;
}

export const getMyEmployee = () => api.get<MyPayProfile>(ME_ENDPOINTS.employee);
export const getMyPaymentsSummary = () => api.get<MyPaymentsSummary>(ME_ENDPOINTS.summary);
export const getMyTransactions = () => api.get<Transaction[], PageMeta>(ME_ENDPOINTS.transactions, { page_size: FULL_PAGE });
export const getMyTransaction = (id: string) => api.get<Transaction>(ME_ENDPOINTS.transaction(id));
