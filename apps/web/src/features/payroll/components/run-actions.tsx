"use client";

import { useState } from "react";
import { CalendarCheck, Loader2, RotateCw, Send, XCircle } from "lucide-react";
import { Button } from "@repo/ui/button";
import { toast } from "@repo/ui/sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { hasAnyPermission, useAuthStore } from "@/features/auth/store";
import { useApproveRun, useCancelRun, usePayNow, useRetryFailed, useRunReview, useRunTransactions } from "@/features/payroll/hooks";
import type { PayrollRun } from "@/features/payroll/types";
import { walletIssue } from "@/features/payroll/normalize";
import { blockingIssues, errorMessage, newIdempotencyKey } from "@/lib/api/request";
import { formatDateTime, formatMoney } from "@/lib/format";
import { runPhase } from "@/lib/status";
import { canRetry } from "@/lib/stellar";
import { useMountTime } from "@/lib/use-now";

type Dialog = "schedule" | "pay" | "cancel" | "retry" | null;

/** A refused approval or payment names what is blocking it (409 `data.issues[]`). */
export function toastPayrollError(error: unknown, fallback: string) {
	const issues = blockingIssues(error);
	if (issues.length) {
		toast.error(errorMessage(error, fallback), {
			description: issues.map((i) => (i.employee_name ? `${i.employee_name}: ${i.reason}` : i.reason)).join(" · "),
		});
	} else {
		toast.error(errorMessage(error, fallback));
	}
}

/**
 * What can happen to a run next, for this user: approve it for its date, pay it now, cancel it,
 * or retry its failed payments. Every money-moving step is confirmed first, and each dialog makes
 * its idempotency key when it opens, so a double click can't send twice.
 */
