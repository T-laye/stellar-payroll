"use client";

import { useMemo, useState } from "react";
import {
	AlertCircle,
	AlertTriangle,
	Briefcase,
	CalendarClock,
	CheckCircle2,
	Clock3,
	Edit2,
	ExternalLink,
	Loader2,
	Plus,
	ReceiptText,
	ShieldCheck,
	Trash2,
	TrendingUp,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import DeleteDialog from "@/components/shared/DeleteDialog";
import EmptyState from "@/components/shared/EmptyState";
import FadeUp from "@/components/shared/FadeUp";
import StatusBadge from "@/components/shared/StatusBadge";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { PayrollForm } from "@/components/payroll/payroll-form";
import { PayrollRunForm } from "@/components/payroll/payroll-run-form";
import { useCompanyDetails } from "@/hooks/company.hook";
import {
	useApprovePayrollRun,
	useCancelPayrollRun,
	useCompanyPayrollGroups,
	useCreatePayrollRun,
	useDeletePayrollGroup,
	useExecutePayrollRun,
	usePayrollRunTransactions,
	usePayrollRuns,
	usePayrollSchedule,
} from "@/hooks/payroll.hook";
import { useCompanyPayrollStats } from "@/hooks/stats.hook";
import { usePayrollStore } from "@/lib/stores/payroll-store";
import { type PayrollRun } from "@/services/payroll.service";
import {
	formatStatAmount,
	formatStatDate,
	formatStatLabel,
	formatStatNumber,
	sumStatRecord,
} from "@/lib/utils/stats";
import { toast } from "sonner";
import { hasAnyPermission, useAuthStore } from "@/lib/stores/auth-store";

function formatDateTime(value: string | null | undefined) {
	if (!value) {
		return "Not scheduled";
	}

	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return "Not scheduled";
	}

	return date.toLocaleString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit",
	});
}

