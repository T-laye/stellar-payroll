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
import DeleteDialog from "../../../components/shared/DeleteDialog";





// ═══════════════════════════════════════════════════════════════════════════════
// PAYROLL PAGE — app/dashboard/payroll/page.tsx
// ═══════════════════════════════════════════════════════════════════════════════
export default function PayrollPage() {
	const groups = usePayrollStore((s) => s.getGroups());
	const deleteGroup = usePayrollStore((s) => s.deleteGroup);
	const addPayment = usePayrollStore((s) => s.addPayment);
	const updateGroup = usePayrollStore((s) => s.updateGroup);
	const employees = useEmployeeStore((s) => s.getEmployees());

	const [isOpen, setIsOpen] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [deleteId, setDeleteId] = useState<string | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);
	const [processingId, setProcessingId] = useState<string | null>(null);

	const editingGroup = editingId
		? groups.find((g) => g.id === editingId)
		: undefined;
	const deletingGroup = deleteId
		? groups.find((g) => g.id === deleteId)
		: undefined;

	const handleDelete = async () => {
		if (!deleteId) return;
		setIsDeleting(true);
		try {
			await new Promise((r) => setTimeout(r, 400));
			deleteGroup(deleteId);
			toast.success("Payroll group deleted", {
				description: `${deletingGroup?.name} has been removed.`,
			});
			setDeleteId(null);
		} catch {
			toast.error("Failed to delete group");
		} finally {
			setIsDeleting(false);
		}
	};

	const handleProcessPayroll = async (groupId: string) => {
		setProcessingId(groupId);
		const group = groups.find((g) => g.id === groupId);
		if (!group) return;

		const toastId = toast.loading(
			`Processing ${group.employees.length} payment${group.employees.length !== 1 ? "s" : ""}…`,
			{
				description: `Running payroll for ${group.name}`,
			},
		);

		try {
			await new Promise((r) => setTimeout(r, 1400));

			group.employees.forEach((empId) => {
				const emp = employees.find((e) => e.id === empId);
				if (emp) {
					addPayment({
						groupId,
						employeeId: empId,
						amount: emp.salary,
						currency: emp.currency,
						status: "pending",
					});
				}
			});

			updateGroup(groupId, { status: "approved" });

			toast.success(`Payroll processed`, {
				id: toastId,
				description: `${group.employees.length} payment${group.employees.length !== 1 ? "s" : ""} queued for ${group.name}.`,
			});
		} catch {
			toast.error("Payroll processing failed", {
				id: toastId,
				description: "Something went wrong. Please try again.",
			});
		} finally {
			setProcessingId(null);
		}
	};

	const handleSuccess = () => {
		const wasEditing = !!editingId;
		setIsOpen(false);
		setEditingId(null);
		toast.success(
			wasEditing ? "Payroll group updated" : "Payroll group created",
			{
				description: wasEditing
					? "Changes saved successfully."
					: "Your new payroll group is ready.",
			},
		);
	};

	return (
		<div className="space-y-6 sm:space-y-8">
			<FadeUp>
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h1 className="text-2xl sm:text-3xl font-bold text-foreground">
							Payroll Groups
						</h1>
						<p className="mt-1 text-sm text-muted-foreground">
							{groups.length} group{groups.length !== 1 ? "s" : ""} configured
						</p>
					</div>
					<Dialog
						open={isOpen}
						onOpenChange={(v) => {
							setIsOpen(v);
							if (!v) setEditingId(null);
						}}
					>
						<DialogTrigger asChild>
							<Button
								className="gap-2 w-full sm:w-auto shadow-sm"
								onClick={() => setEditingId(null)}
							>
								<Plus className="h-4 w-4" /> Create Group
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>
									{editingId ? "Edit Payroll Group" : "Create Payroll Group"}
								</DialogTitle>
								<DialogDescription>
									{editingId
										? "Update group details below."
										: "Set up a new recurring payroll group."}
								</DialogDescription>
							</DialogHeader>
							<PayrollForm group={editingGroup} onSuccess={handleSuccess} />
						</DialogContent>
					</Dialog>
				</div>
			</FadeUp>

			{groups.length === 0 ? (
				<FadeUp delay={60}>
					<EmptyState
						icon={Briefcase}
						title="No payroll groups yet"
						description="Create a payroll group to start managing recurring payments."
						action={
							<Button className="gap-2 mt-2" onClick={() => setIsOpen(true)}>
								<Plus className="h-4 w-4" /> Create First Group
							</Button>
						}
					/>
				</FadeUp>
			) : (
				<div className="grid gap-4 sm:gap-5">
					{groups.map((group, i) => (
						<FadeUp key={group.id} delay={i * 60}>
							<Card className="p-5 sm:p-6 hover:border-primary/30 hover:shadow-sm transition-all duration-200">
								<div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
									<div className="space-y-4 flex-1 min-w-0">
										{/* Title row */}
										<div className="flex items-start gap-3">
											<div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
												<Briefcase className="h-5 w-5 text-primary" />
											</div>
											<div className="min-w-0">
												<div className="flex items-center gap-2 flex-wrap">
													<h3 className="font-semibold text-foreground">
														{group.name}
													</h3>
													<StatusBadge status={group.status} />
												</div>
												{group.description && (
													<p className="text-xs text-muted-foreground mt-0.5">
														{group.description}
													</p>
												)}
											</div>
										</div>

										{/* Stats row */}
										<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
											{[
												{ label: "Employees", value: group.employees.length },
												{
													label: "Total Cost",
													value: `${group.totalAmount} ${group.currency}`,
												},
												{ label: "Frequency", value: group.frequency },
												{ label: "Next Run", value: "On demand" },
											].map((s) => (
												<div
													key={s.label}
													className="bg-muted/40 rounded-lg p-2.5"
												>
													<p className="text-xs text-muted-foreground">
														{s.label}
													</p>
													<p className="text-sm font-semibold text-foreground mt-0.5 capitalize">
														{s.value}
													</p>
												</div>
											))}
										</div>

										{/* Employee chips */}
										{group.employees.length > 0 && (
											<div className="flex flex-wrap gap-1.5">
												{group.employees.slice(0, 6).map((empId) => {
													const emp = employees.find((e) => e.id === empId);
													return emp ? (
														<span
															key={empId}
															className="inline-flex items-center gap-1 rounded-full bg-primary/8 px-2.5 py-0.5 text-xs text-primary font-medium"
														>
															<span className="h-1.5 w-1.5 rounded-full bg-primary/60" />
															{emp.name}
														</span>
													) : null;
												})}
												{group.employees.length > 6 && (
													<span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
														+{group.employees.length - 6} more
													</span>
												)}
											</div>
										)}
									</div>

									{/* Actions */}
									<div className="flex sm:flex-col gap-2 sm:min-w-27.5">
										<Button
											size="sm"
											className="gap-1.5 flex-1 sm:flex-none shadow-sm"
											onClick={() => handleProcessPayroll(group.id)}
											disabled={processingId === group.id}
										>
											{processingId === group.id ? (
												<>
													<Loader2 className="h-3.5 w-3.5 animate-spin" />{" "}
													Running…
												</>
											) : (
												<>
													<Send className="h-3.5 w-3.5" /> Process
												</>
											)}
										</Button>

										<Button
											variant="outline"
											size="sm"
											className="gap-1.5 flex-1 sm:flex-none"
											onClick={() => {
												setEditingId(group.id);
												setIsOpen(true);
											}}
										>
											<Edit2 className="h-3.5 w-3.5" /> Edit
										</Button>

										<Button
											variant="outline"
											size="sm"
											className="gap-1.5 flex-1 sm:flex-none text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20"
											onClick={() => setDeleteId(group.id)}
										>
											<Trash2 className="h-3.5 w-3.5" /> Delete
										</Button>
									</div>
								</div>
							</Card>
						</FadeUp>
					))}
				</div>
			)}

			<DeleteDialog
				open={!!deleteId}
				onOpenChange={(v) => !v && setDeleteId(null)}
				title="Delete Payroll Group"
				description={
					deletingGroup
						? `Are you sure you want to delete "${deletingGroup.name}"? This cannot be undone.`
						: "Are you sure? This action cannot be undone."
				}
				onConfirm={handleDelete}
				isLoading={isDeleting}
			/>
		</div>
	);
}


