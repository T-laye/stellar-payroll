import axios, { type AxiosRequestConfig } from "axios";
import { ApiError, axiosInstance } from "@/lib/api/client";
import { getStoredAuthHeaders } from "@/features/auth/session";

/**
 * Signed-in requests for feature `api.ts` files: both session headers, the `{ statusCode, message,
 * data, meta? }` envelope unwrapped to `{ data, meta }`, and every failure turned into an
 * `ApiError` carrying the API's message (`error` may be a string or `{ message }`).
 */

export interface Envelope<T, M = Record<string, unknown>> {
	statusCode: number;
	message: string;
	data: T;
	meta?: M;
}

function messageOf(body: unknown, fallback: string) {
	if (!body || typeof body !== "object") return fallback;
	const { message, error } = body as { message?: unknown; error?: unknown };
	if (typeof message === "string" && message.trim()) return message;
	if (typeof error === "string" && error.trim()) return error;
	if (error && typeof error === "object" && typeof (error as { message?: unknown }).message === "string")
		return (error as { message: string }).message;
	return fallback;
}

/** The API's wording, made to read like a sentence ("only DRAFT runs…" → "Only DRAFT runs…"). */
function sentence(text: string) {
	return text.charAt(0).toUpperCase() + text.slice(1);
}

async function send<T, M>(config: AxiosRequestConfig): Promise<Envelope<T, M>> {
	try {
		const response = await axiosInstance.request<Envelope<T, M>>({
			...config,
			headers: { ...getStoredAuthHeaders(), ...config.headers },
		});
		return response.data;
	} catch (error) {
		if (axios.isAxiosError(error)) {
			const status = error.response?.status ?? 0;
			const fallback = status === 0 ? "Can't reach PayOrbit. Check your connection and try again." : error.message;
			throw new ApiError(sentence(messageOf(error.response?.data, fallback)), status, error.response?.data);
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
	post: <T, M = Record<string, unknown>>(url: string, body?: unknown) => send<T, M>({ method: "POST", url, data: body }),
	patch: <T, M = Record<string, unknown>>(url: string, body?: unknown) => send<T, M>({ method: "PATCH", url, data: body }),
	delete: <T, M = Record<string, unknown>>(url: string) => send<T, M>({ method: "DELETE", url }),
};

/** A readable message from anything a mutation throws. */
export function errorMessage(error: unknown, fallback = "Something went wrong") {
	return error instanceof Error && error.message ? error.message : fallback;
}
