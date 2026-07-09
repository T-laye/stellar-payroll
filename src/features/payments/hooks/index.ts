"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/stores/auth-store";
import { usePaymentRequestStore } from "@/lib/stores/payment-request-store";
import useAxiosAuth from "@/hooks/useAxiosAuth";

export const PAYMENT_REQUEST_ENDPOINTS = {
	companyList: (companyId: string) => `/companies/${companyId}/payment-requests`,
	companyReview: (companyId: string, requestId: string) =>
		`/companies/${companyId}/payment-requests/${requestId}`,
	myList: "/users/me/payment-requests",
	myCreate: "/users/me/payment-requests",
} as const;

export type PaymentRequestStatus =
	| "PENDING"
	| "APPROVED"
	| "REJECTED"
	| "PAID";
export type PaymentRequestCurrency = "USDC" | "XLM";

export interface PaymentRequest {
	amount: string;
	company_id: string;
	created_at: string;
	currency: string;
	employee_id: string;
	id: string;
	note: string;
	review_note: string | null;
	reviewed_by: string | null;
	status: PaymentRequestStatus;
	updated_at: string;
}

export interface PaymentRequestListResponse {
	data: PaymentRequest[];
	message: string;
	statusCode: number;
}

export interface PaymentRequestResponse {
	data: PaymentRequest;
	message: string;
	statusCode: number;
}

export interface CreatePaymentRequestPayload extends Record<string, unknown> {
	amount: string;
	currency: PaymentRequestCurrency;
	note: string;
}

export interface ReviewPaymentRequestPayload extends Record<string, unknown> {
	review_note: string;
	status: PaymentRequestStatus;
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

export function useCompanyPaymentRequests(
	status: PaymentRequestStatus | "all" = "all",
	companyId?: string,
) {
	const resolvedCompanyId = useResolvedCompanyId(companyId);
	const setCompanyRequests = usePaymentRequestStore(
		(state) => state.setCompanyRequests,
	);
	const axiosAuth = useAxiosAuth();

	const query = useQuery({
		queryKey: ["payment-requests", "company", resolvedCompanyId, status],
		queryFn: async () => {
			const res = await axiosAuth.get<PaymentRequestListResponse>(
				PAYMENT_REQUEST_ENDPOINTS.companyList(requireCompanyId(resolvedCompanyId)),
				{
					params: status && status !== "all" ? { status } : undefined,
				}
			);
			return res.data;
		},
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
	const axiosAuth = useAxiosAuth();

	return useMutation({
		mutationKey: ["payment-requests", "company", "review", resolvedCompanyId],
		mutationFn: async ({
			requestId,
			payload,
		}: {
			requestId: string;
			payload: ReviewPaymentRequestPayload;
		}) => {
			const res = await axiosAuth.patch<PaymentRequestResponse>(
				PAYMENT_REQUEST_ENDPOINTS.companyReview(
					requireCompanyId(resolvedCompanyId),
					requestId
				),
				payload
			);
			return res.data;
		},
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
	const axiosAuth = useAxiosAuth();

	const query = useQuery({
		queryKey: ["payment-requests", "me"],
		queryFn: async () => {
			const res = await axiosAuth.get<PaymentRequestListResponse>(
				PAYMENT_REQUEST_ENDPOINTS.myList
			);
			return res.data;
		},
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
	const axiosAuth = useAxiosAuth();

	return useMutation({
		mutationKey: ["payment-requests", "me", "create"],
		mutationFn: async (payload: CreatePaymentRequestPayload) => {
			const res = await axiosAuth.post<PaymentRequestResponse>(
				PAYMENT_REQUEST_ENDPOINTS.myCreate,
				payload
			);
			return res.data;
		},
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
