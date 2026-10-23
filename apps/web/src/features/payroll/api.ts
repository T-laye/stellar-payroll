import { FULL_PAGE, api } from "@/lib/api/request";
import { latestAttempts, normalizeReview, normalizeScheduleResponse, normalizeSchedulesResponse } from "@/features/payroll/normalize";
import type {
	CreateRunPayload,
	LineItem,
	LineItemInput,
	PageMeta,
	PayrollGroup,
	PayrollRun,
	PayrollSchedule,
	RunReview,
	SchedulePayload,
	ScheduleUpdate,
	Transaction,
	TransactionFilters,
} from "@/features/payroll/types";

/**
 * Payroll endpoints (frontend-integration.md §3). Runs and transactions are scoped by the JWT;
 * groups by company. Writes take an idempotency key made when the form or dialog opened.
 */
export const PAYROLL_ENDPOINTS = {
	groups: (companyId: string) => `/companies/${companyId}/groups`,
	runs: "/payroll/runs",
	run: (id: string) => `/payroll/runs/${id}`,
	review: (id: string) => `/payroll/runs/${id}/review`,
	approve: (id: string) => `/payroll/runs/${id}/approve`,
	cancel: (id: string) => `/payroll/runs/${id}/cancel`,
	execute: (id: string) => `/payroll/runs/${id}/execute`,
	retryFailed: (id: string) => `/payroll/runs/${id}/retry-failed`,
	lineItems: (id: string) => `/payroll/runs/${id}/line-items`,
	bulkLineItems: (id: string) => `/payroll/runs/${id}/line-items/bulk`,
	lineItem: (id: string, itemId: string) => `/payroll/runs/${id}/line-items/${itemId}`,
	transactions: "/transactions",
	transaction: (id: string) => `/transactions/${id}`,
	retry: (id: string) => `/transactions/${id}/retry`,
	schedules: "/payroll/schedules",
	schedule: (id: string) => `/payroll/schedules/${id}`,
	scheduleAction: (id: string, action: "pause" | "resume" | "cancel") => `/payroll/schedules/${id}/${action}`,
} as const;

export const getGroups = (companyId: string) => api.get<PayrollGroup[]>(PAYROLL_ENDPOINTS.groups(companyId));

export const getRuns = () => api.get<PayrollRun[], PageMeta>(PAYROLL_ENDPOINTS.runs, { page_size: FULL_PAGE });
export const getRun = (id: string) => api.get<PayrollRun>(PAYROLL_ENDPOINTS.run(id));
export const getRunReview = (id: string) => api.get<RunReview>(PAYROLL_ENDPOINTS.review(id)).then(normalizeReview);
export const createRun = (payload: CreateRunPayload, key?: string) => api.post<PayrollRun>(PAYROLL_ENDPOINTS.runs, payload, key);
export const updateRun = (id: string, payload: Partial<Pick<CreateRunPayload, "name" | "notes" | "scheduled_at">>) =>
	api.patch<PayrollRun>(PAYROLL_ENDPOINTS.run(id), payload);
export const approveRun = (id: string, key?: string) => api.post<PayrollRun>(PAYROLL_ENDPOINTS.approve(id), undefined, key);
/** 204, no body. */
export const cancelRun = (id: string, key?: string) => api.post<null>(PAYROLL_ENDPOINTS.cancel(id), undefined, key);
export const executeRun = (id: string, key?: string) =>
	api.post<{ id: string; status: string }>(PAYROLL_ENDPOINTS.execute(id), undefined, key);
/** A run's payment rows (each with the employee's name, failure code and `retryable`). */
export const getRunTransactions = (id: string) =>
	api.get<Transaction[], PageMeta>(PAYROLL_ENDPOINTS.transactions, { payroll_run_id: id, page_size: FULL_PAGE }).then(latestAttempts);
/** Every retryable failed payment in the run (202). */
export const retryFailed = (id: string, key?: string) =>
	api.post<{ retried: number; transaction_ids?: string[] }>(PAYROLL_ENDPOINTS.retryFailed(id), undefined, key);

export const getLineItems = (id: string) => api.get<LineItem[]>(PAYROLL_ENDPOINTS.lineItems(id));
export const addLineItems = (id: string, items: LineItemInput[], key?: string) =>
	api.post<LineItem[]>(PAYROLL_ENDPOINTS.bulkLineItems(id), { items }, key);
export const updateLineItem = (id: string, itemId: string, payload: { amount?: string; notes?: string }) =>
	api.patch<LineItem>(PAYROLL_ENDPOINTS.lineItem(id, itemId), payload);
export const removeLineItem = (id: string, itemId: string) => api.delete<null>(PAYROLL_ENDPOINTS.lineItem(id, itemId));

export const getTransactions = (filters: TransactionFilters = {}) =>
	api.get<Transaction[], PageMeta>(PAYROLL_ENDPOINTS.transactions, { ...filters }).then(latestAttempts);
export const getTransaction = (id: string) => api.get<Transaction>(PAYROLL_ENDPOINTS.transaction(id));
/** 202: a new attempt with its own transaction id; the failed one stays in `attempts`. */
export const retryTransaction = (id: string, key?: string) =>
	api.post<{ id: string; status: string }>(PAYROLL_ENDPOINTS.retry(id), undefined, key);

export const getSchedules = () =>
	api.get<PayrollSchedule[], PageMeta>(PAYROLL_ENDPOINTS.schedules, { page_size: FULL_PAGE }).then(normalizeSchedulesResponse);
export const getSchedule = (id: string) => api.get<PayrollSchedule>(PAYROLL_ENDPOINTS.schedule(id)).then(normalizeScheduleResponse);
export const createSchedule = (payload: SchedulePayload, key?: string) =>
	api.post<PayrollSchedule>(PAYROLL_ENDPOINTS.schedules, payload, key).then(normalizeScheduleResponse);
export const updateSchedule = (id: string, payload: ScheduleUpdate) =>
	api.patch<PayrollSchedule>(PAYROLL_ENDPOINTS.schedule(id), payload).then(normalizeScheduleResponse);
export const scheduleAction = (id: string, action: "pause" | "resume" | "cancel", key?: string) =>
	api.post<PayrollSchedule>(PAYROLL_ENDPOINTS.scheduleAction(id, action), undefined, key).then(normalizeScheduleResponse);
