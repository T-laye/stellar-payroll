import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { type WalletStats } from "@/features/stats/types";
import { type CompanyWallet, type CompanyWalletDetail, type MyWalletDetail } from "@/features/wallets/types";

interface WalletState {
	stats: WalletStats | null;
	wallets: CompanyWallet[];
	selectedWallet: CompanyWalletDetail | null;
	myWallet: MyWalletDetail | null;
	myPrivateKey: string | null;
	pinVerifiedAt: string | null;
	setStats: (stats: WalletStats) => void;
	setWallets: (wallets: CompanyWallet[]) => void;
	upsertWallet: (wallet: CompanyWallet | CompanyWalletDetail) => void;
	setSelectedWallet: (wallet: CompanyWalletDetail | null) => void;
	setMyWallet: (wallet: MyWalletDetail | null) => void;
	setMyPrivateKey: (privateKey: string | null) => void;
	markPinVerified: (verifiedAt?: string) => void;
	clearMyWalletAccess: () => void;
	clearWallets: () => void;
}

export const useWalletStore = create<WalletState>()(persist((set) => ({
	stats: null,
	wallets: [],
	selectedWallet: null,
	myWallet: null,
	myPrivateKey: null,
	pinVerifiedAt: null,
	setStats: (stats) => set({ stats }),
	setWallets: (wallets) => set({ wallets }),
	upsertWallet: (wallet) =>
		set((state) => {
			const existingIndex = state.wallets.findIndex(
				(item) => item.id === wallet.id,
			);
			const nextWallets =
				existingIndex === -1
					? [wallet, ...state.wallets]
					: state.wallets.map((item) => (item.id === wallet.id ? wallet : item));

			return {
				wallets: nextWallets,
				selectedWallet:
					state.selectedWallet?.id === wallet.id &&
					"balances" in wallet
						? wallet
						: state.selectedWallet,
			};
		}),
	setSelectedWallet: (selectedWallet) => set({ selectedWallet }),
	setMyWallet: (myWallet) => set({ myWallet }),
	setMyPrivateKey: (myPrivateKey) => set({ myPrivateKey }),
	markPinVerified: (pinVerifiedAt = new Date().toISOString()) =>
		set({ pinVerifiedAt }),
	clearMyWalletAccess: () =>
		set({
			myWallet: null,
			myPrivateKey: null,
			pinVerifiedAt: null,
		}),
	clearWallets: () =>
		set({
			stats: null,
			wallets: [],
			selectedWallet: null,
			myWallet: null,
			myPrivateKey: null,
			pinVerifiedAt: null,
		}),
}), {
	name: "payorbit_wallet_access",
	storage: createJSONStorage(() => sessionStorage),
	// Only when the PIN was verified, so a reload keeps the API's 15-minute window. Never balances or keys.
	partialize: (state) => ({ pinVerifiedAt: state.pinVerifiedAt }),
}));
