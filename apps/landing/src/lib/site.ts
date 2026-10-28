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
 * The public host on Vercel. Link-preview crawlers (WhatsApp, X, Slack) can't open a
 * per-deployment URL (VERCEL_URL sits behind Deployment Protection and redirects to a login), so
 * og:image must point at the production domain; VERCEL_URL is the fallback for local `vercel build`.
 */
const VERCEL_HOST = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;

/**
 * Absolute URL of this site, for `metadataBase` / canonical / robots:
 * NEXT_PUBLIC_SITE_URL → the production domain on Vercel → localhost in dev.
 */
const SITE_URL = new URL(
	process.env.NEXT_PUBLIC_SITE_URL ?? (VERCEL_HOST && `https://${VERCEL_HOST}`) ?? "http://localhost:3002",
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
