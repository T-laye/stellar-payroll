"use client";

import axios from "axios";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { ApiError, axiosInstance } from "@/lib/api/client";

/**
 * The console's session: its own key, kept in sessionStorage (closing the tab signs out), separate
 * from the customer app's. Only PayOrbit platform admins get one: sign-in refuses everyone else.
 * Both tokens go on every request, like the app: `Authorization: Bearer` and `X-Pay-Token`.
 */

export interface AdminUser {
	id: string;
	email: string;
	first_name: string;
	last_name: string;
	company_id: string;
}

interface SessionState {
	accessToken: string | null;
	payToken: string | null;
	/** Seconds since the epoch, from the JWT's `exp`. */
	expiresAt: number | null;
	user: AdminUser | null;
	set: (session: { accessToken: string; payToken: string; expiresAt: number | null; user: AdminUser }) => void;
	clear: () => void;
}

const empty = { accessToken: null, payToken: null, expiresAt: null, user: null };

export const useAdminSession = create<SessionState>()(
	persist(
		(set) => ({
			...empty,
			set: (session) => set(session),
			clear: () => set(empty),
		}),
		{ name: "payorbit-admin-session", storage: createJSONStorage(() => sessionStorage) },
	),
);

export const isExpired = (expiresAt: number | null) => !!expiresAt && expiresAt * 1000 <= Date.now();

export function authHeaders(): Record<string, string> {
	const { accessToken, payToken } = useAdminSession.getState();
	return {
		...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
		...(payToken ? { "X-Pay-Token": payToken } : {}),
	};
}

/** A 401: the session is over. RequireAdmin sends the user to sign in. */
export function expireSession() {
	if (!useAdminSession.getState().accessToken) return;
	useAdminSession.getState().clear();
	if (typeof window !== "undefined") {
		void import("@repo/ui/sonner").then(({ toast }) => toast.info("Your session has ended. Please sign in again."));
	}
}

function claims(token: string): Record<string, unknown> {
	try {
		const part = token.split(".")[1] ?? "";
		const json = atob(
			part
				.replace(/-/g, "+")
				.replace(/_/g, "/")
				.padEnd(Math.ceil(part.length / 4) * 4, "="),
		);
		return JSON.parse(json) as Record<string, unknown>;
	} catch {
		return {};
	}
}

const sentence = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

function failure(error: unknown, fallback: string): never {
	if (axios.isAxiosError(error)) {
		const body = error.response?.data as { message?: unknown; error?: unknown } | undefined;
		const message = typeof body?.message === "string" && body.message ? body.message : fallback;
		throw new ApiError(sentence(message), error.response?.status ?? 0, body);
	}
	throw error instanceof Error ? error : new ApiError(fallback, 0);
}

/**
 * Signs in with the shared login, then keeps the session only for platform admins (the token's
 * `is_platform_admin`, which the login's session object also carries). Anyone else is signed straight
 * back out, so their customer-app session isn't left open here.
 */
export async function signIn(email: string, password: string) {
	let session: { access_token: string; pay_token: string; is_platform_admin?: boolean };
	try {
		const response = await axiosInstance.post("/auth/login", { email, password });
		session = response.data.data.session;
	} catch (error) {
		failure(error, "Couldn't sign you in");
	}
	const tokenClaims = claims(session.access_token);
	const headers = { Authorization: `Bearer ${session.access_token}`, "X-Pay-Token": session.pay_token };
	if (!(session.is_platform_admin ?? tokenClaims.is_platform_admin)) {
		await axiosInstance.post("/auth/logout", undefined, { headers }).catch(() => {});
		throw new ApiError("This account isn't PayOrbit staff. The admin console is for platform admins only.", 403);
	}
	let user: AdminUser;
	try {
		const me = await axiosInstance.get("/users/me", { headers });
		user = me.data.data;
	} catch (error) {
		failure(error, "Couldn't load your profile");
	}
	useAdminSession.getState().set({
		accessToken: session.access_token,
		payToken: session.pay_token,
		expiresAt: typeof tokenClaims.exp === "number" ? tokenClaims.exp : null,
		user,
	});
}

export async function signOut() {
	const headers = authHeaders();
	useAdminSession.getState().clear();
	await axiosInstance.post("/auth/logout", undefined, { headers }).catch(() => {});
}
