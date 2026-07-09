import axios from "axios";
import { ApiError, axiosInstance } from "@/config/axios";
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

function getErrorMessage(data: unknown, fallback: string) {
	if (!data || typeof data !== "object") {
		return fallback;
	}

	const errorData = data as Record<string, unknown>;
	const message = errorData.message;
	const error = errorData.error;

	if (typeof message === "string" && message.trim()) {
		return message;
	}

	if (Array.isArray(message) && message.length > 0) {
		return message.filter(Boolean).join(", ");
	}

	if (typeof error === "string" && error.trim()) {
		return error;
	}

	return fallback;
}

function normalizePayrollError(error: unknown): never {
	if (axios.isAxiosError(error)) {
		throw new ApiError(
			getErrorMessage(error.response?.data, error.message || "Request failed"),
			error.response?.status ?? 500,
			error.response?.data,
		);
	}

	if (error instanceof Error) {
		throw new ApiError(error.message, 500, error);
	}

	throw new ApiError("Request failed", 500, error);
}

export async function getPayrollGroups(companyId: string) {
	const response = await axiosInstance.get<PayrollGroupListResponse>(
		PAYROLL_ENDPOINTS.groups(companyId),
		getAuthOptions(),
	);
	return response.data;
}

export async function createPayrollGroup(
	companyId: string,
	payload: CreatePayrollGroupPayload,
) {
	try {
		const response = await axiosInstance.post<PayrollGroupResponse>(
			PAYROLL_ENDPOINTS.groups(companyId),
			payload,
			getAuthOptions(),
		);
		return response.data;
	} catch (error) {
		normalizePayrollError(error);
	}
}

export async function updatePayrollGroup(
	companyId: string,
	groupId: string,
	payload: UpdatePayrollGroupPayload,
) {
	try {
		const response = await axiosInstance.patch<PayrollGroupResponse>(
			PAYROLL_ENDPOINTS.group(companyId, groupId),
			payload,
			getAuthOptions(),
		);
		return response.data;
	} catch (error) {
		normalizePayrollError(error);
	}
}

export async function deletePayrollGroup(companyId: string, groupId: string) {
	const response = await axiosInstance.delete<GenericPayrollResponse>(
		PAYROLL_ENDPOINTS.group(companyId, groupId),
		getAuthOptions(),
	);
	return response.data;
}

export async function getPayrollRuns() {
	const response = await axiosInstance.get<PayrollRunListResponse>(
		PAYROLL_ENDPOINTS.runs,
		getAuthOptions(),
	);
	return response.data;
}

export async function createPayrollRun(payload: CreatePayrollRunPayload) {
	try {
		const response = await axiosInstance.post<PayrollRunResponse>(
			PAYROLL_ENDPOINTS.runs,
			payload,
			getAuthOptions(),
		);
		return response.data;
	} catch (error) {
		normalizePayrollError(error);
	}
}

export async function getPayrollRun(runId: string) {
	const response = await axiosInstance.get<PayrollRunResponse>(
		PAYROLL_ENDPOINTS.run(runId),
		getAuthOptions(),
	);
	return response.data;
}

export async function updatePayrollRun(
	runId: string,
	payload: UpdatePayrollRunPayload,
) {
	try {
		const response = await axiosInstance.patch<PayrollRunResponse>(
			PAYROLL_ENDPOINTS.run(runId),
			payload,
			getAuthOptions(),
		);
		return response.data;
	} catch (error) {
		normalizePayrollError(error);
	}
}

export async function approvePayrollRun(runId: string) {
	const response = await axiosInstance.post<PayrollRunResponse>(
		PAYROLL_ENDPOINTS.approveRun(runId),
		undefined,
		getAuthOptions(),
	);
	return response.data;
}

export async function cancelPayrollRun(runId: string) {
	const response = await axiosInstance.post<PayrollRunResponse>(
		PAYROLL_ENDPOINTS.cancelRun(runId),
		undefined,
		getAuthOptions(),
	);
	return response.data;
}

export async function executePayrollRun(runId: string) {
	const response = await axiosInstance.post<GenericPayrollResponse>(
		PAYROLL_ENDPOINTS.executeRun(runId),
		undefined,
		getAuthOptions(),
	);
	return response.data;
}

export async function getPayrollRunTransactions(runId: string) {
	const response = await axiosInstance.get<PayrollTransactionListResponse>(
		PAYROLL_ENDPOINTS.runTransactions(runId),
		getAuthOptions(),
	);
	return response.data;
}

export async function getPayrollSchedule() {
	const response = await axiosInstance.get<PayrollRunListResponse>(
		PAYROLL_ENDPOINTS.schedule,
		getAuthOptions(),
	);
	return response.data;
}
