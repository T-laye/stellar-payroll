import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
	AUTH_STORAGE_KEY,
	clearStoredAuthSession,
	StoredAuthSession,
} from "@/lib/auth/session";
import {
	signIn,
	signOut,
	type AuthResponse,
	type AuthUserResponse,
} from "@/services/auth.service";
import { type CurrentUserData } from "@/services/user.service";

export type UserRole = "owner" | "admin" | "hr-manager" | "viewer";

export interface User {
	id: string;
	email: string;
	first_name: string;
	last_name: string;
	permissions: string[];
	role_name: string;
	role_id?: string;
	company?: string;
	company_id?: string;
	created_at?: string;
	email_verified_at?: string | null;
	is_active?: boolean;
	last_login_at?: string | null;
}

export interface AuthSeed {
	email: string;
	first_name?: string;
	last_name?: string;
	role_slug?: UserRole;
	company_name?: string;
	company_slug?: string;
}

interface AuthState {
	user: User | null;
	session: StoredAuthSession | null;
	redirect_url: string | null;
	company_slug: string | null;
	isAuthenticated: boolean;
	_hydrated: boolean;
	login: (email: string, password: string) => Promise<void>;
	hydrateAuth: (response: AuthResponse, seed: AuthSeed) => void;
	setUserProfile: (user: CurrentUserData) => void;
	logout: () => Promise<void>;
	changePassword: (
		currentPassword: string,
		newPassword: string,
	) => Promise<void>;
}

const USER_ROLES = ["owner", "admin", "hr-manager", "viewer"] as const;

function isUserRole(value: unknown): value is UserRole {
	return (
		typeof value === "string" &&
		USER_ROLES.includes(value as (typeof USER_ROLES)[number])
	);
}

function toRoleName(value?: string | null) {
	if (!value) {
		return "Admin";
	}

	return value
		.replace(/-/g, " ")
		.split(" ")
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");
}

function decodeJwtPayload(token?: string | null) {
	if (!token) {
		return null;
	}

	const [, payload] = token.split(".");

	if (!payload) {
		return null;
	}

	try {
		const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
		const paddedPayload = normalizedPayload.padEnd(
			Math.ceil(normalizedPayload.length / 4) * 4,
			"=",
		);
		const decodedPayload =
			typeof globalThis.atob === "function"
				? globalThis.atob(paddedPayload)
				: Buffer.from(paddedPayload, "base64").toString("utf-8");

		return JSON.parse(decodedPayload) as Record<string, unknown>;
	} catch {
		return null;
	}
}

function getFallbackFirstName(seed: AuthSeed, user?: AuthUserResponse) {
	return (
		user?.first_name?.trim() ||
		seed.first_name?.trim() ||
		seed.email.split("@")[0] ||
		"User"
	);
}

function getFallbackLastName(seed: AuthSeed, user?: AuthUserResponse) {
	return user?.last_name?.trim() || seed.last_name?.trim() || "";
}

function getClaimsPermissions(claims: Record<string, unknown> | null) {
	const permissions = claims?.permissions;

	if (!Array.isArray(permissions)) {
		return [];
	}

	return permissions.filter(
		(permission): permission is string => typeof permission === "string",
	);
}

function buildUser(response: AuthResponse, seed: AuthSeed): User {
	const responseData = response.data;
	const responseUser = responseData?.user ?? response.user;
	const accessToken =
		responseData?.session?.access_token ?? response.token ?? null;
	const claims = decodeJwtPayload(accessToken);
	const roleSlug =
		(isUserRole(responseUser?.role_slug) && responseUser.role_slug) ||
		seed.role_slug ||
		null;

	return {
		id:
			responseUser?.id ||
			(typeof claims?.user_id === "string" ? claims.user_id : seed.email),
		email: responseUser?.email || seed.email,
		first_name: getFallbackFirstName(seed, responseUser),
		last_name: getFallbackLastName(seed, responseUser),
		permissions: getClaimsPermissions(claims),
		role_name: toRoleName(responseUser?.role_name ?? roleSlug),
		company:
			responseUser?.company_name ||
			seed.company_name ||
			responseData?.company_slug ||
			seed.company_slug,
	};
}

