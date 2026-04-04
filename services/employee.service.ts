import { apiClient } from "@/lib/api/client";
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

export function getCompanyEmployees(companyId: string) {
	return apiClient.get<EmployeeListResponse>(
		EMPLOYEE_ENDPOINTS.list(companyId),
		getAuthOptions(),
	);
}

export function createCompanyEmployee(
	companyId: string,
	payload: CreateEmployeePayload,
) {
	return apiClient.post<EmployeeResponse>(
		EMPLOYEE_ENDPOINTS.list(companyId),
		payload,
		getAuthOptions(),
	);
}

export function getCompanyEmployee(companyId: string, employeeId: string) {
	return apiClient.get<EmployeeResponse>(
		EMPLOYEE_ENDPOINTS.detail(companyId, employeeId),
		getAuthOptions(),
	);
}

export function updateCompanyEmployee(
	companyId: string,
	employeeId: string,
	payload: UpdateEmployeePayload,
) {
	return apiClient.patch<EmployeeResponse>(
		EMPLOYEE_ENDPOINTS.detail(companyId, employeeId),
		payload,
		getAuthOptions(),
	);
}

export function terminateCompanyEmployee(
	companyId: string,
	employeeId: string,
) {
	return apiClient.delete<GenericEmployeeResponse>(
		EMPLOYEE_ENDPOINTS.detail(companyId, employeeId),
		getAuthOptions(),
	);
}

export function linkEmployeeWallet(
	companyId: string,
	employeeId: string,
	payload: LinkEmployeeWalletPayload,
) {
	return apiClient.post<GenericEmployeeResponse>(
		EMPLOYEE_ENDPOINTS.linkWallet(companyId, employeeId),
		payload,
		getAuthOptions(),
	);
}

export function getEmployeeWallet(employeeId: string) {
	return apiClient.get<EmployeeWalletResponse>(
		EMPLOYEE_ENDPOINTS.walletDetail(employeeId),
		getAuthOptions(),
	);
}