export default function PayrollPage() {
	const user = useAuthStore((state) => state.user);
	const canViewPayroll = hasAnyPermission(user, [
		"*",
		"payroll:read",
		"payroll:create",
		"payroll:update",
		"payroll:approve",
		"payroll:execute",
		"payroll:cancel",
		"company:update",
	]);

	if (!canViewPayroll) {
		return (
			<div className="flex items-center justify-center min-h-100">
				<div className="text-center">
					<Briefcase className="mx-auto h-12 w-12 text-muted-foreground" />
					<h2 className="mt-4 text-lg font-semibold text-foreground">
						Access Denied
					</h2>
					<p className="mt-2 text-sm text-muted-foreground">
						You don't have permission to view payroll information.
					</p>
				</div>
			</div>
		);
	}

	useCompanyDetails();
	const groups = usePayrollStore((state) => state.groups);
	const runs = usePayrollStore((state) => state.runs);
	const schedule = usePayrollStore((state) => state.schedule);
	const runTransactions = usePayrollStore((state) => state.runTransactions);
	useCompanyPayrollGroups();
	usePayrollRuns();
	usePayrollSchedule();
	const payrollStatsQuery = useCompanyPayrollStats();
	const { mutateAsync: deleteGroup, isPending: isDeletingGroup } =
		useDeletePayrollGroup();
	const { mutateAsync: approveRun, isPending: isApprovingRun } =
		useApprovePayrollRun();
	const { mutateAsync: cancelRun, isPending: isCancellingRun } =
		useCancelPayrollRun();
	const { mutateAsync: executeRun, isPending: isExecutingRun } =
		useExecutePayrollRun();

	const [groupDialogOpen, setGroupDialogOpen] = useState(false);
	const [runDialogOpen, setRunDialogOpen] = useState(false);
	const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
	const [editingRunId, setEditingRunId] = useState<string | null>(null);
	const [deleteGroupId, setDeleteGroupId] = useState<string | null>(null);
	const [transactionsRunId, setTransactionsRunId] = useState<string | null>(
		null,
	);

	const editingGroup = editingGroupId
		? groups.find((group) => group.id === editingGroupId)
		: undefined;
	const editingRun = editingRunId
		? runs.find((run) => run.id === editingRunId)
		: undefined;
	const deletingGroup = deleteGroupId
		? groups.find((group) => group.id === deleteGroupId)
		: undefined;
	const transactionRun = transactionsRunId
		? runs.find((run) => run.id === transactionsRunId)
		: undefined;
	const transactionsQuery = usePayrollRunTransactions(
		transactionsRunId ?? undefined,
	);
	const payrollStats = payrollStatsQuery.data?.data;
	const runsByStatus = Object.entries(payrollStats?.runs_by_status ?? {});
	const disbursedByMonth = payrollStats?.disbursed_by_month.slice(-6) ?? [];
	const maxDisbursedAmount = Math.max(
		1,
		...disbursedByMonth.map((entry) => Number.parseFloat(entry.amount) || 0),
	);

	const groupCount = groups.length;
	const upcomingSchedule = schedule.slice(0, 5);
	const recentRuns = useMemo(() => runs.slice(0, 6), [runs]);

	const getGroupName = (groupId: string) =>
		groups.find((group) => group.id === groupId)?.name ?? "Unknown Group";

	const handleGroupSuccess = () => {
		setGroupDialogOpen(false);
		setEditingGroupId(null);
		toast.success(
			editingGroupId ? "Payroll group updated" : "Payroll group created",
		);
	};

	const handleRunSuccess = () => {
		setRunDialogOpen(false);
		setEditingRunId(null);
		toast.success(editingRunId ? "Payroll run updated" : "Payroll run created");
	};

	const handleDeleteGroup = async () => {
		if (!deleteGroupId) {
			return;
		}

		try {
			await deleteGroup(deleteGroupId);
			toast.success("Payroll group deleted", {
				description: `${deletingGroup?.name ?? "Group"} has been removed.`,
			});
			setDeleteGroupId(null);
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to delete group.",
			);
		}
	};

	const runAction = async (
		action: "approve" | "cancel" | "execute",
		run: PayrollRun,
	) => {
		try {
			if (action === "approve") {
				await approveRun(run.id);
				toast.success("Payroll run approved");
			} else if (action === "cancel") {
				await cancelRun(run.id);
				toast.success("Payroll run cancelled");
			} else {
				await executeRun(run.id);
				toast.success("Payroll run execution started");
			}
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: `Failed to ${action} payroll run.`,
			);
		}
	};

	return (
		<div className="space-y-6 sm:space-y-8">
			<FadeUp>
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h1 className="text-2xl font-bold text-foreground sm:text-3xl">
							Payroll
						</h1>
						<p className="mt-1 text-sm text-muted-foreground">
							Manage payroll groups, draft runs, approvals, and disbursement
							timelines.
						</p>
					</div>
					<div className="flex flex-col gap-2 sm:flex-row">
						<Dialog
							open={groupDialogOpen}
							onOpenChange={(open) => {
								setGroupDialogOpen(open);
								if (!open) setEditingGroupId(null);
							}}
						>
							<DialogTrigger asChild>
								<Button
									variant="outline"
									className="gap-2"
									onClick={() => setEditingGroupId(null)}
								>
									<Plus className="h-4 w-4" /> New Group
								</Button>
							</DialogTrigger>
							<DialogContent className="sm:max-w-2xl">
								<DialogHeader>
									<DialogTitle>
										{editingGroup
											? "Edit Payroll Group"
											: "Create Payroll Group"}
									</DialogTitle>
									<DialogDescription>
										Configure a payroll group with its own pay cycle, timezone,
										and settlement currency.
									</DialogDescription>
								</DialogHeader>
								<PayrollForm
									group={editingGroup}
									onSuccess={handleGroupSuccess}
								/>
							</DialogContent>
						</Dialog>

						<Dialog
							open={runDialogOpen}
							onOpenChange={(open) => {
								setRunDialogOpen(open);
								if (!open) setEditingRunId(null);
							}}
						>
							<DialogTrigger asChild>
								<Button className="gap-2" onClick={() => setEditingRunId(null)}>
									<ReceiptText className="h-4 w-4" /> New Run
								</Button>
							</DialogTrigger>
							<DialogContent className="sm:max-w-2xl">
								<DialogHeader>
									<DialogTitle>
										{editingRun ? "Edit Payroll Run" : "Create Payroll Run"}
									</DialogTitle>
									<DialogDescription>
										Create a draft payroll run for a group, then route it
										through approval and execution.
									</DialogDescription>
								</DialogHeader>
								<PayrollRunForm
									groups={groups}
									run={editingRun}
									onSuccess={handleRunSuccess}
								/>
							</DialogContent>
						</Dialog>
					</div>
				</div>
			</FadeUp>

			{payrollStatsQuery.isError && (
				<FadeUp delay={40}>
					<Alert className="border-amber-200 bg-amber-50 text-amber-900">
						<AlertCircle className="h-4 w-4" />
						<AlertTitle>Payroll stats are unavailable</AlertTitle>
						<AlertDescription className="text-amber-800">
							Group and run management still work, but the live payroll summary
							data could not be fetched.
						</AlertDescription>
					</Alert>
				</FadeUp>
			)}

			{payrollStatsQuery.isPending && !payrollStats ? (
				<div className="grid gap-4 lg:grid-cols-4">
					{Array.from({ length: 4 }).map((_, index) => (
						<FadeUp key={index} delay={index * 40}>
							<Card className="p-4">
								<Skeleton className="h-4 w-24" />
								<Skeleton className="mt-3 h-10 w-20" />
							</Card>
						</FadeUp>
					))}
				</div>
			) : payrollStats ? (
				<>
					<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
						{[
							{
								label: "Average Run Amount",
								value: formatStatAmount(payrollStats.average_run_amount),
								icon: TrendingUp,
							},
							{
								label: "Groups",
								value: formatStatNumber(groupCount),
								icon: Briefcase,
							},
							{
								label: "Runs Tracked",
								value: formatStatNumber(
									sumStatRecord(payrollStats.runs_by_status),
								),
								icon: ReceiptText,
							},
							{
								label: "Next Scheduled Run",
								value: payrollStats.next_scheduled_run
									? formatStatDate(payrollStats.next_scheduled_run.scheduled_at)
									: "None scheduled",
								icon: CalendarClock,
							},
						].map((item, index) => {
							const Icon = item.icon;
							return (
								<FadeUp key={item.label} delay={index * 40}>
									<Card className="p-4 sm:p-5">
										<div className="flex items-start justify-between gap-3">
											<div>
												<p className="text-xs text-muted-foreground">
													{item.label}
												</p>
												<p className="mt-2 text-2xl font-semibold text-foreground">
													{item.value}
												</p>
											</div>
											<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
												<Icon className="h-5 w-5 text-primary" />
											</div>
										</div>
									</Card>
								</FadeUp>
							);
						})}
					</div>

					<div className="grid gap-4 xl:grid-cols-2">
						<FadeUp delay={120}>
							<Card className="p-5">
								<h2 className="text-base font-semibold text-foreground">
									Runs By Status
								</h2>
								<div className="mt-4 space-y-3">
									{runsByStatus.length === 0 ? (
										<p className="text-sm text-muted-foreground">
											No run status data yet.
										</p>
									) : (
										runsByStatus.map(([status, count]) => (
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
									Disbursed By Month
								</h2>
								<div className="mt-4 space-y-3">
									{disbursedByMonth.length === 0 ? (
										<p className="text-sm text-muted-foreground">
											No monthly disbursement data yet.
										</p>
									) : (
										disbursedByMonth.map((entry) => (
											<div key={`${entry.month}-${entry.amount}`}>
												<div className="flex items-center justify-between gap-3 text-sm">
													<span className="text-foreground">{entry.month}</span>
													<span className="font-medium text-muted-foreground">
														{formatStatAmount(entry.amount)}
													</span>
												</div>
												<div className="mt-2 h-2 rounded-full bg-muted">
													<div
														className="h-2 rounded-full bg-primary"
														style={{
															width: `${Math.max(
																((Number.parseFloat(entry.amount) || 0) /
																	maxDisbursedAmount) *
																	100,
																8,
															)}%`,
														}}
													/>
												</div>
											</div>
										))
									)}
								</div>
							</Card>
						</FadeUp>
					</div>
				</>
			) : null}

			<div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
				<Card className="p-5 sm:p-6">
					<div className="mb-5 flex items-center justify-between gap-3">
						<div>
							<h2 className="text-lg font-semibold text-foreground">
								Payroll Groups
							</h2>
							<p className="mt-1 text-sm text-muted-foreground">
								Teams and payroll cycles configured for this company.
							</p>
						</div>
					</div>

					{groups.length === 0 ? (
						<EmptyState
							icon={Briefcase}
							title="No payroll groups yet"
							description="Create a payroll group to organize teams and pay cycles."
						/>
					) : (
						<div className="space-y-3">
							{groups.map((group) => (
								<div
									key={group.id}
									className="rounded-2xl border border-border bg-muted/20 p-4"
								>
									<div className="flex flex-wrap items-start justify-between gap-3">
										<div className="space-y-2">
											<div className="flex flex-wrap items-center gap-2">
												<p className="text-sm font-semibold text-foreground">
													{group.name}
												</p>
												<StatusBadge
													status={group.is_active ? "active" : "inactive"}
												/>
												<span className="rounded-full bg-background px-2.5 py-0.5 text-xs text-muted-foreground">
													{formatStatLabel(group.pay_cycle)}
												</span>
											</div>
											<p className="text-sm text-muted-foreground">
												{group.description}
											</p>
											<div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
												<span>{group.currency}</span>
												<span>•</span>
												<span>{group.timezone}</span>
												<span>•</span>
												<span>Updated {formatStatDate(group.updated_at)}</span>
											</div>
										</div>

										<div className="flex flex-wrap gap-2">
											<Button
												variant="outline"
												size="sm"
												className="gap-1.5"
												onClick={() => {
													setEditingGroupId(group.id);
													setGroupDialogOpen(true);
												}}
											>
												<Edit2 className="h-3.5 w-3.5" />
												Edit
											</Button>
											<Button
												variant="outline"
												size="sm"
												className="gap-1.5 border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive"
												onClick={() => setDeleteGroupId(group.id)}
											>
												<Trash2 className="h-3.5 w-3.5" />
												Delete
											</Button>
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</Card>

				<Card className="p-5 sm:p-6">
					<div className="mb-5 flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
							<Clock3 className="h-5 w-5 text-primary" />
						</div>
						<div>
							<h2 className="text-lg font-semibold text-foreground">
								Upcoming Schedule
							</h2>
							<p className="text-sm text-muted-foreground">
								Draft and approved runs scheduled for future execution.
							</p>
						</div>
					</div>

					{upcomingSchedule.length === 0 ? (
						<p className="text-sm text-muted-foreground">
							No upcoming scheduled payroll runs yet.
						</p>
					) : (
						<div className="space-y-3">
							{upcomingSchedule.map((run) => (
								<div key={run.id} className="rounded-xl bg-muted/40 p-3">
									<div className="flex items-center justify-between gap-3">
										<div>
											<p className="text-sm font-medium text-foreground">
												{getGroupName(run.group_id)}
											</p>
											<p className="mt-0.5 text-xs text-muted-foreground">
												{formatDateTime(run.scheduled_at)}
											</p>
										</div>
										<StatusBadge status={run.status.toLowerCase()} />
									</div>
								</div>
							))}
						</div>
					)}
				</Card>
			</div>

			<Card className="p-5 sm:p-6">
				<div className="mb-5 flex items-center justify-between gap-3">
					<div>
						<h2 className="text-lg font-semibold text-foreground">
							Payroll Runs
						</h2>
						<p className="mt-1 text-sm text-muted-foreground">
							Draft, approve, cancel, and execute payroll runs.
						</p>
					</div>
				</div>

				{recentRuns.length === 0 ? (
					<EmptyState
						icon={ReceiptText}
						title="No payroll runs yet"
						description="Create a payroll run once you have at least one payroll group."
					/>
				) : (
					<div className="space-y-4">
						{recentRuns.map((run) => (
							<div
								key={run.id}
								className="rounded-2xl border border-border bg-muted/20 p-4"
							>
								<div className="flex flex-wrap items-start justify-between gap-3">
									<div className="space-y-3">
										<div className="flex flex-wrap items-center gap-2">
											<p className="text-sm font-semibold text-foreground">
												{getGroupName(run.group_id)}
											</p>
											<StatusBadge status={run.status.toLowerCase()} />
										</div>
										<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
											{[
												{
													label: "Amount",
													value: `${formatStatAmount(run.total_amount)} ${run.currency}`,
												},
												{
													label: "Period",
													value: `${formatStatDate(run.period_start)} - ${formatStatDate(run.period_end)}`,
												},
												{
													label: "Scheduled",
													value: formatDateTime(run.scheduled_at),
												},
												{
													label: "Created",
													value: formatStatDate(run.created_at),
												},
											].map((item) => (
												<div
													key={item.label}
													className="rounded-xl bg-background p-3"
												>
													<p className="text-xs text-muted-foreground">
														{item.label}
													</p>
													<p className="mt-1 text-sm font-medium text-foreground">
														{item.value}
													</p>
												</div>
											))}
										</div>
										{run.notes && (
											<p className="text-sm text-muted-foreground">
												{run.notes}
											</p>
										)}
									</div>

									<div className="flex flex-wrap gap-2">
										<Button
											variant="outline"
											size="sm"
											className="gap-1.5"
											onClick={() => setTransactionsRunId(run.id)}
										>
											<ExternalLink className="h-3.5 w-3.5" />
											Transactions
										</Button>
										{run.status === "DRAFT" && (
											<>
												<Button
													variant="outline"
													size="sm"
													className="gap-1.5"
													onClick={() => {
														setEditingRunId(run.id);
														setRunDialogOpen(true);
													}}
												>
													<Edit2 className="h-3.5 w-3.5" />
													Edit
												</Button>
												<Button
													size="sm"
													className="gap-1.5"
													onClick={() => runAction("approve", run)}
													disabled={isApprovingRun}
												>
													<ShieldCheck className="h-3.5 w-3.5" />
													Approve
												</Button>
											</>
										)}
										{run.status === "APPROVED" && (
											<Button
												size="sm"
												className="gap-1.5"
												onClick={() => runAction("execute", run)}
												disabled={isExecutingRun}
											>
												<CheckCircle2 className="h-3.5 w-3.5" />
												Execute
											</Button>
										)}
										{(run.status === "DRAFT" || run.status === "APPROVED") && (
											<Button
												variant="outline"
												size="sm"
												className="gap-1.5 border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive"
												onClick={() => runAction("cancel", run)}
												disabled={isCancellingRun}
											>
												<AlertTriangle className="h-3.5 w-3.5" />
												Cancel
											</Button>
										)}
									</div>
								</div>
							</div>
						))}
					</div>
				)}
			</Card>

			<Dialog
				open={Boolean(transactionsRunId)}
				onOpenChange={(open) => !open && setTransactionsRunId(null)}
			>
				<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
					<DialogHeader>
						<DialogTitle>Run Transactions</DialogTitle>
						<DialogDescription>
							{transactionRun
								? `Transactions for ${getGroupName(transactionRun.group_id)}`
								: "Transactions for the selected payroll run"}
						</DialogDescription>
					</DialogHeader>

					{transactionsQuery.isLoading ? (
						<div className="space-y-3">
							<Skeleton className="h-12 w-full" />
							<Skeleton className="h-12 w-full" />
						</div>
					) : (runTransactions[transactionsRunId ?? ""] ?? []).length === 0 ? (
						<p className="text-sm text-muted-foreground">
							No transactions were returned for this payroll run yet.
						</p>
					) : (
						<div className="space-y-3">
							{(runTransactions[transactionsRunId ?? ""] ?? []).map(
								(transaction) => (
									<div
										key={transaction.id}
										className="rounded-xl border border-border bg-muted/20 p-4"
									>
										<div className="flex flex-wrap items-start justify-between gap-3">
											<div className="space-y-2">
												<div className="flex flex-wrap items-center gap-2">
													<p className="text-sm font-semibold text-foreground">
														{formatStatAmount(transaction.amount)}{" "}
														{transaction.asset}
													</p>
													<StatusBadge
														status={transaction.status.toLowerCase()}
													/>
												</div>
												<p className="text-xs text-muted-foreground">
													To {transaction.to_address}
												</p>
												{transaction.stellar_tx_hash && (
													<p className="break-all font-mono text-xs text-muted-foreground">
														{transaction.stellar_tx_hash}
													</p>
												)}
											</div>
											<div className="text-right text-xs text-muted-foreground">
												<p>Created {formatStatDate(transaction.created_at)}</p>
												{transaction.confirmed_at && (
													<p>
														Confirmed {formatStatDate(transaction.confirmed_at)}
													</p>
												)}
											</div>
										</div>
										{transaction.error_message && (
											<p className="mt-3 text-xs text-destructive">
												{transaction.error_message}
											</p>
										)}
									</div>
								),
							)}
						</div>
					)}

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setTransactionsRunId(null)}
						>
							Close
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<DeleteDialog
				open={Boolean(deleteGroupId)}
				onOpenChange={(open) => !open && setDeleteGroupId(null)}
				title="Delete Payroll Group"
				description={
					deletingGroup
						? `Are you sure you want to delete "${deletingGroup.name}"?`
						: "Are you sure? This action cannot be undone."
				}
				onConfirm={handleDeleteGroup}
				isLoading={isDeletingGroup}
			/>
		</div>
	);
}
