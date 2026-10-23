/** Brand copy for the console's metadata. */
const SITE_NAME = "PayOrbit Admin";
const SITE_DESCRIPTION = "PayOrbit's platform console: companies, users, payments and the audit trail across every workspace.";

/** Mirrors `--primary` (brand purple) in packages/ui globals.css. */
const THEME_COLOR = "#5501ff";

/** This app's base path: `/admin` on Vercel, empty in dev (next.config.ts). */
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Prefix app-local assets when this app is mounted below the site root (Vercel). */
function withBasePath(src: string) {
	return BASE_PATH && src.startsWith("/") && !src.startsWith(`${BASE_PATH}/`) ? `${BASE_PATH}${src}` : src;
}

/** The customer app, for "open in PayOrbit" links: its own port in dev, `/app` on the shared Vercel host. */
const APP_URL =
	process.env.NEXT_PUBLIC_APP_URL ??
	(process.env.NODE_ENV === "development" && !process.env.NEXT_PUBLIC_VERCEL_ENV ? "http://localhost:3000" : "/app");

export { SITE_NAME, SITE_DESCRIPTION, THEME_COLOR, BASE_PATH, withBasePath, APP_URL };
