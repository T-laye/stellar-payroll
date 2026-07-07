"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/stores/auth-store";
import { usePayrollStore } from "@/lib/stores/payroll-store";
import {
	approvePayrollRun,
	cancelPayrollRun,
	createPayrollGroup,
	createPayrollRun,
	deletePayrollGroup,
	executePayrollRun,
	getPayrollGroups,
	getPayrollRun,
	getPayrollRuns,
	getPayrollRunTransactions,
	getPayrollSchedule,
	updatePayrollGroup,
	updatePayrollRun,
	type CreatePayrollGroupPayload,
	type CreatePayrollRunPayload,
	type UpdatePayrollGroupPayload,
	type UpdatePayrollRunPayload,
} from "@/services/payroll.service";

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

function invalidatePayrollQueries(
	queryClient: ReturnType<typeof useQueryClient>,
	companyId: string | null,
) {
	queryClient.invalidateQueries({ queryKey: ["payroll", "groups", companyId] });
	queryClient.invalidateQueries({ queryKey: ["payroll", "runs"] });
	queryClient.invalidateQueries({ queryKey: ["payroll", "schedule"] });
	queryClient.invalidateQueries({ queryKey: ["stats", "payroll", companyId] });
	queryClient.invalidateQueries({ queryKey: ["stats", "overview", companyId] });
	queryClient.invalidateQueries({
		queryKey: ["stats", "transactions", companyId],
	});
}

export function useCompanyPayrollGroups(companyId?: string) {
	const resolvedCompanyId = useResolvedCompanyId(companyId);
	const setGroups = usePayrollStore((state) => state.setGroups);

	const query = useQuery({
		queryKey: ["payroll", "groups", resolvedCompanyId],
		queryFn: () => getPayrollGroups(requireCompanyId(resolvedCompanyId)),
		enabled: Boolean(resolvedCompanyId),
		staleTime: 60_000,
	});

	useEffect(() => {
		if (query.data?.data) {
			setGroups(query.data.data);
		}
	}, [query.data, setGroups]);

	return query;
}

export function useCreatePayrollGroup(companyId?: string) {
	const resolvedCompanyId = useResolvedCompanyId(companyId);
	const queryClient = useQueryClient();
	const upsertGroup = usePayrollStore((state) => state.upsertGroup);

	return useMutation({
		mutationKey: ["payroll", "groups", "create", resolvedCompanyId],
		mutationFn: (payload: CreatePayrollGroupPayload) =>
			createPayrollGroup(requireCompanyId(resolvedCompanyId), payload),
		onSuccess: (response) => {
			upsertGroup(response.data);
			invalidatePayrollQueries(queryClient, resolvedCompanyId);
		},
	});
}

export function useUpdatePayrollGroup(groupId: string, companyId?: string) {
	const resolvedCompanyId = useResolvedCompanyId(companyId);
	const queryClient = useQueryClient();
	const upsertGroup = usePayrollStore((state) => state.upsertGroup);

	return useMutation({
		mutationKey: ["payroll", "groups", "update", resolvedCompanyId, groupId],
		mutationFn: (payload: UpdatePayrollGroupPayload) =>
			updatePayrollGroup(requireCompanyId(resolvedCompanyId), groupId, payload),
		onSuccess: (response) => {
			upsertGroup(response.data);
			invalidatePayrollQueries(queryClient, resolvedCompanyId);
		},
	});
}

export function useDeletePayrollGroup(companyId?: string) {
	const resolvedCompanyId = useResolvedCompanyId(companyId);
	const queryClient = useQueryClient();
	const removeGroup = usePayrollStore((state) => state.removeGroup);

	return useMutation({
		mutationKey: ["payroll", "groups", "delete", resolvedCompanyId],
		mutationFn: (groupId: string) =>
			deletePayrollGroup(requireCompanyId(resolvedCompanyId), groupId),
		onSuccess: (_, groupId) => {
			removeGroup(groupId);
			invalidatePayrollQueries(queryClient, resolvedCompanyId);
		},
	});
}

export function usePayrollRuns() {
	const setRuns = usePayrollStore((state) => state.setRuns);

	const query = useQuery({
		queryKey: ["payroll", "runs"],
		queryFn: getPayrollRuns,
		staleTime: 30_000,
	});

	useEffect(() => {
		if (query.data?.data) {
			setRuns(query.data.data);
		}
	}, [query.data, setRuns]);

	return query;
}

