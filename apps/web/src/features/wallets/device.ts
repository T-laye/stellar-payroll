import { useSyncExternalStore } from "react";

/**
 * Phones and tablets have no browser extensions: a wallet there is an app, reached over
 * WalletConnect (a deep link into the app). iPadOS reports a desktop Mac user agent, so it's
 * caught by touch support.
 */
export function isPhone() {
	return (
		typeof navigator !== "undefined" &&
		(/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
			(/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1))
	);
}

const noop = () => () => {};

/** `isPhone()` for rendering: false on the server and first paint, then the real answer. */
export function useIsPhone() {
	return useSyncExternalStore(noop, isPhone, () => false);
}
