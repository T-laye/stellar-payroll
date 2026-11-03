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

/** A well-formed Stellar public key with a valid checksum, so forms accept it. Not a real account. */
export function stellarAddress(rand: () => number = fallback) {
	const bytes = [6 << 3, ...Array.from({ length: 32 }, () => Math.floor(rand() * 256))];
	let crc = 0;
	for (const byte of bytes) {
		crc ^= byte << 8;
		for (let i = 0; i < 8; i++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
	}
	bytes.push(crc & 255, crc >> 8);
	let buffer = 0;
	let bits = 0;
	let address = "";
	for (const byte of bytes) {
		buffer = (buffer << 8) | byte;
		bits += 8;
		while (bits >= 5) {
			address += BASE32.charAt((buffer >>> (bits - 5)) & 31);
			bits -= 5;
		}
		buffer &= (1 << bits) - 1;
	}
	return address;
}

/** A Stellar-looking secret key (S + 55 base32 chars). Display only. */
export const stellarSecret = (rand: () => number = fallback) => "S" + base32(55, rand);

export const DAY = 86_400_000;

export const iso = (ms: number) => new Date(ms).toISOString();

/** Amounts are decimal strings in whole asset units with seven places, as the API returns them ("5200.0000000"). */
export const money = (n: number) => (Math.round(n * 1e7) / 1e7).toFixed(7);

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
