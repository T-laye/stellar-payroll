"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/stores/auth-store";
import { usePayrollStore } from "@/lib/stores/payroll-store";
import useAxiosAuth from "@/hooks/useAxiosAuth";

export const PAYROLL_ENDPOINTS = {
	groups: (companyId: string) => `/companies/${companyId}/groups`,
	group: (companyId: string, groupId: string) =>
		`/companies/${companyId}/groups/${groupId}`,
	runs: "/payroll/runs",
	run: (runId: string) => `/payroll/runs/${runId}`,
	approveRun: (runId: string) => `/payroll/runs/${runId}/approve`,
	cancelRun: (runId: string) => `/payroll/runs/${runId}/cancel`,
	executeRun: (runId: string) => `/payroll/runs/${runId}/execute`,
	runTransactions: (runId: string) => `/payroll/runs/${runId}/transactions`,
	schedule: "/payroll/schedule",
} as const;

export interface PayrollGroup {
	company_id: string;
	created_at: string;
	currency: string;
	description: string;
	id: string;
	is_active: boolean;
	name: string;
	pay_cycle: string;
	timezone: string;
	updated_at: string;
}

export interface PayrollRun {
	approved_at: string | null;
	approved_by: string | null;
	company_id: string;
	created_at: string;
	created_by: string;
	currency: string;
	executed_at: string | null;
	group_id: string;
	id: string;
	notes: string;
	period_end: string;
	period_start: string;
	scheduled_at: string;
	status: string;
	stellar_memo: string | null;
	total_amount: string;
	updated_at: string;
}

export interface PayrollTransaction {
	amount: string;
	asset: string;
	company_id: string;
	confirmed_at: string | null;
	created_at: string;
	error_message: string | null;
	fee_amount: string | null;
	from_address: string;
	id: string;
	ledger_sequence: number | null;
	line_item_id: string;
	payroll_run_id: string;
	retry_count: number;
	status: string;
	stellar_tx_hash: string | null;
	submitted_at: string | null;
	to_address: string;
}

export interface PayrollGroupResponse {
	data: PayrollGroup;
	message: string;
	statusCode: number;
}

export interface PayrollGroupListResponse {
	data: PayrollGroup[];
	message: string;
	statusCode: number;
}

export interface PayrollRunResponse {
	data: PayrollRun;
	message: string;
	statusCode: number;
}

export interface PayrollRunListResponse {
	data: PayrollRun[];
	message: string;
	statusCode: number;
}

export interface PayrollTransactionListResponse {
	data: PayrollTransaction[];
	message: string;
	statusCode: number;
}

export interface GenericPayrollResponse<T = Record<string, unknown>> {
	data: T;
	message: string;
	statusCode: number;
}

export interface CreatePayrollGroupPayload extends Record<string, unknown> {
	currency: string;
	description: string;
	name: string;
	pay_cycle: string;
	timezone: string;
}

export interface UpdatePayrollGroupPayload extends Record<string, unknown> {
	currency?: string;
	description?: string;
	is_active?: boolean;
	name?: string;
	pay_cycle?: string;
	timezone?: string;
}

export interface CreatePayrollRunPayload extends Record<string, unknown> {
	currency: string;
	group_id: string;
	notes?: string;
	period_end: string;
	period_start: string;
	scheduled_at: string;
}

export interface UpdatePayrollRunPayload extends Record<string, unknown> {
	notes?: string;
	scheduled_at?: string;
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
	const axiosAuth = useAxiosAuth();

