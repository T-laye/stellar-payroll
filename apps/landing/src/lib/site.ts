/** Brand copy for metadata. */
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
	"global payments",
	"Stellar",
	"USDC",
	"PayOrbit",
];

/** Mirrors `--primary` (brand purple) in packages/ui globals.css. */
const THEME_COLOR = "#5501ff";

/**
 * Absolute URL of this site, for `metadataBase` / canonical / robots:
 * NEXT_PUBLIC_SITE_URL → the deployment URL on Vercel → localhost in dev.
 */
const SITE_URL = new URL(
	process.env.NEXT_PUBLIC_SITE_URL ?? (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ?? "http://localhost:3002",
);

/**
 * The app (`apps/web`): `/app` on the shared Vercel host (Vercel Services), its own port in dev.
 * Links into it are plain <a>s: a <Link> would route inside this landing app.
 * Keep in step with APP_URL in next.config.ts (the old-path redirects).
 */
const APP_URL =
	process.env.NEXT_PUBLIC_APP_URL ??
	(process.env.NODE_ENV === "development" && !process.env.NEXT_PUBLIC_VERCEL_ENV ? "http://localhost:3000" : "/app");

const APP_LINKS = {
	signUp: `${APP_URL}/auth/sign-up`,
	signIn: `${APP_URL}/auth/sign-in`,
};

export { SITE_NAME, SITE_TAGLINE, SITE_DESCRIPTION, SHARE_DESCRIPTION, SITE_KEYWORDS, THEME_COLOR, SITE_URL, APP_URL, APP_LINKS };
