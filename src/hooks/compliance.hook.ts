"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useComplianceStore } from "@/lib/stores/compliance-store";
import { getCompanyComplianceStats } from "@/services/compliance.service";

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

	const query = useQuery({
		queryKey: ["compliance", "stats", resolvedCompanyId],
		queryFn: () =>
			getCompanyComplianceStats(requireCompanyId(resolvedCompanyId)),
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
