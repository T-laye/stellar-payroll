import axios from "axios";

const DEFAULT_API_BASE_URL =
	"https://payorbit-production.up.railway.app/api/v1";
export const BASE_URL =
	process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL;

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
});

// Authenticated axios instance
const axiosAuth = axios.create({
	baseURL: BASE_URL,
	headers: { "Content-Type": "application/json" },
});

export { axiosInstance, axiosAuth };
