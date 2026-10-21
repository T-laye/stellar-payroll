import type { StatsResponse, WalletStats } from "@/features/stats/types";

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
