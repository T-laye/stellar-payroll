import { axiosInstance } from "@/lib/api/client";
import { getStoredAuthHeaders } from "@/features/auth/session";
import type { CompanyResponse, UpdateCompanyPayload } from "@/features/company/types";

export const COMPANY_ENDPOINTS = {
	detail: (companyId: string) => `/companies/${companyId}`,
} as const;

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
