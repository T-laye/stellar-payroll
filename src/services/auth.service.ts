import axios from "axios";
import { ApiError, axiosInstance } from "@/config/axios";
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

function getErrorMessage(data: unknown, fallback: string) {
	if (!data || typeof data !== "object") {
		return fallback;
	}

	const errorData = data as Record<string, unknown>;
	const message = errorData.message;

	if (typeof message === "string" && message.trim()) {
		return message;
	}

	return fallback;
}

function normalizeAuthError(error: unknown): never {
	if (axios.isAxiosError(error)) {
		throw new ApiError(
			getErrorMessage(error.response?.data, error.message || "Request failed"),
			error.response?.status ?? 500,
			error.response?.data,
		);
	}

	if (error instanceof Error) {
		throw new ApiError(error.message, 500, error);
	}

	throw new ApiError("Request failed", 500, error);
}

export async function signIn(payload: SigninFormData) {
	try {
		const response = await axiosInstance.post<AuthResponse>(
			AUTH_ENDPOINTS.SIGN_IN,
			payload,
		);
		return response.data;
	} catch (error) {
		normalizeAuthError(error);
	}
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
	const response = await axiosInstance.post<AuthResponse>(
		AUTH_ENDPOINTS.SIGN_OUT,
		undefined,
		{
			headers: getStoredAuthHeaders(session),
		},
	);
	return response.data;
}
