import { axiosInstance } from "@/lib/api/client";
import { getStoredAuthHeaders } from "@/features/auth/session";
import type { PermissionListResponse, UserPermissionsResponse, PermissionOverridePayload, RoleResponse, RolesResponse, CreateRolePayload, UpdateRolePayload } from "@/features/roles/types";

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

function getAuthOptions() {
	return {
		headers: getStoredAuthHeaders(),
	};
}

export async function getCompanyPermissions(companyId: string) {
	const response = await axiosInstance.get<PermissionListResponse>(
		ROLE_ENDPOINTS.companyPermissions(companyId),
		getAuthOptions(),
	);
	return response.data;
}

export async function getUserPermissions(companyId: string, userId: string) {
	const response = await axiosInstance.get<UserPermissionsResponse>(
		ROLE_ENDPOINTS.userPermissions(companyId, userId),
		getAuthOptions(),
	);
	return response.data;
}

export async function grantUserPermissions(
	companyId: string,
	userId: string,
	payload: PermissionOverridePayload,
) {
	const response = await axiosInstance.post<UserPermissionsResponse>(
		ROLE_ENDPOINTS.grantUserPermissions(companyId, userId),
		payload,
		getAuthOptions(),
	);
	return response.data;
}

export async function revokeUserPermissions(
	companyId: string,
	userId: string,
	payload: PermissionOverridePayload,
) {
	const response = await axiosInstance.post<UserPermissionsResponse>(
		ROLE_ENDPOINTS.revokeUserPermissions(companyId, userId),
		payload,
		getAuthOptions(),
	);
	return response.data;
}

export async function removePermissionOverride(
	companyId: string,
	userId: string,
	permission: string,
) {
	const response = await axiosInstance.delete<UserPermissionsResponse>(
		ROLE_ENDPOINTS.removePermissionOverride(companyId, userId, permission),
		getAuthOptions(),
	);
	return response.data;
}

export async function getRoles(companyId: string) {
	const response = await axiosInstance.get<RolesResponse>(
		ROLE_ENDPOINTS.roles(companyId),
		getAuthOptions(),
	);
	return response.data;
}

export async function createRole(
	companyId: string,
	payload: CreateRolePayload,
) {
	const response = await axiosInstance.post<RoleResponse>(
		ROLE_ENDPOINTS.roles(companyId),
		payload,
		getAuthOptions(),
	);
	return response.data;
}

export async function getRole(companyId: string, roleId: string) {
	const response = await axiosInstance.get<RoleResponse>(
		ROLE_ENDPOINTS.role(companyId, roleId),
		getAuthOptions(),
	);
	return response.data;
}

export async function updateRole(
	companyId: string,
	roleId: string,
	payload: UpdateRolePayload,
) {
	const response = await axiosInstance.patch<RoleResponse>(
		ROLE_ENDPOINTS.role(companyId, roleId),
		payload,
		getAuthOptions(),
	);
	return response.data;
}

export async function deleteRole(companyId: string, roleId: string) {
	const response = await axiosInstance.delete<void>(
		ROLE_ENDPOINTS.role(companyId, roleId),
		getAuthOptions(),
	);
	return response.data;
}
