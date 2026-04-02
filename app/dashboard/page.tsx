"use client";

import Link from "next/link";
import {
	AlertCircle,
	ChevronRight,
	ReceiptText,
	ShieldCheck,
	TrendingUp,
	Users,
	Wallet,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import FadeUp from "@/components/shared/FadeUp";
import StatusBadge from "@/components/shared/StatusBadge";
import { useCompanyCompliance } from "@/hooks/compliance.hook";
import { useCompanyEmployees } from "@/hooks/employee.hook";
import { useCompanyPayrollGroups, usePayrollRuns } from "@/hooks/payroll.hook";
import { useMyPaymentRequests } from "@/hooks/payment-request.hook";
import { useMyStats, useCompanyOverviewStats } from "@/hooks/stats.hook";
import { useCompanyWallet } from "@/hooks/wallet.hook";
import {
	getUserDisplayName,
	hasAnyPermission,
	useAuthStore,
} from "@/lib/stores/auth-store";
import { useEmployeeStore } from "@/lib/stores/employee-store";
import { usePaymentRequestStore } from "@/lib/stores/payment-request-store";
import { usePayrollStore } from "@/lib/stores/payroll-store";
import { cn } from "@/lib/utils";
import { routes } from "@/lib/utils/routes";
import {
	formatStatAmount,
	formatStatDate,
	formatStatNumber,
} from "@/lib/utils/stats";

function CompanyOverview() {
	const employees = useEmployeeStore((state) => state.employees);
	const payrollGroups = usePayrollStore((state) => state.groups);
	const payrollRuns = usePayrollStore((state) => state.runs);

	useCompanyEmployees();
	useCompanyPayrollGroups();
	usePayrollRuns();

	const overviewQuery = useCompanyOverviewStats();
	const complianceQuery = useCompanyCompliance();
	const walletQuery = useCompanyWallet();

	const overview = overviewQuery.data?.data;
	const compliance = complianceQuery.data?.data;
	const walletStats = walletQuery.data?.data;
	const pendingRunCount = payrollRuns.filter((run) =>
		["DRAFT", "APPROVED", "PROCESSING"].includes(run.status),
	).length;
	const recentRuns = payrollRuns.slice(0, 5);
	const isStatsLoading =
		(overviewQuery.isPending && !overview) ||
		(complianceQuery.isPending && !compliance) ||
		(walletQuery.isPending && !walletStats);
	const hasStatsError =
		overviewQuery.isError || complianceQuery.isError || walletQuery.isError;

	const getGroupName = (groupId: string) =>
		payrollGroups.find((group) => group.id === groupId)?.name ??
		"Unknown Group";

	const stats = [
		{
			label: "Total Employees",
			value: formatStatNumber(overview?.employees.total ?? employees.length),
			icon: Users,
			color: "text-blue-600",
			bg: "bg-blue-50 dark:bg-blue-900/20",
			href: routes.dashboardRoutes.EMPLOYEES,
		},
		{
			label: "Pending Payroll Runs",
			value: formatStatNumber(
				overview?.payroll.pending_runs ?? pendingRunCount,
			),
			icon: ReceiptText,
			color: "text-purple-600",
			bg: "bg-purple-50 dark:bg-purple-900/20",
			href: routes.dashboardRoutes.PAYROLL_GROUPS,
		},
		{
			label: "Confirmed Transactions",
			value: formatStatNumber(overview?.transactions.total_confirmed),
			icon: TrendingUp,
			color: "text-orange-600",
			bg: "bg-orange-50 dark:bg-orange-900/20",
			href: routes.dashboardRoutes.PAYMENTS,
		},
		{
			label: "Company Wallets",
			value: formatStatNumber(overview?.wallets.total_company_wallets),
			icon: Wallet,
			color: "text-green-600",
			bg: "bg-green-50 dark:bg-green-900/20",
			href: routes.dashboardRoutes.WALLETS,
		},
	];

	return (
		<>
			{hasStatsError && (
				<FadeUp delay={40}>
					<Alert className="border-amber-200 bg-amber-50 text-amber-900">
						<AlertCircle className="h-4 w-4" />
						<AlertTitle>Live stats are unavailable right now</AlertTitle>
						<AlertDescription className="text-amber-800">
							The dashboard is still usable, but one or more company stats
							endpoints are not responding from your browser yet.
						</AlertDescription>
					</Alert>
				</FadeUp>
			)}

			<div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
				{isStatsLoading
					? Array.from({ length: 4 }).map((_, index) => (
							<FadeUp key={index} delay={index * 60}>
								<Card className="p-4 sm:p-5">
									<Skeleton className="h-4 w-24" />
									<Skeleton className="mt-3 h-10 w-20" />
									<Skeleton className="mt-5 h-4 w-28" />
								</Card>
							</FadeUp>
						))
					: stats.map((stat, index) => {
							const Icon = stat.icon;

							return (
								<FadeUp key={stat.label} delay={index * 60}>
									<Link href={stat.href}>
										<Card className="group h-full cursor-pointer p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md sm:p-5">
											<div className="flex items-start justify-between gap-2">
												<div>
													<p className="text-xs text-muted-foreground sm:text-sm">
														{stat.label}
													</p>
													<p className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
														{stat.value}
													</p>
												</div>
												<div
													className={cn(
														"flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110",
														stat.bg,
													)}
												>
													<Icon className={cn("h-5 w-5", stat.color)} />
												</div>
											</div>
											<div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground transition-colors group-hover:text-primary">
												View details <ChevronRight className="h-3 w-3" />
											</div>
										</Card>
									</Link>
								</FadeUp>
							);
						})}
			</div>

			<div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
				<FadeUp delay={200}>
					<Card className="border-primary/20 bg-linear-to-r from-primary/5 via-background to-accent/5 p-5 sm:p-6">
						<div className="flex flex-wrap items-center justify-between gap-4">
							<div>
								<p className="text-sm text-muted-foreground">
									Total Disbursed This Month
								</p>
								<p className="mt-1 text-3xl font-bold text-primary">
									{formatStatAmount(
										overview?.payroll.total_disbursed_this_month,
									)}
								</p>
								<p className="mt-2 text-sm text-muted-foreground">
									All-time disbursed:{" "}
									<span className="font-medium text-foreground">
										{formatStatAmount(
											overview?.payroll.total_disbursed_all_time,
										)}
									</span>
								</p>
							</div>
							<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
								<TrendingUp className="h-6 w-6 text-primary" />
							</div>
						</div>
					</Card>
				</FadeUp>

				<FadeUp delay={260}>
					<Card className="p-5 sm:p-6">
						<div className="flex items-center justify-between gap-3">
							<div>
								<p className="text-sm text-muted-foreground">
									Compliance Pulse
								</p>
								<h2 className="text-lg font-semibold text-foreground">
									Health at a glance
								</h2>
							</div>
							<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
								<ShieldCheck className="h-5 w-5" />
							</div>
						</div>
						<div className="mt-5 grid grid-cols-2 gap-3">
							<div className="rounded-xl bg-muted/40 p-3">
								<p className="text-xs text-muted-foreground">Checks Passed</p>
								<p className="mt-1 text-xl font-semibold text-foreground">
									{formatStatNumber(compliance?.checks_passed)}
								</p>
							</div>
							<div className="rounded-xl bg-muted/40 p-3">
								<p className="text-xs text-muted-foreground">Checks Failed</p>
								<p className="mt-1 text-xl font-semibold text-foreground">
									{formatStatNumber(compliance?.checks_failed)}
								</p>
							</div>
							<div className="rounded-xl bg-muted/40 p-3">
								<p className="text-xs text-muted-foreground">
									Audit Logs, 30 Days
								</p>
								<p className="mt-1 text-xl font-semibold text-foreground">
									{formatStatNumber(compliance?.audit_logs_last_30_days)}
								</p>
							</div>
							<div className="rounded-xl bg-muted/40 p-3">
								<p className="text-xs text-muted-foreground">
									Tax Reports Pending
								</p>
								<p className="mt-1 text-xl font-semibold text-foreground">
									{formatStatNumber(compliance?.tax_reports_pending)}
								</p>
							</div>
						</div>
						<p className="mt-4 text-sm text-muted-foreground">
							Last checked {formatStatDate(compliance?.last_checked_at)}
						</p>
					</Card>
				</FadeUp>
			</div>

			<FadeUp delay={280}>
				<Card className="p-5 sm:p-6">
					<div className="flex flex-wrap items-start justify-between gap-4">
						<div>
							<p className="text-sm text-muted-foreground">Wallet Coverage</p>
							<h2 className="text-lg font-semibold text-foreground">
								Company and employee wallet readiness
							</h2>
						</div>
						<Button asChild variant="outline" size="sm" className="gap-1">
							<Link href={routes.dashboardRoutes.WALLETS}>
								Open wallets <ChevronRight className="h-3.5 w-3.5" />
							</Link>
						</Button>
					</div>

					<div className="mt-5 grid gap-3 md:grid-cols-4">
						{[
							{
								label: "Employees With Wallets",
								value: formatStatNumber(
									walletStats?.employee_wallet_coverage.with_wallet,
								),
							},
							{
								label: "Employees Without Wallets",
								value: formatStatNumber(
									walletStats?.employee_wallet_coverage.without_wallet,
								),
							},
							{
								label: "Funded Wallets",
								value: formatStatNumber(walletStats?.funded_wallets),
							},
							{
								label: "Unfunded Wallets",
								value: formatStatNumber(walletStats?.unfunded_wallets),
							},
						].map((item) => (
							<div key={item.label} className="rounded-xl bg-muted/40 p-4">
								<p className="text-xs text-muted-foreground">{item.label}</p>
								<p className="mt-1 text-2xl font-semibold text-foreground">
									{item.value}
								</p>
							</div>
						))}
					</div>
				</Card>
			</FadeUp>

			<FadeUp delay={320}>
				<Card className="p-4 sm:p-6">
					<div className="mb-5 flex items-center justify-between">
						<h2 className="text-base font-semibold text-foreground sm:text-lg">
							Recent Payroll Runs
						</h2>
						<Link href={routes.dashboardRoutes.PAYROLL_GROUPS}>
							<Button variant="outline" size="sm" className="gap-1 text-xs">
								View All <ChevronRight className="h-3 w-3" />
							</Button>
						</Link>
					</div>

					{recentRuns.length === 0 ? (
						<p className="py-8 text-center text-sm text-muted-foreground">
							No payroll runs yet. Create your first group in Payroll to get
							started.
						</p>
					) : (
						<div className="-mx-4 overflow-x-auto sm:mx-0">
							<table className="w-full text-xs sm:text-sm">
								<thead>
									<tr className="border-b">
										{["Group", "Amount", "Status", "Scheduled"].map(
											(header, index) => (
												<th
													key={header}
													className={cn(
														"px-4 py-3 text-left font-medium text-muted-foreground",
														index === 1 && "hidden sm:table-cell",
														index === 3 && "hidden md:table-cell",
													)}
												>
													{header}
												</th>
											),
										)}
									</tr>
								</thead>
								<tbody>
									{recentRuns.map((run) => (
										<tr
											key={run.id}
											className="border-b transition-colors hover:bg-muted/30 last:border-0"
										>
											<td className="px-4 py-3 font-medium text-foreground">
												<div>
													<p>{getGroupName(run.group_id)}</p>
													<p className="text-xs text-muted-foreground">
														{formatStatDate(run.period_start)} to{" "}
														{formatStatDate(run.period_end)}
													</p>
												</div>
											</td>
											<td className="hidden px-4 py-3 text-foreground sm:table-cell">
												{formatStatAmount(run.total_amount)} {run.currency}
											</td>
											<td className="px-4 py-3">
												<StatusBadge status={run.status.toLowerCase()} />
											</td>
											<td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
												{formatStatDate(run.scheduled_at)}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</Card>
			</FadeUp>
		</>
	);
}

function PersonalOverview() {
	const myStatsQuery = useMyStats();
	const myRequestsQuery = useMyPaymentRequests();
	const myRequests = usePaymentRequestStore((state) => state.myRequests);

	const myStats = myStatsQuery.data?.data;
	const pendingRequests = myRequests.filter(
		(request) => request.status === "PENDING",
	).length;
	const recentRequests = myRequests.slice(0, 5);

	return (
		<>
			<div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
				{[
					{
						label: "Total Received",
						value: myStats?.total_received_all_time ?? "--",
						icon: TrendingUp,
						href: routes.dashboardRoutes.PAYMENTS,
					},
					{
						label: "This Month",
						value: myStats?.total_received_this_month ?? "--",
						icon: ReceiptText,
						href: routes.dashboardRoutes.PAYMENTS,
					},
					{
						label: "Payments Received",
						value: formatStatNumber(myStats?.total_payments_received),
						icon: ShieldCheck,
						href: routes.dashboardRoutes.PAYMENTS,
					},
					{
						label: "Pending Requests",
						value: formatStatNumber(pendingRequests),
						icon: Wallet,
						href: routes.dashboardRoutes.WALLETS,
					},
				].map((stat, index) => {
					const Icon = stat.icon;

					return (
						<FadeUp key={stat.label} delay={index * 60}>
							<Link href={stat.href}>
								<Card className="group h-full cursor-pointer p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md sm:p-5">
									<div className="flex items-start justify-between gap-2">
										<div>
											<p className="text-xs text-muted-foreground sm:text-sm">
												{stat.label}
											</p>
											<p className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
												{stat.value}
											</p>
										</div>
										<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 transition-transform duration-200 group-hover:scale-110">
											<Icon className="h-5 w-5 text-primary" />
										</div>
									</div>
									<div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground transition-colors group-hover:text-primary">
										Open <ChevronRight className="h-3 w-3" />
									</div>
								</Card>
							</Link>
						</FadeUp>
					);
				})}
			</div>

			<div className="grid gap-4 xl:grid-cols-[1.25fr_1fr]">
				<FadeUp delay={200}>
					<Card className="border-primary/20 bg-linear-to-r from-primary/5 via-background to-accent/5 p-5 sm:p-6">
						<div className="flex flex-wrap items-center justify-between gap-4">
							<div>
								<p className="text-sm text-muted-foreground">
									Last Recorded Payment
								</p>
								<p className="mt-1 text-3xl font-bold text-primary">
									{formatStatDate(myStats?.last_payment_at)}
								</p>
								<p className="mt-2 text-sm text-muted-foreground">
									Use the payments page to review requests or raise a new one if
									something looks off.
								</p>
							</div>
							<div className="flex gap-2">
								<Button asChild>
									<Link href={routes.dashboardRoutes.PAYMENTS}>
										Open Payments
									</Link>
								</Button>
								<Button asChild variant="outline">
									<Link href={routes.dashboardRoutes.WALLETS}>Open Wallet</Link>
								</Button>
							</div>
						</div>
					</Card>
				</FadeUp>

				<FadeUp delay={260}>
					<Card className="p-5 sm:p-6">
						<div className="flex items-center justify-between gap-3">
							<div>
								<p className="text-sm text-muted-foreground">Quick Summary</p>
								<h2 className="text-lg font-semibold text-foreground">
									What needs attention
								</h2>
							</div>
							<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
								<AlertCircle className="h-5 w-5" />
							</div>
						</div>
						<div className="mt-5 grid grid-cols-2 gap-3">
							<div className="rounded-xl bg-muted/40 p-3">
								<p className="text-xs text-muted-foreground">Open Requests</p>
								<p className="mt-1 text-xl font-semibold text-foreground">
									{formatStatNumber(pendingRequests)}
								</p>
							</div>
							<div className="rounded-xl bg-muted/40 p-3">
								<p className="text-xs text-muted-foreground">
									All Requests Logged
								</p>
								<p className="mt-1 text-xl font-semibold text-foreground">
									{formatStatNumber(myRequests.length)}
								</p>
							</div>
						</div>
					</Card>
				</FadeUp>
			</div>

			<FadeUp delay={320}>
				<Card className="p-4 sm:p-6">
					<div className="mb-5 flex items-center justify-between">
						<h2 className="text-base font-semibold text-foreground sm:text-lg">
							Recent Payment Requests
						</h2>
						<Link href={routes.dashboardRoutes.PAYMENTS}>
							<Button variant="outline" size="sm" className="gap-1 text-xs">
								View All <ChevronRight className="h-3 w-3" />
							</Button>
						</Link>
					</div>

					{myStatsQuery.isPending || myRequestsQuery.isPending ? (
						<div className="space-y-3">
							<Skeleton className="h-16 w-full" />
							<Skeleton className="h-16 w-full" />
						</div>
					) : recentRequests.length === 0 ? (
						<p className="py-8 text-center text-sm text-muted-foreground">
							No payment requests yet. If you ever miss a payout, you can raise
							a request from the payments page.
						</p>
					) : (
						<div className="-mx-4 overflow-x-auto sm:mx-0">
							<table className="w-full text-xs sm:text-sm">
								<thead>
									<tr className="border-b">
										{["Amount", "Status", "Created", "Note"].map((header) => (
											<th
												key={header}
												className="px-4 py-3 text-left font-medium text-muted-foreground"
											>
												{header}
											</th>
										))}
									</tr>
								</thead>
								<tbody>
									{recentRequests.map((request) => (
										<tr
											key={request.id}
											className="border-b transition-colors hover:bg-muted/30 last:border-0"
										>
											<td className="px-4 py-3 font-medium text-foreground">
												{request.amount} {request.currency}
											</td>
											<td className="px-4 py-3">
												<StatusBadge status={request.status.toLowerCase()} />
											</td>
											<td className="px-4 py-3 text-muted-foreground">
												{formatStatDate(request.created_at)}
											</td>
											<td className="px-4 py-3 text-muted-foreground">
												{request.note}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</Card>
			</FadeUp>
		</>
	);
}

export default function DashboardPage() {
	const user = useAuthStore((state) => state.user);
	const firstName =
		user?.first_name || getUserDisplayName(user).split(" ")[0] || "there";
	const canViewCompanyDashboard = hasAnyPermission(user, [
		"*",
		"company:read",
		"employees:read",
		"payroll:read",
		"wallets:read",
		"reports:read",
		"audit:read",
	]);

	return (
		<div className="space-y-6 sm:space-y-8">
			<FadeUp>
				<div>
					<h1 className="text-2xl font-bold text-foreground sm:text-3xl">
						Welcome back, {firstName}
					</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						{canViewCompanyDashboard
							? "Here's what's happening with your company payroll and your personal payments."
							: "Here's a quick look at your payments, wallet access, and payout requests."}
					</p>
				</div>
			</FadeUp>

			{canViewCompanyDashboard && <CompanyOverview />}

			{canViewCompanyDashboard && (
				<FadeUp delay={100}>
					<div className="border-t pt-6 sm:pt-8">
						<h2 className="text-xl font-semibold text-foreground sm:text-2xl">
							Your Personal Overview
						</h2>
						<p className="mt-1 text-sm text-muted-foreground">
							Track your individual payments and wallet activity.
						</p>
					</div>
				</FadeUp>
			)}

			<PersonalOverview />
		</div>
	);
}
