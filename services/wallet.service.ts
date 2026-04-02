import { apiClient } from "@/lib/api/client";
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

export interface CreateCompanyWalletPayload extends Record<string, unknown> {
	secret_key: string;
	stellar_address: string;
	wallet_type: string;
}

export interface AddWalletTrustlinePayload extends Record<string, unknown> {
	asset_code: string;
	asset_issuer: string;
}

function getAuthOptions() {
	return {
		headers: getStoredAuthHeaders(),
	};
}

export function getCompanyWalletStats(companyId: string) {
	return getWalletStats(companyId);
}

export function getCompanyWallets(companyId: string) {
	return apiClient.get<CompanyWalletListResponse>(
		COMPANY_WALLET_ENDPOINTS.list(companyId),
		getAuthOptions(),
	);
}

export function createCompanyWallet(
	companyId: string,
	payload: CreateCompanyWalletPayload,
) {
	return apiClient.post<CompanyWalletResponse>(
		COMPANY_WALLET_ENDPOINTS.list(companyId),
		payload,
		getAuthOptions(),
	);
}

export function getCompanyWallet(companyId: string, walletId: string) {
	return apiClient.get<CompanyWalletResponse>(
		COMPANY_WALLET_ENDPOINTS.detail(companyId, walletId),
		getAuthOptions(),
	);
}

export function addCompanyWalletTrustline(
	companyId: string,
	walletId: string,
	payload: AddWalletTrustlinePayload,
) {
	return apiClient.post<CompanyWalletResponse>(
		COMPANY_WALLET_ENDPOINTS.trustlines(companyId, walletId),
		payload,
		getAuthOptions(),
	);
}
