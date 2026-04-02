import { create } from "zustand";
import { type PaymentRequest } from "@/services/payment-request.service";

interface PaymentRequestState {
	companyRequests: PaymentRequest[];
	myRequests: PaymentRequest[];
	setCompanyRequests: (requests: PaymentRequest[]) => void;
	setMyRequests: (requests: PaymentRequest[]) => void;
	upsertCompanyRequest: (request: PaymentRequest) => void;
	upsertMyRequest: (request: PaymentRequest) => void;
	clearPaymentRequests: () => void;
}

function upsertRequest(requests: PaymentRequest[], request: PaymentRequest) {
	return requests.some((item) => item.id === request.id)
		? requests.map((item) => (item.id === request.id ? request : item))
		: [request, ...requests];
}

export const usePaymentRequestStore = create<PaymentRequestState>()((set) => ({
	companyRequests: [],
	myRequests: [],
	setCompanyRequests: (companyRequests) => set({ companyRequests }),
	setMyRequests: (myRequests) => set({ myRequests }),
	upsertCompanyRequest: (request) =>
		set((state) => ({
			companyRequests: upsertRequest(state.companyRequests, request),
		})),
	upsertMyRequest: (request) =>
		set((state) => ({
			myRequests: upsertRequest(state.myRequests, request),
			companyRequests: upsertRequest(state.companyRequests, request),
		})),
	clearPaymentRequests: () =>
		set({
			companyRequests: [],
			myRequests: [],
		}),
}));