export function usePayrollRunDetails(runId?: string) {
	const setSelectedRun = usePayrollStore((state) => state.setSelectedRun);
	const upsertRun = usePayrollStore((state) => state.upsertRun);

	const query = useQuery({
		queryKey: ["payroll", "run", runId],
		queryFn: () => getPayrollRun(runId as string),
		enabled: Boolean(runId),
	});

	useEffect(() => {
		if (query.data?.data) {
			setSelectedRun(query.data.data);
			upsertRun(query.data.data);
		}
	}, [query.data, setSelectedRun, upsertRun]);

	return query;
}

export function useCreatePayrollRun(companyId?: string) {
	const resolvedCompanyId = useResolvedCompanyId(companyId);
	const queryClient = useQueryClient();
	const upsertRun = usePayrollStore((state) => state.upsertRun);

	return useMutation({
		mutationKey: ["payroll", "runs", "create"],
		mutationFn: (payload: CreatePayrollRunPayload) => createPayrollRun(payload),
		onSuccess: (response) => {
			upsertRun(response.data);
			invalidatePayrollQueries(queryClient, resolvedCompanyId);
		},
	});
}

export function useUpdatePayrollRun(runId: string, companyId?: string) {
	const resolvedCompanyId = useResolvedCompanyId(companyId);
	const queryClient = useQueryClient();
	const upsertRun = usePayrollStore((state) => state.upsertRun);

	return useMutation({
		mutationKey: ["payroll", "runs", "update", runId],
		mutationFn: (payload: UpdatePayrollRunPayload) =>
			updatePayrollRun(runId, payload),
		onSuccess: (response) => {
			upsertRun(response.data);
			queryClient.setQueryData(["payroll", "run", runId], response);
			invalidatePayrollQueries(queryClient, resolvedCompanyId);
		},
	});
}

function buildRunActionMutation(
	action: "approve" | "cancel",
	queryClient: ReturnType<typeof useQueryClient>,
	companyId: string | null,
	upsertRun: ReturnType<typeof usePayrollStore.getState>["upsertRun"],
) {
	return {
		mutationKey: ["payroll", "runs", action],
		mutationFn: (runId: string) =>
			action === "approve" ? approvePayrollRun(runId) : cancelPayrollRun(runId),
		onSuccess: (response: Awaited<ReturnType<typeof approvePayrollRun>>) => {
			upsertRun(response.data);
			queryClient.setQueryData(["payroll", "run", response.data.id], response);
			invalidatePayrollQueries(queryClient, companyId);
		},
	};
}

export function useApprovePayrollRun(companyId?: string) {
	const resolvedCompanyId = useResolvedCompanyId(companyId);
	const queryClient = useQueryClient();
	const upsertRun = usePayrollStore((state) => state.upsertRun);

	return useMutation(
		buildRunActionMutation("approve", queryClient, resolvedCompanyId, upsertRun),
	);
}

export function useCancelPayrollRun(companyId?: string) {
	const resolvedCompanyId = useResolvedCompanyId(companyId);
	const queryClient = useQueryClient();
	const upsertRun = usePayrollStore((state) => state.upsertRun);

	return useMutation(
		buildRunActionMutation("cancel", queryClient, resolvedCompanyId, upsertRun),
	);
}

export function useExecutePayrollRun(companyId?: string) {
	const resolvedCompanyId = useResolvedCompanyId(companyId);
	const queryClient = useQueryClient();

	return useMutation({
		mutationKey: ["payroll", "runs", "execute"],
		mutationFn: (runId: string) => executePayrollRun(runId),
		onSuccess: (_, runId) => {
			queryClient.invalidateQueries({ queryKey: ["payroll", "run", runId] });
			invalidatePayrollQueries(queryClient, resolvedCompanyId);
		},
	});
}

export function usePayrollRunTransactions(runId?: string) {
	const setRunTransactions = usePayrollStore((state) => state.setRunTransactions);

	const query = useQuery({
		queryKey: ["payroll", "transactions", runId],
		queryFn: () => getPayrollRunTransactions(runId as string),
		enabled: Boolean(runId),
	});

	useEffect(() => {
		if (query.data?.data && runId) {
			setRunTransactions(runId, query.data.data);
		}
	}, [query.data, runId, setRunTransactions]);

	return query;
}

export function usePayrollSchedule() {
	const setSchedule = usePayrollStore((state) => state.setSchedule);

	const query = useQuery({
		queryKey: ["payroll", "schedule"],
		queryFn: getPayrollSchedule,
		staleTime: 30_000,
	});

	useEffect(() => {
		if (query.data?.data) {
			setSchedule(query.data.data);
		}
	}, [query.data, setSchedule]);

	return query;
}
