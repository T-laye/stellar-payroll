"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { acceptInvitation, changeVerificationEmail, completeProfile, forgotPassword, getInvitations, leaveCompany, resetPassword, resendVerificationEmail, signIn, signup, switchCompany, verifyEmail } from "@/features/auth/api";
import { ChangeVerificationEmailFormData, ForgotPasswordFormData, ResetPasswordFormData, SigninFormData, SignupFormData } from "@/features/auth/schema";
import { useAuthStore } from "@/features/auth/store";

export function useLogin() {
	return useMutation({
		mutationKey: ["auth", "login"],
		mutationFn: (payload: SigninFormData & { company_id?: string }) => signIn(payload),
		onSuccess: (response, variables) => {
			useAuthStore.getState().hydrateAuth(response, {
				email: variables.email,
			});
		},
	});
}

/** Pending invites to other companies. A 403 means there is one, but this person's email isn't verified yet. */
export function useInvitations() {
	return useQuery({
		queryKey: ["auth", "invitations"],
		queryFn: getInvitations,
		staleTime: 5 * 60_000,
		retry: false,
	});
}

export function useAcceptInvitation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationKey: ["auth", "invitations", "accept"],
		mutationFn: (companyId: string) => acceptInvitation(companyId),
		onSuccess: (companies) => {
			if (companies?.length) useAuthStore.getState().setCompanies(companies);
			queryClient.invalidateQueries({ queryKey: ["auth", "invitations"] });
		},
	});
}

export function useLeaveCompany() {
	return useMutation({
		mutationKey: ["auth", "memberships", "leave"],
		mutationFn: (companyId: string) => leaveCompany(companyId),
	});
}

export function useSwitchCompany() {
	return useMutation({
		mutationKey: ["auth", "switch-company"],
		mutationFn: (companyId: string) => switchCompany(companyId),
		onSuccess: (response) => useAuthStore.getState().applyCompanySwitch(response),
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
