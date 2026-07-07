"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/stores/auth-store";
import useAxiosAuth from "@/hooks/useAxiosAuth";

export const USER_ENDPOINTS = {
	ME: "/users/me",
	UPDATE_ME: "/user/me",
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

function syncUserProfile(user: CurrentUserData) {
	useAuthStore.getState().setUserProfile(user);
}

export function useCurrentUser() {
	const session = useAuthStore((state) => state.session);
	const logout = useAuthStore((state) => state.logout);
	const axiosAuth = useAxiosAuth();

	const query = useQuery({
		queryKey: ["user", "me"],
		queryFn: async () => {
			const res = await axiosAuth.get<CurrentUserResponse>(USER_ENDPOINTS.ME);
			return res.data;
		},
		enabled: Boolean(session?.access_token || session?.pay_token),
		staleTime: 60_000,
		retry: (failureCount, error: any) => {
			// Don't retry on 401/403 errors (authentication/authorization failures)
			if (error?.response?.status === 401 || error?.response?.status === 403) {
				return false;
			}
			// Retry other errors up to 2 times
			return failureCount < 2;
		},
	});

	useEffect(() => {
		if (query.data?.data) {
			syncUserProfile(query.data.data);
		}
	}, [query.data]);

	// Handle authentication errors by logging out
	useEffect(() => {
		if (query.error) {
			const status = (query.error as any)?.response?.status;
			if (status === 401 || status === 403) {
				// Token is invalid or expired, logout the user
				logout();
			}
		}
	}, [query.error, logout]);

	return query;
}

export function useUpdateCurrentUser() {
	const queryClient = useQueryClient();
	const axiosAuth = useAxiosAuth();

	return useMutation({
		mutationKey: ["user", "update-me"],
		mutationFn: async (payload: UpdateCurrentUserPayload) => {
			const res = await axiosAuth.patch<CurrentUserResponse>(USER_ENDPOINTS.UPDATE_ME, payload);
			return res.data;
		},
		onSuccess: (response) => {
			syncUserProfile(response.data);
			queryClient.setQueryData(["user", "me"], response);
		},
	});
}
