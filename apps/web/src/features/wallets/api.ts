import axios from "axios";
import { ApiError, axiosInstance } from "@/lib/api/client";
import { getStoredAuthHeaders } from "@/features/auth/session";
import { getWalletStats } from "@/features/stats/api";
import type { CompanyWalletListResponse, CompanyWalletResponse, MyWalletResponse, GenericWalletResponse, CreateCompanyWalletPayload, AddWalletTrustlinePayload, SetWalletPinPayload, ChangeWalletPinPayload, TransferFromWalletPayload } from "@/features/wallets/types";

export const COMPANY_WALLET_ENDPOINTS = {
	list: (companyId: string) => `/companies/${companyId}/wallets`,
	detail: (companyId: string, walletId: string) =>
		`/companies/${companyId}/wallets/${walletId}`,
	trustlines: (companyId: string, walletId: string) =>
		`/companies/${companyId}/wallets/${walletId}/trustlines`,
} as const;

export const MY_WALLET_ENDPOINTS = {
	detail: "/users/me/wallet",
	pin: "/users/me/wallet-pin",
	verifyPin: "/users/me/wallet-pin/verify",
	privateKey: "/users/me/wallet/private-key",
	transfer: "/users/me/wallet/transfer",
} as const;

function getAuthOptions(idempotencyKey?: string) {
	return {
		// Writes that move money or create things carry the key made when their dialog opened, so a
		// double submit or a replayed request can't run twice (lib/api/request.ts does this for `api.*`).
		headers: { ...getStoredAuthHeaders(), ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}) },
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

function normalizeWalletError(error: unknown): never {
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

export function getCompanyWalletStats(companyId: string) {
	return getWalletStats(companyId);
}

export function getCompanyWallets(companyId: string) {
	return axiosInstance.get<CompanyWalletListResponse>(
		COMPANY_WALLET_ENDPOINTS.list(companyId),
		getAuthOptions(),
	);
}

export async function createCompanyWallet(
	companyId: string,
	payload: CreateCompanyWalletPayload,
	idempotencyKey?: string,
) {
	try {
		return await axiosInstance.post<CompanyWalletResponse>(
			COMPANY_WALLET_ENDPOINTS.list(companyId),
			payload,
			getAuthOptions(idempotencyKey),
		);
	} catch (error) {
		normalizeWalletError(error);
	}
}

export function getCompanyWallet(companyId: string, walletId: string) {
	return axiosInstance.get<CompanyWalletResponse>(
		COMPANY_WALLET_ENDPOINTS.detail(companyId, walletId),
		getAuthOptions(),
	);
}

export async function addCompanyWalletTrustline(
	companyId: string,
	walletId: string,
	payload: AddWalletTrustlinePayload,
) {
	try {
		return await axiosInstance.post<CompanyWalletResponse>(
			COMPANY_WALLET_ENDPOINTS.trustlines(companyId, walletId),
			payload,
			getAuthOptions(),
		);
	} catch (error) {
		normalizeWalletError(error);
	}
}

export function getMyWallet() {
	return axiosInstance.get<MyWalletResponse>(
		MY_WALLET_ENDPOINTS.detail,
		getAuthOptions(),
	);
}

export function deleteMyWallet() {
	return axiosInstance.delete<GenericWalletResponse>(
		MY_WALLET_ENDPOINTS.detail,
		getAuthOptions(),
	);
}

export function setMyWalletPin(payload: SetWalletPinPayload) {
	return axiosInstance.post<GenericWalletResponse>(
		MY_WALLET_ENDPOINTS.pin,
		payload,
		getAuthOptions(),
	);
}

export function changeMyWalletPin(payload: ChangeWalletPinPayload) {
	return axiosInstance.patch<GenericWalletResponse>(
		MY_WALLET_ENDPOINTS.pin,
		payload,
		getAuthOptions(),
	);
}

export function verifyMyWalletPin(payload: SetWalletPinPayload) {
	return axiosInstance.post<GenericWalletResponse>(
		MY_WALLET_ENDPOINTS.verifyPin,
		payload,
		getAuthOptions(),
	);
}

export function getMyWalletPrivateKey() {
	return axiosInstance.get<
		GenericWalletResponse<string | Record<string, unknown>>
	>(MY_WALLET_ENDPOINTS.privateKey, getAuthOptions());
}

export function transferFromMyWallet(payload: TransferFromWalletPayload, idempotencyKey?: string) {
	return axiosInstance.post<GenericWalletResponse>(
		MY_WALLET_ENDPOINTS.transfer,
		payload,
		getAuthOptions(idempotencyKey),
	);
}

export function extractWalletPrivateKey(
	payload: string | Record<string, unknown> | null | undefined,
) {
	if (!payload) {
		return null;
	}

	if (typeof payload === "string") {
		return payload;
	}

	const candidates = ["private_key", "secret_key", "value"] as const;

	for (const key of candidates) {
		const value = payload[key];
		if (typeof value === "string" && value.trim()) {
			return value;
		}
	}

	return null;
}
