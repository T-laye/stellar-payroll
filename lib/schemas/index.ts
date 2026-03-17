import { z } from 'zod';

// Auth Schemas
export const SigninSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const SignupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['admin', 'payroll-manager', 'viewer']),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Employee Schemas
export const EmployeeSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  country: z.string().min(2, 'Country is required'),
  salary: z.coerce.number().positive('Salary must be positive'),
  currency: z.string().length(3, 'Currency code must be 3 letters'),
  paymentMethod: z.enum(['bank_transfer', 'stellar_wallet']),
  walletAddress: z.string().optional(),
  bankAccount: z.string().optional(),
  status: z.enum(['active', 'inactive']),
  joinDate: z.string().date(),
}).refine((data) => {
  if (data.paymentMethod === 'stellar_wallet' && !data.walletAddress) {
    return false;
  }
  return true;
}, {
  message: 'Wallet address required for Stellar payment method',
  path: ['walletAddress'],
});

// Payroll Group Schemas
export const PayrollGroupSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().optional(),
  employees: z.array(z.string()).min(1, 'Select at least one employee'),
  frequency: z.enum(['weekly', 'biweekly', 'monthly']),
  dueDate: z.string().date(),
  currency: z.string().length(3, 'Currency code must be 3 letters'),
});

// Types
export type SigninFormData = z.infer<typeof SigninSchema>;
export type SignupFormData = z.infer<typeof SignupSchema>;
export type EmployeeFormData = z.infer<typeof EmployeeSchema>;
export type PayrollGroupFormData = z.infer<typeof PayrollGroupSchema>;
