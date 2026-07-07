const DEFAULT_API_BASE_URL = "https://payorbit-production.up.railway.app/api/v1";

export const API_BASE_URL =
	process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL;

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

interface RequestOptions extends Omit<RequestInit, "body"> {
	body?: BodyInit | Record<string, unknown> | null;
	query?: QueryParams;
	headers?: HeadersInit;
}

function buildUrl(path: string, query?: QueryParams) {
	const normalizedPath = path.startsWith("/") ? path : `/${path}`;
	const url = new URL(`${API_BASE_URL}${normalizedPath}`);

	if (!query) {
		return url.toString();
	}

	Object.entries(query).forEach(([key, value]) => {
		if (value === null || value === undefined) {
			return;
		}

		if (Array.isArray(value)) {
			value.forEach((item) => {
				if (item !== null && item !== undefined) {
					url.searchParams.append(key, String(item));
				}
			});
			return;
		}

		url.searchParams.set(key, String(value));
	});

	return url.toString();
}

function isFormData(value: unknown): value is FormData {
	return typeof FormData !== "undefined" && value instanceof FormData;
}

function isBlob(value: unknown): value is Blob {
	return typeof Blob !== "undefined" && value instanceof Blob;
}

function isJsonBody(body: RequestOptions["body"]) {
	if (!body) {
		return false;
	}

	return !(
		typeof body === "string" ||
		body instanceof URLSearchParams ||
		isFormData(body) ||
		isBlob(body) ||
		body instanceof ArrayBuffer
	);
}

async function parseResponse(response: Response) {
	const contentType = response.headers.get("content-type") ?? "";

	if (contentType.includes("application/json")) {
		return response.json();
	}

	if (contentType.startsWith("text/")) {
		return response.text();
	}

	return null;
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

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
	const { body, query, headers, ...rest } = options;
	const requestHeaders = new Headers(headers);

	let requestBody: BodyInit | undefined;

	if (isJsonBody(body)) {
		requestHeaders.set("Content-Type", "application/json");
		requestBody = JSON.stringify(body);
	} else if (body !== null && body !== undefined) {
		requestBody = body as BodyInit;
	}

	const response = await fetch(buildUrl(path, query), {
		...rest,
		headers: requestHeaders,
		body: requestBody,
	});

	const data = await parseResponse(response);

	if (!response.ok) {
		throw new ApiError(
			getErrorMessage(data, `Request failed with status ${response.status}`),
			response.status,
			data,
		);
	}

	return data as T;
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
