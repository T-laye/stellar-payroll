import { create } from "zustand";
import {
	type ComplianceStats,
	type EmployeeStats,
	type OverviewStats,
	type PayrollStats,
	type TransactionStats,
	type WalletStats,
} from "@/services/stats.service";

interface StatsState {
	compliance: ComplianceStats | null;
	employees: EmployeeStats | null;
	overview: OverviewStats | null;
	payroll: PayrollStats | null;
	transactions: TransactionStats | null;
	wallets: WalletStats | null;
	setComplianceStats: (stats: ComplianceStats) => void;
	setEmployeeStats: (stats: EmployeeStats) => void;
	setOverviewStats: (stats: OverviewStats) => void;
	setPayrollStats: (stats: PayrollStats) => void;
	setTransactionStats: (stats: TransactionStats) => void;
	setWalletStats: (stats: WalletStats) => void;
	clearStats: () => void;
}

const initialState = {
	compliance: null,
	employees: null,
	overview: null,
	payroll: null,
	transactions: null,
	wallets: null,
};

export const useStatsStore = create<StatsState>()((set) => ({
	...initialState,
	setComplianceStats: (compliance) => set({ compliance }),
	setEmployeeStats: (employees) => set({ employees }),
	setOverviewStats: (overview) => set({ overview }),
	setPayrollStats: (payroll) => set({ payroll }),
	setTransactionStats: (transactions) => set({ transactions }),
	setWalletStats: (wallets) => set({ wallets }),
	clearStats: () => set(initialState),
}));
