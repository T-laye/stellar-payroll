import { apiClient } from "@/lib/api/client";
import { getStoredAuthHeaders } from "@/lib/auth/session";

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
	currency: string;
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

export function getCompanyPaymentRequests(
	companyId: string,
	status?: PaymentRequestStatus | "all",
) {
	return apiClient.get<PaymentRequestListResponse>(
		PAYMENT_REQUEST_ENDPOINTS.companyList(companyId),
		{
			...getAuthOptions(),
			query:
				status && status !== "all"
					? {
							status,
						}
					: undefined,
		},
	);
}

export function reviewCompanyPaymentRequest(
	companyId: string,
	requestId: string,
	payload: ReviewPaymentRequestPayload,
) {
	return apiClient.patch<PaymentRequestResponse>(
		PAYMENT_REQUEST_ENDPOINTS.companyReview(companyId, requestId),
		payload,
		getAuthOptions(),
	);
}

export function getMyPaymentRequests() {
	return apiClient.get<PaymentRequestListResponse>(
		PAYMENT_REQUEST_ENDPOINTS.myList,
		getAuthOptions(),
	);
}

export function createMyPaymentRequest(payload: CreatePaymentRequestPayload) {
	return apiClient.post<PaymentRequestResponse>(
		PAYMENT_REQUEST_ENDPOINTS.myCreate,
		payload,
		getAuthOptions(),
	);
}
