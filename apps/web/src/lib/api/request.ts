import axios, { type AxiosRequestConfig } from "axios";
import { ApiError, axiosInstance } from "@/lib/api/client";
import { getStoredAuthHeaders } from "@/features/auth/session";
import { expireSession } from "@/features/auth/store";

/**
 * Signed-in requests for feature `api.ts` files (frontend-integration.md §1): both session headers,
 * an `Idempotency-Key` on every POST/PATCH, the `{ statusCode, message, data, meta? }` envelope,
 * and every failure as an `ApiError` carrying the API's message (`error` is a slug, or `{ message }`
 * on a 422) and its `data` (e.g. the `issues[]` that block an approval). A 401 means the session is
 * over (the pay token is a 30-minute sliding session): sign in again.
 */

export interface Envelope<T, M = Record<string, unknown>> {
	statusCode: number;
	message: string;
	data: T;
	meta?: M;
}

export interface PageMeta {
	page: number;
	page_size: number;
	limit: number;
	total: number;
	total_pages: number;
}

/** Lists the UI treats as complete ask for the API's largest page. */
export const FULL_PAGE = 200;

/** A fresh key per user action. Make it when the form or dialog opens, so a double click repeats it. */
export function newIdempotencyKey() {
	return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function messageOf(body: unknown, fallback: string) {
	if (!body || typeof body !== "object") return fallback;
	const { message, error } = body as { message?: unknown; error?: unknown };
	if (typeof message === "string" && message.trim()) return message;
	if (error && typeof error === "object" && typeof (error as { message?: unknown }).message === "string")
		return (error as { message: string }).message;
	if (typeof error === "string" && error.trim()) return error.replace(/_/g, " ");
	return fallback;
}

/** The API's wording, made to read like a sentence ("only DRAFT runs…" → "Only DRAFT runs…"). */
function sentence(text: string) {
	return text.charAt(0).toUpperCase() + text.slice(1);
}

async function send<T, M>(config: AxiosRequestConfig, idempotencyKey?: string): Promise<Envelope<T, M>> {
	const writes = config.method === "POST" || config.method === "PATCH";
	try {
		const response = await axiosInstance.request<Envelope<T, M>>({
			...config,
			headers: {
				...getStoredAuthHeaders(),
				...(writes ? { "Idempotency-Key": idempotencyKey ?? newIdempotencyKey() } : {}),
				...config.headers,
			},
		});
		return response.data;
	} catch (error) {
		if (axios.isAxiosError(error)) {
			const status = error.response?.status ?? 0;
			if (status === 401) expireSession();
			const fallback = status === 0 ? "Can't reach PayOrbit. Check your connection and try again." : error.message;
			const body = error.response?.data as { data?: unknown } | undefined;
			throw new ApiError(sentence(messageOf(body, fallback)), status, body?.data ?? body);
		}
		throw error instanceof Error ? new ApiError(error.message, 0, error) : new ApiError("Something went wrong", 0, error);
	}
}

type Params = Record<string, string | number | boolean | undefined | null>;

/** Drops empty filters so they never reach the query string. */
function clean(params?: Params) {
	if (!params) return undefined;
	return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ""));
}

export const api = {
	get: <T, M = Record<string, unknown>>(url: string, params?: Params) =>
		send<T, M>({ method: "GET", url, params: clean(params) }),
	post: <T, M = Record<string, unknown>>(url: string, body?: unknown, idempotencyKey?: string) =>
		send<T, M>({ method: "POST", url, data: body }, idempotencyKey),
	patch: <T, M = Record<string, unknown>>(url: string, body?: unknown, idempotencyKey?: string) =>
		send<T, M>({ method: "PATCH", url, data: body }, idempotencyKey),
	delete: <T, M = Record<string, unknown>>(url: string) => send<T, M>({ method: "DELETE", url }),
};

/** A readable message from anything a mutation throws. */
export function errorMessage(error: unknown, fallback = "Something went wrong") {
	return error instanceof Error && error.message ? error.message : fallback;
}

/**
 * What's blocking an approval or execution (409 `data.issues[]`), if that's what this error is.
 * Without `employee_name` the issue is about the company or the run ("Company has no operational wallet.").
 */
export function blockingIssues(error: unknown): { employee_name?: string; reason: string }[] {
	if (!(error instanceof ApiError) || error.status !== 409) return [];
	// The 409 body is { statusCode, message, data: { issues } }.
	const body = error.data as { issues?: unknown; data?: { issues?: unknown } } | undefined;
	const issues = body?.data?.issues ?? body?.issues;
	return Array.isArray(issues) ? (issues as { employee_name?: string; reason: string }[]) : [];
}
