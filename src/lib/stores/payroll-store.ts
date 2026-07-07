import { create } from "zustand";
import {
	type PayrollGroup,
	type PayrollRun,
	type PayrollTransaction,
} from "@/services/payroll.service";

interface PayrollState {
	groups: PayrollGroup[];
	runs: PayrollRun[];
	schedule: PayrollRun[];
	selectedRun: PayrollRun | null;
	runTransactions: Record<string, PayrollTransaction[]>;
	setGroups: (groups: PayrollGroup[]) => void;
	upsertGroup: (group: PayrollGroup) => void;
	removeGroup: (groupId: string) => void;
	setRuns: (runs: PayrollRun[]) => void;
	upsertRun: (run: PayrollRun) => void;
	setSelectedRun: (run: PayrollRun | null) => void;
	setSchedule: (runs: PayrollRun[]) => void;
	setRunTransactions: (runId: string, transactions: PayrollTransaction[]) => void;
	clearPayroll: () => void;
}

export type Payment = PayrollTransaction;

export const usePayrollStore = create<PayrollState>()((set) => ({
	groups: [],
	runs: [],
	schedule: [],
	selectedRun: null,
	runTransactions: {},
	setGroups: (groups) => set({ groups }),
	upsertGroup: (group) =>
		set((state) => ({
			groups: state.groups.some((item) => item.id === group.id)
				? state.groups.map((item) => (item.id === group.id ? group : item))
				: [group, ...state.groups],
		})),
	removeGroup: (groupId) =>
		set((state) => ({
			groups: state.groups.filter((group) => group.id !== groupId),
		})),
	setRuns: (runs) => set({ runs }),
	upsertRun: (run) =>
		set((state) => ({
			runs: state.runs.some((item) => item.id === run.id)
				? state.runs.map((item) => (item.id === run.id ? run : item))
				: [run, ...state.runs],
			selectedRun:
				state.selectedRun?.id === run.id ? run : state.selectedRun,
		})),
	setSelectedRun: (selectedRun) => set({ selectedRun }),
	setSchedule: (schedule) => set({ schedule }),
	setRunTransactions: (runId, transactions) =>
		set((state) => ({
			runTransactions: {
				...state.runTransactions,
				[runId]: transactions,
			},
		})),
	clearPayroll: () =>
		set({
			groups: [],
			runs: [],
			schedule: [],
			selectedRun: null,
			runTransactions: {},
		}),
}));
