import type { NextConfig } from "next";

/**
 * The PayOrbit admin console (platform staff). Dev serves it at the root of localhost:3001. On Vercel
 * every service shares one host until PayOrbit has an admin subdomain (repo root `vercel.json`), so
 * there it lives under `/admin`, as the app lives under `/app`.
 */
const BASE_PATH = process.env.VERCEL_ENV ? "/admin" : "";

/** The PayOrbit API. Its routes sit under `/api/v1`. */
const API_ORIGIN = process.env.API_PROXY_TARGET || "https://settle.getpayorbit.com/api/v1";

/** The browser calls this app's own `/api/v1` proxy, so CORS never applies. NEXT_PUBLIC_API_URL forces direct calls. */
const API_URL = process.env.NEXT_PUBLIC_API_URL || `${BASE_PATH}/api/v1`;

const nextConfig: NextConfig = {
	basePath: BASE_PATH,
	env: { NEXT_PUBLIC_BASE_PATH: BASE_PATH, NEXT_PUBLIC_API_URL: API_URL, NEXT_PUBLIC_VERCEL_ENV: process.env.VERCEL_ENV ?? "" },
	// A separate output dir for one-off verification builds (`NEXT_DIST_DIR=.next-verify next build`).
	distDir: process.env.NEXT_DIST_DIR || ".next",
	reactCompiler: true,
	transpilePackages: ["@repo/ui", "@repo/mock-api"],
	allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.*.*.*"],
	async rewrites() {
		return [{ source: "/api/v1/:path*", destination: `${API_ORIGIN}/:path*` }];
	},
};

export default nextConfig;
