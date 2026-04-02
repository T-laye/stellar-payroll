import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
	AUTH_STORAGE_KEY,
	clearStoredAuthSession,
	StoredAuthSession,
} from "@/lib/auth/session";
import { signIn, signOut, type AuthResponse } from "@/services/auth.service";

export type UserRole = "owner" | "admin" | "hr-manager" | "viewer";

export interface User {
	id: string;
	email: string;
	name: string;
	role: UserRole;
	company?: string;
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
	login: (email: string, password: string) => Promise<void>;
	hydrateAuth: (response: AuthResponse, seed: AuthSeed) => void;
	logout: () => Promise<void>;
	updateProfile: (
		updates: Partial<Pick<User, "name" | "email" | "company">>,
	) => Promise<void>;
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

function buildName(seed: AuthSeed, user?: AuthResponse["user"]) {
	const firstName =
		user?.first_name?.trim() ||
		seed.first_name?.trim() ||
		seed.email.split("@")[0] ||
		"User";
	const lastName = user?.last_name?.trim() || seed.last_name?.trim() || "";

	return `${firstName} ${lastName}`.trim();
}

function buildUser(response: AuthResponse, seed: AuthSeed): User {
	const responseData = response.data;
	const responseUser = responseData?.user ?? response.user;
	const accessToken =
		responseData?.session?.access_token ?? response.token ?? null;
	const claims = decodeJwtPayload(accessToken);
	const role =
		(isUserRole(responseUser?.role_slug) && responseUser.role_slug) ||
		seed.role_slug ||
		"admin";

	return {
		id:
			responseUser?.id ||
			(typeof claims?.user_id === "string" ? claims.user_id : seed.email),
		email: responseUser?.email || seed.email,
		name: buildName(seed, responseUser),
		role,
		company:
			responseUser?.company_name ||
			seed.company_name ||
			responseData?.company_slug ||
			seed.company_slug,
	};
}

function buildSession(response: AuthResponse): StoredAuthSession | null {
	const responseData = response.data;
	const accessToken = responseData?.session?.access_token ?? response.token ?? null;
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
};

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

			updateProfile: async (updates) => {
				const { user } = get();

				if (!user) {
					throw new Error("Not authenticated");
				}

				if (updates.name !== undefined && updates.name.trim().length < 2) {
					throw new Error("Name must be at least 2 characters");
				}

				if (updates.email !== undefined && !updates.email.includes("@")) {
					throw new Error("Invalid email address");
				}

				set({
					user: {
						...user,
						...updates,
					},
				});
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
		},
	),
);