function mapCurrentUserToStoreUser(
	currentUser: CurrentUserData,
	existingUser: User | null,
): User {
	return {
		id: currentUser.id,
		email: currentUser.email,
		first_name: currentUser.first_name,
		last_name: currentUser.last_name,
		permissions: existingUser?.permissions ?? [],
		role_name: currentUser.role_name,
		role_id: currentUser.role_id,
		company: existingUser?.company,
		company_id: currentUser.company_id,
		created_at: currentUser.created_at,
		email_verified_at: currentUser.email_verified_at,
		is_active: currentUser.is_active,
		last_login_at: currentUser.last_login_at,
	};
}

function buildSession(response: AuthResponse): StoredAuthSession | null {
	const responseData = response.data;
	const accessToken =
		responseData?.session?.access_token ?? response.token ?? null;
	const payToken = responseData?.session?.pay_token ?? null;
	const verifyEmailToken =
		responseData?.session?.verify_email_token ??
		responseData?.verify_email_token ??
		null;

	if (!accessToken && !payToken && !verifyEmailToken) {
		return null;
	}

	return {
		access_token: accessToken,
		pay_token: payToken,
		verify_email_token: verifyEmailToken,
	};
}

const initialState = {
	user: null,
	session: null,
	redirect_url: null,
	company_slug: null,
	isAuthenticated: false,
	_hydrated: false,
};

export function getUserDisplayName(
	user: Pick<User, "first_name" | "last_name" | "email"> | null,
) {
	if (!user) {
		return "User";
	}

	const fullName = `${user.first_name} ${user.last_name}`.trim();

	return fullName || user.email || "User";
}

export function getUserPermissions(user: Pick<User, "permissions"> | null) {
	return user?.permissions ?? [];
}

export function hasPermission(
	user: Pick<User, "permissions"> | null,
	permission: string,
) {
	const permissions = getUserPermissions(user);

	return permissions.includes("*") || permissions.includes(permission);
}

export function hasAnyPermission(
	user: Pick<User, "permissions"> | null,
	permissions: string[],
) {
	return permissions.some((permission) => hasPermission(user, permission));
}

export const useAuthStore = create<AuthState>()(
	persist(
		(set, get) => ({
			...initialState,

			login: async (email: string, password: string) => {
				const response = await signIn({ email, password });
				get().hydrateAuth(response, { email });
			},

			hydrateAuth: (response, seed) => {
				const session = buildSession(response);
				const user = buildUser(response, seed);

				set({
					user,
					session,
					redirect_url: response.data?.redirect_url ?? null,
					company_slug:
						response.data?.company_slug ??
						response.data?.user?.company_slug ??
						seed.company_slug ??
						null,
					isAuthenticated: Boolean(
						user || session?.access_token || session?.pay_token,
					),
				});
			},

			setUserProfile: (currentUser) => {
				const existingUser = get().user;

				set({
					user: mapCurrentUserToStoreUser(currentUser, existingUser),
				});
			},

			logout: async () => {
				const session = get().session;

				try {
					if (session?.access_token || session?.pay_token) {
						await signOut(session);
					}
				} finally {
					clearStoredAuthSession();
					set(initialState);
				}
			},

			changePassword: async (currentPassword: string, newPassword: string) => {
				if (!currentPassword.trim()) {
					throw new Error("Current password is required");
				}

				if (newPassword.length < 6) {
					throw new Error("New password must be at least 6 characters");
				}

				if (currentPassword === newPassword) {
					throw new Error(
						"New password must be different from current password",
					);
				}
			},
		}),
		{
			name: AUTH_STORAGE_KEY,
			storage: createJSONStorage(() => sessionStorage),
			partialize: (state) => ({
				user: state.user,
				session: state.session,
				redirect_url: state.redirect_url,
				company_slug: state.company_slug,
				isAuthenticated: state.isAuthenticated,
			}),
			onRehydrateStorage: () => (state) => {
				if (state) {
					state._hydrated = true;
				}
			},
		},
	),
);
