/** Small helpers shared by the seed and the handlers. */

/** Circle's Testnet USDC, the asset payroll pays in. */
export const USDC_ISSUER = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";

/** Deterministic PRNG (mulberry32): the seed looks the same on every machine. */
export function random(seed: number) {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

const fallback = random(Date.now());

export function uuid(rand: () => number = fallback) {
	const h = hex(32, rand);
	return `${h.slice(0, 8)}-${h.slice(8, 12)}-7${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20)}`;
}

export function hex(length: number, rand: () => number = fallback) {
	return Array.from({ length }, () => Math.floor(rand() * 16).toString(16)).join("");
}

const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

const base32 = (length: number, rand: () => number) => Array.from({ length }, () => BASE32[Math.floor(rand() * 32)]).join("");

/** A Stellar-looking public key (G + 55 base32 chars). Display only: not a real account. */
export const stellarAddress = (rand: () => number = fallback) => "G" + base32(55, rand);

/** A Stellar-looking secret key (S + 55 base32 chars). Display only. */
export const stellarSecret = (rand: () => number = fallback) => "S" + base32(55, rand);

export const DAY = 86_400_000;

export const iso = (ms: number) => new Date(ms).toISOString();

/** Amounts are decimal strings with 2 places, as the UI displays them. */
export const money = (n: number) => (Math.round(n * 100) / 100).toFixed(2);

export const num = (value: string | null | undefined) => Number.parseFloat(value ?? "") || 0;

/** "YYYY-MM-DD" in UTC. */
export const day = (ms: number) => iso(ms).slice(0, 10);

/** Base64url JSON, so the app can decode the token's claims like a real JWT. */
export function base64url(value: unknown) {
	const bytes = new TextEncoder().encode(JSON.stringify(value));
	const encoded = btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join(""));
	return encoded.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function fromBase64url(value: string) {
	const padded = value
		.replace(/-/g, "+")
		.replace(/_/g, "/")
		.padEnd(Math.ceil(value.length / 4) * 4, "=");
	const bytes = Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
	return JSON.parse(new TextDecoder().decode(bytes)) as Record<string, unknown>;
}
