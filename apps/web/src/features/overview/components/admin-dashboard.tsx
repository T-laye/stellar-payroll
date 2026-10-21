"use client";

import Link from "next/link";
import {
	AlertTriangle,
	ArrowLeftRight,
	ArrowRight,
	CalendarClock,
	CheckCircle2,
	Clock,
	Coins,
	Plus,
	UserPlus,
	Users,
	Wallet,
	XCircle,
} from "lucide-react";
import { Button } from "@repo/ui/button";
import { Skeleton } from "@repo/ui/skeleton";
import { BarChart } from "@/components/bar-chart";
import { Money } from "@/components/money";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { StatCard } from "@/components/stat-card";
import { EmptyState, ErrorState } from "@/components/states";
import { RunStatusPill } from "@/components/status-pill";
import { hasAnyPermission, useAuthStore } from "@/features/auth/store";
import { NotificationItem } from "@/features/notifications/components/notification-item";
import { notificationHref, useNotifications } from "@/features/notifications/hooks";
import { useGroups, useRuns } from "@/features/payroll/hooks";
import { runName } from "@/features/payroll/utils";
import { useCompanyOverviewStats, useCompanyPayrollStats, useCompanyTransactionStats } from "@/features/stats/hooks";
import { formatCount, formatDate, formatMoney, formatRelative } from "@/lib/format";
import { routes } from "@/lib/routes";
import { useMountTime } from "@/lib/use-now";

function greeting(date = new Date()) {
	const hour = date.getHours();
	return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
}

const monthLabel = (month: string) =>
	new Date(`${month}-01T00:00:00Z`).toLocaleString("en-US", { month: "short", timeZone: "UTC" });

