import axios from "axios";
import { ApiError, axiosInstance } from "@/config/axios";
import { getStoredAuthHeaders } from "@/lib/auth/session";

export const EMPLOYEE_ENDPOINTS = {
	list: (companyId: string) => `/companies/${companyId}/employees`,
	detail: (companyId: string, employeeId: string) =>
		`/companies/${companyId}/employees/${employeeId}`,
	linkWallet: (companyId: string, employeeId: string) =>
		`/companies/${companyId}/employees/${employeeId}/wallet`,
	walletDetail: (employeeId: string) => `/employees/${employeeId}/wallet`,
} as const;

export interface EmployeeWalletSummary {
	id: string;
	is_funded: boolean;
	network: string;
	stellar_address: string;
}

export interface CompanyEmployee {
	company_id: string;
	country: string;
	created_at: string;
	department: string;
	email: string;
	employee_number: string;
	employment_type: string;
	role_slug: string;
	end_date: string | null;
	external_id: string;
	first_name: string;
	group_id: string | null;
	id: string;
	job_title: string;
	last_name: string;
	phone: string;
	salary_amount: string;
	salary_currency: string;
	start_date: string;
	status: string;
	updated_at: string;
	wallet?: EmployeeWalletSummary | null;
}

export interface EmployeeListResponse {
	data: CompanyEmployee[];
	message: string;
	statusCode: number;
}

export interface EmployeeResponse {
	data: CompanyEmployee;
	message: string;
	statusCode: number;
}

export interface EmployeeWalletBalance {
	amount: string;
	asset: string;
}

export interface EmployeeLastPayment {
	amount: string;
	asset: string;
	confirmed_at: string;
	from_address: string;
	stellar_tx_hash: string;
	transaction_id: string;
}

export interface EmployeeWalletDetail {
	balances: EmployeeWalletBalance[];
	created_at: string;
	id: string;
	is_funded: boolean;
	last_payment: EmployeeLastPayment | null;
	network: string;
	owner_id: string;
	owner_type: string;
	stellar_address: string;
	total_payments_received: number;
	updated_at: string;
	wallet_type: string;
}

export interface EmployeeWalletResponse {
	data: EmployeeWalletDetail;
	message: string;
	statusCode: number;
}

export interface GenericEmployeeResponse<T = Record<string, unknown>> {
	data: T;
	message: string;
	statusCode: number;
}

export interface CreateEmployeePayload extends Record<string, unknown> {
	country: string;
	department: string;
	email: string;
	employment_type: string;
	external_id?: string;
	first_name: string;
	group_id?: string;
	job_title: string;
	last_name: string;
	phone: string;
	salary_amount: string;
	salary_currency: string;
	start_date: string;
	role_slug: string;
}

export interface UpdateEmployeePayload extends Record<string, unknown> {
	department?: string;
	employment_type?: string;
	end_date?: string | null;
	external_id?: string;
	first_name?: string;
	group_id?: string | null;
	job_title?: string;
	last_name?: string;
	phone?: string;
	salary_amount?: string;
	salary_currency?: string;
	status?: string;
	role_slug?: string;
}

export interface LinkEmployeeWalletPayload extends Record<string, unknown> {
	stellar_address?: string;
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

function normalizeEmployeeError(error: unknown): never {
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

export async function getCompanyEmployees(companyId: string) {
	const response = await axiosInstance.get<EmployeeListResponse>(
		EMPLOYEE_ENDPOINTS.list(companyId),
		getAuthOptions(),
	);
	return response.data;
}

export async function createCompanyEmployee(
	companyId: string,
	payload: CreateEmployeePayload,
) {
	try {
		const response = await axiosInstance.post<EmployeeResponse>(
			EMPLOYEE_ENDPOINTS.list(companyId),
			payload,
			getAuthOptions(),
		);
		return response.data;
	} catch (error) {
		normalizeEmployeeError(error);
	}
}

export async function getCompanyEmployee(
	companyId: string,
	employeeId: string,
) {
	const response = await axiosInstance.get<EmployeeResponse>(
		EMPLOYEE_ENDPOINTS.detail(companyId, employeeId),
		getAuthOptions(),
	);
	return response.data;
}

export async function updateCompanyEmployee(
	companyId: string,
	employeeId: string,
	payload: UpdateEmployeePayload,
) {
	const response = await axiosInstance.patch<EmployeeResponse>(
		EMPLOYEE_ENDPOINTS.detail(companyId, employeeId),
		payload,
		getAuthOptions(),
	);
	return response.data;
}

export async function terminateCompanyEmployee(
	companyId: string,
	employeeId: string,
) {
	const response = await axiosInstance.delete<GenericEmployeeResponse>(
		EMPLOYEE_ENDPOINTS.detail(companyId, employeeId),
		getAuthOptions(),
	);
	return response.data;
}

export async function linkEmployeeWallet(
	companyId: string,
	employeeId: string,
	payload: LinkEmployeeWalletPayload,
) {
	try {
		const response = await axiosInstance.post<GenericEmployeeResponse>(
			EMPLOYEE_ENDPOINTS.linkWallet(companyId, employeeId),
			payload,
			getAuthOptions(),
		);
		return response.data;
	} catch (error) {
		normalizeEmployeeError(error);
	}
}

export async function getEmployeeWallet(employeeId: string) {
	const response = await axiosInstance.get<EmployeeWalletResponse>(
		EMPLOYEE_ENDPOINTS.walletDetail(employeeId),
		getAuthOptions(),
	);
	return response.data;
}
