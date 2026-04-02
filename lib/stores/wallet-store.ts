import { create } from "zustand";
import { type WalletStats } from "@/services/stats.service";
import {
	type CompanyWallet,
	type CompanyWalletDetail,
} from "@/services/wallet.service";

interface WalletState {
	stats: WalletStats | null;
	wallets: CompanyWallet[];
	selectedWallet: CompanyWalletDetail | null;
	setStats: (stats: WalletStats) => void;
	setWallets: (wallets: CompanyWallet[]) => void;
	upsertWallet: (wallet: CompanyWallet | CompanyWalletDetail) => void;
	setSelectedWallet: (wallet: CompanyWalletDetail | null) => void;
	clearWallets: () => void;
}

export const useWalletStore = create<WalletState>()((set) => ({
	stats: null,
	wallets: [],
	selectedWallet: null,
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
	clearWallets: () =>
		set({
			stats: null,
			wallets: [],
			selectedWallet: null,
		}),
}));
