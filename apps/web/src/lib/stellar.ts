/**
 * Stellar helpers for display: explorer links (Stellar Expert, Testnet for this MVP), short
 * hashes and addresses, the fee estimate on the payroll review, and why a payment failed.
 */

export const STELLAR_NETWORK = "testnet" as const;

const EXPLORER = `https://stellar.expert/explorer/${STELLAR_NETWORK}`;

export const explorerTxUrl = (hash: string) => `${EXPLORER}/tx/${hash}`;
export const explorerAccountUrl = (address: string) => `${EXPLORER}/account/${address}`;

/** "0x9f1…a3e2"-style middle truncation. */
export function shortHash(value: string | null | undefined, head = 6, tail = 4) {
	if (!value) return "--";
	return value.length <= head + tail + 1 ? value : `${value.slice(0, head)}…${value.slice(-tail)}`;
}

/** Horizon calls lumens "native"; people know them as XLM. */
export const assetCode = (asset: string) => (asset === "native" ? "XLM" : asset);

const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/** A real G… public key: the right shape, the account version byte and a matching CRC16 checksum. */
export function isStellarAddress(value: string) {
	const text = value.trim();
	if (!/^G[A-Z2-7]{55}$/.test(text)) return false;
	const bytes: number[] = [];
	let buffer = 0;
	let bits = 0;
	for (const char of text) {
		buffer = (buffer << 5) | BASE32.indexOf(char);
		bits += 5;
		if (bits >= 8) {
			bytes.push((buffer >>> (bits - 8)) & 255);
			bits -= 8;
			buffer &= (1 << bits) - 1;
		}
	}
	let crc = 0;
	for (const byte of bytes.slice(0, 33)) {
		crc ^= byte << 8;
		for (let i = 0; i < 8; i++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
	}
	return bytes[0] === 6 << 3 && bytes[33] === (crc & 255) && bytes[34] === crc >> 8;
}

/**
 * Network fees for a payroll: Stellar charges the base fee (100 stroops = 0.00001 XLM) per
 * operation, and a transaction carries up to 100 payment operations. Settlement takes a ledger
 * close (~5 s) per transaction.
 */
export function estimatePayout(paymentCount: number) {
	const transactions = Math.max(1, Math.ceil(paymentCount / 100));
	return {
		transactions,
		feeXlm: (paymentCount * 0.00001).toFixed(5),
		seconds: transactions * 5,
	};
}

export type FailureKind = "wallet" | "trustline" | "balance" | "network" | "transaction";

export interface FailureInfo {
	kind: FailureKind;
	/** The PRD's category. */
	category: string;
	/** What happened, in plain words. */
	summary: string;
	/** What the admin can do about it. */
	action: string;
	/** Whether the employee record needs fixing before a retry can work. */
	needsEmployeeFix: boolean;
}

const FAILURES: Record<FailureKind, FailureInfo> = {
	wallet: {
		kind: "wallet",
		category: "Invalid wallet / payment details",
		summary: "The destination account doesn't exist on Stellar, or the employee has no wallet.",
		action: "Fix the employee's wallet address, then retry.",
		needsEmployeeFix: true,
	},
	trustline: {
		kind: "trustline",
		category: "Invalid wallet / payment details",
		summary: "The employee's wallet can't hold this asset yet: it has no trustline for it.",
		action: "Ask the employee to add a USDC trustline to their wallet, then retry.",
		needsEmployeeFix: true,
	},
	balance: {
		kind: "balance",
		category: "Insufficient balance",
		summary: "The company wallet didn't have enough funds for this payment.",
		action: "Fund the operational wallet, then retry.",
		needsEmployeeFix: false,
	},
	network: {
		kind: "network",
		category: "Network / processing error",
		summary: "A temporary network problem stopped the payment.",
		action: "This is usually transient. Retry the payment.",
		needsEmployeeFix: false,
	},
	transaction: {
		kind: "transaction",
		category: "Transaction failure",
		summary: "The network rejected the transaction.",
		action: "Check the details below and retry.",
		needsEmployeeFix: false,
	},
};

const NO_PAYOUT_WALLET: FailureInfo = {
	kind: "balance",
	category: "No operational wallet",
	summary: "The company has no operational wallet to pay from.",
	action: "Add an operational wallet on the Wallets page and fund it, then retry.",
	needsEmployeeFix: false,
};

const CODE_TO_KIND: Record<string, FailureKind> = {
	INVALID_WALLET: "wallet",
	NO_TRUSTLINE: "trustline",
	INSUFFICIENT_BALANCE: "balance",
	NETWORK_ERROR: "network",
	TRANSACTION_FAILED: "transaction",
};

/**
 * Why a payment failed. Uses `failure_code` (proposed, docs/PLAN.md §8) when present, otherwise
 * reads the Horizon result code in the API's free-text `error_message`.
 */
export function failureInfo(payment: { failure_code?: string | null; error_message?: string | null }): FailureInfo {
	// Older payments file this under INSUFFICIENT_BALANCE, but funding the wallet they have won't help.
	if (payment.failure_code === "NO_OPERATIONAL_WALLET" || /no operational wallet/i.test(payment.error_message ?? "")) return NO_PAYOUT_WALLET;
	const byCode = payment.failure_code ? CODE_TO_KIND[payment.failure_code] : undefined;
	if (byCode) return FAILURES[byCode];
	const message = (payment.error_message ?? "").toLowerCase();
	if (/no_destination|invalid destination|no stellar wallet|wallet/.test(message)) return FAILURES.wallet;
	if (/no_trust|trustline|does not trust/.test(message)) return FAILURES.trustline;
	if (/underfunded|insufficient/.test(message)) return FAILURES.balance;
	if (/timeout|timed out|tx_too_late|network/.test(message)) return FAILURES.network;
	return FAILURES.transaction;
}

/** Retries are capped at 5 attempts per payment; after that `retryable` turns false. */
export const MAX_RETRIES = 5;

/** Show Retry only when the API says the payment is retryable (older rows: failed and under the cap). */
export const canRetry = (payment: { status: string; retryable?: boolean; retry_count?: number }) =>
	payment.retryable ?? (payment.status === "FAILED" && (payment.retry_count ?? 0) < MAX_RETRIES - 1);

/** The API's explorer link when it sends one, else Stellar Expert (Testnet). */
export const paymentExplorerUrl = (payment: { explorer_url?: string | null; stellar_tx_hash?: string | null }) =>
	payment.explorer_url || (payment.stellar_tx_hash ? explorerTxUrl(payment.stellar_tx_hash) : null);
