"use client";

import { useEffect, useMemo, useState } from "react";
import {
	AlertCircle,
	CheckCircle,
	Clock,
	Copy,
	ExternalLink,
	Filter,
	Loader2,
	ReceiptText,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import EmptyState from "@/components/shared/EmptyState";
import FadeUp from "@/components/shared/FadeUp";
import StatusBadge from "@/components/shared/StatusBadge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
	useCompanyPayrollGroups,
	usePayrollRunTransactions,
	usePayrollRuns,
} from "@/hooks/payroll.hook";
import { useCompanyTransactionStats } from "@/hooks/stats.hook";
import { usePayrollStore } from "@/lib/stores/payroll-store";
import { cn } from "@/lib/utils";
import {
	formatStatAmount,
	formatStatDate,
	formatStatLabel,
	formatStatNumber,
	formatStatPercent,
	sumStatRecord,
} from "@/lib/utils/stats";
import { toast } from "sonner";

function formatDateTime(value: string | null | undefined) {
	if (!value) {
		return "Not available";
	}

	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return "Not available";
	}

	return date.toLocaleString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit",
	});
}

export default function PaymentsPage() {
	const groups = usePayrollStore((state) => state.groups);
	const runs = usePayrollStore((state) => state.runs);
	const runTransactions = usePayrollStore((state) => state.runTransactions);

	const groupsQuery = useCompanyPayrollGroups();
	const runsQuery = usePayrollRuns();
	const transactionStatsQuery = useCompanyTransactionStats();

	const [selectedRunId, setSelectedRunId] = useState<string>("");
	const [selectedStatus, setSelectedStatus] = useState("all");

	useEffect(() => {
		if (!selectedRunId && runs.length > 0) {
			setSelectedRunId(runs[0].id);
		}
	}, [runs, selectedRunId]);

	const selectedRun = runs.find((run) => run.id === selectedRunId);
	const transactionsQuery = usePayrollRunTransactions(selectedRunId || undefined);
	const transactionStats = transactionStatsQuery.data?.data;
	const transactionStatuses = Object.entries(transactionStats?.by_status ?? {});
	const assetVolumes = transactionStats?.volume_by_asset ?? [];
	const transactions = selectedRunId ? runTransactions[selectedRunId] ?? [] : [];
	const filteredTransactions = useMemo(
		() =>
			selectedStatus === "all"
				? transactions
				: transactions.filter(
						(transaction) => transaction.status.toUpperCase() === selectedStatus,
					),
		[selectedStatus, transactions],
	);

	const getGroupName = (groupId: string) =>
		groups.find((group) => group.id === groupId)?.name ?? "Unknown Group";

	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text);
		toast.success("Copied to clipboard", {
			description: "Transaction hash copied.",
		});
	};

	const stats = [
		{
			label: "Tracked Transactions",
			value: formatStatNumber(
				transactionStats
					? sumStatRecord(transactionStats.by_status)
					: filteredTransactions.length,
			),
			color: "text-foreground",
			bg: "bg-muted/50",
		},
		{
			label: "Success Rate",
			value: formatStatPercent(transactionStats?.success_rate),
			color: "text-green-600",
			bg: "bg-green-50 dark:bg-green-900/20",
		},
		{
			label: "Need Retry",
			value: formatStatNumber(transactionStats?.failed_needing_retry),
			color: "text-blue-600",
			bg: "bg-blue-50 dark:bg-blue-900/20",
		},
		{
			label: "Assets In Use",
			value: formatStatNumber(assetVolumes.length),
			color: "text-yellow-600",
			bg: "bg-yellow-50 dark:bg-yellow-900/20",
		},
	];

	const statusIcon = (status: string) => {
		switch (status.toUpperCase()) {
			case "COMPLETED":
			case "CONFIRMED":
				return <CheckCircle className="h-4 w-4 text-green-600" />;
			case "PROCESSING":
				return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
			case "PENDING":
				return <Clock className="h-4 w-4 text-yellow-600" />;
			case "FAILED":
			case "CANCELLED":
				return <AlertCircle className="h-4 w-4 text-red-600" />;
			default:
				return <ReceiptText className="h-4 w-4 text-muted-foreground" />;
		}
	};

	return (
		<div className="space-y-6 sm:space-y-8">
			<FadeUp>
				<div>
					<h1 className="text-2xl font-bold text-foreground sm:text-3xl">
						Payments
					</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Review payroll transactions by run, status, hash, and destination
						address.
					</p>
				</div>
			</FadeUp>

			{transactionStatsQuery.isError && (
				<FadeUp delay={40}>
					<Alert className="border-amber-200 bg-amber-50 text-amber-900">
						<AlertCircle className="h-4 w-4" />
						<AlertTitle>Transaction stats are unavailable</AlertTitle>
						<AlertDescription className="text-amber-800">
							Your transaction activity feed still works, but the live company
							transaction summaries could not be fetched.
						</AlertDescription>
					</Alert>
				</FadeUp>
			)}

			{transactionStatsQuery.isPending && !transactionStats ? (
				<div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
					{Array.from({ length: 4 }).map((_, index) => (
						<FadeUp key={index} delay={index * 40}>
							<Card className="p-4 sm:p-5">
								<Skeleton className="h-4 w-24" />
								<Skeleton className="mt-3 h-10 w-20" />
							</Card>
						</FadeUp>
					))}
				</div>
			) : (
				<div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
					{stats.map((stat, index) => (
						<FadeUp key={stat.label} delay={index * 50}>
							<Card className={cn("p-4 sm:p-5", stat.bg)}>
								<p className="text-xs text-muted-foreground">{stat.label}</p>
								<p className={cn("mt-1 text-2xl font-bold", stat.color)}>
									{stat.value}
								</p>
							</Card>
						</FadeUp>
					))}
				</div>
			)}

			{transactionStats && (
				<div className="grid gap-4 xl:grid-cols-2">
					<FadeUp delay={120}>
						<Card className="p-5">
							<h2 className="text-base font-semibold text-foreground">
								Transactions By Status
							</h2>
							<div className="mt-4 space-y-3">
								{transactionStatuses.length === 0 ? (
									<p className="text-sm text-muted-foreground">
										No transaction status data yet.
									</p>
								) : (
									transactionStatuses.map(([status, count]) => (
										<div
											key={status}
											className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2.5"
										>
											<span className="text-sm text-foreground">
												{formatStatLabel(status)}
											</span>
											<span className="text-sm font-medium text-muted-foreground">
												{formatStatNumber(count)}
											</span>
										</div>
									))
								)}
							</div>
						</Card>
					</FadeUp>

					<FadeUp delay={160}>
						<Card className="p-5">
							<h2 className="text-base font-semibold text-foreground">
								Volume By Asset
							</h2>
							<div className="mt-4 space-y-3">
								{assetVolumes.length === 0 ? (
									<p className="text-sm text-muted-foreground">
										No asset volume data yet.
									</p>
								) : (
									assetVolumes.map((asset) => (
										<div
											key={`${asset.asset}-${asset.amount}-${asset.count}`}
											className="rounded-xl bg-muted/40 p-3"
										>
											<div className="flex items-center justify-between gap-3">
												<p className="text-sm font-medium text-foreground">
													{asset.asset}
												</p>
												<p className="text-xs text-muted-foreground">
													{formatStatNumber(asset.count)} txns
												</p>
											</div>
											<p className="mt-1 text-lg font-semibold text-foreground">
												{formatStatAmount(asset.amount)}
											</p>
										</div>
									))
								)}
							</div>
						</Card>
					</FadeUp>
				</div>
			)}

			<FadeUp delay={200}>
				<Card className="p-5 sm:p-6">
					<div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
						<div className="space-y-3">
							<label className="text-sm font-medium text-foreground">
								Payroll Run
							</label>
							<Select value={selectedRunId} onValueChange={setSelectedRunId}>
								<SelectTrigger>
									<SelectValue placeholder="Select a payroll run" />
								</SelectTrigger>
								<SelectContent>
									{runs.map((run) => (
										<SelectItem key={run.id} value={run.id}>
											{getGroupName(run.group_id)} •{" "}
											{formatStatDate(run.period_start)} -{" "}
											{formatStatDate(run.period_end)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-3">
							<label className="text-sm font-medium text-foreground">
								Status Filter
							</label>
							<div className="flex items-center gap-3">
								<Filter className="h-4 w-4 shrink-0 text-muted-foreground" />
								<Select value={selectedStatus} onValueChange={setSelectedStatus}>
									<SelectTrigger className="w-full">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All Transactions</SelectItem>
										<SelectItem value="PENDING">Pending</SelectItem>
										<SelectItem value="PROCESSING">Processing</SelectItem>
										<SelectItem value="COMPLETED">Completed</SelectItem>
										<SelectItem value="FAILED">Failed</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
					</div>

					{selectedRun && (
						<div className="mt-5 grid gap-3 md:grid-cols-4">
							<div className="rounded-xl bg-muted/40 p-4">
								<p className="text-xs text-muted-foreground">Group</p>
								<p className="mt-1 text-sm font-semibold text-foreground">
									{getGroupName(selectedRun.group_id)}
								</p>
							</div>
							<div className="rounded-xl bg-muted/40 p-4">
								<p className="text-xs text-muted-foreground">Run Amount</p>
								<p className="mt-1 text-sm font-semibold text-foreground">
									{formatStatAmount(selectedRun.total_amount)}{" "}
									{selectedRun.currency}
								</p>
							</div>
							<div className="rounded-xl bg-muted/40 p-4">
								<p className="text-xs text-muted-foreground">Scheduled</p>
								<p className="mt-1 text-sm font-semibold text-foreground">
									{formatDateTime(selectedRun.scheduled_at)}
								</p>
							</div>
							<div className="rounded-xl bg-muted/40 p-4">
								<p className="text-xs text-muted-foreground">Status</p>
								<div className="mt-1">
									<StatusBadge status={selectedRun.status.toLowerCase()} />
								</div>
							</div>
						</div>
					)}
				</Card>
			</FadeUp>

			{runsQuery.isPending || groupsQuery.isPending ? (
				<div className="space-y-3">
					{Array.from({ length: 3 }).map((_, index) => (
						<FadeUp key={index} delay={index * 40}>
							<Card className="p-5 sm:p-6">
								<Skeleton className="h-5 w-40" />
								<Skeleton className="mt-4 h-20 w-full" />
							</Card>
						</FadeUp>
					))}
				</div>
			) : runs.length === 0 ? (
				<FadeUp delay={220}>
					<EmptyState
						icon={ReceiptText}
						title="No payroll runs yet"
						description="Create a payroll run in the payroll section to begin tracking transactions here."
					/>
				</FadeUp>
			) : transactionsQuery.isPending && selectedRunId ? (
				<FadeUp delay={220}>
					<Card className="p-5 sm:p-6">
						<div className="flex items-center gap-3 text-sm text-muted-foreground">
							<Loader2 className="h-4 w-4 animate-spin" />
							Loading transactions for this payroll run...
						</div>
					</Card>
				</FadeUp>
			) : filteredTransactions.length === 0 ? (
				<FadeUp delay={220}>
					<EmptyState
						icon={ReceiptText}
						title={
							transactions.length === 0
								? "No transactions for this run yet"
								: "No transactions match this filter"
						}
						description={
							transactions.length === 0
								? "Transactions will appear here once this payroll run starts creating payouts."
								: "Try switching to another status or choosing a different payroll run."
						}
					/>
				</FadeUp>
			) : (
				<div className="space-y-3">
					{filteredTransactions.map((transaction, index) => (
						<FadeUp key={transaction.id} delay={index * 40}>
							<Card className="p-5 transition-colors hover:border-primary/20 sm:p-6">
								<div className="flex flex-wrap items-start justify-between gap-4">
									<div className="flex items-center gap-3">
										{statusIcon(transaction.status)}
										<div>
											<p className="text-sm font-semibold text-foreground">
												{formatStatAmount(transaction.amount)} {transaction.asset}
											</p>
											<p className="text-xs text-muted-foreground">
												{selectedRun
													? getGroupName(selectedRun.group_id)
													: "Payroll run transaction"}
											</p>
										</div>
									</div>
									<StatusBadge status={transaction.status.toLowerCase()} />
								</div>

								<div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
									<div>
										<p className="text-xs text-muted-foreground">To</p>
										<p className="break-all text-sm text-foreground">
											{transaction.to_address}
										</p>
									</div>
									<div>
										<p className="text-xs text-muted-foreground">Created</p>
										<p className="text-sm text-foreground">
											{formatDateTime(transaction.created_at)}
										</p>
									</div>
									<div>
										<p className="text-xs text-muted-foreground">Submitted</p>
										<p className="text-sm text-foreground">
											{formatDateTime(transaction.submitted_at)}
										</p>
									</div>
									<div>
										<p className="text-xs text-muted-foreground">Confirmed</p>
										<p className="text-sm text-foreground">
											{formatDateTime(transaction.confirmed_at)}
										</p>
									</div>
								</div>

								{transaction.stellar_tx_hash && (
									<div className="mt-4 flex items-center justify-between gap-3 rounded-lg bg-muted/50 p-3">
										<div className="min-w-0">
											<p className="text-xs text-muted-foreground">
												Transaction Hash
											</p>
											<p className="truncate font-mono text-xs text-foreground">
												{transaction.stellar_tx_hash.substring(0, 24)}...
											</p>
										</div>
										<div className="flex shrink-0 gap-1">
											<Button
												variant="ghost"
												size="sm"
												className="h-7 w-7 p-0"
												onClick={() =>
													copyToClipboard(transaction.stellar_tx_hash!)
												}
											>
												<Copy className="h-3.5 w-3.5" />
											</Button>
											<Button
												variant="ghost"
												size="sm"
												className="h-7 w-7 p-0"
												asChild
											>
												<a
													href={`https://stellar.expert/explorer/public/tx/${transaction.stellar_tx_hash}`}
													target="_blank"
													rel="noopener noreferrer"
												>
													<ExternalLink className="h-3.5 w-3.5" />
												</a>
											</Button>
										</div>
									</div>
								)}

								{(transaction.fee_amount || transaction.ledger_sequence) && (
									<div className="mt-4 grid gap-3 sm:grid-cols-2">
										{transaction.fee_amount && (
											<div className="rounded-lg bg-muted/40 p-3">
												<p className="text-xs text-muted-foreground">
													Fee Amount
												</p>
												<p className="mt-1 text-sm font-medium text-foreground">
													{formatStatAmount(transaction.fee_amount)}
												</p>
											</div>
										)}
										{transaction.ledger_sequence && (
											<div className="rounded-lg bg-muted/40 p-3">
												<p className="text-xs text-muted-foreground">
													Ledger Sequence
												</p>
												<p className="mt-1 text-sm font-medium text-foreground">
													{formatStatNumber(transaction.ledger_sequence)}
												</p>
											</div>
										)}
									</div>
								)}

								{transaction.error_message && (
									<div className="mt-3 flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 p-2.5 dark:border-red-800 dark:bg-red-900/20">
										<AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-600" />
										<p className="text-xs text-red-700 dark:text-red-400">
											{transaction.error_message}
										</p>
									</div>
								)}
							</Card>
						</FadeUp>
					))}
				</div>
			)}
		</div>
	);
}
