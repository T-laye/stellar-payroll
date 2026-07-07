"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/stores/auth-store";
import { usePaymentRequestStore } from "@/lib/stores/payment-request-store";
import {
	createMyPaymentRequest,
	getCompanyPaymentRequests,
	getMyPaymentRequests,
	reviewCompanyPaymentRequest,
	type CreatePaymentRequestPayload,
	type PaymentRequestStatus,
	type ReviewPaymentRequestPayload,
} from "@/services/payment-request.service";

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

export function useCompanyPaymentRequests(
	status: PaymentRequestStatus | "all" = "all",
	companyId?: string,
) {
	const resolvedCompanyId = useResolvedCompanyId(companyId);
	const setCompanyRequests = usePaymentRequestStore(
		(state) => state.setCompanyRequests,
	);

	const query = useQuery({
		queryKey: ["payment-requests", "company", resolvedCompanyId, status],
		queryFn: () =>
			getCompanyPaymentRequests(requireCompanyId(resolvedCompanyId), status),
		enabled: Boolean(resolvedCompanyId),
		staleTime: 30_000,
	});

	useEffect(() => {
		if (query.data?.data) {
			setCompanyRequests(query.data.data);
		}
	}, [query.data, setCompanyRequests]);

	return query;
}

export function useReviewCompanyPaymentRequest(companyId?: string) {
	const resolvedCompanyId = useResolvedCompanyId(companyId);
	const queryClient = useQueryClient();
	const upsertCompanyRequest = usePaymentRequestStore(
		(state) => state.upsertCompanyRequest,
	);

	return useMutation({
		mutationKey: ["payment-requests", "company", "review", resolvedCompanyId],
		mutationFn: ({
			requestId,
			payload,
		}: {
			requestId: string;
			payload: ReviewPaymentRequestPayload;
		}) =>
			reviewCompanyPaymentRequest(
				requireCompanyId(resolvedCompanyId),
				requestId,
				payload,
			),
		onSuccess: (response) => {
			upsertCompanyRequest(response.data);
			queryClient.invalidateQueries({
				queryKey: ["payment-requests", "company", resolvedCompanyId],
			});
			queryClient.invalidateQueries({
				queryKey: ["payment-requests", "me"],
			});
		},
	});
}

export function useMyPaymentRequests() {
	const setMyRequests = usePaymentRequestStore((state) => state.setMyRequests);

	const query = useQuery({
		queryKey: ["payment-requests", "me"],
		queryFn: getMyPaymentRequests,
		staleTime: 30_000,
	});

	useEffect(() => {
		if (query.data?.data) {
			setMyRequests(query.data.data);
		}
	}, [query.data, setMyRequests]);

	return query;
}

export function useCreateMyPaymentRequest() {
	const queryClient = useQueryClient();
	const upsertMyRequest = usePaymentRequestStore((state) => state.upsertMyRequest);

	return useMutation({
		mutationKey: ["payment-requests", "me", "create"],
		mutationFn: (payload: CreatePaymentRequestPayload) =>
			createMyPaymentRequest(payload),
		onSuccess: (response) => {
			upsertMyRequest(response.data);
			queryClient.invalidateQueries({
				queryKey: ["payment-requests", "me"],
			});
			queryClient.invalidateQueries({
				queryKey: ["payment-requests", "company"],
			});
		},
	});
}
