import axios from "axios";
import { ApiError, axiosInstance } from "@/lib/api/client";
import { getStoredAuthHeaders, type StoredAuthSession } from "@/features/auth/session";
import { ChangeVerificationEmailFormData, ForgotPasswordFormData, ResetPasswordFormData, SigninFormData, SignupFormData } from "@/features/auth/schema";
import type { AuthResponse } from "@/features/auth/types";

export const AUTH_ENDPOINTS = {
	SIGN_UP: "/auth/register",
	SIGN_IN: "/auth/login",
	/** An invited employee sets a password and gets a session (token from the invite email). */
	COMPLETE_PROFILE: "/auth/complete-profile",
	CHANGE_PASSWORD: "/auth/change-password",
	FORGOT_PASSWORD: "/auth/forgot-password",
	RESET_PASSWORD: "/auth/reset-password",
	RESEND_VERIFICATION: "/auth/resend-verification",
	CHANGE_VERIFICATION_EMAIL: "/auth/change-verification-email",
	VERIFY_EMAIL: "/auth/verify-email",
	SIGN_OUT: "/auth/logout",
} as const;

/** "an account with this email already exists" → "An account with this email already exists". */
const sentence = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

function getErrorMessage(data: unknown, fallback: string) {
	if (!data || typeof data !== "object") {
		return fallback;
	}

	const errorData = data as Record<string, unknown>;
	// 422s carry the specific reason in error.message ("lastname is required").
	const detail = errorData.error;
	if (detail && typeof detail === "object" && typeof (detail as { message?: unknown }).message === "string") {
		return (detail as { message: string }).message;
	}
	const message = errorData.message;

	if (typeof message === "string" && message.trim()) {
		return message;
	}

	return fallback;
}

function normalizeAuthError(error: unknown): never {
	if (axios.isAxiosError(error)) {
		throw new ApiError(
			sentence(getErrorMessage(error.response?.data, error.message || "Request failed")),
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
	try {
		const response = await axiosInstance.post<AuthResponse>(
			AUTH_ENDPOINTS.SIGN_UP,
			payload,
		);
		return response.data;
	} catch (error) {
		normalizeAuthError(error);
	}
}

export async function forgotPassword(payload: ForgotPasswordFormData) {
	try {
		const response = await axiosInstance.post<AuthResponse>(
			AUTH_ENDPOINTS.FORGOT_PASSWORD,
			payload,
		);
		return response.data;
	} catch (error) {
		normalizeAuthError(error);
	}
}

export async function resetPassword(
	payload: ResetPasswordFormData & { token: string; email?: string },
) {
	try {
		const response = await axiosInstance.post<AuthResponse>(
			AUTH_ENDPOINTS.RESET_PASSWORD,
			payload,
		);
		return response.data;
	} catch (error) {
		normalizeAuthError(error);
	}
}

export async function resendVerificationEmail(payload: { email: string }) {
	try {
		const response = await axiosInstance.post<AuthResponse>(
			AUTH_ENDPOINTS.RESEND_VERIFICATION,
			payload,
		);
		return response.data;
	} catch (error) {
		normalizeAuthError(error);
	}
}

export async function changeVerificationEmail(
	payload: ChangeVerificationEmailFormData,
) {
	try {
		const response = await axiosInstance.patch<AuthResponse>(
			AUTH_ENDPOINTS.CHANGE_VERIFICATION_EMAIL,
			payload,
		);
		return response.data;
	} catch (error) {
		normalizeAuthError(error);
	}
}

export async function verifyEmail(payload: { token: string; email?: string }) {
	try {
		const response = await axiosInstance.post<AuthResponse>(
			AUTH_ENDPOINTS.VERIFY_EMAIL,
			payload,
		);
		return response.data;
	} catch (error) {
		normalizeAuthError(error);
	}
}

export async function completeProfile(payload: { token: string; password: string }) {
	try {
		const response = await axiosInstance.post<AuthResponse>(AUTH_ENDPOINTS.COMPLETE_PROFILE, payload);
		return response.data;
	} catch (error) {
		normalizeAuthError(error);
	}
}

export async function signOut(session?: StoredAuthSession | null) {
	try {
		const response = await axiosInstance.post<AuthResponse>(
			AUTH_ENDPOINTS.SIGN_OUT,
			undefined,
			{
				headers: getStoredAuthHeaders(session),
			},
		);
		return response.data;
	} catch (error) {
		normalizeAuthError(error);
	}
}