	const query = useQuery({
		queryKey: ["payroll", "groups", resolvedCompanyId],
		queryFn: async () => {
			const res = await axiosAuth.get<PayrollGroupListResponse>(
				PAYROLL_ENDPOINTS.groups(requireCompanyId(resolvedCompanyId))
			);
			return res.data;
		},
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
	const axiosAuth = useAxiosAuth();

	return useMutation({
		mutationKey: ["payroll", "groups", "create", resolvedCompanyId],
		mutationFn: async (payload: CreatePayrollGroupPayload) => {
			const res = await axiosAuth.post<PayrollGroupResponse>(
				PAYROLL_ENDPOINTS.groups(requireCompanyId(resolvedCompanyId)),
				payload
			);
			return res.data;
		},
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
	const axiosAuth = useAxiosAuth();

	return useMutation({
		mutationKey: ["payroll", "groups", "update", resolvedCompanyId, groupId],
		mutationFn: async (payload: UpdatePayrollGroupPayload) => {
			const res = await axiosAuth.patch<PayrollGroupResponse>(
				PAYROLL_ENDPOINTS.group(requireCompanyId(resolvedCompanyId), groupId),
				payload
			);
			return res.data;
		},
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
	const axiosAuth = useAxiosAuth();

	return useMutation({
		mutationKey: ["payroll", "groups", "delete", resolvedCompanyId],
		mutationFn: async (groupId: string) => {
			const res = await axiosAuth.delete<GenericPayrollResponse>(
				PAYROLL_ENDPOINTS.group(requireCompanyId(resolvedCompanyId), groupId)
			);
			return res.data;
		},
		onSuccess: (_, groupId) => {
			removeGroup(groupId);
			invalidatePayrollQueries(queryClient, resolvedCompanyId);
		},
	});
}

export function usePayrollRuns() {
	const setRuns = usePayrollStore((state) => state.setRuns);
	const axiosAuth = useAxiosAuth();

	const query = useQuery({
		queryKey: ["payroll", "runs"],
		queryFn: async () => {
			const res = await axiosAuth.get<PayrollRunListResponse>(
				PAYROLL_ENDPOINTS.runs
			);
			return res.data;
		},
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
	const axiosAuth = useAxiosAuth();

	const query = useQuery({
		queryKey: ["payroll", "run", runId],
		queryFn: async () => {
			const res = await axiosAuth.get<PayrollRunResponse>(
				PAYROLL_ENDPOINTS.run(runId as string)
			);
			return res.data;
		},
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
	const axiosAuth = useAxiosAuth();

	return useMutation({
		mutationKey: ["payroll", "runs", "create"],
		mutationFn: async (payload: CreatePayrollRunPayload) => {
			const res = await axiosAuth.post<PayrollRunResponse>(
				PAYROLL_ENDPOINTS.runs,
				payload
			);
			return res.data;
		},
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
	const axiosAuth = useAxiosAuth();

	return useMutation({
		mutationKey: ["payroll", "runs", "update", runId],
		mutationFn: async (payload: UpdatePayrollRunPayload) => {
			const res = await axiosAuth.patch<PayrollRunResponse>(
				PAYROLL_ENDPOINTS.run(runId),
				payload
			);
			return res.data;
		},
		onSuccess: (response) => {
			upsertRun(response.data);
			queryClient.setQueryData(["payroll", "run", runId], response);
			invalidatePayrollQueries(queryClient, resolvedCompanyId);
		},
	});
}

export function useApprovePayrollRun(companyId?: string) {
	const resolvedCompanyId = useResolvedCompanyId(companyId);
	const queryClient = useQueryClient();
	const upsertRun = usePayrollStore((state) => state.upsertRun);
	const axiosAuth = useAxiosAuth();

	return useMutation({
		mutationKey: ["payroll", "runs", "approve"],
		mutationFn: async (runId: string) => {
			const res = await axiosAuth.post<PayrollRunResponse>(
				PAYROLL_ENDPOINTS.approveRun(runId)
			);
			return res.data;
		},
		onSuccess: (response) => {
			upsertRun(response.data);
			queryClient.setQueryData(["payroll", "run", response.data.id], response);
			invalidatePayrollQueries(queryClient, resolvedCompanyId);
		},
	});
}

export function useCancelPayrollRun(companyId?: string) {
	const resolvedCompanyId = useResolvedCompanyId(companyId);
	const queryClient = useQueryClient();
	const upsertRun = usePayrollStore((state) => state.upsertRun);
	const axiosAuth = useAxiosAuth();

	return useMutation({
		mutationKey: ["payroll", "runs", "cancel"],
		mutationFn: async (runId: string) => {
			const res = await axiosAuth.post<PayrollRunResponse>(
				PAYROLL_ENDPOINTS.cancelRun(runId)
			);
			return res.data;
		},
		onSuccess: (response) => {
			upsertRun(response.data);
			queryClient.setQueryData(["payroll", "run", response.data.id], response);
			invalidatePayrollQueries(queryClient, resolvedCompanyId);
		},
	});
}

export function useExecutePayrollRun(companyId?: string) {
	const resolvedCompanyId = useResolvedCompanyId(companyId);
	const queryClient = useQueryClient();
	const axiosAuth = useAxiosAuth();

	return useMutation({
		mutationKey: ["payroll", "runs", "execute"],
		mutationFn: async (runId: string) => {
			const res = await axiosAuth.post<GenericPayrollResponse>(
				PAYROLL_ENDPOINTS.executeRun(runId)
			);
			return res.data;
		},
		onSuccess: (_, runId) => {
			queryClient.invalidateQueries({ queryKey: ["payroll", "run", runId] });
			invalidatePayrollQueries(queryClient, resolvedCompanyId);
		},
	});
}

export function usePayrollRunTransactions(runId?: string) {
	const setRunTransactions = usePayrollStore((state) => state.setRunTransactions);
	const axiosAuth = useAxiosAuth();

	const query = useQuery({
		queryKey: ["payroll", "transactions", runId],
		queryFn: async () => {
			const res = await axiosAuth.get<PayrollTransactionListResponse>(
				PAYROLL_ENDPOINTS.runTransactions(runId as string)
			);
			return res.data;
		},
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
	const axiosAuth = useAxiosAuth();

	const query = useQuery({
		queryKey: ["payroll", "schedule"],
		queryFn: async () => {
			const res = await axiosAuth.get<PayrollRunListResponse>(
				PAYROLL_ENDPOINTS.schedule
			);
			return res.data;
		},
		staleTime: 30_000,
	});

	useEffect(() => {
		if (query.data?.data) {
			setSchedule(query.data.data);
		}
	}, [query.data, setSchedule]);

	return query;
}
