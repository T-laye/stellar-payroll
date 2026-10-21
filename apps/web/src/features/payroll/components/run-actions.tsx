"use client";

import { useState } from "react";
import { CalendarCheck, Loader2, RotateCw, Send, XCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@repo/ui/button";
import { toast } from "@repo/ui/sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { hasAnyPermission, useAuthStore } from "@/features/auth/store";
import { retryTransaction } from "@/features/payroll/api";
import {
	refreshPayroll,
	useApproveRun,
	useCancelRun,
	useLineItems,
	usePayNow,
	useRunTransactions,
} from "@/features/payroll/hooks";
import { isIncomplete } from "@/features/payroll/components/payroll-review";
import type { PayrollRun } from "@/features/payroll/types";
import { errorMessage } from "@/lib/api/request";
import { formatDateTime, formatMoney } from "@/lib/format";
import { runPhase } from "@/lib/status";
import { canRetry } from "@/lib/stellar";

type Dialog = "schedule" | "pay" | "cancel" | "retry" | null;

/**
 * What can happen to a run next, for this user: approve it for its date, pay it now, cancel it,
 * or retry its failed payments. Every money-moving step is confirmed first.
 */
export function RunActions({ run }: { run: PayrollRun }) {
	const user = useAuthStore((state) => state.user);
	const canApprove = hasAnyPermission(user, ["payroll:approve"]);
	const canExecute = hasAnyPermission(user, ["payroll:execute"]);
	const canCancel = hasAnyPermission(user, ["payroll:cancel"]);
	const phase = runPhase(run);
	const items = useLineItems(run.status === "DRAFT" ? run.id : undefined);
	const txs = useRunTransactions(phase === "failed" ? run.id : undefined);
	const approve = useApproveRun();
	const payNow = usePayNow();
	const cancel = useCancelRun();
	const queryClient = useQueryClient();
	const [dialog, setDialog] = useState<Dialog>(null);
	const [retrying, setRetrying] = useState(false);

	const incomplete = (items.data ?? []).filter(isIncomplete).length;
	const empty = run.status === "DRAFT" && (items.data?.length ?? 0) === 0;
	const blocked = incomplete > 0 || empty;
	const retryable = (txs.data ?? []).filter(canRetry);
	const total = formatMoney(run.total_amount, run.currency);
	const people = run.employee_count ?? items.data?.length ?? 0;

	const close = () => setDialog(null);
	const fail = (error: unknown) => toast.error(errorMessage(error));

	const retryAll = async () => {
		setRetrying(true);
		let done = 0;
		try {
			// One at a time: each retry is its own payment, and a failure shouldn't hide the rest.
			for (const t of retryable) {
				await retryTransaction(t.id);
				done++;
			}
			toast.success(`${done} payment${done === 1 ? "" : "s"} queued for retry`);
			close();
		} catch (error) {
			toast.error(`${done} queued, then: ${errorMessage(error)}`);
		} finally {
			setRetrying(false);
			refreshPayroll(queryClient);
		}
	};

	return (
		<>
			{run.status === "DRAFT" && canCancel && (
				<Button
					variant="ghost"
					className="text-destructive hover:bg-destructive/10 hover:text-destructive"
					onClick={() => setDialog("cancel")}
				>
					<XCircle /> Cancel run
				</Button>
			)}
			{phase === "scheduled" && canCancel && (
				<Button variant="outline" onClick={() => setDialog("cancel")}>
					<XCircle /> Cancel
				</Button>
			)}
			{run.status === "DRAFT" && canApprove && (
				<Button
					variant="outline"
					disabled={blocked}
					onClick={() => setDialog("schedule")}
					title={blocked ? "Fix the incomplete payment information first" : undefined}
				>
					<CalendarCheck /> Approve &amp; schedule
				</Button>
			)}
			{(run.status === "DRAFT" ? canApprove && canExecute : phase === "scheduled" && canExecute) && (
				<Button
					disabled={blocked}
					onClick={() => setDialog("pay")}
					title={blocked ? "Fix the incomplete payment information first" : undefined}
				>
					<Send /> {run.status === "DRAFT" ? "Approve & pay now" : "Pay now"}
				</Button>
			)}
			{phase === "failed" && canExecute && retryable.length > 0 && (
				<Button onClick={() => setDialog("retry")}>
					<RotateCw /> Retry {retryable.length} failed
				</Button>
			)}

			<ConfirmDialog
				open={dialog === "schedule"}
				onOpenChange={(open) => !open && close()}
				title="Approve this payroll?"
				description={`${total} to ${people} employee${people === 1 ? "" : "s"} will be paid automatically on ${formatDateTime(run.scheduled_at)}. You can still cancel it before then.`}
				confirmLabel="Approve & schedule"
				loading={approve.isPending}
				onConfirm={() =>
					approve.mutate(run.id, {
						onSuccess: () => {
							toast.success("Payroll approved", { description: `It will be paid on ${formatDateTime(run.scheduled_at)}.` });
							close();
						},
						onError: fail,
					})
				}
			/>
			<ConfirmDialog
				open={dialog === "pay"}
				onOpenChange={(open) => !open && close()}
				title="Send these payments now?"
				description={`${total} will be sent to ${people} employee${people === 1 ? "" : "s"} on the Stellar network. Payments can't be reversed once confirmed.`}
				confirmLabel={`Pay ${total}`}
				loading={payNow.isPending}
				onConfirm={() =>
					payNow.mutate(run, {
						onSuccess: () => {
							toast.success("Payroll is processing", { description: "Payments settle in a few seconds." });
							close();
						},
						onError: fail,
					})
				}
			/>
			<ConfirmDialog
				open={dialog === "cancel"}
				onOpenChange={(open) => !open && close()}
				title="Cancel this payroll?"
				description="No payments will be sent. The run stays in your history as cancelled."
				confirmLabel="Cancel payroll"
				tone="destructive"
				loading={cancel.isPending}
				onConfirm={() =>
					cancel.mutate(run.id, {
						onSuccess: () => {
							toast.success("Payroll cancelled");
							close();
						},
						onError: fail,
					})
				}
			/>
			<ConfirmDialog
				open={dialog === "retry"}
				onOpenChange={(open) => !open && close()}
				title={`Retry ${retryable.length} failed payment${retryable.length === 1 ? "" : "s"}?`}
				description="Each failed payment is sent again. Fix missing wallets or fund the operational wallet first, or they will fail again."
				confirmLabel="Retry payments"
				loading={retrying}
				onConfirm={retryAll}
			/>
			{(approve.isPending || payNow.isPending) && (
				<Loader2 className="size-4 animate-spin text-muted-foreground" aria-label="Working" />
			)}
		</>
	);
}
