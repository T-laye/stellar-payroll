import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PayrollGroup {
  id: string;
  name: string;
  description: string;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  employees: string[]; // employee IDs
  dueDate: string;
  status: 'draft' | 'pending' | 'approved' | 'paid';
  totalAmount: number;
  currency: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  groupId: string;
  employeeId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  stellarTxHash?: string;
  createdAt: string;
  completedAt?: string;
}

interface PayrollState {
  groups: PayrollGroup[];
  payments: Payment[];
  addGroup: (group: Omit<PayrollGroup, 'id' | 'createdAt'>) => void;
  updateGroup: (id: string, group: Partial<PayrollGroup>) => void;
  deleteGroup: (id: string) => void;
  getGroup: (id: string) => PayrollGroup | undefined;
  getGroups: () => PayrollGroup[];
  addPayment: (payment: Omit<Payment, 'id' | 'createdAt'>) => void;
  updatePayment: (id: string, payment: Partial<Payment>) => void;
  getPaymentsByGroup: (groupId: string) => Payment[];
  getPaymentsByEmployee: (employeeId: string) => Payment[];
}

export const usePayrollStore = create<PayrollState>()(
  persist(
    (set, get) => ({
      groups: [],
      payments: [],

      addGroup: (group) => {
        const newGroup: PayrollGroup = {
          ...group,
          id: `group_${Date.now()}`,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          groups: [...state.groups, newGroup],
        }));
        return newGroup.id;
      },

      updateGroup: (id, updates) => {
        set((state) => ({
          groups: state.groups.map((group) =>
            group.id === id ? { ...group, ...updates } : group
          ),
        }));
      },

      deleteGroup: (id) => {
        set((state) => ({
          groups: state.groups.filter((group) => group.id !== id),
          payments: state.payments.filter((payment) => payment.groupId !== id),
        }));
      },

      getGroup: (id) => {
        return get().groups.find((group) => group.id === id);
      },

      getGroups: () => {
        return get().groups;
      },

      addPayment: (payment) => {
        const newPayment: Payment = {
          ...payment,
          id: `pay_${Date.now()}`,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          payments: [...state.payments, newPayment],
        }));
      },

      updatePayment: (id, updates) => {
        set((state) => ({
          payments: state.payments.map((payment) =>
            payment.id === id ? { ...payment, ...updates } : payment
          ),
        }));
      },

      getPaymentsByGroup: (groupId) => {
        return get().payments.filter((payment) => payment.groupId === groupId);
      },

      getPaymentsByEmployee: (employeeId) => {
        return get().payments.filter((payment) => payment.employeeId === employeeId);
      },
    }),
    {
      name: 'stellar_payroll',
    }
  )
);
