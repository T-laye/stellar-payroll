"use client";

import { useMutation } from "@tanstack/react-query";
import { changeVerificationEmail, completeProfile, forgotPassword, resetPassword, resendVerificationEmail, signIn, signup, verifyEmail } from "@/features/auth/api";
import { ChangeVerificationEmailFormData, ForgotPasswordFormData, ResetPasswordFormData, SigninFormData, SignupFormData } from "@/features/auth/schema";
import { useAuthStore } from "@/features/auth/store";

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

/** Accepts an employee invite: sets the password and signs them straight in. */
export function useCompleteProfile() {
	return useMutation({
		mutationKey: ["auth", "complete-profile"],
		mutationFn: (payload: { token: string; password: string }) => completeProfile(payload),
		onSuccess: (response) => {
			if (response) useAuthStore.getState().hydrateAuth(response, { email: response.data?.user?.email ?? "" });
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
