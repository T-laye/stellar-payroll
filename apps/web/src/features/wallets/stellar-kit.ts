"use client";

import type { StellarWalletsKit as Kit } from "@creit.tech/stellar-wallets-kit/sdk";
import type { ModuleInterface } from "@creit.tech/stellar-wallets-kit/types";
import { isPhone } from "@/features/wallets/device";

/**
 * External Stellar wallets through Stellar Wallets Kit (the setup from ../go-medi): Freighter's
 * browser extension (its phone app over WalletConnect on phones), Albedo's web wallet, and LOBSTR
 * over WalletConnect. PayOrbit only ever reads the public address to pay into, so nothing here
 * signs. Loaded on first use: the kit is large and touches the DOM.
 */

/**
 * WalletConnect (Reown) project id: phone wallets pair through it (a deep link on a phone, a QR
 * code on a laptop). Not a secret, it ships in the bundle; the project's domain allowlist protects
 * it, so PayOrbit's domains must be listed there. NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID overrides it.
 */
const WALLETCONNECT_PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "b8cc56756132b11f2077932ac3d6f807";
const WALLETCONNECT_ID = "wallet_connect";

/** How long a browser-extension wallet gets to answer "are you there?". */
const EXTENSION_CHECK_MS = 3000;

/** WalletConnect explorer ids of the Stellar wallets that pair over WalletConnect. */
const STELLAR_WALLETCONNECT_IDS = [
	"76a3d548a08cf402f5c7d021f24fd2881d767084b387a5325df88bc3d4b6f21b", // LOBSTR
	"997a355c8f682468706a76cff1b004a7115f505fb962dac54b6e9b442dd1c380", // Freighter
];

/** The wallets the picker offers (`components/connect-wallet-button.tsx`). */
export type WalletId = "freighter" | "albedo" | "lobstr";

/** Our wallet ids → the kit's module ids. Freighter on a phone is the app, over WalletConnect. */
function moduleFor(walletId: WalletId) {
	if (walletId === "lobstr" || (walletId === "freighter" && isPhone())) return WALLETCONNECT_ID;
	return walletId;
}

let kitPromise: Promise<typeof Kit> | null = null;

function loadKit(): Promise<typeof Kit> {
	kitPromise ??= (async () => {
		const [{ StellarWalletsKit }, { defaultModules }, { Networks }, { WalletConnectModule, WalletConnectTargetChain }] =
			await Promise.all([
				import("@creit.tech/stellar-wallets-kit/sdk"),
				import("@creit.tech/stellar-wallets-kit/modules/utils"),
				import("@creit.tech/stellar-wallets-kit/types"),
				import("@creit.tech/stellar-wallets-kit/modules/wallet-connect"),
			]);
		const origin = window.location.origin;
		const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
		const modules: ModuleInterface[] = [
			...defaultModules(),
			new WalletConnectModule({
				projectId: WALLETCONNECT_PROJECT_ID,
				metadata: {
					name: "PayOrbit",
					description: "Receive payroll in USDC on Stellar",
					url: origin,
					icons: [`${origin}${base}/icons/icon-192.png`],
				},
				allowedChains: [WalletConnectTargetChain.TESTNET],
				// Only Stellar wallets, in PayOrbit's colours.
				appKitOptions: {
					includeWalletIds: STELLAR_WALLETCONNECT_IDS,
					featuredWalletIds: STELLAR_WALLETCONNECT_IDS,
					themeMode: "light",
					themeVariables: {
						"--w3m-accent": "#5501FF",
						"--w3m-font-family": "Inter, system-ui, sans-serif",
						"--w3m-border-radius-master": "4px",
					},
				} as never,
			}),
		];
		StellarWalletsKit.init({ modules, network: Networks.TESTNET });
		return StellarWalletsKit;
	})();
	// A failed load (offline, blocked script) shouldn't stick: the next tap tries again.
	kitPromise.catch(() => (kitPromise = null));
	return kitPromise;
}

