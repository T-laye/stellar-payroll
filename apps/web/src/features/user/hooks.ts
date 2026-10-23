"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCurrentUser, updateCurrentUser } from "@/features/user/api";
import { type CurrentUserData, type UpdateCurrentUserPayload } from "@/features/user/types";
import { useAuthStore } from "@/features/auth/store";
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
		// 401 = the session ended (handled centrally); 403 = no permission. Neither improves with a retry.
		retry: (failureCount, error) => !(error instanceof ApiError && (error.status === 401 || error.status === 403)) && failureCount < 2,
	});

	useEffect(() => {
		if (query.data?.data) {
			syncUserProfile(query.data.data);
		}
	}, [query.data]);

	// Only a 401 ends the session; a 403 is a permission answer, not a sign-out.
	useEffect(() => {
		if (query.error instanceof ApiError && query.error.status === 401) logout();
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
