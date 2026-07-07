import { apiClient } from "@/lib/api/client";
import { getStoredAuthHeaders } from "@/lib/auth/session";

export const PAYROLL_ENDPOINTS = {
	groups: (companyId: string) => `/companies/${companyId}/groups`,
	group: (companyId: string, groupId: string) =>
		`/companies/${companyId}/groups/${groupId}`,
	runs: "/payroll/runs",
	run: (runId: string) => `/payroll/runs/${runId}`,
	approveRun: (runId: string) => `/payroll/runs/${runId}/approve`,
	cancelRun: (runId: string) => `/payroll/runs/${runId}/cancel`,
	executeRun: (runId: string) => `/payroll/runs/${runId}/execute`,
	runTransactions: (runId: string) => `/payroll/runs/${runId}/transactions`,
	schedule: "/payroll/schedule",
} as const;

export interface PayrollGroup {
	company_id: string;
	created_at: string;
	currency: string;
	description: string;
	id: string;
	is_active: boolean;
	name: string;
	pay_cycle: string;
	timezone: string;
	updated_at: string;
}

export interface PayrollRun {
	approved_at: string | null;
	approved_by: string | null;
	company_id: string;
	created_at: string;
	created_by: string;
	currency: string;
	executed_at: string | null;
	group_id: string;
	id: string;
	notes: string;
	period_end: string;
	period_start: string;
	scheduled_at: string;
	status: string;
	stellar_memo: string | null;
	total_amount: string;
	updated_at: string;
}

export interface PayrollTransaction {
	amount: string;
	asset: string;
	company_id: string;
	confirmed_at: string | null;
	created_at: string;
	error_message: string | null;
	fee_amount: string | null;
	from_address: string;
	id: string;
	ledger_sequence: number | null;
	line_item_id: string;
	payroll_run_id: string;
	retry_count: number;
	status: string;
	stellar_tx_hash: string | null;
	submitted_at: string | null;
	to_address: string;
}

export interface PayrollGroupResponse {
	data: PayrollGroup;
	message: string;
	statusCode: number;
}

export interface PayrollGroupListResponse {
	data: PayrollGroup[];
	message: string;
	statusCode: number;
}

export interface PayrollRunResponse {
	data: PayrollRun;
	message: string;
	statusCode: number;
}

export interface PayrollRunListResponse {
	data: PayrollRun[];
	message: string;
	statusCode: number;
}

export interface PayrollTransactionListResponse {
	data: PayrollTransaction[];
	message: string;
	statusCode: number;
}

export interface GenericPayrollResponse<T = Record<string, unknown>> {
	data: T;
	message: string;
	statusCode: number;
}

export interface CreatePayrollGroupPayload extends Record<string, unknown> {
	currency: string;
	description: string;
	name: string;
	pay_cycle: string;
	timezone: string;
}

export interface UpdatePayrollGroupPayload extends Record<string, unknown> {
	currency?: string;
	description?: string;
	is_active?: boolean;
	name?: string;
	pay_cycle?: string;
	timezone?: string;
}

export interface CreatePayrollRunPayload extends Record<string, unknown> {
	currency: string;
	group_id: string;
	notes?: string;
	period_end: string;
	period_start: string;
	scheduled_at: string;
}

export interface UpdatePayrollRunPayload extends Record<string, unknown> {
	notes?: string;
	scheduled_at?: string;
}

function getAuthOptions() {
	return {
		headers: getStoredAuthHeaders(),
	};
}

export function getPayrollGroups(companyId: string) {
	return apiClient.get<PayrollGroupListResponse>(
		PAYROLL_ENDPOINTS.groups(companyId),
		getAuthOptions(),
	);
}

export function createPayrollGroup(
	companyId: string,
	payload: CreatePayrollGroupPayload,
) {
	return apiClient.post<PayrollGroupResponse>(
		PAYROLL_ENDPOINTS.groups(companyId),
		payload,
		getAuthOptions(),
	);
}

export function updatePayrollGroup(
	companyId: string,
	groupId: string,
	payload: UpdatePayrollGroupPayload,
) {
	return apiClient.patch<PayrollGroupResponse>(
		PAYROLL_ENDPOINTS.group(companyId, groupId),
		payload,
		getAuthOptions(),
	);
}

export function deletePayrollGroup(companyId: string, groupId: string) {
	return apiClient.delete<GenericPayrollResponse>(
		PAYROLL_ENDPOINTS.group(companyId, groupId),
		getAuthOptions(),
	);
}

export function getPayrollRuns() {
	return apiClient.get<PayrollRunListResponse>(
		PAYROLL_ENDPOINTS.runs,
		getAuthOptions(),
	);
}

export function createPayrollRun(payload: CreatePayrollRunPayload) {
	return apiClient.post<PayrollRunResponse>(
		PAYROLL_ENDPOINTS.runs,
		payload,
		getAuthOptions(),
	);
}

export function getPayrollRun(runId: string) {
	return apiClient.get<PayrollRunResponse>(
		PAYROLL_ENDPOINTS.run(runId),
		getAuthOptions(),
	);
}

export function updatePayrollRun(runId: string, payload: UpdatePayrollRunPayload) {
	return apiClient.patch<PayrollRunResponse>(
		PAYROLL_ENDPOINTS.run(runId),
		payload,
		getAuthOptions(),
	);
}

export function approvePayrollRun(runId: string) {
	return apiClient.post<PayrollRunResponse>(
		PAYROLL_ENDPOINTS.approveRun(runId),
		undefined,
		getAuthOptions(),
	);
}

export function cancelPayrollRun(runId: string) {
	return apiClient.post<PayrollRunResponse>(
		PAYROLL_ENDPOINTS.cancelRun(runId),
		undefined,
		getAuthOptions(),
	);
}

export function executePayrollRun(runId: string) {
	return apiClient.post<GenericPayrollResponse>(
		PAYROLL_ENDPOINTS.executeRun(runId),
		undefined,
		getAuthOptions(),
	);
}

export function getPayrollRunTransactions(runId: string) {
	return apiClient.get<PayrollTransactionListResponse>(
		PAYROLL_ENDPOINTS.runTransactions(runId),
		getAuthOptions(),
	);
}

export function getPayrollSchedule() {
	return apiClient.get<PayrollRunListResponse>(
		PAYROLL_ENDPOINTS.schedule,
		getAuthOptions(),
	);
}
