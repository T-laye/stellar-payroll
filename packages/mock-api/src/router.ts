import { read, type MockDb, type MockUser } from "./db";
import { effectivePermissions } from "./permissions";
import { base64url, fromBase64url, hex } from "./util";

/** A tiny router for the mock backend: "/payroll/runs/:id" patterns, an auth level, and the request context. */

export interface Ctx {
	method: string;
	path: string;
	params: Record<string, string>;
	query: URLSearchParams;
	body: Record<string, unknown>;
	/** The signed-in user (null on public routes). */
	user: MockUser | null;
	/** The signed-in user's effective permissions. */
	permissions: string[];
}

export class HttpError extends Error {
	constructor(
		public status: number,
		message: string,
		/** Extra detail in the error body's `data` (e.g. the issues blocking an approval). */
		public data?: unknown,
	) {
		super(message);
	}
}

/** 204: the adapter answers with no body. */
export const NO_CONTENT = { statusCode: 204, noContent: true } as const;

/**
 * `?page=1&page_size=20` (max 200; `limit` is an alias) → `meta: { page, page_size, limit, total, total_pages }`.
 * `fallback` is the page size when none is asked for.
 */
export function paged<T>(ctx: Ctx, list: T[], extra: Record<string, unknown> = {}, fallback = 50, message = "successful") {
	const page = Math.max(1, Number(ctx.query.get("page")) || 1);
	const pageSize = Math.min(200, Math.max(1, Number(ctx.query.get("page_size") ?? ctx.query.get("limit")) || fallback));
	return {
		statusCode: 200,
		message,
		data: list.slice((page - 1) * pageSize, page * pageSize),
		meta: { page, page_size: pageSize, limit: pageSize, total: list.length, total_pages: Math.max(1, Math.ceil(list.length / pageSize)), ...extra },
	};
}

export type Handler = (ctx: Ctx) => unknown;
type Auth = "public" | "user";

interface Route {
	method: string;
	parts: string[];
	auth: Auth;
	handler: Handler;
}

const routes: Route[] = [];

export function route(method: string, pattern: string, auth: Auth, handler: Handler) {
	routes.push({ method: method.toUpperCase(), parts: pattern.split("/").filter(Boolean), auth, handler });
}

function match(route: Route, segments: string[]) {
	if (route.parts.length !== segments.length) return null;
	const params: Record<string, string> = {};
	for (let i = 0; i < route.parts.length; i++) {
		const part = route.parts[i]!;
		const segment = decodeURIComponent(segments[i]!);
		if (part.startsWith(":")) params[part.slice(1)] = segment;
		else if (part !== segment) return null;
	}
	return params;
}

/** The success envelope the live API uses. */
export const ok = (data: unknown, message = "successful", statusCode = 200) => ({ statusCode, message, data });

/**
 * A JWT-shaped access token (unsigned): the app decodes its payload for the user's permissions,
 * exactly as it does with the live API's HS256 tokens.
 */
export function accessToken(db: MockDb, user: MockUser) {
	const claims = {
		user_id: user.id,
		company_id: user.company_id,
		role_id: user.role_id,
		permissions: effectivePermissions(db, user.id),
		exp: Math.floor(Date.now() / 1000) + 7 * 86_400,
	};
	return `${base64url({ alg: "none", typ: "JWT" })}.${base64url(claims)}.mock${hex(16)}`;
}

function userFromToken(db: MockDb, authorization: string | undefined) {
	const token = authorization?.replace(/^Bearer\s+/i, "");
	const payload = token?.split(".")[1];
	if (!payload) return null;
	try {
		const claims = fromBase64url(payload);
		return db.users.find((u) => u.id === claims.user_id && u.is_active) ?? null;
	} catch {
		return null;
	}
}

/** Throws 403 unless the user holds one of `permissions` (or "*"). */
export function need(ctx: Ctx, ...permissions: string[]) {
	if (ctx.permissions.includes("*") || permissions.some((p) => ctx.permissions.includes(p))) return;
	throw new HttpError(403, `insufficient permissions: requires ${permissions.join(" or ")}`);
}

/** The signed-in user (routes registered as "user" always have one). */
export const me = (ctx: Ctx) => ctx.user!;

/** Company routes: the path's company must be the token's company. */
export function companyOf(ctx: Ctx) {
	if (ctx.params.id !== me(ctx).company_id) throw new HttpError(403, "company does not match the authenticated user");
	return ctx.params.id;
}

export async function dispatch(
	method: string,
	path: string,
	query: URLSearchParams,
	body: Record<string, unknown>,
	authorization?: string,
) {
	const segments = path.split("/").filter(Boolean);
	const candidates = routes.filter((r) => match(r, segments));
	if (candidates.length === 0) throw new HttpError(404, "route not found");
	const found = candidates.find((r) => r.method === method.toUpperCase());
	if (!found) throw new HttpError(405, "method not allowed");

	const db = read();
	const user = userFromToken(db, authorization);
	if (found.auth !== "public" && !user) throw new HttpError(401, "missing authorization header");
	const permissions = user ? effectivePermissions(db, user.id) : [];

	return found.handler({ method, path, params: match(found, segments)!, query, body, user, permissions });
}
