"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getUserDisplayName, useAuthStore } from "@/lib/stores/auth-store";
import { usePayrollStore } from "@/lib/stores/payroll-store";
import { useEmployeeStore } from "@/lib/stores/employee-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Briefcase, Send, TrendingUp, ChevronRight } from "lucide-react";
import FadeUp from "../../components/shared/FadeUp";
import { cn } from "../../lib/utils";
import StatusBadge from "../../components/shared/StatusBadge";
import { routes } from "../../lib/utils/routes";

export default function DashboardPage() {
	const [mounted, setMounted] = useState(false);
	const user = useAuthStore((state) => state.user);
	const employees = useEmployeeStore((state) => state.employees);
	const payrollGroups = usePayrollStore((state) => state.getGroups());
	const payments = usePayrollStore((state) => state.payments);

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) return null;

	const totalPayroll = payments
		.filter((payment) => payment.status === "completed")
		.reduce((sum, payment) => sum + Number(payment.amount), 0);
	const recentPayments = payments.slice(0, 5);
	const firstName =
		user?.first_name || getUserDisplayName(user).split(" ")[0] || "there";

	const stats = [
		{
			label: "Total Employees",
			value: employees.length,
			icon: Users,
			color: "text-blue-600",
			bg: "bg-blue-50 dark:bg-blue-900/20",
			href: routes.dashboardRoutes.EMPLOYEES,
		},
		{
			label: "Payroll Groups",
			value: payrollGroups.length,
			icon: Briefcase,
			color: "text-purple-600",
			bg: "bg-purple-50 dark:bg-purple-900/20",
			href: routes.dashboardRoutes.PAYROLL_GROUPS,
		},
		{
			label: "Pending Payments",
			value: payments.filter((payment) => payment.status === "pending").length,
			icon: Send,
			color: "text-orange-600",
			bg: "bg-orange-50 dark:bg-orange-900/20",
			href: routes.dashboardRoutes.PAYMENTS,
		},
		{
			label: "Completed",
			value: payments.filter((payment) => payment.status === "completed").length,
			icon: TrendingUp,
			color: "text-green-600",
			bg: "bg-green-50 dark:bg-green-900/20",
			href: routes.dashboardRoutes.PAYMENTS,
		},
	];

	return (
		<div className="space-y-6 sm:space-y-8">
			<FadeUp>
				<div>
					<h1 className="text-2xl font-bold text-foreground sm:text-3xl">
						Welcome back, {firstName}
					</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Here&apos;s what&apos;s happening with your payroll today.
					</p>
				</div>
			</FadeUp>

			<div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
				{stats.map((stat, index) => {
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

			{totalPayroll > 0 && (
				<FadeUp delay={200}>
					<Card className="border-primary/20 bg-linear-to-r from-primary/5 via-background to-accent/5 p-5 sm:p-6">
						<div className="flex flex-wrap items-center justify-between gap-4">
							<div>
								<p className="text-sm text-muted-foreground">
									Total Payroll Processed
								</p>
								<p className="mt-1 text-3xl font-bold text-primary">
									$
									{totalPayroll.toLocaleString(undefined, {
										minimumFractionDigits: 2,
										maximumFractionDigits: 2,
									})}
								</p>
							</div>
							<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
								<TrendingUp className="h-6 w-6 text-primary" />
							</div>
						</div>
					</Card>
				</FadeUp>
			)}

			<FadeUp delay={240}>
				<Card className="p-4 sm:p-6">
					<div className="mb-5 flex items-center justify-between">
						<h2 className="text-base font-semibold text-foreground sm:text-lg">
							Recent Payments
						</h2>
						<Link href={routes.dashboardRoutes.PAYMENTS}>
							<Button variant="outline" size="sm" className="gap-1 text-xs">
								View All <ChevronRight className="h-3 w-3" />
							</Button>
						</Link>
					</div>

					{recentPayments.length === 0 ? (
						<p className="py-8 text-center text-sm text-muted-foreground">
							No payments yet. Process a payroll group to get started.
						</p>
					) : (
						<div className="-mx-4 overflow-x-auto sm:mx-0">
							<table className="w-full text-xs sm:text-sm">
								<thead>
									<tr className="border-b">
										{["Employee", "Amount", "Status", "Date"].map(
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
									{recentPayments.map((payment) => {
										const employee = employees.find(
											(item) => item.id === payment.employeeId,
										);

										return (
											<tr
												key={payment.id}
												className="border-b transition-colors hover:bg-muted/30 last:border-0"
											>
												<td className="px-4 py-3 font-medium text-foreground">
													{employee?.name ?? "Unknown"}
												</td>
												<td className="hidden px-4 py-3 text-foreground sm:table-cell">
													{payment.amount} {payment.currency}
												</td>
												<td className="px-4 py-3">
													<StatusBadge status={payment.status} />
												</td>
												<td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
													{new Date(payment.createdAt).toLocaleDateString()}
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					)}
				</Card>
			</FadeUp>
		</div>
	);
}
