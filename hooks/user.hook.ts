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

function syncUserProfile(user: CurrentUserData) {
	useAuthStore.getState().setUserProfile(user);
}

export function useCurrentUser() {
	const session = useAuthStore((state) => state.session);
	const query = useQuery({
		queryKey: ["user", "me"],
		queryFn: getCurrentUser,
		enabled: Boolean(session?.access_token || session?.pay_token),
		staleTime: 60_000,
	});

	useEffect(() => {
		if (query.data?.data) {
			syncUserProfile(query.data.data);
		}
	}, [query.data]);

	return query;
}

export function useUpdateCurrentUser() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationKey: ["user", "update-me"],
		mutationFn: (payload: UpdateCurrentUserPayload) => updateCurrentUser(payload),
		onSuccess: (response) => {
			syncUserProfile(response.data);
			queryClient.setQueryData(["user", "me"], response);
		},
	});
}
