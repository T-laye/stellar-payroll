"use client";

// ============================================================
// ENHANCED DASHBOARD PAGES
// app/dashboard/page.tsx
// app/dashboard/employees/page.tsx
// app/dashboard/payroll/page.tsx
// app/dashboard/payments/page.tsx
// app/dashboard/settings/page.tsx
// ============================================================

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth-store";
import { usePayrollStore } from "@/lib/stores/payroll-store";
import { useEmployeeStore } from "@/lib/stores/employee-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { EmployeeForm } from "@/components/employees/employee-form";
import { PayrollForm } from "@/components/payroll/payroll-form";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Users,
	Briefcase,
	Send,
	TrendingUp,
	Plus,
	Trash2,
	Edit2,
	CheckCircle,
	Clock,
	AlertCircle,
	Copy,
	ExternalLink,
	Search,
	Filter,
	RefreshCw,
	ShieldCheck,
	Key,
	Webhook,
	User,
	Mail,
	Building,
	ChevronRight,
	Loader2,
	AlertTriangle,
} from "lucide-react";
import FadeUp from "../../../components/shared/FadeUp";
import EmptyState from "../../../components/shared/EmptyState";
import StatusBadge from "../../../components/shared/StatusBadge";

// ═══════════════════════════════════════════════════════════════════════════════
// PAYMENTS PAGE — app/dashboard/payments/page.tsx
// ═══════════════════════════════════════════════════════════════════════════════
export default function PaymentsPage() {
	const payments = usePayrollStore((s) => s.payments);
	const updatePayment = usePayrollStore((s) => s.updatePayment);
	const groups = usePayrollStore((s) => s.getGroups());
	const employees = useEmployeeStore((s) => s.getEmployees());

	const [selectedStatus, setSelectedStatus] = useState("all");
	const prevCompletedRef = useRef<Set<string>>(new Set());

	// Simulate payment processing + toast on completion
	useEffect(() => {
		const interval = setInterval(() => {
			payments
				.filter((p) => p.status === "processing")
				.forEach((payment) => {
					if (Math.random() > 0.3) {
						updatePayment(payment.id, {
							status: "completed",
							completedAt: new Date().toISOString(),
						});
						if (!prevCompletedRef.current.has(payment.id)) {
							prevCompletedRef.current.add(payment.id);
							const emp = employees.find((e) => e.id === payment.employeeId);
							toast.success("Payment completed", {
								description: `${emp?.name ?? "Employee"} — ${payment.amount} ${payment.currency}`,
							});
						}
					}
				});
		}, 3000);
		return () => clearInterval(interval);
	}, [payments, updatePayment, employees]);

	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text);
		toast.success("Copied to clipboard", {
			description: "Transaction hash copied.",
		});
	};

	const filtered =
		selectedStatus === "all"
			? payments
			: payments.filter((p) => p.status === selectedStatus);

	const stats = [
		{
			label: "Total",
			value: payments.length,
			color: "text-foreground",
			bg: "bg-muted/50",
		},
		{
			label: "Completed",
			value: payments.filter((p) => p.status === "completed").length,
			color: "text-green-600",
			bg: "bg-green-50 dark:bg-green-900/20",
		},
		{
			label: "Processing",
			value: payments.filter((p) => p.status === "processing").length,
			color: "text-blue-600",
			bg: "bg-blue-50 dark:bg-blue-900/20",
		},
		{
			label: "Pending",
			value: payments.filter((p) => p.status === "pending").length,
			color: "text-yellow-600",
			bg: "bg-yellow-50 dark:bg-yellow-900/20",
		},
		{
			label: "Failed",
			value: payments.filter((p) => p.status === "failed").length,
			color: "text-red-600",
			bg: "bg-red-50 dark:bg-red-900/20",
		},
	];

	const statusIcon = (status: string) => {
		switch (status) {
			case "completed":
				return <CheckCircle className="h-4 w-4 text-green-600" />;
			case "processing":
				return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
			case "pending":
				return <Clock className="h-4 w-4 text-yellow-600" />;
			case "failed":
				return <AlertCircle className="h-4 w-4 text-red-600" />;
			default:
				return null;
		}
	};

	return (
		<div className="space-y-6 sm:space-y-8">
			<FadeUp>
				<div>
					<h1 className="text-2xl sm:text-3xl font-bold text-foreground">
						Payments
					</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Track and manage your cross-border payments
					</p>
				</div>
			</FadeUp>

			{/* Stats */}
			<div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-5">
				{stats.map((s, i) => (
					<FadeUp key={s.label} delay={i * 50}>
						<Card className={cn("p-4 sm:p-5", s.bg)}>
							<p className="text-xs text-muted-foreground">{s.label}</p>
							<p className={cn("text-2xl font-bold mt-1", s.color)}>
								{s.value}
							</p>
						</Card>
					</FadeUp>
				))}
			</div>

			{/* Filter */}
			<FadeUp delay={200}>
				<div className="flex items-center gap-3">
					<Filter className="h-4 w-4 text-muted-foreground shrink-0" />
					<Select value={selectedStatus} onValueChange={setSelectedStatus}>
						<SelectTrigger className="w-44">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Payments</SelectItem>
							<SelectItem value="pending">Pending</SelectItem>
							<SelectItem value="processing">Processing</SelectItem>
							<SelectItem value="completed">Completed</SelectItem>
							<SelectItem value="failed">Failed</SelectItem>
						</SelectContent>
					</Select>
					{selectedStatus !== "all" && (
						<Button
							variant="ghost"
							size="sm"
							className="text-xs"
							onClick={() => setSelectedStatus("all")}
						>
							Clear
						</Button>
					)}
				</div>
			</FadeUp>

			{/* List */}
			{filtered.length === 0 ? (
				<FadeUp delay={220}>
					<EmptyState
						icon={Send}
						title={
							payments.length === 0
								? "No payments yet"
								: "No payments match this filter"
						}
						description={
							payments.length === 0
								? "Process a payroll group to generate payments."
								: "Try selecting a different status filter."
						}
					/>
				</FadeUp>
			) : (
				<div className="space-y-3">
					{filtered.map((payment, i) => {
						const emp = employees.find((e) => e.id === payment.employeeId);
						const group = groups.find((g) => g.id === payment.groupId);
						return (
							<FadeUp key={payment.id} delay={i * 40}>
								<Card className="p-5 sm:p-6 hover:border-primary/20 transition-colors">
									<div className="flex items-start justify-between gap-4 flex-wrap">
										<div className="flex items-center gap-3">
											{statusIcon(payment.status)}
											<div>
												<p className="font-semibold text-foreground text-sm">
													{emp?.name ?? "Unknown"}
												</p>
												<p className="text-xs text-muted-foreground">
													{group?.name}
												</p>
											</div>
										</div>
										<StatusBadge status={payment.status} />
									</div>

									<div className="grid grid-cols-2 gap-3 mt-4 sm:grid-cols-4">
										<div>
											<p className="text-xs text-muted-foreground">Amount</p>
											<p className="text-sm font-semibold text-foreground">
												{payment.amount} {payment.currency}
											</p>
										</div>
										<div>
											<p className="text-xs text-muted-foreground">Created</p>
											<p className="text-sm text-foreground">
												{new Date(payment.createdAt).toLocaleDateString()}
											</p>
										</div>
										{payment.completedAt && (
											<div>
												<p className="text-xs text-muted-foreground">
													Completed
												</p>
												<p className="text-sm text-foreground">
													{new Date(payment.completedAt).toLocaleDateString()}
												</p>
											</div>
										)}
									</div>

									{/* Tx hash */}
									{payment.stellarTxHash && (
										<div className="mt-4 rounded-lg bg-muted/50 p-3 flex items-center justify-between gap-3">
											<div className="min-w-0">
												<p className="text-xs text-muted-foreground">
													Transaction Hash
												</p>
												<p className="font-mono text-xs text-foreground truncate">
													{payment.stellarTxHash.substring(0, 24)}…
												</p>
											</div>
											<div className="flex gap-1 shrink-0">
												<Button
													variant="ghost"
													size="sm"
													className="h-7 w-7 p-0"
													onClick={() =>
														copyToClipboard(payment.stellarTxHash!)
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
														href={`https://stellar.expert/explorer/public/tx/${payment.stellarTxHash}`}
														target="_blank"
														rel="noopener noreferrer"
													>
														<ExternalLink className="h-3.5 w-3.5" />
													</a>
												</Button>
											</div>
										</div>
									)}

									{/* Status hints */}
									{payment.status === "processing" && (
										<div className="mt-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-2.5 flex items-center gap-2">
											<RefreshCw className="h-3.5 w-3.5 text-blue-600 animate-spin shrink-0" />
											<p className="text-xs text-blue-700 dark:text-blue-400">
												Payment is being processed on the Stellar network…
											</p>
										</div>
									)}
									{payment.status === "failed" && (
										<div className="mt-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 p-2.5 flex items-center gap-2">
											<AlertCircle className="h-3.5 w-3.5 text-red-600 shrink-0" />
											<p className="text-xs text-red-700 dark:text-red-400">
												Payment failed. Please retry or contact support.
											</p>
										</div>
									)}
								</Card>
							</FadeUp>
						);
					})}
				</div>
			)}
		</div>
	);
}
