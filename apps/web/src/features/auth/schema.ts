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

// Types
export type SigninFormData = z.infer<typeof SigninSchema>;

export type ForgotPasswordFormData = z.infer<typeof ForgotPasswordSchema>;

export type SignupFormData = z.infer<typeof SignupSchema>;

export type ResetPasswordFormData = z.infer<typeof ResetPasswordSchema>;

export type ChangeVerificationEmailFormData = z.infer<
	typeof ChangeVerificationEmailSchema
>;
