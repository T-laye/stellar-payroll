"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/features/auth/store";
import {
	addLineItems,
	approveRun,
	cancelRun,
	createRun,
	createSchedule,
	executeRun,
	getGroups,
	getLineItems,
	getRun,
	getRunTransactions,
	getRuns,
	getSchedule,
	getSchedules,
	getTransaction,
	getTransactions,
	removeLineItem,
	retryTransaction,
	runComplianceCheck,
	scheduleAction,
	updateLineItem,
	updateRun,
	updateSchedule,
} from "@/features/payroll/api";
import type {
	CreateRunPayload,
	LineItemInput,
	PayrollRun,
	SchedulePayload,
	Transaction,
	TransactionFilters,
} from "@/features/payroll/types";

/**
 * Payroll queries and mutations. Anything that is still settling (a run paying out, a payment
 * waiting on the network) polls until it lands; writes never retry (a retried execution could
 * pay twice) and refresh everything payroll-shaped when they succeed.
 */

const LIVE_POLL = 1500;

export function useCompanyId() {
	return useAuthStore((state) => state.user?.company_id ?? null);
}

/** After any payroll write: runs, payments, stats and notifications may all have moved. */
export function refreshPayroll(queryClient: QueryClient) {
	for (const key of ["payroll", "transactions", "stats", "notifications", "me"])
		queryClient.invalidateQueries({ queryKey: [key] });
}

const isSettling = (run?: PayrollRun) =>
	!!run &&
	(run.status === "PROCESSING" ||
		run.status === "RETRYING" ||
		(run.status === "APPROVED" && Date.parse(run.scheduled_at) <= Date.now()));

const hasPendingPayments = (list?: Transaction[]) => !!list?.some((t) => t.status === "PENDING" || t.status === "SUBMITTED");

export function useGroups() {
	const companyId = useCompanyId();
	return useQuery({
		queryKey: ["payroll", "groups", companyId],
		queryFn: () => getGroups(companyId!),
		enabled: !!companyId,
		staleTime: 5 * 60_000,
		select: (response) => response.data,
	});
}

export function useRuns() {
	return useQuery({
		queryKey: ["payroll", "runs"],
		queryFn: getRuns,
		staleTime: 15_000,
		select: (response) => response.data,
		refetchInterval: (query) => (query.state.data?.data.some(isSettling) ? LIVE_POLL * 2 : false),
	});
}

export function useRun(id?: string) {
	return useQuery({
		queryKey: ["payroll", "run", id],
		queryFn: () => getRun(id!),
		enabled: !!id,
		select: (response) => response.data,
		refetchInterval: (query) => (isSettling(query.state.data?.data) ? LIVE_POLL : false),
	});
}

export function useLineItems(runId?: string) {
	return useQuery({
		queryKey: ["payroll", "run", runId, "line-items"],
		queryFn: () => getLineItems(runId!),
		enabled: !!runId,
		select: (response) => response.data,
	});
}

export function useRunTransactions(runId?: string, live = false) {
	return useQuery({
		queryKey: ["payroll", "run", runId, "transactions"],
		queryFn: () => getRunTransactions(runId!),
		enabled: !!runId,
		select: (response) => response.data,
		refetchInterval: (query) => (live || hasPendingPayments(query.state.data?.data) ? LIVE_POLL : false),
	});
}

export function useComplianceCheck(runId?: string, enabled = true) {
	return useQuery({
		// A POST, but it only reads: re-run whenever the line items change.
		queryKey: ["payroll", "run", runId, "compliance"],
		queryFn: () => runComplianceCheck(runId!),
		enabled: !!runId && enabled,
		select: (response) => response.data,
		staleTime: 0,
	});
}

export function useTransactions(filters: TransactionFilters = {}, enabled = true) {
	return useQuery({
		queryKey: ["transactions", filters],
		queryFn: () => getTransactions(filters),
		enabled,
		placeholderData: keepPreviousData,
		refetchInterval: (query) => (hasPendingPayments(query.state.data?.data) ? LIVE_POLL * 2 : false),
	});
}

export function useTransaction(id?: string) {
	return useQuery({
		queryKey: ["transactions", "one", id],
		queryFn: () => getTransaction(id!),
		enabled: !!id,
		select: (response) => response.data,
		refetchInterval: (query) => (hasPendingPayments(query.state.data ? [query.state.data.data] : []) ? LIVE_POLL : false),
	});
}

