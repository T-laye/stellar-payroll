"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useWalletStore } from "@/lib/stores/wallet-store";
import {
	addCompanyWalletTrustline,
	changeMyWalletPin,
	createCompanyWallet,
	deleteMyWallet,
	extractWalletPrivateKey,
	getCompanyWallet,
	getCompanyWallets,
	getCompanyWalletStats,
	getMyWallet,
	getMyWalletPrivateKey,
	setMyWalletPin,
	transferFromMyWallet,
	verifyMyWalletPin,
	type AddWalletTrustlinePayload,
	type ChangeWalletPinPayload,
	type CreateCompanyWalletPayload,
	type SetWalletPinPayload,
	type TransferFromWalletPayload,
} from "@/services/wallet.service";

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

const WALLET_PIN_WINDOW_MS = 15 * 60 * 1000;

export function hasFreshWalletVerification(pinVerifiedAt?: string | null) {
	if (!pinVerifiedAt) {
		return false;
	}

	const verifiedAt = new Date(pinVerifiedAt).getTime();

	if (Number.isNaN(verifiedAt)) {
		return false;
	}

	return Date.now() - verifiedAt < WALLET_PIN_WINDOW_MS;
}

export function useCompanyWallet(companyId: string) {
	const resolvedCompanyId = useResolvedCompanyId(companyId);
	const setStats = useWalletStore((state) => state.setStats);

	const query = useQuery({
		queryKey: ["wallets", "stats", resolvedCompanyId],
		queryFn: () => getCompanyWalletStats(requireCompanyId(resolvedCompanyId)),
		enabled: Boolean(resolvedCompanyId),
		staleTime: 60_000,
	});

	useEffect(() => {
		if (query.data?.data) {
			setStats(query.data.data);
		}
	}, [query.data, setStats]);

	return query;
}

export function useCompanyWallets(companyId?: string) {
	const resolvedCompanyId = useResolvedCompanyId(companyId);
	const setWallets = useWalletStore((state) => state.setWallets);

	const query = useQuery({
		queryKey: ["wallets", "list", resolvedCompanyId],
		queryFn: () => getCompanyWallets(requireCompanyId(resolvedCompanyId)),
		enabled: Boolean(resolvedCompanyId),
		staleTime: 60_000,
	});

	useEffect(() => {
		if (query.data?.data) {
			setWallets(query.data.data);
		}
	}, [query.data, setWallets]);

	return query;
}

export function useCompanyWalletDetails(walletId?: string, companyId?: string) {
	const resolvedCompanyId = useResolvedCompanyId(companyId);
	const setSelectedWallet = useWalletStore((state) => state.setSelectedWallet);
	const upsertWallet = useWalletStore((state) => state.upsertWallet);

	const query = useQuery({
		queryKey: ["wallets", "detail", resolvedCompanyId, walletId],
		queryFn: () => getCompanyWallet(requireCompanyId(resolvedCompanyId), walletId as string),
		enabled: Boolean(resolvedCompanyId && walletId),
		staleTime: 30_000,
	});

	useEffect(() => {
		if (query.data?.data) {
			setSelectedWallet(query.data.data);
			upsertWallet(query.data.data);
		}
	}, [query.data, setSelectedWallet, upsertWallet]);

	return query;
}

export function useCreateCompanyWallet(companyId?: string) {
	const resolvedCompanyId = useResolvedCompanyId(companyId);
	const queryClient = useQueryClient();
	const upsertWallet = useWalletStore((state) => state.upsertWallet);
	const setSelectedWallet = useWalletStore((state) => state.setSelectedWallet);

	return useMutation({
		mutationKey: ["wallets", "create", resolvedCompanyId],
		mutationFn: (payload: CreateCompanyWalletPayload) =>
			createCompanyWallet(requireCompanyId(resolvedCompanyId), payload),
		onSuccess: (response) => {
			upsertWallet(response.data);
			setSelectedWallet(response.data);
			queryClient.invalidateQueries({
				queryKey: ["wallets", "list", resolvedCompanyId],
			});
			queryClient.invalidateQueries({
				queryKey: ["wallets", "stats", resolvedCompanyId],
			});
			queryClient.setQueryData(
				["wallets", "detail", resolvedCompanyId, response.data.id],
				response,
			);
		},
	});
}

