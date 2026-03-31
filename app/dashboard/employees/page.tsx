"use client";

import { useState } from "react";
import { useEmployeeStore } from "@/lib/stores/employee-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmployeeForm } from "@/components/employees/employee-form";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Users, Plus, Trash2, Edit2, Search } from "lucide-react";
import FadeUp from "../../../components/shared/FadeUp";
import EmptyState from "../../../components/shared/EmptyState";
import StatusBadge from "../../../components/shared/StatusBadge";
import DeleteDialog from "../../../components/shared/DeleteDialog";

// ═══════════════════════════════════════════════════════════════════════════════
// EMPLOYEES PAGE — app/dashboard/employees/page.tsx
// ═══════════════════════════════════════════════════════════════════════════════
export default function EmployeesPage() {
	const employees = useEmployeeStore((s) => s.employees);
	const deleteEmployee = useEmployeeStore((s) => s.deleteEmployee);

	const [isOpen, setIsOpen] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [deleteId, setDeleteId] = useState<string | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);
	const [search, setSearch] = useState("");

	const editingEmployee = editingId
		? employees.find((e) => e.id === editingId)
		: undefined;
	const deletingEmployee = deleteId
		? employees.find((e) => e.id === deleteId)
		: undefined;

	const filtered = employees.filter(
		(e) =>
			e.name.toLowerCase().includes(search.toLowerCase()) ||
			e.email.toLowerCase().includes(search.toLowerCase()) ||
			e.country?.toLowerCase().includes(search.toLowerCase()),
	);

	const handleDelete = async () => {
		if (!deleteId) return;
		setIsDeleting(true);
		try {
			await new Promise((r) => setTimeout(r, 400));
			deleteEmployee(deleteId);
			toast.success("Employee removed", {
				description: `${deletingEmployee?.name} has been removed from your team.`,
			});
			setDeleteId(null);
		} catch {
			toast.error("Failed to delete employee", {
				description: "Please try again.",
			});
		} finally {
			setIsDeleting(false);
		}
	};

	const handleSuccess = () => {
		setIsOpen(false);
		setEditingId(null);
		toast.success(editingId ? "Employee updated" : "Employee added", {
			description: editingId
				? "Employee details have been updated."
				: "New team member has been added successfully.",
		});
	};

	return (
		<div className="space-y-6 sm:space-y-8">
			{/* Header */}
			<FadeUp>
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h1 className="text-2xl sm:text-3xl font-bold text-foreground">
							Employees
						</h1>
						<p className="mt-1 text-sm text-muted-foreground">
							{employees.length} team member{employees.length !== 1 ? "s" : ""}{" "}
							across your organization
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
								<Plus className="h-4 w-4" /> Add Employee
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>
									{editingId ? "Edit Employee" : "Add New Employee"}
								</DialogTitle>
								<DialogDescription>
									{editingId
										? "Update employee information below."
										: "Fill in the details to add a new team member."}
								</DialogDescription>
							</DialogHeader>
							<EmployeeForm
								employee={editingEmployee}
								onSuccess={handleSuccess}
							/>
						</DialogContent>
					</Dialog>
				</div>
			</FadeUp>

			{/* Search */}
			{employees.length > 0 && (
				<FadeUp delay={60}>
					<div className="relative max-w-sm">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
						<Input
							placeholder="Search employees..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="pl-9"
						/>
					</div>
				</FadeUp>
			)}

			{/* Table */}
			{employees.length === 0 ? (
				<FadeUp delay={80}>
					<EmptyState
						icon={Users}
						title="No employees yet"
						description="Add your first team member to get started with payroll."
						action={
							<Button className="gap-2 mt-2" onClick={() => setIsOpen(true)}>
								<Plus className="h-4 w-4" /> Add First Employee
							</Button>
						}
					/>
				</FadeUp>
			) : filtered.length === 0 ? (
				<FadeUp delay={80}>
					<Card className="p-8 text-center">
						<p className="text-sm text-muted-foreground">
							No employees match "{search}"
						</p>
					</Card>
				</FadeUp>
			) : (
				<FadeUp delay={80}>
					<Card className="overflow-hidden">
						<div className="overflow-x-auto">
							<table className="w-full text-sm">
								<thead className="border-b bg-muted/30">
									<tr>
										{["Name", "Email", "Country", "Salary", "Status", ""].map(
											(h, i) => (
												<th
													key={i}
													className={cn(
														"text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide",
														i === 1 && "hidden sm:table-cell",
														i === 2 && "hidden md:table-cell",
														i === 3 && "hidden lg:table-cell",
														i === 5 && "text-right",
													)}
												>
													{h}
												</th>
											),
										)}
									</tr>
								</thead>
								<tbody>
									{filtered.map((employee, i) => (
										<tr
											key={employee.id}
											className="border-b last:border-0 hover:bg-muted/20 transition-colors"
											style={{ animationDelay: `${i * 30}ms` }}
										>
											<td className="py-3 px-4">
												<div className="flex items-center gap-2.5">
													<div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
														<span className="text-xs font-semibold text-primary">
															{employee.name[0].toUpperCase()}
														</span>
													</div>
													<span className="font-medium text-foreground">
														{employee.name}
													</span>
												</div>
											</td>
											<td className="py-3 px-4 text-muted-foreground hidden sm:table-cell">
												{employee.email}
											</td>
											<td className="py-3 px-4 text-muted-foreground hidden md:table-cell">
												{employee.country}
											</td>
											<td className="py-3 px-4 font-medium text-foreground hidden lg:table-cell">
												{employee.salary} {employee.currency}
											</td>
											<td className="py-3 px-4">
												<StatusBadge status={employee.status} />
											</td>
											<td className="py-3 px-4">
												<div className="flex justify-end gap-1">
													<Button
														variant="ghost"
														size="sm"
														className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary transition-colors"
														onClick={() => {
															setEditingId(employee.id);
															setIsOpen(true);
														}}
													>
														<Edit2 className="h-3.5 w-3.5" />
													</Button>
													<Button
														variant="ghost"
														size="sm"
														className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive transition-colors"
														onClick={() => setDeleteId(employee.id)}
													>
														<Trash2 className="h-3.5 w-3.5" />
													</Button>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
						{filtered.length > 0 && (
							<div className="px-4 py-3 border-t bg-muted/20 text-xs text-muted-foreground">
								Showing {filtered.length} of {employees.length} employees
							</div>
						)}
					</Card>
				</FadeUp>
			)}

			<DeleteDialog
				open={!!deleteId}
				onOpenChange={(v) => !v && setDeleteId(null)}
				title="Remove Employee"
				description={
					deletingEmployee
						? `Are you sure you want to remove ${deletingEmployee.name}? This action cannot be undone.`
						: "Are you sure? This action cannot be undone."
				}
				onConfirm={handleDelete}
				isLoading={isDeleting}
			/>
		</div>
	);
}
