import { axiosInstance } from "@/lib/api/client";
import { getStoredAuthHeaders } from "@/features/auth/session";
import type { CurrentUserResponse, UpdateCurrentUserPayload } from "@/features/user/types";

export const USER_ENDPOINTS = {
	ME: "/users/me",
	UPDATE_ME: "/users/me",
} as const;

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
