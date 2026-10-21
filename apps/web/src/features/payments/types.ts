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