export function RunActions({ run }: { run: PayrollRun }) {
	const user = useAuthStore((state) => state.user);
	const canApprove = hasAnyPermission(user, ["payroll:approve"]);
	const canExecute = hasAnyPermission(user, ["payroll:execute"]);
	const canCancel = hasAnyPermission(user, ["payroll:cancel"]);
	const phase = runPhase(run);
	const review = useRunReview(run.status === "DRAFT" || run.status === "APPROVED" ? run.id : undefined);
	const txs = useRunTransactions(phase === "failed" ? run.id : undefined);
	const approve = useApproveRun();
	const payNow = usePayNow();
	const cancel = useCancelRun();
	const retryFailed = useRetryFailed();
	const [dialog, setDialog] = useState<{ kind: Dialog; key: string }>({ kind: null, key: "" });
	const now = useMountTime();

	const companyIssue = walletIssue(review.data);
	const blocked = (run.status === "DRAFT" && !review.data?.ready) || !!companyIssue;
	const retryable = (txs.data ?? []).filter(canRetry);
	const total = formatMoney(run.total_amount, run.currency);
	const people = run.employee_count ?? review.data?.employee_count ?? 0;
	const payDatePassed = Date.parse(run.scheduled_at) <= now;
	const blockedTitle = companyIssue?.reason ?? (blocked ? "Fix the incomplete payment information first" : undefined);

	const open = (kind: Exclude<Dialog, null>) => setDialog({ kind, key: newIdempotencyKey() });
	const close = () => setDialog({ kind: null, key: "" });
	// A repeated key replays the first response for 24 h, so a retry after a failure needs a new one.
	const renewKey = () => setDialog((current) => (current.kind ? { ...current, key: newIdempotencyKey() } : current));

	return (
		<>
			{(run.status === "DRAFT" || phase === "scheduled" || phase === "awaiting") && canCancel && (
				<Button
					variant={run.status === "DRAFT" ? "ghost" : "outline"}
					className={run.status === "DRAFT" ? "text-destructive hover:bg-destructive/10 hover:text-destructive" : undefined}
					onClick={() => open("cancel")}
				>
					<XCircle /> {run.status === "DRAFT" ? "Cancel run" : "Cancel"}
				</Button>
			)}
			{run.status === "DRAFT" && canApprove && (
				<Button variant="outline" disabled={blocked} onClick={() => open("schedule")} title={blockedTitle}>
					<CalendarCheck /> {payDatePassed ? "Approve" : "Approve & schedule"}
				</Button>
			)}
			{(run.status === "DRAFT" ? canApprove && canExecute : (phase === "scheduled" || phase === "awaiting") && canExecute) && (
				<Button disabled={blocked} onClick={() => open("pay")} title={blockedTitle}>
					<Send /> {run.status === "DRAFT" ? "Approve & pay now" : "Pay now"}
				</Button>
			)}
			{phase === "failed" && canExecute && retryable.length > 0 && (
				<Button onClick={() => open("retry")}>
					<RotateCw /> Retry {retryable.length} failed
				</Button>
			)}

			<ConfirmDialog
				open={dialog.kind === "schedule"}
				onOpenChange={(next) => !next && close()}
				title="Approve this payroll?"
				description={
					payDatePassed
						? `Its pay date (${formatDateTime(run.scheduled_at)}) has passed, so it won't be paid automatically. After approving, use Pay now to send ${total}.`
						: `${total} to ${people} employee${people === 1 ? "" : "s"} will be paid automatically on ${formatDateTime(run.scheduled_at)}. You can still cancel it before then.`
				}
				confirmLabel={payDatePassed ? "Approve" : "Approve & schedule"}
				loading={approve.isPending}
				onConfirm={() =>
					approve.mutate(
						{ id: run.id, key: dialog.key },
						{
							onSuccess: () => {
								toast.success("Payroll approved", {
									description: payDatePassed ? "Pay it now to send the payments." : `It will be paid on ${formatDateTime(run.scheduled_at)}.`,
								});
								close();
							},
							onError: (error) => {
								renewKey();
								toastPayrollError(error, "Couldn't approve this payroll");
							},
						},
					)
				}
			/>
			<ConfirmDialog
				open={dialog.kind === "pay"}
				onOpenChange={(next) => !next && close()}
				title="Send these payments now?"
				description={`${total} will be sent to ${people} employee${people === 1 ? "" : "s"} on the Stellar network. Payments can't be reversed once confirmed.`}
				confirmLabel={`Pay ${total}`}
				loading={payNow.isPending}
				onConfirm={() =>
					payNow.mutate(
						{ run, key: dialog.key },
						{
							onSuccess: () => {
								toast.success("Payroll is processing", { description: "Payments settle in a few seconds." });
								close();
							},
							onError: (error) => {
								renewKey();
								toastPayrollError(error, "Couldn't start this payroll");
							},
						},
					)
				}
			/>
			<ConfirmDialog
				open={dialog.kind === "cancel"}
				onOpenChange={(next) => !next && close()}
				title="Cancel this payroll?"
				description="No payments will be sent. The run stays in your history as cancelled."
				confirmLabel="Cancel payroll"
				tone="destructive"
				loading={cancel.isPending}
				onConfirm={() =>
					cancel.mutate(
						{ id: run.id, key: dialog.key },
						{
							onSuccess: () => {
								toast.success("Payroll cancelled");
								close();
							},
							onError: (error) => {
								renewKey();
								toast.error(errorMessage(error));
							},
						},
					)
				}
			/>
			<ConfirmDialog
				open={dialog.kind === "retry"}
				onOpenChange={(next) => !next && close()}
				title={`Retry ${retryable.length} failed payment${retryable.length === 1 ? "" : "s"}?`}
				description="Each is sent again as a new attempt. Fix missing wallets or fund the operational wallet first, or they will fail again."
				confirmLabel="Retry payments"
				loading={retryFailed.isPending}
				onConfirm={() =>
					retryFailed.mutate(
						{ runId: run.id, key: dialog.key },
						{
							onSuccess: (result) => {
								toast.success(`${result.retried} payment${result.retried === 1 ? "" : "s"} queued for retry`);
								close();
							},
							onError: (error) => {
								renewKey();
								toast.error(errorMessage(error, "Couldn't retry these payments"));
							},
						},
					)
				}
			/>
			{(approve.isPending || payNow.isPending) && <Loader2 className="size-4 animate-spin text-muted-foreground" aria-label="Working" />}
		</>
	);
}
