import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UserRole = "owner" | "admin" | "hr-manager" | "viewer";

export interface User {
	id: string;
	email: string;
	first_name: string;
	last_name: string;
	role_slug: UserRole;
	company_country: string;
	company_name: string;
	company_slug: string;
	company_timezone: string;
	password: string;
}

interface AuthState {
	user: User | null;
	isLoading: boolean;
	error: string | null;
	login: (email: string, password: string) => Promise<void>;
	signup: (
		email: string,
		password: string,
		name: string,
		company: string,
	) => Promise<void>;
	logout: () => void;
	clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
	persist(
		(set) => ({
			user: null,
			isLoading: false,
			error: null,
			login: async (email: string, password: string) => {
				set({ isLoading: true, error: null });
				try {
					// Mock authentication
					await new Promise((resolve) => setTimeout(resolve, 500));

					// Simulate user login
					const user: User = {
						id: `user_${Date.now()}`,
						email,
						first_name: email.split("@")[0],
						last_name: "User",
						role_slug: "admin",
						company_country: "Nigeria",
						company_name: "Acme Corp",
						company_slug: "acme-corp",
						company_timezone: "Africa/Lagos",
						password,
					};

					set({ user, isLoading: false });
				} catch (error) {
					set({
						error: error instanceof Error ? error.message : "Login failed",
						isLoading: false,
					});
					throw error;
				}
			},
			signup: async (
				email: string,
				password: string,
				name: string,
				company: string,
			) => {
				set({ isLoading: true, error: null });
				try {
					await new Promise((resolve) => setTimeout(resolve, 500));

					const user: User = {
						id: `user_${Date.now()}`,
						email,
						first_name: name,
						last_name: "",
						role_slug: "admin",
						company_country: "Nigeria",
						company_name: company,
						company_slug: company.toLowerCase().replace(/\s+/g, "-"),
						company_timezone: "Africa/Lagos",
						password,
					};

					set({ user, isLoading: false });
				} catch (error) {
					set({
						error: error instanceof Error ? error.message : "Signup failed",
						isLoading: false,
					});
					throw error;
				}
			},
			logout: () => {
				set({ user: null });
			},
			clearError: () => set({ error: null }),
		}),
		{
			name: "auth-store",
			partialize: (state) => ({ user: state.user }),
		},
	),
);
