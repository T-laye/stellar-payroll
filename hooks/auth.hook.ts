"use client";

import { useMutation } from "@tanstack/react-query";
import {
	changeVerificationEmail,
	forgotPassword,
	resetPassword,
	resendVerificationEmail,
	signup,
	verifyEmail,
} from "@/services/auth.service";
import {
	ChangeVerificationEmailFormData,
	ForgotPasswordFormData,
	ResetPasswordFormData,
	SignupFormData,
} from "@/lib/schemas";

export function useSignup() {
	return useMutation({
		mutationKey: ["auth", "signup"],
		mutationFn: (payload: SignupFormData) => signup(payload),
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
		mutationFn: (payload: { email: string }) => resendVerificationEmail(payload),
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
	});
}
