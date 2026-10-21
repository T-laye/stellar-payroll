import type { NextConfig } from "next";

/**
 * Dev serves this app at the root of localhost:3000. On Vercel every service shares one host
 * until PayOrbit has its own app subdomain (repo root `vercel.json`), so there it lives under
 * `/app`. Next prefixes pages, <Link>s, static imports and `/_next` assets with it; anything
 * that builds a URL by hand reads NEXT_PUBLIC_BASE_PATH (`withBasePath` in lib/site.ts).
 */
const BASE_PATH = process.env.VERCEL_ENV ? "/app" : "";

/** The PayOrbit API. Its routes sit under `/api/v1`. */
const API_ORIGIN = process.env.API_PROXY_TARGET || "https://payorbit-production.up.railway.app/api/v1";

/**
 * Where the browser sends API calls: the same-origin `/api/v1` proxy below, so CORS never
 * applies in dev, on the LAN or on previews. NEXT_PUBLIC_API_URL forces direct calls (the API
 * must then allow this origin); NEXT_PUBLIC_API_BASE_URL is the old name.
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || `${BASE_PATH}/api/v1`;

const nextConfig: NextConfig = {
	basePath: BASE_PATH,
	// VERCEL_ENV inlined for client code too (lib/site.ts picks production URLs with it).
	env: { NEXT_PUBLIC_BASE_PATH: BASE_PATH, NEXT_PUBLIC_API_URL: API_URL, NEXT_PUBLIC_VERCEL_ENV: process.env.VERCEL_ENV ?? "" },
	// A separate output dir for one-off verification builds (`NEXT_DIST_DIR=.next-verify next build`)
	// so they never overwrite the `.next` a running `pnpm dev` is serving from.
	distDir: process.env.NEXT_DIST_DIR || ".next",
	reactCompiler: true,
	transpilePackages: ["@repo/ui", "@repo/mock-api"],
	// Dev only: let a phone on the LAN load dev assets / HMR.
	allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.*.*.*"],
	// Same-origin API proxy: the browser calls /api/v1/…, Next forwards it, so CORS never applies.
	async rewrites() {
		return [{ source: "/api/v1/:path*", destination: `${API_ORIGIN}/:path*` }];
	},
	// The app used to serve its dashboard under /dashboard; keep old bookmarks working.
	async redirects() {
		return [
			{ source: "/dashboard", destination: "/overview", permanent: false },
			{ source: "/dashboard/:path*", destination: "/:path*", permanent: false },
		];
	},
};

export default nextConfig;
