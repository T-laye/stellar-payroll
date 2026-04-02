import { apiClient } from "@/lib/api/client";
import {
	getStoredAuthHeaders,
	type StoredAuthSession,
} from "@/lib/auth/session";
import {
	ChangeVerificationEmailFormData,
	ForgotPasswordFormData,
	ResetPasswordFormData,
	SigninFormData,
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
	company_name?: string;
	company_slug?: string;
}

export interface AuthResponseData {
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

export function signIn(payload: SigninFormData) {
	return apiClient.post<AuthResponse>(AUTH_ENDPOINTS.SIGN_IN, payload);
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

export function signOut(session?: StoredAuthSession | null) {
	return apiClient.post<AuthResponse>(AUTH_ENDPOINTS.SIGN_OUT, undefined, {
		headers: getStoredAuthHeaders(session),
	});
}
