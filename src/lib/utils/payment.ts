import { type PayrollTransaction } from "@/services/payroll.service";

export function processPayment(
	transaction: PayrollTransaction,
): PayrollTransaction {
	const statuses = ["PENDING", "PROCESSING", "COMPLETED", "FAILED"] as const;
	const nextStatus = statuses[Math.floor(Math.random() * statuses.length)];

	return {
		...transaction,
		status: nextStatus,
		stellar_tx_hash:
			nextStatus === "COMPLETED"
				? generateStellarTransaction()
				: transaction.stellar_tx_hash,
		confirmed_at:
			nextStatus === "COMPLETED"
				? new Date().toISOString()
				: transaction.confirmed_at,
	};
}

export function generateStellarTransaction(): string {
	return `GBUL${Math.random().toString(36).substring(2, 15).toUpperCase()}${Math.random().toString(36).substring(2, 15).toUpperCase()}`;
}

export function formatCurrency(
	amount: number | string,
	currency: string = "USD",
): string {
	const numericAmount =
		typeof amount === "number" ? amount : Number.parseFloat(amount);

	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency,
	}).format(Number.isFinite(numericAmount) ? numericAmount : 0);
}

function parseTransactionAmount(transaction: PayrollTransaction) {
	const amount = Number.parseFloat(transaction.amount);
	return Number.isFinite(amount) ? amount : 0;
}

export function calculatePayrollTotals(transactions: PayrollTransaction[]) {
	return {
		pending: transactions
			.filter((transaction) => transaction.status === "PENDING")
			.reduce((sum, transaction) => sum + parseTransactionAmount(transaction), 0),
		processing: transactions
			.filter((transaction) => transaction.status === "PROCESSING")
			.reduce((sum, transaction) => sum + parseTransactionAmount(transaction), 0),
		completed: transactions
			.filter((transaction) => transaction.status === "COMPLETED")
			.reduce((sum, transaction) => sum + parseTransactionAmount(transaction), 0),
		failed: transactions
			.filter((transaction) => transaction.status === "FAILED")
			.reduce((sum, transaction) => sum + parseTransactionAmount(transaction), 0),
	};
}
