/** Brand copy for the root layout's metadata. */
const SITE_NAME = "PayOrbit";
const SITE_TAGLINE = "Instant Global Payroll";
const SITE_DESCRIPTION =
	"PayOrbit settles payroll instantly using USDC on the Stellar network — no wire transfers, no bank delays, no hidden fees. Built for teams that work across borders.";

/** Shorter copy for link previews. */
const SHARE_DESCRIPTION = "Pay your global team in seconds, not days. Cross-border payroll settled in USDC on Stellar.";

const SITE_KEYWORDS = [
	"crypto payroll",
	"stablecoin payroll",
	"contractor payments",
	"remote team payroll",
	"payroll",
	"cross-border payments",
	"global payroll",
	"Stellar",
	"USDC",
	"PayOrbit",
];

/** Mirrors `--primary` (brand purple) in packages/ui globals.css. */
const THEME_COLOR = "#5501ff";

/** Read through next.config `env`, so client components agree with the server render. */
const IS_PRODUCTION = process.env.NEXT_PUBLIC_VERCEL_ENV === "production";

/**
 * Absolute site URL for `metadataBase`: NEXT_PUBLIC_SITE_URL → the deployment URL on Vercel →
 * localhost in dev. Set NEXT_PUBLIC_SITE_URL once PayOrbit has its production domain.
 */
const ORIGIN =
	process.env.NEXT_PUBLIC_SITE_URL ?? (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ?? "http://localhost:3000";

/** This app's base path: `/app` on Vercel, empty in dev (next.config.ts). */
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Prefix app-local assets when this app is mounted below the site root (Vercel). */
function withBasePath(src: string) {
	return BASE_PATH && src.startsWith("/") && !src.startsWith(`${BASE_PATH}/`) ? `${BASE_PATH}${src}` : src;
}

/** Includes the base path, so metadata URLs resolve under `/app`. */
const SITE_URL = new URL(`${BASE_PATH}/`, ORIGIN);

/** The landing site (`apps/landing`): `/` on the shared Vercel host, its own port in dev.
 * Link to it with a plain <a>. */
const LANDING_URL =
	process.env.NEXT_PUBLIC_LANDING_URL ??
	(!IS_PRODUCTION && process.env.NODE_ENV === "development" ? "http://localhost:3002" : "/");

export {
	SITE_NAME,
	SITE_TAGLINE,
	SITE_DESCRIPTION,
	SHARE_DESCRIPTION,
	SITE_KEYWORDS,
	THEME_COLOR,
	SITE_URL,
	BASE_PATH,
	withBasePath,
	LANDING_URL,
};
