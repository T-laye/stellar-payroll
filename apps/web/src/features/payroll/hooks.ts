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
	getRunReview,
	getRunTransactions,
	getRuns,
	getSchedule,
	getSchedules,
	getTransaction,
	getTransactions,
	removeLineItem,
	retryFailed,
	retryTransaction,
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
	ScheduleUpdate,
	Transaction,
	TransactionFilters,
} from "@/features/payroll/types";

/**
 * Payroll queries and mutations. Anything still settling (a run paying out, a payment waiting on
 * the network) polls every few seconds until it lands (frontend-integration.md §3: 3–5 s). Writes
 * never retry and carry the idempotency key their form or dialog made, so a repeat can't pay twice.
 */

const LIVE_POLL = 3000;

export function useCompanyId() {
	return useAuthStore((state) => state.user?.company_id ?? null);
}

/** After any payroll write: runs, payments, stats and notifications may all have moved. */
export function refreshPayroll(queryClient: QueryClient) {
	for (const key of ["payroll", "transactions", "stats", "notifications", "me"]) queryClient.invalidateQueries({ queryKey: [key] });
}

const isSettling = (run?: PayrollRun) => !!run && (run.status === "PROCESSING" || run.status === "RETRYING");

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
		refetchInterval: (query) => (query.state.data?.data.some(isSettling) ? LIVE_POLL : false),
	});
}

/** A run carries `employee_count` and `payments`, so while it pays out this one poll drives the progress bar. */
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

/** The review screen: totals, per-employee issues, network estimate, `ready`. Refreshes after every line-item change. */
export function useRunReview(runId?: string) {
	return useQuery({
		queryKey: ["payroll", "run", runId, "review"],
		queryFn: () => getRunReview(runId!),
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

export function useTransactions(filters: TransactionFilters = {}, enabled = true) {
	return useQuery({
		queryKey: ["transactions", filters],
		queryFn: () => getTransactions(filters),
		enabled,
		placeholderData: keepPreviousData,
		refetchInterval: (query) => (hasPendingPayments(query.state.data?.data) ? LIVE_POLL : false),
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

/** Creates the draft, then adds its people (the server never copies a group's employees). */
export function useCreateRun() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({ run, items, key }: { run: CreateRunPayload; items: LineItemInput[]; key: string }) => {
			const created = (await createRun(run, key)).data;
			for (let start = 0; start < items.length; start += 100) {
				await addLineItems(created.id, items.slice(start, start + 100), `${key}:items:${start}`);
			}
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
					.filter((i) => {
						const next = wanted.get(i.employee_id)?.amount;
						return next !== undefined && Number(next) !== Number(i.amount);
					})
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
	return useMutation({
		mutationFn: ({ id, key }: { id: string; key: string }) => approveRun(id, key),
		onSuccess: () => refreshPayroll(queryClient),
	});
}

/** Approve (if still a draft) and start paying now. */
export function usePayNow() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({ run, key }: { run: Pick<PayrollRun, "id" | "status">; key: string }) => {
			if (run.status === "DRAFT") await approveRun(run.id, key);
			return executeRun(run.id, key);
		},
		onSuccess: () => refreshPayroll(queryClient),
	});
}

export function useCancelRun() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, key }: { id: string; key: string }) => cancelRun(id, key),
		onSuccess: () => refreshPayroll(queryClient),
	});
}

/** Retries one failed payment; resolves to the new attempt's transaction. */
export function useRetryPayment() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({ id, key }: { id: string; key: string }) => (await retryTransaction(id, key)).data,
		onSuccess: () => refreshPayroll(queryClient),
	});
}

export function useRetryFailed() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({ runId, key }: { runId: string; key: string }) => (await retryFailed(runId, key)).data,
		onSuccess: () => refreshPayroll(queryClient),
	});
}

// ---- Recurring schedules ----

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
		mutationFn: ({ payload, key }: { payload: SchedulePayload; key: string }) => createSchedule(payload, key),
		onSuccess: () => refreshPayroll(queryClient),
	});
}

export function useUpdateSchedule(id: string) {
	const queryClient = useQueryClient();
	return useMutation({ mutationFn: (payload: ScheduleUpdate) => updateSchedule(id, payload), onSuccess: () => refreshPayroll(queryClient) });
}

export function useScheduleAction() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, action, key }: { id: string; action: "pause" | "resume" | "cancel"; key?: string }) => scheduleAction(id, action, key),
		onSuccess: () => refreshPayroll(queryClient),
	});
}