/** Starts loading the kit (and WalletConnect's relay connection) ahead of the first tap. */
export function preloadWallets() {
	void loadKit().catch(() => undefined);
}

/**
 * WalletConnect's client reaches its relay a moment after the kit loads; asking it to connect
 * before that fails ("not been started yet"). Wait for it, up to 15 s.
 */
async function walletConnectReady(kit: typeof Kit) {
	const deadline = Date.now() + 15_000;
	while (!(await kit.selectedModule.isAvailable().catch(() => false))) {
		if (Date.now() > deadline)
			throw new Error("Phone wallets couldn’t be reached (WalletConnect didn’t start). Check your connection and try again.");
		await new Promise((resolve) => setTimeout(resolve, 250));
	}
}

/** AppKit's modal (WalletConnect), to notice when the person closes it. */
type AppKitLike = { subscribeState?: (callback: (state: { open: boolean }) => void) => () => void };

/** The kit waits forever if the WalletConnect modal is closed; a close (with no approval right after) rejects as a dismissal. */
async function fetchViaWalletConnect(kit: typeof Kit) {
	const modal = (kit.selectedModule as unknown as { modal?: AppKitLike }).modal;
	let unsubscribe = () => {};
	const closed = new Promise<never>((_, reject) => {
		let wasOpen = false;
		unsubscribe =
			modal?.subscribeState?.((state) => {
				if (state.open) wasOpen = true;
				else if (wasOpen) setTimeout(() => reject({ code: -1, message: "The wallet modal was closed." }), 1500);
			}) ?? (() => {});
	});
	try {
		return await Promise.race([kit.fetchAddress(), closed]);
	} finally {
		unsubscribe();
	}
}

/** The wallet's public address (G…). Addresses are the same on every network, so none is checked. */
export async function fetchWalletAddress(walletId: WalletId) {
	const kit = await loadKit();
	const moduleId = moduleFor(walletId);
	kit.setWallet(moduleId);
	// Without the extension, Freighter's own check never answers: give it 3 s, then call it not installed.
	if (moduleId === "freighter") {
		const installed = await Promise.race([
			kit.selectedModule.isAvailable().catch(() => false),
			new Promise<boolean>((resolve) => setTimeout(() => resolve(false), EXTENSION_CHECK_MS)),
		]);
		if (!installed) throw new Error("Freighter isn’t installed in this browser. Install the extension, or use Albedo or LOBSTR.");
	}
	if (moduleId === WALLETCONNECT_ID) await walletConnectReady(kit);
	const { address } = moduleId === WALLETCONNECT_ID ? await fetchViaWalletConnect(kit) : await kit.fetchAddress();
	// Only the address was needed: end the WalletConnect pairing so the next connect starts fresh.
	if (moduleId === WALLETCONNECT_ID) await kit.disconnect().catch(() => undefined);
	return address;
}

/** Real wallets reject with `{ code, message }` objects, not Errors. */
export function walletErrorMessage(error: unknown, fallback = "The wallet didn’t share an address.") {
	let message = "";
	if (error instanceof Error) message = error.message;
	else if (error && typeof error === "object" && "message" in error && typeof error.message === "string") message = error.message;
	// A bad WalletConnect project id surfaces as a relay socket error; an unlisted domain as an origin error.
	if (/project not found|unauthorized: invalid key/i.test(message)) {
		return "Phone wallets aren’t available right now (WalletConnect isn’t set up). Try Freighter or Albedo, or paste the address.";
	}
	if (/origin not allowed|not allowed origin|unauthorized origin/i.test(message)) {
		return "This site isn’t on the WalletConnect project’s allowed domains yet. Try Freighter or Albedo, or paste the address.";
	}
	return message || fallback;
}

/** Closing the picker or declining a prompt is a choice, not a failure. */
export function isWalletDismissal(error: unknown) {
	const message = walletErrorMessage(error, "");
	return (
		!message || /declin|reject|cancel|denied|(modal|popup|window) (was )?closed|user closed|closed by (the )?user/i.test(message)
	);
}
