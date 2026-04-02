"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useRoleStore } from "@/lib/stores/role-store";
import {
	createRole,
	deleteRole,
	getCompanyPermissions,
	getRole,
	getRoles,
	getUserPermissions,
	grantUserPermissions,
	removePermissionOverride,
	revokeUserPermissions,
	updateRole,
	type CreateRolePayload,
	type PermissionOverridePayload,
	type UpdateRolePayload,
} from "@/services/role.service";

function useResolvedCompanyId(companyId?: string) {
	const currentCompanyId = useAuthStore((state) => state.user?.company_id);
	return companyId ?? currentCompanyId ?? null;
}

function requireCompanyId(companyId: string | null) {
	if (!companyId) {
		throw new Error("Company ID is required");
	}

	return companyId;
}

export function useCompanyPermissions(companyId?: string) {
	const resolvedCompanyId = useResolvedCompanyId(companyId);
	const setPermissions = useRoleStore((state) => state.setPermissions);

	const query = useQuery({
		queryKey: ["roles", "permissions", resolvedCompanyId],
		queryFn: () => getCompanyPermissions(requireCompanyId(resolvedCompanyId)),
		enabled: Boolean(resolvedCompanyId),
		staleTime: 60_000,
	});

	useEffect(() => {
		if (query.data?.data) {
			setPermissions(query.data.data);
		}
	}, [query.data, setPermissions]);

	return query;
}

export function useCompanyRoles(companyId?: string) {
	const resolvedCompanyId = useResolvedCompanyId(companyId);
	const setRoles = useRoleStore((state) => state.setRoles);

	const query = useQuery({
		queryKey: ["roles", "list", resolvedCompanyId],
		queryFn: () => getRoles(requireCompanyId(resolvedCompanyId)),
		enabled: Boolean(resolvedCompanyId),
		staleTime: 60_000,
	});

	useEffect(() => {
		if (query.data?.data) {
			setRoles(query.data.data);
		}
	}, [query.data, setRoles]);

	return query;
}

export function useRoleDetails(roleId?: string, companyId?: string) {
	const resolvedCompanyId = useResolvedCompanyId(companyId);
	const setSelectedRole = useRoleStore((state) => state.setSelectedRole);

	const query = useQuery({
		queryKey: ["roles", "detail", resolvedCompanyId, roleId],
		queryFn: () =>
			getRole(requireCompanyId(resolvedCompanyId), roleId as string),
		enabled: Boolean(resolvedCompanyId && roleId),
	});

	useEffect(() => {
		if (query.data?.data) {
			setSelectedRole(query.data.data);
		}
	}, [query.data, setSelectedRole]);

	return query;
}

export function useCreateRole(companyId?: string) {
	const resolvedCompanyId = useResolvedCompanyId(companyId);
	const queryClient = useQueryClient();
	const upsertRole = useRoleStore((state) => state.upsertRole);

	return useMutation({
		mutationKey: ["roles", "create", resolvedCompanyId],
		mutationFn: (payload: CreateRolePayload) =>
			createRole(requireCompanyId(resolvedCompanyId), payload),
		onSuccess: (response) => {
			upsertRole(response.data);
			queryClient.invalidateQueries({
				queryKey: ["roles", "list", resolvedCompanyId],
			});
		},
	});
}

export function useUpdateRole(roleId: string, companyId?: string) {
	const resolvedCompanyId = useResolvedCompanyId(companyId);
	const queryClient = useQueryClient();
	const upsertRole = useRoleStore((state) => state.upsertRole);

	return useMutation({
		mutationKey: ["roles", "update", resolvedCompanyId, roleId],
		mutationFn: (payload: UpdateRolePayload) =>
			updateRole(requireCompanyId(resolvedCompanyId), roleId, payload),
		onSuccess: (response) => {
			upsertRole(response.data);
			queryClient.invalidateQueries({
				queryKey: ["roles", "list", resolvedCompanyId],
			});
			queryClient.setQueryData(
				["roles", "detail", resolvedCompanyId, roleId],
				response,
			);
		},
	});
}

