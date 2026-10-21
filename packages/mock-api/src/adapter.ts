import { AxiosError, AxiosHeaders, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { update } from "./db";
import { settle } from "./engine";
import { HttpError, dispatch } from "./router";
import "./handlers/index";

/**
 * An axios adapter that answers from the in-browser mock backend instead of the network. The web app
 * installs it on its axios instances when NEXT_PUBLIC_API_SOURCE is not "live", so every existing
 * hook works unchanged: same URLs, same `{ statusCode, message, data }` envelopes, same error shapes.
 */

const LATENCY: [number, number] = [150, 450];

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function parseBody(data: unknown): Record<string, unknown> {
	if (!data) return {};
	if (typeof data === "string") {
		try {
			return JSON.parse(data) as Record<string, unknown>;
		} catch {
			return {};
		}
	}
	return data as Record<string, unknown>;
}

function headerValue(config: InternalAxiosRequestConfig, name: string) {
	const headers = config.headers as AxiosHeaders | Record<string, unknown> | undefined;
	const value = headers instanceof AxiosHeaders ? headers.get(name) : headers?.[name];
	return typeof value === "string" ? value : undefined;
}

export async function mockAdapter(config: InternalAxiosRequestConfig): Promise<AxiosResponse> {
	const url = new URL(config.url ?? "/", "http://mock.local/");
	const query = url.searchParams;
	for (const [key, value] of Object.entries(config.params ?? {})) if (value != null) query.set(key, String(value));
	// The API's routes sit under /api/v1; strip whatever base the app uses.
	const path = url.pathname.replace(/^.*?\/api\/v1(?=\/|$)/, "") || "/";
	const method = (config.method ?? "get").toUpperCase();

	await wait(LATENCY[0] + Math.random() * (LATENCY[1] - LATENCY[0]));
	update((db) => settle(db));

	const respond = (status: number, data: unknown): AxiosResponse => ({
		data,
		status,
		statusText: String(status),
		headers: new AxiosHeaders({ "content-type": "application/json" }),
		config,
		request: { mock: true },
	});

	try {
		const result = await dispatch(method, path, query, parseBody(config.data), headerValue(config, "Authorization"));
		const status = (result as { statusCode?: number })?.statusCode ?? 200;
		return respond(status, result);
	} catch (error) {
		const status = error instanceof HttpError ? error.status : 500;
		const message = error instanceof Error ? error.message : "mock backend error";
		if (!(error instanceof HttpError)) console.error("[mock-api]", method, path, error);
		const response = respond(status, { statusCode: status, message, error: status === 422 ? { message } : message });
		throw new AxiosError(
			message,
			status >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST,
			config,
			response.request,
			response,
		);
	}
}
