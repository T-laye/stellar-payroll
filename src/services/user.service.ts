import { axiosInstance } from "@/config/axios";
import { getStoredAuthHeaders } from "@/lib/auth/session";

export const USER_ENDPOINTS = {
	ME: "/users/me",
	UPDATE_ME: "/users/me",
} as const;

export interface CurrentUserData {
	company_id: string;
	created_at: string;
	email: string;
	email_verified_at: string | null;
	first_name: string;
	id: string;
	is_active: boolean;
	last_login_at: string | null;
	last_name: string;
	role_id: string;
	role_name: string;
}

export interface CurrentUserResponse {
	data: CurrentUserData;
	message: string;
	statusCode: number;
}

export interface UpdateCurrentUserPayload extends Record<string, unknown> {
	first_name: string;
	last_name: string;
}

export async function getCurrentUser() {
	const response = await axiosInstance.get<CurrentUserResponse>(
		USER_ENDPOINTS.ME,
		{
			headers: getStoredAuthHeaders(),
		},
	);
	return response.data;
}

export async function updateCurrentUser(payload: UpdateCurrentUserPayload) {
	const response = await axiosInstance.patch<CurrentUserResponse>(
		USER_ENDPOINTS.UPDATE_ME,
		payload,
		{
			headers: getStoredAuthHeaders(),
		},
	);
	return response.data;
}
