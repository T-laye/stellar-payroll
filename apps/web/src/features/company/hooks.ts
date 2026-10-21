"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/features/auth/store";
import { useCompanyStore } from "@/features/company/store";
import { getCompany, updateCompany } from "@/features/company/api";
import { type UpdateCompanyPayload } from "@/features/company/types";

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

	const query = useQuery({
		queryKey: ["company", "detail", resolvedCompanyId],
		queryFn: () => getCompany(requireCompanyId(resolvedCompanyId)),
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

	return useMutation({
		mutationKey: ["company", "update", resolvedCompanyId],
		mutationFn: (payload: UpdateCompanyPayload) =>
			updateCompany(requireCompanyId(resolvedCompanyId), payload),
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
