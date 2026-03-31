import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UserRole = "admin" | "payroll-manager" | "viewer";

export interface User {
	id: string;
	email: string;
	name: string;
	role: UserRole;
	company?: string;
}

interface AuthState {
	user: User | null;
	isAuthenticated: boolean;
	login: (email: string, password: string) => Promise<void>;
	signup: (
		email: string,
		password: string,
		name: string,
		role: UserRole,
	) => Promise<void>;
	logout: () => void;
	updateProfile: (
		updates: Partial<Pick<User, "name" | "email" | "company">>,
	) => Promise<void>;
	changePassword: (
		currentPassword: string,
		newPassword: string,
	) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
	persist(
		(set, get) => ({
			user: null,
			isAuthenticated: false,

			login: async (email: string, password: string) => {
				if (!email.includes("@") || password.length < 6) {
					throw new Error("Invalid email or password");
				}

				const users = JSON.parse(localStorage.getItem("stellar_users") || "[]");
				const user = users.find((u: any) => u.email === email);

				if (!user) throw new Error("User not found");
				if (user.password !== password) throw new Error("Invalid password");

				set({
					user: {
						id: user.id,
						email: user.email,
						name: user.name,
						role: user.role,
						company: user.company,
					},
					isAuthenticated: true,
				});
			},

			signup: async (
				email: string,
				password: string,
				name: string,
				role: UserRole,
			) => {
				if (!email.includes("@") || password.length < 6 || name.length < 2) {
					throw new Error("Invalid input");
				}

				const users = JSON.parse(localStorage.getItem("stellar_users") || "[]");

				if (users.some((u: any) => u.email === email)) {
					throw new Error("User already exists");
				}

				const newUser = {
					id: `user_${Date.now()}`,
					email,
					password,
					name,
					role,
					company: `${name}'s Company`,
				};

				users.push(newUser);
				localStorage.setItem("stellar_users", JSON.stringify(users));

				set({
					user: {
						id: newUser.id,
						email: newUser.email,
						name: newUser.name,
						role: newUser.role,
						company: newUser.company,
					},
					isAuthenticated: true,
				});
			},

			logout: () => {
				set({ user: null, isAuthenticated: false });
			},

			updateProfile: async (updates) => {
				const { user } = get();
				if (!user) throw new Error("Not authenticated");

				// Validate
				if (updates.name !== undefined && updates.name.trim().length < 2) {
					throw new Error("Name must be at least 2 characters");
				}
				if (updates.email !== undefined && !updates.email.includes("@")) {
					throw new Error("Invalid email address");
				}

				// Check email uniqueness if changing email
				if (updates.email && updates.email !== user.email) {
					const users = JSON.parse(
						localStorage.getItem("stellar_users") || "[]",
					);
					if (
						users.some(
							(u: any) => u.email === updates.email && u.id !== user.id,
						)
					) {
						throw new Error("Email already in use by another account");
					}
				}

				// Simulate network delay
				await new Promise((r) => setTimeout(r, 600));

				// Update in localStorage users list
				const users = JSON.parse(localStorage.getItem("stellar_users") || "[]");
				const updatedUsers = users.map((u: any) =>
					u.id === user.id ? { ...u, ...updates } : u,
				);
				localStorage.setItem("stellar_users", JSON.stringify(updatedUsers));

				// Update store
				set({ user: { ...user, ...updates } });
			},

			changePassword: async (currentPassword: string, newPassword: string) => {
				const { user } = get();
				if (!user) throw new Error("Not authenticated");

				if (newPassword.length < 6) {
					throw new Error("New password must be at least 6 characters");
				}
				if (currentPassword === newPassword) {
					throw new Error(
						"New password must be different from current password",
					);
				}

				// Verify current password
				const users = JSON.parse(localStorage.getItem("stellar_users") || "[]");
				const storedUser = users.find((u: any) => u.id === user.id);

				if (!storedUser) throw new Error("User not found");
				if (storedUser.password !== currentPassword) {
					throw new Error("Current password is incorrect");
				}

				// Simulate network delay
				await new Promise((r) => setTimeout(r, 600));

				// Update password in localStorage
				const updatedUsers = users.map((u: any) =>
					u.id === user.id ? { ...u, password: newPassword } : u,
				);
				localStorage.setItem("stellar_users", JSON.stringify(updatedUsers));
			},
		}),
		{
			name: "stellar_auth",
		},
	),
);
