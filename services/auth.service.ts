import { apiClient } from "@/lib/api/client";
import {
	ChangeVerificationEmailFormData,
	ForgotPasswordFormData,
	ResetPasswordFormData,
	SignupFormData,
} from "@/lib/schemas";

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
	GET_USER: "/auth/me",
	SIGN_OUT: "/auth/logout",
} as const;

export interface AuthResponse {
	message?: string;
	data?: unknown;
	user?: unknown;
	token?: string;
}

export function signup(payload: SignupFormData) {
	return apiClient.post<AuthResponse>(AUTH_ENDPOINTS.SIGN_UP, payload);
}

export function forgotPassword(payload: ForgotPasswordFormData) {
	return apiClient.post<AuthResponse>(AUTH_ENDPOINTS.FORGOT_PASSWORD, payload);
}

export function resetPassword(
	payload: ResetPasswordFormData & { token: string; email?: string },
) {
	return apiClient.post<AuthResponse>(AUTH_ENDPOINTS.RESET_PASSWORD, payload);
}

export function resendVerificationEmail(payload: { email: string }) {
	return apiClient.post<AuthResponse>(AUTH_ENDPOINTS.RESEND_VERIFICATION, payload);
}

export function changeVerificationEmail(payload: ChangeVerificationEmailFormData) {
	return apiClient.patch<AuthResponse>(
		AUTH_ENDPOINTS.CHANGE_VERIFICATION_EMAIL,
		payload,
	);
}

export function verifyEmail(payload: { token: string; email?: string }) {
	return apiClient.post<AuthResponse>(AUTH_ENDPOINTS.VERIFY_EMAIL, payload);
}
