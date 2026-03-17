import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Employee {
  id: string;
  name: string;
  email: string;
  country: string;
  salary: number;
  currency: string;
  paymentMethod: 'bank_transfer' | 'stellar_wallet';
  walletAddress?: string;
  bankAccount?: string;
  status: 'active' | 'inactive';
  joinDate: string;
}

interface EmployeeState {
  employees: Employee[];
  addEmployee: (employee: Omit<Employee, 'id'>) => void;
  updateEmployee: (id: string, employee: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  getEmployee: (id: string) => Employee | undefined;
  getEmployees: () => Employee[];
}

export const useEmployeeStore = create<EmployeeState>()(
  persist(
    (set, get) => ({
      employees: [],

      addEmployee: (employee) => {
        const newEmployee: Employee = {
          ...employee,
          id: `emp_${Date.now()}`,
        };
        set((state) => ({
          employees: [...state.employees, newEmployee],
        }));
      },

      updateEmployee: (id, updates) => {
        set((state) => ({
          employees: state.employees.map((emp) =>
            emp.id === id ? { ...emp, ...updates } : emp
          ),
        }));
      },

      deleteEmployee: (id) => {
        set((state) => ({
          employees: state.employees.filter((emp) => emp.id !== id),
        }));
      },

      getEmployee: (id) => {
        return get().employees.find((emp) => emp.id === id);
      },

      getEmployees: () => {
        return get().employees;
      },
    }),
    {
      name: 'stellar_employees',
    }
  )
);