/** PRD §7: totals, latest activity, upcoming payroll, and anything that needs attention. */
export function AdminDashboard() {
	const user = useAuthStore((state) => state.user);
	const canPayroll = hasAnyPermission(user, ["payroll:read"]);
	const canCreate = hasAnyPermission(user, ["payroll:create"]);
	const canAddPeople = hasAnyPermission(user, ["employees:create"]);
	const overview = useCompanyOverviewStats();
	const payroll = useCompanyPayrollStats(canPayroll);
	const txStats = useCompanyTransactionStats(canPayroll);
	const runs = useRuns();
	const groups = useGroups();
	const activity = useNotifications();

	const o = overview.data?.data;
	const p = payroll.data?.data;
	const t = txStats.data?.data;
	const usdc = t?.volume_by_asset.find((v) => v.asset === "USDC");
	const xlm = t?.volume_by_asset.find((v) => v.asset === "XLM");
	const months = p?.disbursed_by_month ?? [];
	// The current month is still running, so compare the last two complete months.
	const latest = months[months.length - 2];
	const before = months[months.length - 3];
	const trend =
		latest && before && Number(before.amount) > 0
			? {
					value: ((Number(latest.amount) - Number(before.amount)) / Number(before.amount)) * 100,
					label: `${monthLabel(latest.month)} vs ${monthLabel(before.month)}`,
				}
			: null;
	const now = useMountTime();
	const upcoming = (runs.data ?? [])
		.filter((r) => (r.status === "DRAFT" || r.status === "APPROVED") && Date.parse(r.scheduled_at) > now)
		.sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))
		.slice(0, 4);
	const loadingStats = overview.isLoading || txStats.isLoading;
	const failedToRetry = o?.transactions.pending_retry ?? 0;
	const withoutWallet = o?.wallets.employees_without_wallet ?? 0;
	const drafts = (runs.data ?? []).filter((r) => r.status === "DRAFT").length;

	return (
		<>
			<PageHeader
				title={`${greeting()}, ${user?.first_name ?? "there"}`}
				description="Here's your payroll overview."
				actions={
					<>
						{canCreate && (
							<Button asChild>
								<Link href={routes.payroll.create}>
									<Plus /> Create Payroll
								</Link>
							</Button>
						)}
						{canAddPeople && (
							<Button asChild variant="outline">
								<Link href={routes.employees.create}>
									<UserPlus /> Add Employee
								</Link>
							</Button>
						)}
						{canPayroll && (
							<Button asChild variant="outline">
								<Link href={routes.transactions.list}>
									<ArrowLeftRight /> View Transactions
								</Link>
							</Button>
						)}
					</>
				}
			/>

			{overview.isError ? (
				<SectionCard>
					<ErrorState message="We couldn't load your payroll overview." onRetry={() => overview.refetch()} />
				</SectionCard>
			) : (
				<div className="space-y-6">
					{(failedToRetry > 0 || withoutWallet > 0 || drafts > 0) && (
						<div className="grid gap-3 md:grid-cols-3">
							{failedToRetry > 0 && (
								<Attention
									tone="danger"
									icon={XCircle}
									title={`${failedToRetry} failed payment${failedToRetry === 1 ? "" : "s"} can be retried`}
									href={`${routes.transactions.list}?status=FAILED`}
									cta="Review failures"
								/>
							)}
							{drafts > 0 && (
								<Attention
									tone="warning"
									icon={Clock}
									title={`${drafts} payroll run${drafts === 1 ? "" : "s"} waiting for review`}
									href={`${routes.payroll.list}?status=pending`}
									cta="Review payroll"
								/>
							)}
							{withoutWallet > 0 && (
								<Attention
									tone="warning"
									icon={Wallet}
									title={`${withoutWallet} employee${withoutWallet === 1 ? " has" : "s have"} no wallet yet`}
									href={`${routes.employees.list}?status=pending`}
									cta="Add wallets"
								/>
							)}
						</div>
					)}

					<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
						<StatCard
							index={0}
							label="Total Payroll Processed"
							icon={Coins}
							loading={loadingStats}
							value={formatMoney(usdc?.amount ?? o?.payroll.total_disbursed_all_time ?? 0, "USDC")}
							trend={trend}
							hint={xlm ? `+ ${formatMoney(xlm.amount, "XLM")}` : undefined}
						/>
						<StatCard
							index={1}
							label="Successful Payments"
							icon={CheckCircle2}
							tone="success"
							loading={loadingStats}
							value={formatCount(o?.transactions.total_confirmed)}
							hint={t ? `${t.success_rate}% success rate` : undefined}
							href={`${routes.transactions.list}?status=CONFIRMED`}
						/>
						<StatCard
							index={2}
							label="Pending Payments"
							icon={Clock}
							tone="warning"
							loading={loadingStats}
							value={formatCount(o?.transactions.total_pending ?? t?.by_status.PENDING ?? 0)}
							hint={`${formatCount(o?.payroll.pending_runs)} run${o?.payroll.pending_runs === 1 ? "" : "s"} not yet paid`}
							href={`${routes.transactions.list}?status=PENDING,SUBMITTED`}
						/>
						<StatCard
							index={3}
							label="Failed Payments"
							icon={XCircle}
							tone="danger"
							loading={loadingStats}
							value={formatCount(o?.transactions.total_failed)}
							hint={failedToRetry ? `${failedToRetry} can be retried` : "Nothing to retry"}
							href={`${routes.transactions.list}?status=FAILED`}
						/>
					</div>

					<div className="grid gap-6 lg:grid-cols-3">
						<SectionCard
							className="lg:col-span-2"
							title="Payroll paid"
							description="Confirmed payments over the last six months"
							action={
								<Link href={routes.payroll.list} className="text-sm font-medium text-primary hover:underline">
									Payroll history
								</Link>
							}
						>
							<div className="grid gap-6 sm:grid-cols-[180px_1fr]">
								<div className="space-y-5">
									<div>
										<p className="text-xs font-medium text-muted-foreground">Total amount paid this month</p>
										{payroll.isLoading ? (
											<Skeleton className="mt-1 h-7 w-28" />
										) : (
											<p className="mt-1 text-2xl font-semibold tabular-nums">
												{formatMoney(o?.payroll.total_disbursed_this_month ?? 0)}
											</p>
										)}
									</div>
									<div>
										<p className="text-xs font-medium text-muted-foreground">Employees paid</p>
										<p className="mt-1 flex items-baseline gap-2">
											<span className="text-2xl font-semibold tabular-nums">
												{formatCount(o?.transactions.employees_paid_this_month ?? o?.employees.active)}
											</span>
											<span className="text-xs text-muted-foreground">
												this month · {formatCount(o?.transactions.employees_paid_all_time)} all time
											</span>
										</p>
									</div>
									<div>
										<p className="text-xs font-medium text-muted-foreground">Average payroll run</p>
										<p className="mt-1 text-lg font-semibold tabular-nums">{formatMoney(p?.average_run_amount ?? 0)}</p>
									</div>
								</div>
								{payroll.isLoading ? (
									<Skeleton className="h-36 w-full" />
								) : (
									<BarChart
										data={months.map((m) => ({ label: monthLabel(m.month), value: Number(m.amount) }))}
										format={(v) => formatMoney(v, "USDC", { compact: true })}
									/>
								)}
							</div>
						</SectionCard>

						<SectionCard
							title="Upcoming Payroll"
							flush
							action={
								<Link href={routes.recurring.list} className="text-sm font-medium text-primary hover:underline">
									Schedules
								</Link>
							}
						>
							{runs.isLoading ? (
								<div className="space-y-3 p-5">
									{Array.from({ length: 3 }, (_, i) => (
										<Skeleton key={i} className="h-14 w-full" />
									))}
								</div>
							) : upcoming.length === 0 ? (
								<EmptyState
									compact
									icon={CalendarClock}
									title="Nothing scheduled"
									description="Create a payroll or a recurring schedule to see it here."
								/>
							) : (
								<ul className="divide-y divide-border">
									{upcoming.map((run) => (
										<li key={run.id}>
											<Link
												href={routes.payroll.detail(run.id)}
												className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-accent/50"
											>
												<span className="flex w-11 shrink-0 flex-col items-center rounded-lg bg-primary/8 py-1 text-primary">
													<span className="text-[10px] font-semibold uppercase">
														{new Date(run.scheduled_at).toLocaleString("en-US", { month: "short" })}
													</span>
													<span className="text-base leading-tight font-bold">{new Date(run.scheduled_at).getDate()}</span>
												</span>
												<span className="min-w-0 flex-1">
													<span className="block truncate text-sm font-medium text-foreground">{runName(run, groups.data)}</span>
													<span className="block text-xs text-muted-foreground">
														{run.employee_count ?? "—"} employees · <Money value={run.total_amount} asset={run.currency} />
													</span>
												</span>
												<RunStatusPill run={run} />
											</Link>
										</li>
									))}
								</ul>
							)}
						</SectionCard>
					</div>

					<SectionCard
						title="Latest Payroll Activity"
						flush
						action={
							<Link href={routes.dashboardRoutes.NOTIFICATIONS} className="text-sm font-medium text-primary hover:underline">
								View all
							</Link>
						}
					>
						{activity.isLoading ? (
							<div className="space-y-3 p-5">
								{Array.from({ length: 4 }, (_, i) => (
									<Skeleton key={i} className="h-10 w-full" />
								))}
							</div>
						) : (activity.data?.data.length ?? 0) === 0 ? (
							<EmptyState
								compact
								icon={Users}
								title="No activity yet"
								description="Payroll runs and payments will show up here as they happen."
							/>
						) : (
							<div className="divide-y divide-border">
								{activity.data!.data.slice(0, 6).map((n) => (
									<NotificationItem
										key={n.id}
										notification={{ ...n, read_at: n.read_at ?? "seen" }}
										href={notificationHref(n, true)}
										compact
									/>
								))}
							</div>
						)}
					</SectionCard>

					{p?.next_scheduled_run && (
						<p className="text-center text-xs text-muted-foreground">
							Next payroll {formatRelative(p.next_scheduled_run.scheduled_at)} ({formatDate(p.next_scheduled_run.scheduled_at)}).
							Approved runs are paid automatically at their scheduled time.
						</p>
					)}
				</div>
			)}
		</>
	);
}

function Attention({
	tone,
	icon: Icon,
	title,
	href,
	cta,
}: {
	tone: "danger" | "warning";
	icon: typeof AlertTriangle;
	title: string;
	href: string;
	cta: string;
}) {
	return (
		<Link
			href={href}
			className={
				tone === "danger"
					? "animate-rise group flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 transition-colors hover:bg-destructive/10"
					: "animate-rise group flex items-center gap-3 rounded-xl border border-warning/25 bg-warning/5 px-4 py-3 transition-colors hover:bg-warning/10"
			}
		>
			<Icon className={tone === "danger" ? "size-5 shrink-0 text-destructive" : "size-5 shrink-0 text-warning"} />
			<span className="min-w-0 flex-1">
				<span className="block text-sm font-medium text-foreground">{title}</span>
				<span className="flex items-center gap-1 text-xs font-medium text-muted-foreground group-hover:text-foreground">
					{cta} <ArrowRight className="size-3" />
				</span>
			</span>
		</Link>
	);
}
