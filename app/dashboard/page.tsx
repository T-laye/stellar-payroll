"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/stores/auth-store";
import { usePayrollStore } from "@/lib/stores/payroll-store";
import { useEmployeeStore } from "@/lib/stores/employee-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { Users, Briefcase, Send, TrendingUp, ChevronRight } from "lucide-react";
import FadeUp from "../../components/shared/FadeUp";
import { cn } from "../../lib/utils";
import StatusBadge from "../../components/shared/StatusBadge";

export default function DashboardPage() {
	const [mounted, setMounted] = useState(false);
	const user = useAuthStore((s) => s.user);
	const employees = useEmployeeStore((s) => s.employees);
	const payrollGroups = usePayrollStore((s) => s.getGroups());
	const payments = usePayrollStore((s) => s.payments);

	useEffect(() => {
		setMounted(true);
	}, []);
	if (!mounted) return null;

	const totalPayroll = payments
		.filter((p) => p.status === "completed")
		.reduce((sum, p) => sum + Number(p.amount), 0);

	const stats = [
		{
			label: "Total Employees",
			value: employees.length,
			icon: Users,
			color: "text-blue-600",
			bg: "bg-blue-50 dark:bg-blue-900/20",
			href: "/dashboard/employees",
		},
		{
			label: "Payroll Groups",
			value: payrollGroups.length,
			icon: Briefcase,
			color: "text-purple-600",
			bg: "bg-purple-50 dark:bg-purple-900/20",
			href: "/dashboard/payroll",
		},
		{
			label: "Pending Payments",
			value: payments.filter((p) => p.status === "pending").length,
			icon: Send,
			color: "text-orange-600",
			bg: "bg-orange-50 dark:bg-orange-900/20",
			href: "/dashboard/payments",
		},
		{
			label: "Completed",
			value: payments.filter((p) => p.status === "completed").length,
			icon: TrendingUp,
			color: "text-green-600",
			bg: "bg-green-50 dark:bg-green-900/20",
			href: "/dashboard/payments",
		},
	];

	const recentPayments = payments.slice(0, 5);

	return (
		<div className="space-y-6 sm:space-y-8">
			{/* Welcome */}
			<FadeUp>
				<div>
					<h1 className="text-2xl sm:text-3xl font-bold text-foreground">
						Welcome back, {user?.name?.split(" ")[0]} 👋
					</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Here's what's happening with your payroll today.
					</p>
				</div>
			</FadeUp>

			{/* Stats */}
			<div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
				{stats.map((stat, i) => {
					const Icon = stat.icon;
					return (
						<FadeUp key={stat.label} delay={i * 60}>
							<Link href={stat.href}>
								<Card className="p-4 sm:p-5 hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group">
									<div className="flex items-start justify-between gap-2">
										<div>
											<p className="text-xs sm:text-sm text-muted-foreground">
												{stat.label}
											</p>
											<p className="text-2xl sm:text-3xl font-bold text-foreground mt-1">
												{stat.value}
											</p>
										</div>
										<div
											className={cn(
												"h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110",
												stat.bg,
											)}
										>
											<Icon className={cn("h-5 w-5", stat.color)} />
										</div>
									</div>
									<div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground group-hover:text-primary transition-colors">
										View details <ChevronRight className="h-3 w-3" />
									</div>
								</Card>
							</Link>
						</FadeUp>
					);
				})}
			</div>

			{/* Total payroll processed */}
			{totalPayroll > 0 && (
				<FadeUp delay={200}>
					<Card className="p-5 sm:p-6 bg-linear-to-r from-primary/5 via-background to-accent/5 border-primary/20">
						<div className="flex items-center justify-between flex-wrap gap-4">
							<div>
								<p className="text-sm text-muted-foreground">
									Total Payroll Processed
								</p>
								<p className="text-3xl font-bold text-primary mt-1">
									$
									{totalPayroll.toLocaleString(undefined, {
										minimumFractionDigits: 2,
										maximumFractionDigits: 2,
									})}
								</p>
							</div>
							<div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
								<TrendingUp className="h-6 w-6 text-primary" />
							</div>
						</div>
					</Card>
				</FadeUp>
			)}

			{/* Recent Payments */}
			<FadeUp delay={240}>
				<Card className="p-4 sm:p-6">
					<div className="flex items-center justify-between mb-5">
						<h2 className="text-base sm:text-lg font-semibold text-foreground">
							Recent Payments
						</h2>
						<Link href="/dashboard/payments">
							<Button variant="outline" size="sm" className="text-xs gap-1">
								View All <ChevronRight className="h-3 w-3" />
							</Button>
						</Link>
					</div>

					{recentPayments.length === 0 ? (
						<p className="text-sm text-muted-foreground text-center py-8">
							No payments yet. Process a payroll group to get started.
						</p>
					) : (
						<div className="overflow-x-auto -mx-4 sm:mx-0">
							<table className="w-full text-xs sm:text-sm">
								<thead>
									<tr className="border-b">
										{["Employee", "Amount", "Status", "Date"].map((h, i) => (
											<th
												key={h}
												className={cn(
													"text-left py-3 px-4 font-medium text-muted-foreground",
													i === 1 && "hidden sm:table-cell",
													i === 3 && "hidden md:table-cell",
												)}
											>
												{h}
											</th>
										))}
									</tr>
								</thead>
								<tbody>
									{recentPayments.map((payment) => {
										const emp = employees.find(
											(e) => e.id === payment.employeeId,
										);
										return (
											<tr
												key={payment.id}
												className="border-b last:border-0 hover:bg-muted/30 transition-colors"
											>
												<td className="py-3 px-4 font-medium text-foreground">
													{emp?.name ?? "Unknown"}
												</td>
												<td className="py-3 px-4 text-foreground hidden sm:table-cell">
													{payment.amount} {payment.currency}
												</td>
												<td className="py-3 px-4">
													<StatusBadge status={payment.status} />
												</td>
												<td className="py-3 px-4 text-muted-foreground hidden md:table-cell">
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
