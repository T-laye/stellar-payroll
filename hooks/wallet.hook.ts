"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useWalletStore } from "@/lib/stores/wallet-store";
import {
	addCompanyWalletTrustline,
	createCompanyWallet,
	getCompanyWallet,
	getCompanyWallets,
	getCompanyWalletStats,
	type AddWalletTrustlinePayload,
	type CreateCompanyWalletPayload,
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

export function useCompanyWallet(companyId?: string) {
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
