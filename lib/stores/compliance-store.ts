import { create } from "zustand";
import { type ComplianceStats } from "@/services/stats.service";

interface ComplianceState {
	stats: ComplianceStats | null;
	setStats: (stats: ComplianceStats) => void;
	clearCompliance: () => void;
}

export const useComplianceStore = create<ComplianceState>()((set) => ({
	stats: null,
	setStats: (stats) => set({ stats }),
	clearCompliance: () => set({ stats: null }),
}));
