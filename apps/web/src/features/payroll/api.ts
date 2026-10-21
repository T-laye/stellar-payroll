import { api } from "@/lib/api/request";
import type {
	ComplianceCheck,
	CreateRunPayload,
	LineItem,
	LineItemInput,
	PageMeta,
	PayrollGroup,
	PayrollRun,
	PayrollSchedule,
	SchedulePayload,
	Transaction,
	TransactionFilters,
} from "@/features/payroll/types";

/**
 * Payroll endpoints. Runs and transactions are scoped by the JWT; groups by company.
 * Proposed in docs/PLAN.md and served by the mock until the API has them: run `name`,
 * transaction filters + pagination, `/payroll/schedules/*`.
 */
export const PAYROLL_ENDPOINTS = {
	groups: (companyId: string) => `/companies/${companyId}/groups`,
	runs: "/payroll/runs",
	run: (id: string) => `/payroll/runs/${id}`,
	approve: (id: string) => `/payroll/runs/${id}/approve`,
	cancel: (id: string) => `/payroll/runs/${id}/cancel`,
	execute: (id: string) => `/payroll/runs/${id}/execute`,
	runTransactions: (id: string) => `/payroll/runs/${id}/transactions`,
	lineItems: (id: string) => `/payroll/runs/${id}/line-items`,
	bulkLineItems: (id: string) => `/payroll/runs/${id}/line-items/bulk`,
	lineItem: (id: string, itemId: string) => `/payroll/runs/${id}/line-items/${itemId}`,
	compliance: (id: string) => `/payroll/runs/${id}/compliance-check`,
	transactions: "/transactions",
	transaction: (id: string) => `/transactions/${id}`,
	retry: (id: string) => `/transactions/${id}/retry`,
	schedules: "/payroll/schedules",
	schedule: (id: string) => `/payroll/schedules/${id}`,
	scheduleAction: (id: string, action: "pause" | "resume" | "cancel") => `/payroll/schedules/${id}/${action}`,
} as const;

export const getGroups = (companyId: string) => api.get<PayrollGroup[]>(PAYROLL_ENDPOINTS.groups(companyId));

export const getRuns = () => api.get<PayrollRun[]>(PAYROLL_ENDPOINTS.runs);
export const getRun = (id: string) => api.get<PayrollRun>(PAYROLL_ENDPOINTS.run(id));
export const createRun = (payload: CreateRunPayload) => api.post<PayrollRun>(PAYROLL_ENDPOINTS.runs, payload);
export const updateRun = (id: string, payload: Partial<Pick<CreateRunPayload, "name" | "notes" | "scheduled_at">>) =>
	api.patch<PayrollRun>(PAYROLL_ENDPOINTS.run(id), payload);
export const approveRun = (id: string) => api.post<PayrollRun>(PAYROLL_ENDPOINTS.approve(id));
export const cancelRun = (id: string) => api.post<PayrollRun>(PAYROLL_ENDPOINTS.cancel(id));
export const executeRun = (id: string) => api.post<{ id: string; status: string }>(PAYROLL_ENDPOINTS.execute(id));
export const getRunTransactions = (id: string) => api.get<Transaction[]>(PAYROLL_ENDPOINTS.runTransactions(id));

export const getLineItems = (id: string) => api.get<LineItem[]>(PAYROLL_ENDPOINTS.lineItems(id));
export const addLineItems = (id: string, items: LineItemInput[]) =>
	api.post<LineItem[]>(PAYROLL_ENDPOINTS.bulkLineItems(id), { items });
export const updateLineItem = (id: string, itemId: string, payload: { amount?: string; notes?: string }) =>
	api.patch<LineItem>(PAYROLL_ENDPOINTS.lineItem(id, itemId), payload);
export const removeLineItem = (id: string, itemId: string) => api.delete<null>(PAYROLL_ENDPOINTS.lineItem(id, itemId));

export const runComplianceCheck = (id: string) => api.post<ComplianceCheck>(PAYROLL_ENDPOINTS.compliance(id));

export const getTransactions = (filters: TransactionFilters = {}) =>
	api.get<Transaction[], PageMeta>(PAYROLL_ENDPOINTS.transactions, { ...filters });
export const getTransaction = (id: string) => api.get<Transaction>(PAYROLL_ENDPOINTS.transaction(id));
export const retryTransaction = (id: string) => api.post<{ id: string; status: string }>(PAYROLL_ENDPOINTS.retry(id));

export const getSchedules = () => api.get<PayrollSchedule[]>(PAYROLL_ENDPOINTS.schedules);
export const getSchedule = (id: string) => api.get<PayrollSchedule>(PAYROLL_ENDPOINTS.schedule(id));
export const createSchedule = (payload: SchedulePayload) => api.post<PayrollSchedule>(PAYROLL_ENDPOINTS.schedules, payload);
export const updateSchedule = (id: string, payload: Partial<SchedulePayload>) =>
	api.patch<PayrollSchedule>(PAYROLL_ENDPOINTS.schedule(id), payload);
export const scheduleAction = (id: string, action: "pause" | "resume" | "cancel") =>
	api.post<PayrollSchedule>(PAYROLL_ENDPOINTS.scheduleAction(id, action));
