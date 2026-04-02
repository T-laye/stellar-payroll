import { apiClient } from "@/lib/api/client";
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

export function getCompany(companyId: string) {
	return apiClient.get<CompanyResponse>(
		COMPANY_ENDPOINTS.detail(companyId),
		getAuthOptions(),
	);
}

export function updateCompany(companyId: string, payload: UpdateCompanyPayload) {
	return apiClient.patch<CompanyResponse>(
		COMPANY_ENDPOINTS.detail(companyId),
		payload,
		getAuthOptions(),
	);
}
