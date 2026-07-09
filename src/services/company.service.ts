import { axiosInstance } from "@/config/axios";
import { getStoredAuthHeaders } from "@/lib/auth/session";

export const COMPANY_ENDPOINTS = {
	detail: (companyId: string) => `/companies/${companyId}`,
} as const;

export interface Company {
	country: string;
	created_at: string;
	default_currency: string;
	email: string;
	id: string;
	is_active: boolean;
	logo_url: string | null;
	name: string;
	phone: string | null;
	slug: string;
	timezone: string;
	updated_at: string;
	website: string | null;
}

export interface CompanyResponse {
	data: Company;
	message: string;
	statusCode: number;
}

export interface UpdateCompanyPayload extends Record<string, unknown> {
	default_currency?: string;
	logo_url?: string;
	name?: string;
	phone?: string;
	timezone?: string;
	website?: string;
}

function getAuthOptions() {
	return {
		headers: getStoredAuthHeaders(),
	};
}

export async function getCompany(companyId: string) {
	const response = await axiosInstance.get<CompanyResponse>(
		COMPANY_ENDPOINTS.detail(companyId),
		getAuthOptions(),
	);
	return response.data;
}

export async function updateCompany(
	companyId: string,
	payload: UpdateCompanyPayload,
) {
	const response = await axiosInstance.patch<CompanyResponse>(
		COMPANY_ENDPOINTS.detail(companyId),
		payload,
		getAuthOptions(),
	);
	return response.data;
}
