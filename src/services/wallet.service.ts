import axios from "axios";
import { ApiError, axiosInstance } from "@/config/axios";
import { getStoredAuthHeaders } from "@/lib/auth/session";
import {
	getWalletStats,
	type StatsResponse,
	type WalletStats,
} from "@/services/stats.service";

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

export type WalletStatsResponse = StatsResponse<WalletStats>;

export interface CompanyWallet {
	created_at: string;
	id: string;
	is_funded: boolean;
	network: string;
	owner_id: string;
	owner_type: string;
	stellar_address: string;
	updated_at: string;
	wallet_type: string;
}

export interface WalletBalance {
	amount: string;
	asset: string;
}

export interface CompanyWalletDetail extends CompanyWallet {
	balances: WalletBalance[];
}

export interface MyWalletDetail {
	balances: WalletBalance[];
	created_at: string;
	id: string;
	is_funded: boolean;
	network: string;
	owner_id: string;
	owner_type: string;
	stellar_address: string;
	updated_at: string;
	wallet_type: string;
}

export interface CompanyWalletListResponse {
	data: CompanyWallet[];
	message: string;
	statusCode: number;
}

export interface CompanyWalletResponse {
	data: CompanyWalletDetail;
	message: string;
	statusCode: number;
}

export interface MyWalletResponse {
	data: MyWalletDetail;
	message: string;
	statusCode: number;
}

export interface GenericWalletResponse<T = Record<string, unknown>> {
	data: T;
	message: string;
	statusCode: number;
}

export interface CreateCompanyWalletPayload extends Record<string, unknown> {
	secret_key?: string;
	stellar_address?: string;
	wallet_type: "OPERATIONAL" | "ESCROW" | "EXTERNAL";
}

export interface AddWalletTrustlinePayload extends Record<string, unknown> {
	asset_code: string;
	asset_issuer: string;
}

export interface SetWalletPinPayload extends Record<string, unknown> {
	pin: string;
}

export interface ChangeWalletPinPayload extends Record<string, unknown> {
	current_pin: string;
	new_pin: string;
}

export interface TransferFromWalletPayload extends Record<string, unknown> {
	amount: string;
	asset: string;
	destination: string;
	memo?: string;
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
) {
	try {
		return await axiosInstance.post<CompanyWalletResponse>(
			COMPANY_WALLET_ENDPOINTS.list(companyId),
			payload,
			getAuthOptions(),
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

export function transferFromMyWallet(payload: TransferFromWalletPayload) {
	return axiosInstance.post<GenericWalletResponse>(
		MY_WALLET_ENDPOINTS.transfer,
		payload,
		getAuthOptions(),
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
