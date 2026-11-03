import axios from "axios";
import { ApiError, axiosInstance } from "@/lib/api/client";
import { getStoredAuthHeaders, type StoredAuthSession } from "@/features/auth/session";
import { ChangeVerificationEmailFormData, ForgotPasswordFormData, ResetPasswordFormData, SigninFormData, SignupFormData } from "@/features/auth/schema";
import type { AuthResponse, CompanyMembership } from "@/features/auth/types";

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
	INVITATIONS: "/auth/invitations",
	ACCEPT_INVITATION: "/auth/invitations/accept",
	SWITCH_COMPANY: "/auth/switch-company",
	MEMBERSHIPS: "/auth/memberships",
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

export async function signIn(payload: SigninFormData & { company_id?: string }) {
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

export async function changePassword(payload: { current_password: string; new_password: string }) {
	try {
		await axiosInstance.patch(AUTH_ENDPOINTS.CHANGE_PASSWORD, payload, { headers: getStoredAuthHeaders() });
	} catch (error) {
		normalizeAuthError(error);
	}
}

/** Pending invites from other companies, sent to the signed-in person's email. */
export async function getInvitations() {
	try {
		const response = await axiosInstance.get<{ data: CompanyMembership[] | null }>(AUTH_ENDPOINTS.INVITATIONS, {
			headers: getStoredAuthHeaders(),
		});
		return response.data.data ?? [];
	} catch (error) {
		normalizeAuthError(error);
	}
}

/** Joins the company without a new password and returns the person's updated memberships. */
export async function acceptInvitation(companyId: string) {
	try {
		const response = await axiosInstance.post<{ data: CompanyMembership[] | { companies?: CompanyMembership[] } | null }>(
			AUTH_ENDPOINTS.ACCEPT_INVITATION,
			{ company_id: companyId },
			{ headers: getStoredAuthHeaders() },
		);
		const data = response.data.data;
		return Array.isArray(data) ? data : (data?.companies ?? []);
	} catch (error) {
		normalizeAuthError(error);
	}
}

/** Ends the person's membership and returns the ones left. Leaving the current company also ends this session. */
export async function leaveCompany(companyId: string) {
	try {
		const response = await axiosInstance.delete<{ data: CompanyMembership[] | null }>(`${AUTH_ENDPOINTS.MEMBERSHIPS}/${companyId}`, {
			headers: getStoredAuthHeaders(),
		});
		return response.data.data ?? [];
	} catch (error) {
		normalizeAuthError(error);
	}
}

/** Ends the calling session and returns a new one for that company: the caller must keep the new tokens. */
export async function switchCompany(companyId: string) {
	try {
		const response = await axiosInstance.post<AuthResponse>(
			AUTH_ENDPOINTS.SWITCH_COMPANY,
			{ company_id: companyId },
			{ headers: getStoredAuthHeaders() },
		);
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
