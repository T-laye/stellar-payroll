import axios, { type AxiosRequestConfig } from "axios";
import { axiosInstance } from "@/config/axios";

type Primitive = string | number | boolean;
type QueryValue = Primitive | null | undefined;
type QueryParams = Record<string, QueryValue | QueryValue[]>;

export class ApiError extends Error {
	status: number;
	data: unknown;

	constructor(message: string, status: number, data?: unknown) {
		super(message);
		this.name = "ApiError";
		this.status = status;
		this.data = data;
	}
}

interface RequestOptions extends Omit<
	AxiosRequestConfig,
	"url" | "data" | "params" | "headers"
> {
	body?: unknown;
	query?: QueryParams;
	headers?: Record<string, string> | HeadersInit;
}

function isJsonBody(body: RequestOptions["body"]) {
	if (body === null || body === undefined || typeof body === "string") {
		return false;
	}

	return !(
		body instanceof FormData ||
		body instanceof Blob ||
		body instanceof ArrayBuffer ||
		body instanceof URLSearchParams
	);
}

function getErrorMessage(data: unknown, fallback: string) {
	if (!data || typeof data !== "object") {
		return fallback;
	}

	const errorData = data as Record<string, unknown>;
	const candidates = ["message", "error", "detail"] as const;

	for (const key of candidates) {
		const value = errorData[key];
		if (typeof value === "string" && value.trim()) {
			return value;
		}
	}

	return fallback;
}

function normalizeError(error: unknown): never {
	if (axios.isAxiosError(error)) {
		const message = getErrorMessage(
			error.response?.data,
			error.message || "Request failed",
		);
		throw new ApiError(
			message,
			error.response?.status ?? 500,
			error.response?.data,
		);
	}

	if (error instanceof Error) {
		throw new ApiError(error.message, 500, error);
	}

	throw new ApiError("Request failed", 500, error);
}

async function request<T>(
	path: string,
	options: RequestOptions = {},
): Promise<T> {
	const { body, query, headers, ...rest } = options;
	const requestHeaders = new Headers(headers);

	let requestBody: unknown = body;

	if (isJsonBody(body)) {
		requestHeaders.set("Content-Type", "application/json");
		requestBody = JSON.stringify(body);
	}

	try {
		const response = await axiosInstance.request<T>({
			...rest,
			url: path.startsWith("/") ? path : `/${path}`,
			headers: Object.fromEntries(requestHeaders.entries()),
			params: query,
			data: requestBody,
		});

		return response.data as T;
	} catch (error) {
		normalizeError(error);
	}

	throw new ApiError("Request failed", 500);
}

export const apiClient = {
	request,
	get: <T>(path: string, options?: Omit<RequestOptions, "method" | "body">) =>
		request<T>(path, { ...options, method: "GET" }),
	post: <T>(
		path: string,
		body?: RequestOptions["body"],
		options?: Omit<RequestOptions, "method" | "body">,
	) => request<T>(path, { ...options, method: "POST", body }),
	put: <T>(
		path: string,
		body?: RequestOptions["body"],
		options?: Omit<RequestOptions, "method" | "body">,
	) => request<T>(path, { ...options, method: "PUT", body }),
	patch: <T>(
		path: string,
		body?: RequestOptions["body"],
		options?: Omit<RequestOptions, "method" | "body">,
	) => request<T>(path, { ...options, method: "PATCH", body }),
	delete: <T>(
		path: string,
		options?: Omit<RequestOptions, "method" | "body">,
	) => request<T>(path, { ...options, method: "DELETE" }),
};
