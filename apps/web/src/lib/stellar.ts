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

export const isStellarAddress = (value: string) => /^G[A-Z2-7]{55}$/.test(value.trim());

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
		summary: "The employee has no valid Stellar wallet to receive the payment.",
		action: "Add or correct the employee's wallet address, then retry.",
		needsEmployeeFix: true,
	},
	trustline: {
		kind: "trustline",
		category: "Invalid wallet / payment details",
		summary: "The employee's wallet can't hold this asset yet (no trustline).",
		action: "Ask the employee to add the asset to their wallet, or pay in XLM, then retry.",
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
		summary: "The network didn't confirm the payment in time.",
		action: "Nothing was sent. Retry the payment.",
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
	const byCode = payment.failure_code ? CODE_TO_KIND[payment.failure_code] : undefined;
	if (byCode) return FAILURES[byCode];
	const message = (payment.error_message ?? "").toLowerCase();
	if (/no_destination|invalid destination|no stellar wallet|wallet/.test(message)) return FAILURES.wallet;
	if (/no_trust|trustline|does not trust/.test(message)) return FAILURES.trustline;
	if (/underfunded|insufficient/.test(message)) return FAILURES.balance;
	if (/timeout|timed out|tx_too_late|network/.test(message)) return FAILURES.network;
	return FAILURES.transaction;
}

/** The API allows three retries per payment. */
export const MAX_RETRIES = 3;

export const canRetry = (payment: { status: string; retry_count?: number }) =>
	payment.status === "FAILED" && (payment.retry_count ?? 0) < MAX_RETRIES;
