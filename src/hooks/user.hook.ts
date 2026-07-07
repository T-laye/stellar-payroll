"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	getCurrentUser,
	updateCurrentUser,
	type CurrentUserData,
	type UpdateCurrentUserPayload,
} from "@/services/user.service";
import { useAuthStore } from "@/lib/stores/auth-store";
import { ApiError } from "@/lib/api/client";

function syncUserProfile(user: CurrentUserData) {
	useAuthStore.getState().setUserProfile(user);
}

export function useCurrentUser() {
	const session = useAuthStore((state) => state.session);
	const logout = useAuthStore((state) => state.logout);
	const query = useQuery({
		queryKey: ["user", "me"],
		queryFn: getCurrentUser,
		enabled: Boolean(session?.access_token || session?.pay_token),
		staleTime: 60_000,
		retry: (failureCount, error) => {
			// Don't retry on 401/403 errors (authentication/authorization failures)
			if (
				error instanceof ApiError &&
				(error.status === 401 || error.status === 403)
			) {
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
		if (query.error && query.error instanceof ApiError) {
			if (query.error.status === 401 || query.error.status === 403) {
				// Token is invalid or expired, logout the user
				logout();
			}
		}
	}, [query.error, logout]);

	return query;
}

export function useUpdateCurrentUser() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationKey: ["user", "update-me"],
		mutationFn: (payload: UpdateCurrentUserPayload) =>
			updateCurrentUser(payload),
		onSuccess: (response) => {
			syncUserProfile(response.data);
			queryClient.setQueryData(["user", "me"], response);
		},
	});
}
