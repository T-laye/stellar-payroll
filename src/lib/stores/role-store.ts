import { create } from "zustand";
import {
	type PlatformPermission,
	type Role,
	type UserPermissionsData,
} from "@/services/role.service";

interface RoleState {
	permissions: PlatformPermission[];
	roles: Role[];
	selectedRole: Role | null;
	userPermissions: Record<string, UserPermissionsData>;
	setPermissions: (permissions: PlatformPermission[]) => void;
	setRoles: (roles: Role[]) => void;
	upsertRole: (role: Role) => void;
	removeRole: (roleId: string) => void;
	setSelectedRole: (role: Role | null) => void;
	setUserPermissions: (userId: string, permissions: UserPermissionsData) => void;
	clearRoleState: () => void;
	getRoleById: (roleId: string) => Role | undefined;
}

const initialState = {
	permissions: [],
	roles: [],
	selectedRole: null,
	userPermissions: {},
};

export const useRoleStore = create<RoleState>()((set, get) => ({
	...initialState,
	setPermissions: (permissions) => set({ permissions }),
	setRoles: (roles) => set({ roles }),
	upsertRole: (role) =>
		set((state) => {
			const existing = state.roles.find((item) => item.id === role.id);

			if (!existing) {
				return { roles: [...state.roles, role] };
			}

			return {
				roles: state.roles.map((item) => (item.id === role.id ? role : item)),
				selectedRole:
					state.selectedRole?.id === role.id ? role : state.selectedRole,
			};
		}),
	removeRole: (roleId) =>
		set((state) => ({
			roles: state.roles.filter((role) => role.id !== roleId),
			selectedRole:
				state.selectedRole?.id === roleId ? null : state.selectedRole,
		})),
	setSelectedRole: (selectedRole) => set({ selectedRole }),
	setUserPermissions: (userId, permissions) =>
		set((state) => ({
			userPermissions: {
				...state.userPermissions,
				[userId]: permissions,
			},
		})),
	clearRoleState: () => set(initialState),
	getRoleById: (roleId) => get().roles.find((role) => role.id === roleId),
}));
