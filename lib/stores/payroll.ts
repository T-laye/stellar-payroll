import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Employee {
  id: string;
  name: string;
  email: string;
  walletAddress: string;
  country: string;
  salary: number;
  currency: string;
  status: 'active' | 'inactive';
  joinDate: string;
}

export interface PayrollGroup {
  id: string;
  name: string;
  description: string;
  employeeIds: string[];
  paymentFrequency: 'weekly' | 'biweekly' | 'monthly';
  nextPaymentDate: string;
  totalAmount: number;
}

export interface Payment {
  id: string;
  payrollGroupId: string;
  employeeId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  transactionHash?: string;
  createdAt: string;
  completedAt?: string;
}

interface PayrollState {
  employees: Employee[];
  payrollGroups: PayrollGroup[];
  payments: Payment[];
  addEmployee: (employee: Employee) => void;
  updateEmployee: (id: string, employee: Partial<Employee>) => void;
  removeEmployee: (id: string) => void;
  addPayrollGroup: (group: PayrollGroup) => void;
  updatePayrollGroup: (id: string, group: Partial<PayrollGroup>) => void;
  removePayrollGroup: (id: string) => void;
  addPayment: (payment: Payment) => void;
  updatePaymentStatus: (id: string, status: Payment['status']) => void;
  getPaymentsByGroup: (groupId: string) => Payment[];
  getEmployeeById: (id: string) => Employee | undefined;
  getGroupById: (id: string) => PayrollGroup | undefined;
}

// Mock initial data
const mockEmployees: Employee[] = [
  {
    id: 'emp_1',
    name: 'Alice Johnson',
    email: 'alice@example.com',
    walletAddress: 'GCZXWBHRXVLUU5APHYLRQ...',
    country: 'US',
    salary: 5000,
    currency: 'USD',
    status: 'active',
    joinDate: '2023-01-15',
  },
  {
    id: 'emp_2',
    name: 'Bob Smith',
    email: 'bob@example.com',
    walletAddress: 'GDZXWBHRXVLUU5APHYLRQ...',
    country: 'UK',
    salary: 4500,
    currency: 'GBP',
    status: 'active',
    joinDate: '2023-02-20',
  },
];

const mockPayrollGroups: PayrollGroup[] = [
  {
    id: 'group_1',
    name: 'Engineering Team',
    description: 'Monthly payroll for engineering department',
    employeeIds: ['emp_1', 'emp_2'],
    paymentFrequency: 'monthly',
    nextPaymentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    totalAmount: 9500,
  },
];

export const usePayrollStore = create<PayrollState>()(
  persist(
    (set, get) => ({
      employees: mockEmployees,
      payrollGroups: mockPayrollGroups,
      payments: [],
      addEmployee: (employee) =>
        set((state) => ({
          employees: [...state.employees, employee],
        })),
      updateEmployee: (id, updates) =>
        set((state) => ({
          employees: state.employees.map((emp) =>
            emp.id === id ? { ...emp, ...updates } : emp
          ),
        })),
      removeEmployee: (id) =>
        set((state) => ({
          employees: state.employees.filter((emp) => emp.id !== id),
        })),
      addPayrollGroup: (group) =>
        set((state) => ({
          payrollGroups: [...state.payrollGroups, group],
        })),
      updatePayrollGroup: (id, updates) =>
        set((state) => ({
          payrollGroups: state.payrollGroups.map((group) =>
            group.id === id ? { ...group, ...updates } : group
          ),
        })),
      removePayrollGroup: (id) =>
        set((state) => ({
          payrollGroups: state.payrollGroups.filter((group) => group.id !== id),
        })),
      addPayment: (payment) =>
        set((state) => ({
          payments: [...state.payments, payment],
        })),
      updatePaymentStatus: (id, status) =>
        set((state) => ({
          payments: state.payments.map((payment) =>
            payment.id === id
              ? {
                  ...payment,
                  status,
                  completedAt: status === 'completed' ? new Date().toISOString() : undefined,
                }
              : payment
          ),
        })),
      getPaymentsByGroup: (groupId) => {
        return get().payments.filter((p) => p.payrollGroupId === groupId);
      },
      getEmployeeById: (id) => {
        return get().employees.find((emp) => emp.id === id);
      },
      getGroupById: (id) => {
        return get().payrollGroups.find((group) => group.id === id);
      },
    }),
    {
      name: 'payroll-store',
    }
  )
);
