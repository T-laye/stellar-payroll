import { create } from "zustand";
import { type Company } from "@/services/company.service";

interface CompanyState {
	company: Company | null;
	setCompany: (company: Company) => void;
	clearCompany: () => void;
}

export const useCompanyStore = create<CompanyState>()((set) => ({
	company: null,
	setCompany: (company) => set({ company }),
	clearCompany: () => set({ company: null }),
}));
