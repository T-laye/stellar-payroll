"use client";

import { useQuery } from "@tanstack/react-query";
import { getCompanies, getUsers } from "@/features/admin/api";
import { fullName } from "@/features/admin/labels";

/**
 * Names for ids in tables (a company on a user row, the actor of an audit entry). Loads one large page
 * of each (the admin endpoints cap pages at 100); ids it doesn't know fall back to a short id.
 */
const LOOKUP_LIMIT = 100;

export function useCompanyList() {
	const { data } = useQuery({
		queryKey: ["admin", "lookup", "companies"],
		queryFn: () => getCompanies({ limit: LOOKUP_LIMIT }),
		staleTime: 60_000,
	});
	return data?.data ?? [];
}

export function useCompanyNames() {
	const names = new Map(useCompanyList().map((c) => [c.id, c.name]));
	return (id: string | null | undefined) => (id ? (names.get(id) ?? `${id.slice(0, 8)}…`) : "--");
}

export function useUserNames() {
	const { data } = useQuery({
		queryKey: ["admin", "lookup", "users"],
		queryFn: () => getUsers({ limit: LOOKUP_LIMIT }),
		staleTime: 60_000,
	});
	const users = new Map((data?.data ?? []).map((u) => [u.id, u]));
	return (id: string | null | undefined) => {
		if (!id) return "System";
		const u = users.get(id);
		return u ? fullName(u) : `${id.slice(0, 8)}…`;
	};
}
