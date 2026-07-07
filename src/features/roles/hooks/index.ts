"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useRoleStore } from "@/lib/stores/role-store";
import useAxiosAuth from "@/hooks/useAxiosAuth";

export const ROLE_ENDPOINTS = {
	companyPermissions: (companyId: string) =>
		`/companies/${companyId}/permissions`,
	userPermissions: (companyId: string, userId: string) =>
		`/companies/${companyId}/users/${userId}/permissions`,
	grantUserPermissions: (companyId: string, userId: string) =>
		`/companies/${companyId}/users/${userId}/permissions/grant`,
	revokeUserPermissions: (companyId: string, userId: string) =>
		`/companies/${companyId}/users/${userId}/permissions/revoke`,
	removePermissionOverride: (
		companyId: string,
		userId: string,
		permission: string,
	) =>
		`/companies/${companyId}/users/${userId}/permissions/${encodeURIComponent(permission)}`,
	roles: (companyId: string) => `/companies/${companyId}/roles`,
	role: (companyId: string, roleId: string) =>
		`/companies/${companyId}/roles/${roleId}`,
} as const;

export type PlatformPermission = string;

export interface PermissionListResponse {
	data: PlatformPermission[];
	message: string;
	statusCode: number;
}

export interface UserPermissionOverride {
	company_id: string;
	created_at: string;
	granted_by: string;
	id: string;
	permission: PlatformPermission;
	type: "GRANT" | "REVOKE";
	user_id: string;
}

export interface UserPermissionsData {
	effective_permissions: PlatformPermission[];
	overrides: UserPermissionOverride[];
	role_id: string;
	role_name: string;
	role_permissions: PlatformPermission[];
	user_id: string;
}

export interface UserPermissionsResponse {
	data: UserPermissionsData;
	message: string;
	statusCode: number;
}

export interface PermissionOverridePayload extends Record<string, unknown> {
	permissions: PlatformPermission[];
}

export interface Role {
	id: string;
	company_id?: string;
	created_at: string;
	description: string;
	is_active: boolean;
	is_system: boolean;
	name: string;
	permissions: PlatformPermission[];
	slug: string;
	updated_at: string;
}

export interface RoleResponse {
	data: Role;
	message: string;
	statusCode: number;
}

export interface RolesResponse {
	data: Role[];
	message: string;
	statusCode: number;
}

export interface CreateRolePayload extends Record<string, unknown> {
	description: string;
	name: string;
	permissions: PlatformPermission[];
	slug: string;
}

