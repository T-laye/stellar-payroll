"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useComplianceStore } from "@/lib/stores/compliance-store";
import useAxiosAuth from "@/hooks/useAxiosAuth";
import { ComplianceStats, StatsResponse } from "@/features/stats/hooks";

function requireCompanyId(companyId: string | null) {
	if (!companyId) {
		throw new Error("Company ID is required");
	}
	return companyId;
}

export function useCompanyCompliance(companyId: string) {
	const currentCompanyId = useAuthStore((state) => state.user?.company_id);
	const resolvedCompanyId = companyId ?? currentCompanyId ?? null;
	const setStats = useComplianceStore((state) => state.setStats);
	const axiosAuth = useAxiosAuth();

	const query = useQuery({
		queryKey: ["compliance", "stats", resolvedCompanyId],
		queryFn: async () => {
			const res = await axiosAuth.get<StatsResponse<ComplianceStats>>(
				`/companies/${requireCompanyId(resolvedCompanyId)}/stats/compliance`
			);
			return res.data;
		},
		enabled: Boolean(resolvedCompanyId),
		staleTime: 60_000,
	});

	useEffect(() => {
		if (query.data?.data) {
			setStats(query.data.data);
		}
	}, [query.data, setStats]);

	return query;
}