export function useDeleteRole(companyId?: string) {
	const resolvedCompanyId = useResolvedCompanyId(companyId);
	const queryClient = useQueryClient();
	const removeRoleFromStore = useRoleStore((state) => state.removeRole);
	const setSelectedRole = useRoleStore((state) => state.setSelectedRole);

	return useMutation({
		mutationKey: ["roles", "delete", resolvedCompanyId],
		mutationFn: (roleId: string) =>
			deleteRole(requireCompanyId(resolvedCompanyId), roleId),
		onSuccess: (_, roleId) => {
			removeRoleFromStore(roleId);
			setSelectedRole(null);
			queryClient.invalidateQueries({
				queryKey: ["roles", "list", resolvedCompanyId],
			});
			queryClient.removeQueries({
				queryKey: ["roles", "detail", resolvedCompanyId, roleId],
			});
		},
	});
}

export function useUserPermissions(userId?: string, companyId?: string) {
	const resolvedCompanyId = useResolvedCompanyId(companyId);
	const setUserPermissions = useRoleStore((state) => state.setUserPermissions);

	const query = useQuery({
		queryKey: ["roles", "user-permissions", resolvedCompanyId, userId],
		queryFn: () =>
			getUserPermissions(requireCompanyId(resolvedCompanyId), userId as string),
		enabled: Boolean(resolvedCompanyId && userId),
	});

	useEffect(() => {
		if (query.data?.data && userId) {
			setUserPermissions(userId, query.data.data);
		}
	}, [query.data, setUserPermissions, userId]);

	return query;
}

function buildOverrideMutation(
	action: "grant" | "revoke",
	companyId: string | null,
	queryClient: ReturnType<typeof useQueryClient>,
	setUserPermissions: ReturnType<typeof useRoleStore.getState>["setUserPermissions"],
) {
	return {
		mutationKey: ["roles", action, companyId],
		mutationFn: ({
			userId,
			payload,
		}: {
			userId: string;
			payload: PermissionOverridePayload;
		}) =>
			action === "grant"
				? grantUserPermissions(requireCompanyId(companyId), userId, payload)
				: revokeUserPermissions(requireCompanyId(companyId), userId, payload),
		onSuccess: (
			response: Awaited<ReturnType<typeof grantUserPermissions>>,
			variables: { userId: string },
		) => {
			setUserPermissions(variables.userId, response.data);
			queryClient.setQueryData(
				["roles", "user-permissions", companyId, variables.userId],
				response,
			);
		},
	};
}

export function useGrantUserPermissions(companyId?: string) {
	const resolvedCompanyId = useResolvedCompanyId(companyId);
	const queryClient = useQueryClient();
	const setUserPermissions = useRoleStore((state) => state.setUserPermissions);

	return useMutation(
		buildOverrideMutation(
			"grant",
			resolvedCompanyId,
			queryClient,
			setUserPermissions,
		),
	);
}

export function useRevokeUserPermissions(companyId?: string) {
	const resolvedCompanyId = useResolvedCompanyId(companyId);
	const queryClient = useQueryClient();
	const setUserPermissions = useRoleStore((state) => state.setUserPermissions);

	return useMutation(
		buildOverrideMutation(
			"revoke",
			resolvedCompanyId,
			queryClient,
			setUserPermissions,
		),
	);
}

export function useRemovePermissionOverride(companyId?: string) {
	const resolvedCompanyId = useResolvedCompanyId(companyId);
	const queryClient = useQueryClient();
	const setUserPermissions = useRoleStore((state) => state.setUserPermissions);

	return useMutation({
		mutationKey: ["roles", "remove-override", resolvedCompanyId],
		mutationFn: ({
			userId,
			permission,
		}: {
			userId: string;
			permission: string;
		}) =>
			removePermissionOverride(
				requireCompanyId(resolvedCompanyId),
				userId,
				permission,
			),
		onSuccess: (response, variables) => {
			setUserPermissions(variables.userId, response.data);
			queryClient.setQueryData(
				["roles", "user-permissions", resolvedCompanyId, variables.userId],
				response,
			);
		},
	});
}
