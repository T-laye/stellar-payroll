"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useCompanyStore } from "@/lib/stores/company-store";
import useAxiosAuth from "@/hooks/useAxiosAuth";

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

function useResolvedCompanyId(companyId?: string) {
	const currentCompanyId = useAuthStore((state) => state.user?.company_id);
	return companyId ?? currentCompanyId ?? null;
}

function requireCompanyId(companyId: string | null) {
	if (!companyId) {
		throw new Error("Company ID is required");
	}
	return companyId;
}

export function useCompanyDetails(companyId?: string) {
	const resolvedCompanyId = useResolvedCompanyId(companyId);
	const setCompany = useCompanyStore((state) => state.setCompany);
	const axiosAuth = useAxiosAuth();

	const query = useQuery({
		queryKey: ["company", "detail", resolvedCompanyId],
		queryFn: async () => {
			const res = await axiosAuth.get<CompanyResponse>(
				COMPANY_ENDPOINTS.detail(requireCompanyId(resolvedCompanyId))
			);
			return res.data;
		},
		enabled: Boolean(resolvedCompanyId),
		staleTime: 60_000,
	});

	useEffect(() => {
		if (query.data?.data) {
			setCompany(query.data.data);
		}
	}, [query.data, setCompany]);

	return query;
}

export function useUpdateCompany(companyId?: string) {
	const resolvedCompanyId = useResolvedCompanyId(companyId);
	const queryClient = useQueryClient();
	const setCompany = useCompanyStore((state) => state.setCompany);
	const axiosAuth = useAxiosAuth();

	return useMutation({
		mutationKey: ["company", "update", resolvedCompanyId],
		mutationFn: async (payload: UpdateCompanyPayload) => {
			const res = await axiosAuth.patch<CompanyResponse>(
				COMPANY_ENDPOINTS.detail(requireCompanyId(resolvedCompanyId)),
				payload
			);
			return res.data;
		},
		onSuccess: (response) => {
			setCompany(response.data);
			queryClient.setQueryData(
				["company", "detail", resolvedCompanyId],
				response,
			);
			useAuthStore.setState((state) => ({
				user: state.user
					? {
							...state.user,
							company: response.data.name,
						}
					: state.user,
			}));
		},
	});
}