// ---- Run mutations ----

export function useCreateRun() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({ run, items }: { run: CreateRunPayload; items: LineItemInput[] }) => {
			const created = (await createRun(run)).data;
			// A run created for a group may already hold that group's people (docs/PLAN.md, open question).
			const existing = (await getLineItems(created.id)).data;
			const have = new Set(existing.map((i) => i.employee_id));
			const wanted = new Set(items.map((i) => i.employee_id));
			await Promise.all(existing.filter((i) => !wanted.has(i.employee_id)).map((i) => removeLineItem(created.id, i.id)));
			const toAdd = items.filter((i) => !have.has(i.employee_id));
			for (let start = 0; start < toAdd.length; start += 100) await addLineItems(created.id, toAdd.slice(start, start + 100));
			return created;
		},
		onSuccess: () => refreshPayroll(queryClient),
	});
}

/** Brings a draft's line items in line with the picker: removes, adds and re-prices. */
export function useSyncLineItems(runId?: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (items: LineItemInput[]) => {
			const existing = (await getLineItems(runId!)).data;
			const wanted = new Map(items.map((i) => [i.employee_id, i]));
			const have = new Map(existing.map((i) => [i.employee_id, i]));
			await Promise.all(existing.filter((i) => !wanted.has(i.employee_id)).map((i) => removeLineItem(runId!, i.id)));
			await Promise.all(
				existing
					.filter(
						(i) =>
							wanted.has(i.employee_id) &&
							wanted.get(i.employee_id)!.amount &&
							Number(wanted.get(i.employee_id)!.amount) !== Number(i.amount),
					)
					.map((i) => updateLineItem(runId!, i.id, { amount: wanted.get(i.employee_id)!.amount })),
			);
			const toAdd = items.filter((i) => !have.has(i.employee_id));
			if (toAdd.length) await addLineItems(runId!, toAdd);
		},
		onSuccess: () => refreshPayroll(queryClient),
	});
}

export function useUpdateRun(runId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload: Parameters<typeof updateRun>[1]) => updateRun(runId, payload),
		onSuccess: () => refreshPayroll(queryClient),
	});
}

export function useUpdateLineItem(runId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ itemId, amount }: { itemId: string; amount: string }) => updateLineItem(runId, itemId, { amount }),
		onSuccess: () => refreshPayroll(queryClient),
	});
}

export function useRemoveLineItem(runId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (itemId: string) => removeLineItem(runId, itemId),
		onSuccess: () => refreshPayroll(queryClient),
	});
}

export function useApproveRun() {
	const queryClient = useQueryClient();
	return useMutation({ mutationFn: approveRun, onSuccess: () => refreshPayroll(queryClient) });
}

/** Approve (if still a draft) and start paying now. */
export function usePayNow() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (run: Pick<PayrollRun, "id" | "status">) => {
			if (run.status === "DRAFT") await approveRun(run.id);
			return executeRun(run.id);
		},
		onSuccess: () => refreshPayroll(queryClient),
	});
}

export function useCancelRun() {
	const queryClient = useQueryClient();
	return useMutation({ mutationFn: cancelRun, onSuccess: () => refreshPayroll(queryClient) });
}

export function useRetryPayment() {
	const queryClient = useQueryClient();
	return useMutation({ mutationFn: retryTransaction, onSuccess: () => refreshPayroll(queryClient) });
}

// ---- Recurring schedules (proposed) ----

export function useSchedules() {
	return useQuery({ queryKey: ["payroll", "schedules"], queryFn: getSchedules, select: (response) => response.data });
}

export function useSchedule(id?: string) {
	return useQuery({
		queryKey: ["payroll", "schedules", id],
		queryFn: () => getSchedule(id!),
		enabled: !!id,
		select: (response) => response.data,
	});
}

export function useCreateSchedule() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload: SchedulePayload) => createSchedule(payload),
		onSuccess: () => refreshPayroll(queryClient),
	});
}

export function useUpdateSchedule(id: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload: Partial<SchedulePayload>) => updateSchedule(id, payload),
		onSuccess: () => refreshPayroll(queryClient),
	});
}

export function useScheduleAction() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, action }: { id: string; action: "pause" | "resume" | "cancel" }) => scheduleAction(id, action),
		onSuccess: () => refreshPayroll(queryClient),
	});
}
