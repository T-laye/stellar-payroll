import { create } from "zustand";
import {
	type CompanyEmployee,
	type EmployeeWalletDetail,
} from "@/services/employee.service";

interface EmployeeState {
	employees: CompanyEmployee[];
	selectedEmployee: CompanyEmployee | null;
	employeeWallets: Record<string, EmployeeWalletDetail>;
	setEmployees: (employees: CompanyEmployee[]) => void;
	upsertEmployee: (employee: CompanyEmployee) => void;
	setSelectedEmployee: (employee: CompanyEmployee | null) => void;
	setEmployeeWallet: (employeeId: string, wallet: EmployeeWalletDetail) => void;
	getEmployee: (id: string) => CompanyEmployee | undefined;
	getEmployees: () => CompanyEmployee[];
	clearEmployees: () => void;
}

export const useEmployeeStore = create<EmployeeState>()((set, get) => ({
	employees: [],
	selectedEmployee: null,
	employeeWallets: {},
	setEmployees: (employees) => set({ employees }),
	upsertEmployee: (employee) =>
		set((state) => {
			const exists = state.employees.some((item) => item.id === employee.id);

			return {
				employees: exists
					? state.employees.map((item) =>
							item.id === employee.id ? { ...item, ...employee } : item,
						)
					: [employee, ...state.employees],
				selectedEmployee:
					state.selectedEmployee?.id === employee.id
						? { ...state.selectedEmployee, ...employee }
						: state.selectedEmployee,
			};
		}),
	setSelectedEmployee: (selectedEmployee) => set({ selectedEmployee }),
	setEmployeeWallet: (employeeId, wallet) =>
		set((state) => ({
			employeeWallets: {
				...state.employeeWallets,
				[employeeId]: wallet,
			},
		})),
	getEmployee: (id) => get().employees.find((employee) => employee.id === id),
	getEmployees: () => get().employees,
	clearEmployees: () =>
		set({
			employees: [],
			selectedEmployee: null,
			employeeWallets: {},
		}),
}));

export function getEmployeeDisplayName(
	employee?: Pick<CompanyEmployee, "first_name" | "last_name" | "email"> | null,
) {
	if (!employee) {
		return "Unknown";
	}

	const fullName = `${employee.first_name} ${employee.last_name}`.trim();
	return fullName || employee.email || "Unknown";
}

export function getEmployeeSalaryValue(
	employee?: Pick<CompanyEmployee, "salary_amount"> | null,
) {
	if (!employee?.salary_amount) {
		return 0;
	}

	const parsed = Number.parseFloat(employee.salary_amount);
	return Number.isNaN(parsed) ? 0 : parsed;
}

export function getEmployeeInitials(
	employee?: Pick<CompanyEmployee, "first_name" | "last_name" | "email"> | null,
) {
	if (!employee) {
		return "U";
	}

	const firstInitial = employee.first_name?.charAt(0) ?? "";
	const lastInitial = employee.last_name?.charAt(0) ?? "";
	const initials = `${firstInitial}${lastInitial}`.trim();
	return (initials || employee.email?.charAt(0) || "U").toUpperCase();
}
