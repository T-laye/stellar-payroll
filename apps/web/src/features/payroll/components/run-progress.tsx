"use client";

import { CheckCircle2, Clock, Coins, XCircle } from "lucide-react";
import { Progress } from "@repo/ui/progress";
import { StatCard } from "@/components/stat-card";
import { SectionCard } from "@/components/section-card";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/states";
import { TransactionsTable } from "@/features/payroll/components/transactions-table";
import { useRunTransactions } from "@/features/payroll/hooks";
import type { PayrollRun } from "@/features/payroll/types";
import { sumAmounts } from "@/lib/decimal";
import { formatMoney } from "@/lib/format";

/**
 * A run's payments as they settle: totals by state, a progress bar while it pays out, and every
 * payment with its status, hash and failure reason (PRD §7). Polls until nothing is in flight.
 */
export function RunProgress({
	run,
	canRetryPayments,
	showStats = true,
}: {
	run: PayrollRun;
	canRetryPayments?: boolean;
	showStats?: boolean;
}) {
	const live = run.status === "PROCESSING" || run.status === "RETRYING";
	const { data, isLoading, isError, refetch } = useRunTransactions(run.id, live);
	const list = data ?? [];
	const confirmed = list.filter((t) => t.status === "CONFIRMED");
	const failed = list.filter((t) => t.status === "FAILED");
	const pending = list.length - confirmed.length - failed.length;
	const settled = confirmed.length + failed.length;
	const percent = list.length ? Math.round((settled / list.length) * 100) : 0;
	const paid = sumAmounts(confirmed.map((t) => t.amount));

	return (
		<div className="space-y-6">
			{showStats && (
				<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
					<StatCard
						index={0}
						label="Total Amount"
						icon={Coins}
						value={formatMoney(run.total_amount, run.currency)}
						hint={`${formatMoney(paid, run.currency)} paid so far`}
					/>
					<StatCard
						index={1}
						label="Successful"
						icon={CheckCircle2}
						tone="success"
						value={confirmed.length}
						loading={isLoading}
					/>
					<StatCard index={2} label="Pending" icon={Clock} tone="warning" value={pending} loading={isLoading} />
					<StatCard
						index={3}
						label="Failed"
						icon={XCircle}
						tone="danger"
						value={failed.length}
						loading={isLoading}
						hint={failed.length ? "See the reasons below" : undefined}
					/>
				</div>
			)}

			{live && list.length > 0 && (
				<div className="animate-rise rounded-xl border border-info/25 bg-info/5 p-4">
					<div className="mb-2 flex items-center justify-between text-sm">
						<span className="flex items-center gap-2 font-medium text-foreground">
							<span className="animate-signal size-2 rounded-full bg-info text-info" aria-hidden />
							Sending payments on Stellar…
						</span>
						<span className="text-muted-foreground tabular-nums">
							{settled} / {list.length} settled
						</span>
					</div>
					<Progress value={percent} className="h-2" />
				</div>
			)}

			<SectionCard
				title="Payments"
				description={list.length ? `${list.length} payment${list.length === 1 ? "" : "s"}` : undefined}
				flush
			>
				{isLoading ? (
					<TableSkeleton rows={4} />
				) : isError ? (
					<ErrorState message="We couldn't load this run's payments." onRetry={() => refetch()} />
				) : list.length === 0 ? (
					<EmptyState
						compact
						icon={Clock}
						title="No payments yet"
						description="Payments are created when the run starts paying out."
					/>
				) : (
					<TransactionsTable payments={list} showRun={false} canRetryPayments={canRetryPayments} />
				)}
			</SectionCard>
		</div>
	);
}
