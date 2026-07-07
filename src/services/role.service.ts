import { apiClient } from "@/lib/api/client";
import { getStoredAuthHeaders } from "@/lib/auth/session";

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

function getAuthOptions() {
	return {
		headers: getStoredAuthHeaders(),
	};
}

export function getCompanyPermissions(companyId: string) {
	return apiClient.get<PermissionListResponse>(
		ROLE_ENDPOINTS.companyPermissions(companyId),
		getAuthOptions(),
	);
}

export function getUserPermissions(companyId: string, userId: string) {
	return apiClient.get<UserPermissionsResponse>(
		ROLE_ENDPOINTS.userPermissions(companyId, userId),
		getAuthOptions(),
	);
}

export function grantUserPermissions(
	companyId: string,
	userId: string,
	payload: PermissionOverridePayload,
) {
	return apiClient.post<UserPermissionsResponse>(
		ROLE_ENDPOINTS.grantUserPermissions(companyId, userId),
		payload,
		getAuthOptions(),
	);
}

export function revokeUserPermissions(
	companyId: string,
	userId: string,
	payload: PermissionOverridePayload,
) {
	return apiClient.post<UserPermissionsResponse>(
		ROLE_ENDPOINTS.revokeUserPermissions(companyId, userId),
		payload,
		getAuthOptions(),
	);
}

export function removePermissionOverride(
	companyId: string,
	userId: string,
	permission: string,
) {
	return apiClient.delete<UserPermissionsResponse>(
		ROLE_ENDPOINTS.removePermissionOverride(companyId, userId, permission),
		getAuthOptions(),
	);
}

export function getRoles(companyId: string) {
	return apiClient.get<RolesResponse>(ROLE_ENDPOINTS.roles(companyId), getAuthOptions());
}

export function createRole(companyId: string, payload: CreateRolePayload) {
	return apiClient.post<RoleResponse>(
		ROLE_ENDPOINTS.roles(companyId),
		payload,
		getAuthOptions(),
	);
}

export function getRole(companyId: string, roleId: string) {
	return apiClient.get<RoleResponse>(
		ROLE_ENDPOINTS.role(companyId, roleId),
		getAuthOptions(),
	);
}

export function updateRole(
	companyId: string,
	roleId: string,
	payload: UpdateRolePayload,
) {
	return apiClient.patch<RoleResponse>(
		ROLE_ENDPOINTS.role(companyId, roleId),
		payload,
		getAuthOptions(),
	);
}

export function deleteRole(companyId: string, roleId: string) {
	return apiClient.delete<void>(
		ROLE_ENDPOINTS.role(companyId, roleId),
		getAuthOptions(),
	);
}
