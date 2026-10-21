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
