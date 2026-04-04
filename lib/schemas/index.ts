import { z } from "zod";

// Auth Schemas
export const SigninSchema = z.object({
	email: z.string().email("Invalid email address"),
	password: z.string().min(6, "Password must be at least 6 characters"),
});

export const ForgotPasswordSchema = z.object({
	email: z.string().email("Invalid email address"),
});

export const SignupSchema = z
	.object({
		first_name: z.string().min(2, "First name must be at least 2 characters"),
		last_name: z.string().min(2, "Last name must be at least 2 characters"),
		company_name: z
			.string()
			.min(2, "Company name must be at least 2 characters"),
		company_country: z
			.string()
			.min(2, "Company country must be at least 2 characters"),
		company_slug: z
			.string()
			.min(3, "Company slug must be at least 3 characters")
			.max(50, "Company slug must be at most 50 characters"),
		company_timezone: z
			.string()
			.min(2, "Company timezone must be at least 2 characters"),
		email: z.string().email("Invalid email address"),
		password: z.string().min(8, "Password must be at least 8 characters"),
		confirmPassword: z.string(),
		role_slug: z.enum(["owner", "admin", "hr-manager"]),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords don't match",
		path: ["confirmPassword"],
	});

export const ResetPasswordSchema = z
	.object({
		password: z.string().min(6, "Password must be at least 6 characters"),
		confirmPassword: z.string(),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords don't match",
		path: ["confirmPassword"],
	});

export const ChangeVerificationEmailSchema = z.object({
	email: z.string().email("Invalid email address"),
});

// Employee Schemas
export const EmployeeSchema = z.object({
	first_name: z.string().min(2, "First name must be at least 2 characters"),
	last_name: z.string().min(2, "Last name must be at least 2 characters"),
	email: z.string().email("Invalid email address"),
	country: z.string().min(2, "Country is required"),
	department: z.string().min(2, "Department is required"),
	employment_type: z.enum([
		"FULL_TIME",
		"PART_TIME",
		"CONTRACT",
		"INTERN",
		"TEMPORARY",
	]),
	external_id: z.string().optional(),
	group_id: z.string().optional(),
	job_title: z.string().min(2, "Job title is required"),
	phone: z.string().min(7, "Phone number is required"),
	salary_amount: z.string().min(1, "Salary amount is required"),
	salary_currency: z
		.string()
		.min(3, "Currency code must be at least 3 letters"),
	start_date: z.string().date(),
	status: z.enum(["ACTIVE", "INACTIVE", "TERMINATED"]).optional(),
	end_date: z.string().optional(),
	role_slug: z.string().min(1, "Role is required"),
});

// Payroll Group Schemas
export const PayrollGroupSchema = z.object({
	name: z.string().min(3, "Name must be at least 3 characters"),
	description: z.string().min(2, "Description is required"),
	currency: z.string().min(3, "Currency code must be at least 3 characters"),
	pay_cycle: z.enum(["WEEKLY", "BIWEEKLY", "MONTHLY"]),
	timezone: z.string().min(2, "Timezone is required"),
});

export const PayrollRunSchema = z.object({
	group_id: z.string().min(1, "Payroll group is required"),
	currency: z.string().min(3, "Currency code must be at least 3 characters"),
	notes: z.string().optional(),
	period_start: z.string().date(),
	period_end: z.string().date(),
	scheduled_at: z.string().min(1, "Schedule is required"),
});

// Types
export type SigninFormData = z.infer<typeof SigninSchema>;
export type ForgotPasswordFormData = z.infer<typeof ForgotPasswordSchema>;
export type SignupFormData = z.infer<typeof SignupSchema>;
export type ResetPasswordFormData = z.infer<typeof ResetPasswordSchema>;
export type ChangeVerificationEmailFormData = z.infer<
	typeof ChangeVerificationEmailSchema
>;
export type EmployeeFormData = z.infer<typeof EmployeeSchema>;
export type PayrollGroupFormData = z.infer<typeof PayrollGroupSchema>;
export type PayrollRunFormData = z.infer<typeof PayrollRunSchema>;
