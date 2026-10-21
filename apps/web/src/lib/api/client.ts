import axios, { type AxiosAdapter } from "axios";
import { USE_MOCK_API } from "@/lib/api/source";

// The same-origin /api/v1 proxy, or a direct URL (next.config.ts sets NEXT_PUBLIC_API_URL).
export const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

/** In mock mode every request is answered in the browser (lib/api/source.ts); loaded only then. */
const mockAdapter: AxiosAdapter = async (config) => (await import("@repo/mock-api/adapter")).mockAdapter(config);
const adapter = USE_MOCK_API ? { adapter: mockAdapter } : {};

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

// Default axios instance (unauthenticated)
const axiosInstance = axios.create({
	baseURL: BASE_URL,
	headers: { "Content-Type": "application/json" },
	...adapter,
});

// Authenticated axios instance
const axiosAuth = axios.create({
	baseURL: BASE_URL,
	headers: { "Content-Type": "application/json" },
	...adapter,
});

export { axiosInstance, axiosAuth };
