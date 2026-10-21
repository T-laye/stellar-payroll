import axios from "axios";
import { ApiError, axiosInstance } from "@/lib/api/client";
import { getStoredAuthHeaders } from "@/features/auth/session";
import type { PaymentRequestStatus, PaymentRequestListResponse, PaymentRequestResponse, CreatePaymentRequestPayload, ReviewPaymentRequestPayload } from "@/features/payments/types";

export const PAYMENT_REQUEST_ENDPOINTS = {
	companyList: (companyId: string) =>
		`/companies/${companyId}/payment-requests`,
	companyReview: (companyId: string, requestId: string) =>
		`/companies/${companyId}/payment-requests/${requestId}`,
	myList: "/users/me/payment-requests",
	myCreate: "/users/me/payment-requests",
} as const;

function getAuthOptions() {
	return {
		headers: getStoredAuthHeaders(),
	};
}

function getErrorMessage(data: unknown, fallback: string) {
	if (!data || typeof data !== "object") {
		return fallback;
	}

	const errorData = data as Record<string, unknown>;
	const message = errorData.message;
	const error = errorData.error;

	if (typeof message === "string" && message.trim()) {
		return message;
	}

	if (Array.isArray(message) && message.length > 0) {
		return message.filter(Boolean).join(", ");
	}

	if (typeof error === "string" && error.trim()) {
		return error;
	}

	return fallback;
}

function normalizePaymentRequestError(error: unknown): never {
	if (axios.isAxiosError(error)) {
		throw new ApiError(
			getErrorMessage(error.response?.data, error.message || "Request failed"),
			error.response?.status ?? 500,
			error.response?.data,
		);
	}

	if (error instanceof Error) {
		throw new ApiError(error.message, 500, error);
	}

	throw new ApiError("Request failed", 500, error);
}

export async function getCompanyPaymentRequests(
	companyId: string,
	status?: PaymentRequestStatus | "all",
) {
	const response = await axiosInstance.get<PaymentRequestListResponse>(
		PAYMENT_REQUEST_ENDPOINTS.companyList(companyId),
		{
			...getAuthOptions(),
			params:
				status && status !== "all"
					? {
							status,
						}
					: undefined,
		},
	);
	return response.data;
}

export async function reviewCompanyPaymentRequest(
	companyId: string,
	requestId: string,
	payload: ReviewPaymentRequestPayload,
) {
	try {
		const response = await axiosInstance.patch<PaymentRequestResponse>(
			PAYMENT_REQUEST_ENDPOINTS.companyReview(companyId, requestId),
			payload,
			getAuthOptions(),
		);
		return response.data;
	} catch (error) {
		normalizePaymentRequestError(error);
	}
}

export async function getMyPaymentRequests() {
	const response = await axiosInstance.get<PaymentRequestListResponse>(
		PAYMENT_REQUEST_ENDPOINTS.myList,
		getAuthOptions(),
	);
	return response.data;
}

export async function createMyPaymentRequest(
	payload: CreatePaymentRequestPayload,
) {
	try {
		const response = await axiosInstance.post<PaymentRequestResponse>(
			PAYMENT_REQUEST_ENDPOINTS.myCreate,
			payload,
			getAuthOptions(),
		);
		return response.data;
	} catch (error) {
		normalizePaymentRequestError(error);
	}
}
