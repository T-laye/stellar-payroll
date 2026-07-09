"use client";

import { useMutation } from "@tanstack/react-query";
import { axiosInstance } from "@/config/axios";
import {
	ChangeVerificationEmailFormData,
	ForgotPasswordFormData,
	ResetPasswordFormData,
	SigninFormData,
	SignupFormData,
} from "@/lib/schemas";
import { useAuthStore } from "@/lib/stores/auth-store";
import { StoredAuthSession } from "@/lib/auth/session";

export const AUTH_ENDPOINTS = {
	SIGN_UP: "/auth/register",
	SIGN_IN: "/auth/login",
	ACCEPT_INVITE: "/auth/accept-invite",
	SEND_INVITE: "/auth/invite",
	CHANGE_PASSWORD: "/auth/change-password",
	FORGOT_PASSWORD: "/auth/forgot-password",
	RESET_PASSWORD: "/auth/reset-password",
	RESEND_VERIFICATION: "/auth/resend-verification",
	CHANGE_VERIFICATION_EMAIL: "/auth/change-verification-email",
	VERIFY_EMAIL: "/auth/verify-email",
	SIGN_OUT: "/auth/logout",
} as const;

export interface AuthSessionResponse {
	access_token?: string;
	pay_token?: string;
	verify_email_token?: string;
}

export interface AuthUserResponse {
	id?: string;
	email?: string;
	first_name?: string;
	last_name?: string;
	role_slug?: string;
	role_name?: string;
	company_id?: string;
	company_name?: string;
	company_slug?: string;
}

export interface AuthResponseData {
	company_id?: string;
	company_slug?: string;
	redirect_url?: string;
	session?: AuthSessionResponse;
	verify_email_token?: string;
	user?: AuthUserResponse;
}

export interface AuthResponse {
	statusCode?: number;
	message?: string;
	data?: AuthResponseData;
	user?: AuthUserResponse;
	token?: string;
}

// Service helper calls for Auth (unauthenticated)
export async function signIn(payload: SigninFormData) {
	const response = await axiosInstance.post<AuthResponse>(
		AUTH_ENDPOINTS.SIGN_IN,
		payload,
	);
	console.log(response, 'login', payload)
	return response.data;
}

export async function signup(payload: SignupFormData) {
	const response = await axiosInstance.post<AuthResponse>(
		AUTH_ENDPOINTS.SIGN_UP,
		payload,
	);
	return response.data;
}

export async function forgotPassword(payload: ForgotPasswordFormData) {
	const response = await axiosInstance.post<AuthResponse>(
		AUTH_ENDPOINTS.FORGOT_PASSWORD,
		payload,
	);
	return response.data;
}

export async function resetPassword(
	payload: ResetPasswordFormData & { token: string; email?: string },
) {
	const response = await axiosInstance.post<AuthResponse>(
		AUTH_ENDPOINTS.RESET_PASSWORD,
		payload,
	);
	return response.data;
}

export async function resendVerificationEmail(payload: { email: string }) {
	const response = await axiosInstance.post<AuthResponse>(
		AUTH_ENDPOINTS.RESEND_VERIFICATION,
		payload,
	);
	return response.data;
}

export async function changeVerificationEmail(
	payload: ChangeVerificationEmailFormData,
) {
	const response = await axiosInstance.patch<AuthResponse>(
		AUTH_ENDPOINTS.CHANGE_VERIFICATION_EMAIL,
		payload,
	);
	return response.data;
}

export async function verifyEmail(payload: { token: string; email?: string }) {
	const response = await axiosInstance.post<AuthResponse>(
		AUTH_ENDPOINTS.VERIFY_EMAIL,
		payload,
	);
	return response.data;
}

export async function signOut(session?: StoredAuthSession | null) {
	const headers: Record<string, string> = {};
	if (session?.access_token) {
		headers.Authorization = `Bearer ${session.access_token}`;
	}
	if (session?.pay_token) {
		headers["X-Pay-Token"] = session.pay_token;
	}
	const response = await axiosInstance.post<AuthResponse>(
		AUTH_ENDPOINTS.SIGN_OUT,
		undefined,
		{
			headers,
		},
	);
	return response.data;
}

// React Query Hooks
export function useLogin() {
	return useMutation({
		mutationKey: ["auth", "login"],
		mutationFn: (payload: SigninFormData) => signIn(payload),
		onSuccess: (response, variables) => {
			console.log(response, 'login')
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
	});
}
