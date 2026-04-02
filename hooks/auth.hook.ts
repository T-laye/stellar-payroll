"use client";

import { useMutation } from "@tanstack/react-query";
import {
	changeVerificationEmail,
	forgotPassword,
	resetPassword,
	resendVerificationEmail,
	signIn,
	signup,
	verifyEmail,
} from "@/services/auth.service";
import {
	ChangeVerificationEmailFormData,
	ForgotPasswordFormData,
	ResetPasswordFormData,
	SigninFormData,
	SignupFormData,
} from "@/lib/schemas";
import { useAuthStore } from "@/lib/stores/auth-store";

export function useLogin() {
	return useMutation({
		mutationKey: ["auth", "login"],
		mutationFn: (payload: SigninFormData) => signIn(payload),
		onSuccess: (response, variables) => {
			useAuthStore.getState().hydrateAuth(response, {
				email: variables.email,
			});
		},
	});
}

export function useSignup() {
	return useMutation({
		mutationKey: ["auth", "signup"],
		mutationFn: (payload: SignupFormData) => signup(payload),
		onSuccess: (response, variables) => {
			useAuthStore.getState().hydrateAuth(response, {
				email: variables.email,
				first_name: variables.first_name,
				last_name: variables.last_name,
				role_slug: variables.role_slug,
				company_name: variables.company_name,
				company_slug: variables.company_slug,
			});
		},
	});
}

export function useForgotPassword() {
	return useMutation({
		mutationKey: ["auth", "forgot-password"],
		mutationFn: (payload: ForgotPasswordFormData) => forgotPassword(payload),
	});
}

export function useResetPassword() {
	return useMutation({
		mutationKey: ["auth", "reset-password"],
		mutationFn: (
			payload: ResetPasswordFormData & { token: string; email?: string },
		) => resetPassword(payload),
	});
}

export function useResendVerificationEmail() {
	return useMutation({
		mutationKey: ["auth", "resend-verification-email"],
		mutationFn: (payload: { email: string }) =>
			resendVerificationEmail(payload),
	});
}

export function useChangeVerificationEmail() {
	return useMutation({
		mutationKey: ["auth", "change-verification-email"],
		mutationFn: (payload: ChangeVerificationEmailFormData) =>
			changeVerificationEmail(payload),
	});
}

export function useVerifyEmail() {
	return useMutation({
		mutationKey: ["auth", "verify-email"],
		mutationFn: (payload: { token: string; email?: string }) =>
			verifyEmail(payload),
		// onSuccess: (data) => {
		// 	// console.log("Email verification successful:", data);
		// },
	});
}