export function useAddCompanyWalletTrustline(companyId?: string) {
	const resolvedCompanyId = useResolvedCompanyId(companyId);
	const queryClient = useQueryClient();
	const setSelectedWallet = useWalletStore((state) => state.setSelectedWallet);
	const upsertWallet = useWalletStore((state) => state.upsertWallet);

	return useMutation({
		mutationKey: ["wallets", "trustline", resolvedCompanyId],
		mutationFn: ({
			walletId,
			payload,
		}: {
			walletId: string;
			payload: AddWalletTrustlinePayload;
		}) =>
			addCompanyWalletTrustline(
				requireCompanyId(resolvedCompanyId),
				walletId,
				payload,
			),
		onSuccess: (response) => {
			setSelectedWallet(response.data);
			upsertWallet(response.data);
			queryClient.invalidateQueries({
				queryKey: ["wallets", "list", resolvedCompanyId],
			});
			queryClient.invalidateQueries({
				queryKey: ["wallets", "stats", resolvedCompanyId],
			});
			queryClient.setQueryData(
				["wallets", "detail", resolvedCompanyId, response.data.id],
				response,
			);
		},
	});
}

export function useMyWalletDetails(enabled = true) {
	const setMyWallet = useWalletStore((state) => state.setMyWallet);
	const pinVerifiedAt = useWalletStore((state) => state.pinVerifiedAt);
	const isVerified = hasFreshWalletVerification(pinVerifiedAt);

	const query = useQuery({
		queryKey: ["wallets", "me"],
		queryFn: getMyWallet,
		enabled: enabled && isVerified,
		staleTime: 30_000,
	});

	useEffect(() => {
		if (query.data?.data) {
			setMyWallet(query.data.data);
		}
	}, [query.data, setMyWallet]);

	return query;
}

export function useSetMyWalletPin() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationKey: ["wallets", "me", "pin", "set"],
		mutationFn: (payload: SetWalletPinPayload) => setMyWalletPin(payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["wallets", "me"] });
		},
	});
}

export function useChangeMyWalletPin() {
	const queryClient = useQueryClient();
	const clearMyWalletAccess = useWalletStore((state) => state.clearMyWalletAccess);

	return useMutation({
		mutationKey: ["wallets", "me", "pin", "change"],
		mutationFn: (payload: ChangeWalletPinPayload) => changeMyWalletPin(payload),
		onSuccess: () => {
			clearMyWalletAccess();
			queryClient.invalidateQueries({ queryKey: ["wallets", "me"] });
		},
	});
}

export function useVerifyMyWalletPin() {
	const queryClient = useQueryClient();
	const markPinVerified = useWalletStore((state) => state.markPinVerified);

	return useMutation({
		mutationKey: ["wallets", "me", "pin", "verify"],
		mutationFn: (payload: SetWalletPinPayload) => verifyMyWalletPin(payload),
		onSuccess: () => {
			markPinVerified();
			queryClient.invalidateQueries({ queryKey: ["wallets", "me"] });
		},
	});
}

export function useMyWalletPrivateKey(enabled = false) {
	const setMyPrivateKey = useWalletStore((state) => state.setMyPrivateKey);
	const pinVerifiedAt = useWalletStore((state) => state.pinVerifiedAt);
	const isVerified = hasFreshWalletVerification(pinVerifiedAt);

	const query = useQuery({
		queryKey: ["wallets", "me", "private-key"],
		queryFn: () => getMyWalletPrivateKey(),
		enabled: enabled && isVerified,
		staleTime: 0,
	});

	useEffect(() => {
		if (query.data?.data) {
			setMyPrivateKey(extractWalletPrivateKey(query.data.data));
		}
	}, [query.data, setMyPrivateKey]);

	return query;
}

export function useDeleteMyWallet() {
	const queryClient = useQueryClient();
	const clearMyWalletAccess = useWalletStore((state) => state.clearMyWalletAccess);

	return useMutation({
		mutationKey: ["wallets", "me", "delete"],
		mutationFn: deleteMyWallet,
		onSuccess: () => {
			clearMyWalletAccess();
			queryClient.removeQueries({ queryKey: ["wallets", "me"] });
			queryClient.removeQueries({ queryKey: ["wallets", "me", "private-key"] });
			queryClient.invalidateQueries({ queryKey: ["stats", "me"] });
		},
	});
}

export function useTransferFromMyWallet() {
	const queryClient = useQueryClient();
	const markPinVerified = useWalletStore((state) => state.markPinVerified);

	return useMutation({
		mutationKey: ["wallets", "me", "transfer"],
		mutationFn: (payload: TransferFromWalletPayload) => transferFromMyWallet(payload),
		onSuccess: () => {
			markPinVerified();
			queryClient.invalidateQueries({ queryKey: ["wallets", "me"] });
			queryClient.invalidateQueries({ queryKey: ["stats", "me"] });
		},
	});
}
