"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ExternalLink, FileText, RotateCw, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@repo/ui/button";
import { toast } from "@repo/ui/sonner";
import { cn } from "@repo/ui/lib/utils";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { CopyButton, HashValue } from "@/components/hash";
import { AssetBadge, Money } from "@/components/money";
import { PaymentTimeline } from "@/components/payment-timeline";
import { DetailList, SectionCard } from "@/components/section-card";
import { PaymentStatusPill, TonePill } from "@/components/status-pill";
import { useRetryPayment } from "@/features/payroll/hooks";
import type { Transaction } from "@/features/payroll/types";
import { errorMessage, newIdempotencyKey } from "@/lib/api/request";
import { formatDateTime, formatMoney } from "@/lib/format";
import { routes } from "@/lib/routes";
import { MAX_RETRIES, canRetry, failureInfo, paymentExplorerUrl } from "@/lib/stellar";

/**
 * One payment, for an admin (employee, failure reason, retry, attempts, payroll link) or for the
 * employee it paid (status, amount, and how to verify it on Stellar). PRD §5, §7, §8.
 */
export function PaymentDetail({
	payment,
	audience,
	canRetryPayments,
}: {
	payment: Transaction;
	audience: "admin" | "employee";
	canRetryPayments?: boolean;
}) {
	const admin = audience === "admin";
	const failed = payment.status === "FAILED";
	const completed = payment.status === "CONFIRMED";
	const failure = failed ? failureInfo(payment) : null;
	const router = useRouter();
	// The dialog's idempotency key, made when it opens.
	const [retryKey, setRetryKey] = useState<string | null>(null);
	const confirmRetry = retryKey !== null;
	const setConfirmRetry = (open: boolean) => setRetryKey(open ? newIdempotencyKey() : null);
	const retry = useRetryPayment();
	const explorerUrl = paymentExplorerUrl(payment);
	const retryable = admin && canRetryPayments && canRetry(payment);
	const attempts = payment.attempts ?? [];

	const doRetry = () =>
		retry.mutate(
			{ id: payment.id, key: retryKey ?? newIdempotencyKey() },
			{
				onSuccess: (next) => {
					toast.success("Payment queued for retry", { description: "A new attempt is on its way; this one stays in its history." });
					setConfirmRetry(false);
					// A retry is a new transaction: follow it.
					if (next.id && next.id !== payment.id) router.replace(routes.transactions.detail(next.id));
				},
				onError: (error) => {
					// A repeated key replays the first response: the next try needs a new one.
					setRetryKey(newIdempotencyKey());
					toast.error(errorMessage(error, "Couldn't retry this payment"));
				},
			},
		);

	return (
		<div className="grid gap-6 lg:grid-cols-3">
			<div className="min-w-0 space-y-6 lg:col-span-2">
				<SectionCard>
					<div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
						<div>
							<p className="text-sm text-muted-foreground">
								{admin ? `Payment to ${payment.employee_name || "employee"}` : "Payment amount"}
							</p>
							<p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">
								<Money value={payment.amount} asset={payment.asset} />
							</p>
							<p className="mt-1 text-sm text-muted-foreground">{payment.payroll_run_name || "Payroll payment"}</p>
						</div>
						<PaymentStatusPill status={payment.status} className="self-start px-3 py-1 text-sm" />
					</div>
					<PaymentTimeline
						className="mt-8"
						status={payment.status}
						createdAt={payment.created_at}
						submittedAt={payment.submitted_at}
						confirmedAt={payment.confirmed_at}
					/>
				</SectionCard>

				{failure && (
					<div role="alert" className="animate-rise rounded-xl border border-destructive/25 bg-destructive/5 p-5">
						<div className="flex gap-3">
							<AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
							<div className="min-w-0 flex-1 space-y-2">
								<div className="flex flex-wrap items-center gap-2">
									<p className="font-semibold text-foreground">Payment failed</p>
									{admin && <TonePill label={failure.category} tone="danger" />}
								</div>
								{admin ? (
									<>
										<p className="text-sm text-foreground">{failure.summary}</p>
										<p className="text-sm text-muted-foreground">
											<span className="font-medium text-foreground">What to do: </span>
											{failure.action}
										</p>
										{payment.error_message && (
											<p className="rounded-md bg-card/70 px-3 py-2 font-mono text-xs wrap-break-word text-muted-foreground">
												{payment.error_message}
											</p>
										)}
										<div className="flex flex-wrap gap-2 pt-1">
											{failure.needsEmployeeFix && payment.employee_id && (
												<Button asChild variant="outline" size="sm">
													<Link href={routes.employees.edit(payment.employee_id)}>
														<UserRound /> Fix employee details
													</Link>
												</Button>
											)}
											{failure.kind === "balance" && (
												<Button asChild variant="outline" size="sm">
													<Link href={routes.dashboardRoutes.WALLETS}>Fund wallet</Link>
												</Button>
											)}
											{retryable && (
												<Button size="sm" onClick={() => setConfirmRetry(true)}>
													<RotateCw /> Retry payment
												</Button>
											)}
										</div>
										{admin && !canRetry(payment) && (
											<p className="text-xs text-muted-foreground">
												This payment has used all {MAX_RETRIES} attempts. Create a new payroll to pay it.
											</p>
										)}
									</>
								) : (
									<p className="text-sm text-muted-foreground">
										This payment didn&apos;t go through. Your employer has been notified and can send it again; you don&apos;t
										need to do anything.
									</p>
								)}
							</div>
						</div>
					</div>
				)}

				<SectionCard title="Transaction details">
					<DetailList
						columns={2}
						items={[
							{ label: "Employee", value: payment.employee_name || "--", hidden: !admin },
							{ label: "Amount", value: formatMoney(payment.amount, payment.asset, { withCode: payment.asset === "USDC" }) },
							{ label: "Asset", value: <AssetBadge asset={payment.asset} /> },
							{ label: "Date & time", value: formatDateTime(payment.confirmed_at ?? payment.submitted_at ?? payment.created_at) },
							{ label: "Status", value: <PaymentStatusPill status={payment.status} /> },
							{
								label: "Payroll cycle",
								value: admin ? (
									<Link href={routes.payroll.detail(payment.payroll_run_id)} className="font-medium text-primary hover:underline">
										{payment.payroll_run_name || "View payroll"}
									</Link>
								) : (
									payment.payroll_run_name || "--"
								),
							},
							{ label: "Transaction hash", value: <HashValue value={payment.stellar_tx_hash} /> },
							{ label: "Ledger", value: payment.ledger_sequence ? `#${payment.ledger_sequence.toLocaleString("en-US")}` : "--" },
							{ label: "Network fee", value: payment.fee_amount ? `${payment.fee_amount} XLM` : "--", hidden: !admin },
							{ label: "Attempts", value: `${Math.max(1, payment.attempts?.length ?? payment.retry_count + 1)} of ${MAX_RETRIES}`, hidden: !admin },
							{ label: "From", value: <HashValue value={payment.from_address} kind="account" />, hidden: !admin },
							{ label: "To wallet", value: <HashValue value={payment.to_address || null} kind="account" /> },
						]}
					/>
				</SectionCard>

				{admin && attempts.length > 0 && (
					<SectionCard title="Attempts" description="Each try keeps its own result, so a retry never hides the earlier failure.">
						<ol className="space-y-3">
							{[...attempts].reverse().map((a) => (
								<li key={`${a.attempt}-${a.at}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
									<span
										className={cn("size-2 rounded-full", a.status === "CONFIRMED" ? "bg-success" : "bg-destructive")}
										aria-hidden
									/>
									<span className="font-medium">Attempt {a.attempt}</span>
									<span className={a.status === "CONFIRMED" ? "text-success" : "text-destructive"}>
										{a.status === "CONFIRMED" ? "Completed" : "Failed"}
									</span>
									<span className="text-muted-foreground">{formatDateTime(a.at)}</span>
									{a.stellar_tx_hash ? (
										<HashValue value={a.stellar_tx_hash} />
									) : (
										a.error && <span className="w-full pl-5 text-xs text-muted-foreground">{failureInfo({ failure_code: a.failure_code, error_message: a.error }).summary}</span>
									)}
								</li>
							))}
						</ol>
					</SectionCard>
				)}
			</div>

			<div className="space-y-6">
				<SectionCard title={admin ? "On-chain verification" : "Verify your transaction"}>
					{completed && payment.stellar_tx_hash ? (
						<div className="space-y-4">
							<div className="flex items-start gap-3 rounded-lg bg-success/8 p-3">
								<ShieldCheck className="mt-0.5 size-5 shrink-0 text-success" />
								<p className="text-sm text-foreground">
									Confirmed on the Stellar network
									{payment.ledger_sequence ? ` in ledger #${payment.ledger_sequence.toLocaleString("en-US")}` : ""}. Anyone can
									check it with the transaction hash.
								</p>
							</div>
							<div>
								<p className="text-xs font-medium text-muted-foreground">Transaction hash</p>
								<div className="mt-1 flex items-start gap-1">
									<p className="min-w-0 flex-1 rounded-md bg-muted px-2.5 py-2 font-mono text-xs break-all">
										{payment.stellar_tx_hash}
									</p>
									<CopyButton value={payment.stellar_tx_hash} label="Copy transaction hash" />
								</div>
							</div>
							<Button asChild className="w-full">
								<a href={explorerUrl ?? "#"} target="_blank" rel="noreferrer">
									View on Stellar Expert <ExternalLink />
								</a>
							</Button>
							<p className="text-center text-xs text-muted-foreground">Stellar Testnet</p>
						</div>
					) : (
						<p className="text-sm text-muted-foreground">
							{failed
								? "Failed payments are never recorded on the network, so there's nothing to verify."
								: "The transaction hash appears here once the payment is sent. It usually takes a few seconds."}
						</p>
					)}
				</SectionCard>
				{admin && (
					<Button asChild variant="outline" className="w-full">
						<Link href={routes.payroll.detail(payment.payroll_run_id)}>
							<FileText /> View payroll
						</Link>
					</Button>
				)}
			</div>

			<ConfirmDialog
				open={confirmRetry}
				onOpenChange={setConfirmRetry}
				title="Retry this payment?"
				description={`${formatMoney(payment.amount, payment.asset)} will be sent again to ${payment.employee_name || "the employee"}. Make sure the cause is fixed first: ${failure?.action ?? ""}`}
				confirmLabel="Retry payment"
				loading={retry.isPending}
				onConfirm={doRetry}
			/>
		</div>
	);
}