export interface UpdateRolePayload extends Record<string, unknown> {
	description?: string;
	is_active?: boolean;
	name?: string;
	permissions?: PlatformPermission[];
}

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
	const axiosAuth = useAxiosAuth();

	const query = useQuery({
		queryKey: ["roles", "permissions", resolvedCompanyId],
		queryFn: async () => {
			const res = await axiosAuth.get<PermissionListResponse>(
				ROLE_ENDPOINTS.companyPermissions(requireCompanyId(resolvedCompanyId))
			);
			return res.data;
		},
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
	const axiosAuth = useAxiosAuth();

	const query = useQuery({
		queryKey: ["roles", "list", resolvedCompanyId],
		queryFn: async () => {
			const res = await axiosAuth.get<RolesResponse>(
				ROLE_ENDPOINTS.roles(requireCompanyId(resolvedCompanyId))
			);
			return res.data;
		},
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
	const axiosAuth = useAxiosAuth();

	const query = useQuery({
		queryKey: ["roles", "detail", resolvedCompanyId, roleId],
		queryFn: async () => {
			const res = await axiosAuth.get<RoleResponse>(
				ROLE_ENDPOINTS.role(requireCompanyId(resolvedCompanyId), roleId as string)
			);
			return res.data;
		},
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
	const axiosAuth = useAxiosAuth();

	return useMutation({
		mutationKey: ["roles", "create", resolvedCompanyId],
		mutationFn: async (payload: CreateRolePayload) => {
			const res = await axiosAuth.post<RoleResponse>(
				ROLE_ENDPOINTS.roles(requireCompanyId(resolvedCompanyId)),
				payload
			);
			return res.data;
		},
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
	const axiosAuth = useAxiosAuth();

	return useMutation({
		mutationKey: ["roles", "update", resolvedCompanyId, roleId],
		mutationFn: async (payload: UpdateRolePayload) => {
			const res = await axiosAuth.patch<RoleResponse>(
				ROLE_ENDPOINTS.role(requireCompanyId(resolvedCompanyId), roleId),
				payload
			);
			return res.data;
		},
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
	const axiosAuth = useAxiosAuth();

	return useMutation({
		mutationKey: ["roles", "delete", resolvedCompanyId],
		mutationFn: async (roleId: string) => {
			const res = await axiosAuth.delete<void>(
				ROLE_ENDPOINTS.role(requireCompanyId(resolvedCompanyId), roleId)
			);
			return res.data;
		},
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
	const axiosAuth = useAxiosAuth();

	const query = useQuery({
		queryKey: ["roles", "user-permissions", resolvedCompanyId, userId],
		queryFn: async () => {
			const res = await axiosAuth.get<UserPermissionsResponse>(
				ROLE_ENDPOINTS.userPermissions(requireCompanyId(resolvedCompanyId), userId as string)
			);
			return res.data;
		},
		enabled: Boolean(resolvedCompanyId && userId),
	});

	useEffect(() => {
		if (query.data?.data && userId) {
			setUserPermissions(userId, query.data.data);
		}
	}, [query.data, setUserPermissions, userId]);

	return query;
}

export function useGrantUserPermissions(companyId?: string) {
	const resolvedCompanyId = useResolvedCompanyId(companyId);
	const queryClient = useQueryClient();
	const setUserPermissions = useRoleStore((state) => state.setUserPermissions);
	const axiosAuth = useAxiosAuth();

	return useMutation({
		mutationKey: ["roles", "grant", resolvedCompanyId],
		mutationFn: async ({
			userId,
			payload,
		}: {
			userId: string;
			payload: PermissionOverridePayload;
		}) => {
			const res = await axiosAuth.post<UserPermissionsResponse>(
				ROLE_ENDPOINTS.grantUserPermissions(requireCompanyId(resolvedCompanyId), userId),
				payload
			);
			return res.data;
		},
		onSuccess: (response, variables) => {
			setUserPermissions(variables.userId, response.data);
			queryClient.setQueryData(
				["roles", "user-permissions", resolvedCompanyId, variables.userId],
				response,
			);
		},
	});
}

export function useRevokeUserPermissions(companyId?: string) {
	const resolvedCompanyId = useResolvedCompanyId(companyId);
	const queryClient = useQueryClient();
	const setUserPermissions = useRoleStore((state) => state.setUserPermissions);
	const axiosAuth = useAxiosAuth();

	return useMutation({
		mutationKey: ["roles", "revoke", resolvedCompanyId],
		mutationFn: async ({
			userId,
			payload,
		}: {
			userId: string;
			payload: PermissionOverridePayload;
		}) => {
			const res = await axiosAuth.post<UserPermissionsResponse>(
				ROLE_ENDPOINTS.revokeUserPermissions(requireCompanyId(resolvedCompanyId), userId),
				payload
			);
			return res.data;
		},
		onSuccess: (response, variables) => {
			setUserPermissions(variables.userId, response.data);
			queryClient.setQueryData(
				["roles", "user-permissions", resolvedCompanyId, variables.userId],
				response,
			);
		},
	});
}

export function useRemovePermissionOverride(companyId?: string) {
	const resolvedCompanyId = useResolvedCompanyId(companyId);
	const queryClient = useQueryClient();
	const setUserPermissions = useRoleStore((state) => state.setUserPermissions);
	const axiosAuth = useAxiosAuth();

	return useMutation({
		mutationKey: ["roles", "remove-override", resolvedCompanyId],
		mutationFn: async ({
			userId,
			permission,
		}: {
			userId: string;
			permission: string;
		}) => {
			const res = await axiosAuth.delete<UserPermissionsResponse>(
				ROLE_ENDPOINTS.removePermissionOverride(
					requireCompanyId(resolvedCompanyId),
					userId,
					permission
				)
			);
			return res.data;
		},
		onSuccess: (response, variables) => {
			setUserPermissions(variables.userId, response.data);
			queryClient.setQueryData(
				["roles", "user-permissions", resolvedCompanyId, variables.userId],
				response,
			);
		},
	});
}
