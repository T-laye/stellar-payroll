import axios from "axios";
import { ApiError, axiosInstance } from "@/config/axios";
import { getStoredAuthHeaders } from "@/lib/auth/session";

export const PAYMENT_REQUEST_ENDPOINTS = {
	companyList: (companyId: string) =>
		`/companies/${companyId}/payment-requests`,
	companyReview: (companyId: string, requestId: string) =>
		`/companies/${companyId}/payment-requests/${requestId}`,
	myList: "/users/me/payment-requests",
	myCreate: "/users/me/payment-requests",
} as const;

export type PaymentRequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "PAID";

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

export type PaymentRequestCurrency = "USDC" | "XLM";

export interface CreatePaymentRequestPayload extends Record<string, unknown> {
	amount: string;
	currency: PaymentRequestCurrency;
	note: string;
}

export interface ReviewPaymentRequestPayload extends Record<string, unknown> {
	review_note: string;
	status: PaymentRequestStatus;
}

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
