"use client";

import { useMemo, useState } from "react";
import {
	AlertCircle,
	Briefcase,
	Edit2,
	Eye,
	Plus,
	Search,
	Trash2,
	UserPlus,
	Users,
	Wallet,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import DeleteDialog from "@/components/shared/DeleteDialog";
import EmptyState from "@/components/shared/EmptyState";
import FadeUp from "@/components/shared/FadeUp";
import StatusBadge from "@/components/shared/StatusBadge";
import { EmployeeForm } from "@/components/employees/employee-form";
import {
	useCompanyEmployees,
	useEmployeeDetails,
	useEmployeeWalletDetails,
	useLinkEmployeeWallet,
	useTerminateEmployee,
} from "@/hooks/employee.hook";
import { useCompanyEmployeeStats } from "@/hooks/stats.hook";
import {
	getEmployeeDisplayName,
	getEmployeeInitials,
	getEmployeeSalaryValue,
	useEmployeeStore,
} from "@/lib/stores/employee-store";
import { cn } from "@/lib/utils";
import {
	formatStatAmount,
	formatStatDate,
	formatStatLabel,
	formatStatNumber,
	sumStatRecord,
} from "@/lib/utils/stats";
import { toast } from "sonner";

export default function EmployeesPage() {
	const employees = useEmployeeStore((state) => state.employees);
	const employeeWallets = useEmployeeStore((state) => state.employeeWallets);
	const employeeQuery = useCompanyEmployees();
	const employeeStatsQuery = useCompanyEmployeeStats();
	const { mutateAsync: terminateEmployee, isPending: isTerminating } =
		useTerminateEmployee();
	const { mutateAsync: linkEmployeeWallet, isPending: isLinkingWallet } =
		useLinkEmployeeWallet();

	const [isFormOpen, setIsFormOpen] = useState(false);
	const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
	const [detailsEmployeeId, setDetailsEmployeeId] = useState<string | null>(null);
	const [terminateEmployeeId, setTerminateEmployeeId] = useState<string | null>(
		null,
	);
	const [search, setSearch] = useState("");
	const [walletAddress, setWalletAddress] = useState("");

	const employeeStats = employeeStatsQuery.data?.data;
	const detailsQuery = useEmployeeDetails(detailsEmployeeId ?? undefined);
	const walletDetailsQuery = useEmployeeWalletDetails(detailsEmployeeId ?? undefined);
	const editingEmployee = editingEmployeeId
		? employees.find((employee) => employee.id === editingEmployeeId)
		: undefined;
	const selectedEmployee = detailsEmployeeId
		? employees.find((employee) => employee.id === detailsEmployeeId)
		: undefined;
	const terminatingEmployee = terminateEmployeeId
		? employees.find((employee) => employee.id === terminateEmployeeId)
		: undefined;
	const detailedEmployee = detailsQuery.data?.data ?? selectedEmployee;
	const selectedWallet =
		(detailsEmployeeId && employeeWallets[detailsEmployeeId]) || null;

	const filteredEmployees = useMemo(() => {
		return employees.filter((employee) => {
			const displayName = getEmployeeDisplayName(employee).toLowerCase();
			const query = search.toLowerCase();

			return (
				displayName.includes(query) ||
				employee.email.toLowerCase().includes(query) ||
				employee.department.toLowerCase().includes(query) ||
				employee.job_title.toLowerCase().includes(query) ||
				employee.country.toLowerCase().includes(query)
			);
		});
	}, [employees, search]);

	const activeEmployees = employees.filter(
		(employee) => employee.status === "ACTIVE",
	).length;
	const terminatedEmployees = employees.filter(
		(employee) => employee.status === "TERMINATED",
	).length;
	const employeesWithWallets = employees.filter((employee) => employee.wallet).length;
	const topDepartments = employeeStats?.by_department.slice(0, 4) ?? [];

	const handleFormSuccess = () => {
		setIsFormOpen(false);
		setEditingEmployeeId(null);
		toast.success(
			editingEmployeeId ? "Employee updated" : "Employee created",
			{
				description: editingEmployeeId
					? "Employee details have been updated successfully."
					: "The employee has been added to your company.",
			},
		);
	};

	const handleTerminate = async () => {
		if (!terminateEmployeeId) {
			return;
		}

		try {
			await terminateEmployee(terminateEmployeeId);
			toast.success("Employee terminated", {
				description: `${getEmployeeDisplayName(terminatingEmployee)} has been terminated.`,
			});
			setTerminateEmployeeId(null);
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to terminate employee.",
			);
		}
	};

	const handleWalletSubmit = async () => {
		if (!detailsEmployeeId) {
			return;
		}

		try {
			await linkEmployeeWallet({
				employeeId: detailsEmployeeId,
				payload: walletAddress.trim()
					? { stellar_address: walletAddress.trim() }
					: {},
			});
			toast.success(
				walletAddress.trim()
					? "Employee wallet linked"
					: "Employee wallet generated",
			);
			setWalletAddress("");
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to update wallet.",
			);
		}
	};

	return (
		<div className="space-y-6 sm:space-y-8">
			<FadeUp>
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h1 className="text-2xl font-bold text-foreground sm:text-3xl">
							Employees
						</h1>
						<p className="mt-1 text-sm text-muted-foreground">
							Manage your company directory, payroll details, and employee
							wallet links.
						</p>
					</div>
					<Dialog
						open={isFormOpen}
						onOpenChange={(open) => {
							setIsFormOpen(open);
							if (!open) {
								setEditingEmployeeId(null);
							}
						}}
					>
						<DialogTrigger asChild>
							<Button
								className="w-full gap-2 shadow-sm sm:w-auto"
								onClick={() => setEditingEmployeeId(null)}
							>
								<Plus className="h-4 w-4" /> Add Employee
							</Button>
						</DialogTrigger>
						<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
							<DialogHeader>
								<DialogTitle>
									{editingEmployeeId ? "Edit Employee" : "Create Employee"}
								</DialogTitle>
								<DialogDescription>
									{editingEmployeeId
										? "Update the employee details below."
										: "Create a new employee record for this company."}
								</DialogDescription>
							</DialogHeader>
							<EmployeeForm
								employee={editingEmployee}
								onSuccess={handleFormSuccess}
							/>
						</DialogContent>
					</Dialog>
				</div>
			</FadeUp>

			{(employeeQuery.isError || employeeStatsQuery.isError) && (
				<FadeUp delay={40}>
					<Alert className="border-amber-200 bg-amber-50 text-amber-900">
						<AlertCircle className="h-4 w-4" />
						<AlertTitle>Some employee data could not be loaded</AlertTitle>
						<AlertDescription className="text-amber-800">
							The page remains usable, but one or more employee endpoints are not
							responding right now.
						</AlertDescription>
					</Alert>
				</FadeUp>
			)}

			{employeeQuery.isPending && employees.length === 0 ? (
				<div className="grid gap-4 lg:grid-cols-4">
					{Array.from({ length: 4 }).map((_, index) => (
						<FadeUp key={index} delay={index * 40}>
							<Card className="p-4">
								<Skeleton className="h-4 w-28" />
								<Skeleton className="mt-3 h-10 w-16" />
							</Card>
						</FadeUp>
					))}
				</div>
			) : (
				<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
					{[
						{
							label: "Total Employees",
							value: formatStatNumber(employees.length),
							icon: Users,
						},
						{
							label: "Active Employees",
							value: formatStatNumber(activeEmployees),
							icon: UserPlus,
						},
						{
							label: "Wallets Linked",
							value: formatStatNumber(employeesWithWallets),
							icon: Wallet,
						},
						{
							label: "Terminated",
							value: formatStatNumber(terminatedEmployees),
							icon: AlertCircle,
						},
					].map((item) => {
						const Icon = item.icon;

						return (
							<Card key={item.label} className="p-4 sm:p-5">
								<div className="flex items-start justify-between gap-3">
									<div>
										<p className="text-xs text-muted-foreground">{item.label}</p>
										<p className="mt-2 text-2xl font-semibold text-foreground">
											{item.value}
										</p>
									</div>
									<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
										<Icon className="h-5 w-5 text-primary" />
									</div>
								</div>
							</Card>
						);
					})}
				</div>
			)}

			{employeeStats && (
				<div className="grid gap-4 xl:grid-cols-3">
					<FadeUp delay={100}>
						<Card className="p-5">
							<p className="text-sm font-medium text-foreground">
								Onboarding Snapshot
							</p>
							<div className="mt-4 grid grid-cols-2 gap-3">
								<div className="rounded-xl bg-muted/40 p-3">
									<p className="text-xs text-muted-foreground">
										Onboarded This Month
									</p>
									<p className="mt-1 text-xl font-semibold text-foreground">
										{formatStatNumber(employeeStats.onboarded_this_month)}
									</p>
								</div>
								<div className="rounded-xl bg-muted/40 p-3">
									<p className="text-xs text-muted-foreground">
										Without Wallet
									</p>
									<p className="mt-1 text-xl font-semibold text-foreground">
										{formatStatNumber(employeeStats.without_wallet)}
									</p>
								</div>
							</div>
						</Card>
					</FadeUp>

					<FadeUp delay={140}>
						<Card className="p-5">
							<p className="text-sm font-medium text-foreground">
								Top Departments
							</p>
							<div className="mt-4 space-y-3">
								{topDepartments.length === 0 ? (
									<p className="text-sm text-muted-foreground">
										No department breakdown yet.
									</p>
								) : (
									topDepartments.map((department) => (
										<div
											key={department.department}
											className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2.5"
										>
											<span className="text-sm text-foreground">
												{department.department}
											</span>
											<span className="text-sm font-medium text-muted-foreground">
												{formatStatNumber(department.count)}
											</span>
										</div>
									))
								)}
							</div>
						</Card>
					</FadeUp>

					<FadeUp delay={180}>
						<Card className="p-5">
							<p className="text-sm font-medium text-foreground">
								Employment Mix
							</p>
							<div className="mt-4 flex flex-wrap gap-2">
								{Object.entries(employeeStats.by_employment_type).length === 0 ? (
									<p className="text-sm text-muted-foreground">
										No employment mix data yet.
									</p>
								) : (
									Object.entries(employeeStats.by_employment_type).map(
										([type, count]) => (
											<Badge key={type} variant="outline">
												{formatStatLabel(type)}: {formatStatNumber(count)}
											</Badge>
										),
									)
								)}
							</div>
							<p className="mt-4 text-sm text-muted-foreground">
								Tracked employees across all types:{" "}
								<span className="font-medium text-foreground">
									{formatStatNumber(
										sumStatRecord(employeeStats.by_employment_type),
									)}
								</span>
							</p>
						</Card>
					</FadeUp>
				</div>
			)}

			{employees.length > 0 && (
				<FadeUp delay={60}>
					<div className="relative max-w-sm">
						<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							placeholder="Search employees..."
							value={search}
							onChange={(event) => setSearch(event.target.value)}
							className="pl-9"
						/>
					</div>
				</FadeUp>
			)}

			{employees.length === 0 ? (
				<FadeUp delay={80}>
					<EmptyState
						icon={Users}
						title="No employees yet"
						description="Add your first team member to start managing payroll and wallets."
						action={
							<Button className="mt-2 gap-2" onClick={() => setIsFormOpen(true)}>
								<Plus className="h-4 w-4" /> Add First Employee
							</Button>
						}
					/>
				</FadeUp>
			) : filteredEmployees.length === 0 ? (
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
										{[
											"Name",
											"Department",
											"Role",
											"Salary",
											"Wallet",
											"Status",
											"",
										].map((header, index) => (
											<th
												key={header}
												className={cn(
													"px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground",
													index === 2 && "hidden lg:table-cell",
													index === 4 && "hidden md:table-cell",
													index === 6 && "text-right",
												)}
											>
												{header}
											</th>
										))}
									</tr>
								</thead>
								<tbody>
									{filteredEmployees.map((employee) => (
										<tr
											key={employee.id}
											className="border-b transition-colors last:border-0 hover:bg-muted/20"
										>
											<td className="px-4 py-3">
												<div className="flex items-center gap-2.5">
													<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
														<span className="text-xs font-semibold text-primary">
															{getEmployeeInitials(employee)}
														</span>
													</div>
													<div>
														<p className="font-medium text-foreground">
															{getEmployeeDisplayName(employee)}
														</p>
														<p className="text-xs text-muted-foreground">
															{employee.email}
														</p>
													</div>
												</div>
											</td>
											<td className="px-4 py-3 text-muted-foreground">
												{employee.department}
											</td>
											<td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
												{employee.job_title}
											</td>
											<td className="px-4 py-3 font-medium text-foreground">
												{formatStatAmount(getEmployeeSalaryValue(employee))}{" "}
												{employee.salary_currency}
											</td>
											<td className="hidden px-4 py-3 md:table-cell">
												{employee.wallet ? (
													<Badge variant="outline">
														{employee.wallet.is_funded
															? "Funded Wallet"
															: "Wallet Linked"}
													</Badge>
												) : (
													<span className="text-xs text-muted-foreground">
														No wallet
													</span>
												)}
											</td>
											<td className="px-4 py-3">
												<StatusBadge status={employee.status.toLowerCase()} />
											</td>
											<td className="px-4 py-3">
												<div className="flex justify-end gap-1">
													<Button
														variant="ghost"
														size="sm"
														className="h-8 w-8 p-0"
														onClick={() => setDetailsEmployeeId(employee.id)}
													>
														<Eye className="h-4 w-4" />
													</Button>
													<Button
														variant="ghost"
														size="sm"
														className="h-8 w-8 p-0"
														onClick={() => {
															setEditingEmployeeId(employee.id);
															setIsFormOpen(true);
														}}
													>
														<Edit2 className="h-4 w-4" />
													</Button>
													<Button
														variant="ghost"
														size="sm"
														className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
														onClick={() => setTerminateEmployeeId(employee.id)}
														disabled={employee.status === "TERMINATED"}
													>
														<Trash2 className="h-4 w-4" />
													</Button>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
						<div className="border-t bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
							Showing {filteredEmployees.length} of {employees.length} employees
						</div>
					</Card>
				</FadeUp>
			)}

			<Dialog
				open={Boolean(detailsEmployeeId)}
				onOpenChange={(open) => {
					if (!open) {
						setDetailsEmployeeId(null);
						setWalletAddress("");
					}
				}}
			>
				<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
					<DialogHeader>
						<DialogTitle>Employee Details</DialogTitle>
						<DialogDescription>
							Review employee information and manage the linked wallet.
						</DialogDescription>
					</DialogHeader>

					{detailsQuery.isLoading && !detailedEmployee ? (
						<div className="space-y-3">
							<Skeleton className="h-16 w-full" />
							<Skeleton className="h-40 w-full" />
						</div>
					) : detailedEmployee ? (
						<div className="space-y-5">
							<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
								{[
									{
										label: "Employee Number",
										value: detailedEmployee.employee_number || "Not assigned",
									},
									{
										label: "Department",
										value: detailedEmployee.department,
									},
									{
										label: "Job Title",
										value: detailedEmployee.job_title,
									},
									{
										label: "Employment Type",
										value: formatStatLabel(detailedEmployee.employment_type),
									},
									{
										label: "Start Date",
										value: formatStatDate(detailedEmployee.start_date),
									},
									{
										label: "External ID",
										value: detailedEmployee.external_id || "Not provided",
									},
								].map((item) => (
									<div key={item.label} className="rounded-xl bg-muted/40 p-3">
										<p className="text-xs text-muted-foreground">{item.label}</p>
										<p className="mt-1 text-sm font-medium text-foreground">
											{item.value}
										</p>
									</div>
								))}
							</div>

							<div className="rounded-2xl border border-border bg-muted/20 p-4">
								<div className="flex items-center gap-2">
									<Wallet className="h-4 w-4 text-primary" />
									<p className="text-sm font-semibold text-foreground">
										Wallet Management
									</p>
								</div>

								<div className="mt-4 space-y-4">
									{selectedWallet ? (
										<>
											<div className="grid gap-3 sm:grid-cols-3">
												<div className="rounded-xl bg-background p-3">
													<p className="text-xs text-muted-foreground">
														Network
													</p>
													<p className="mt-1 text-sm font-medium text-foreground">
														{selectedWallet.network}
													</p>
												</div>
												<div className="rounded-xl bg-background p-3">
													<p className="text-xs text-muted-foreground">
														Wallet Type
													</p>
													<p className="mt-1 text-sm font-medium text-foreground">
														{selectedWallet.wallet_type}
													</p>
												</div>
												<div className="rounded-xl bg-background p-3">
													<p className="text-xs text-muted-foreground">
														Total Payments Received
													</p>
													<p className="mt-1 text-sm font-medium text-foreground">
														{formatStatNumber(
															selectedWallet.total_payments_received,
														)}
													</p>
												</div>
											</div>

											<div className="rounded-xl bg-background p-3">
												<p className="text-xs text-muted-foreground">
													Stellar Address
												</p>
												<p className="mt-1 break-all font-mono text-sm text-foreground">
													{selectedWallet.stellar_address}
												</p>
											</div>

											<div>
												<p className="text-sm font-medium text-foreground">
													Balances
												</p>
												<div className="mt-2 grid gap-2">
													{selectedWallet.balances.length === 0 ? (
														<p className="text-sm text-muted-foreground">
															No balances returned for this wallet yet.
														</p>
													) : (
														selectedWallet.balances.map((balance) => (
															<div
																key={`${balance.asset}-${balance.amount}`}
																className="flex items-center justify-between rounded-xl bg-background px-3 py-2.5"
															>
																<span className="text-sm text-foreground">
																	{balance.asset}
																</span>
																<span className="text-sm font-medium text-muted-foreground">
																	{formatStatAmount(balance.amount)}
																</span>
															</div>
														))
													)}
												</div>
											</div>
										</>
									) : walletDetailsQuery.isLoading ? (
										<p className="text-sm text-muted-foreground">
											Loading wallet details...
										</p>
									) : (
										<p className="text-sm text-muted-foreground">
											No wallet details found for this employee yet.
										</p>
									)}

									<div className="space-y-2">
										<label className="text-sm font-medium text-foreground">
											Link Existing Wallet
										</label>
										<Input
											value={walletAddress}
											onChange={(event) => setWalletAddress(event.target.value)}
											placeholder="Leave blank to generate a custodial wallet"
										/>
										<p className="text-xs text-muted-foreground">
											Provide a Stellar address to link an external wallet, or
											leave it blank to generate one.
										</p>
									</div>
								</div>
							</div>
						</div>
					) : (
						<p className="text-sm text-muted-foreground">
							Employee details are unavailable right now.
						</p>
					)}

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setDetailsEmployeeId(null)}
						>
							Close
						</Button>
						<Button onClick={handleWalletSubmit} disabled={isLinkingWallet}>
							{isLinkingWallet
								? "Saving..."
								: walletAddress.trim()
									? "Link Wallet"
									: "Generate Wallet"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<DeleteDialog
				open={Boolean(terminateEmployeeId)}
				onOpenChange={(open) => !open && setTerminateEmployeeId(null)}
				title="Terminate Employee"
				description={
					terminatingEmployee
						? `This will mark ${getEmployeeDisplayName(terminatingEmployee)} as terminated.`
						: "This will mark the employee as terminated."
				}
				onConfirm={handleTerminate}
				isLoading={isTerminating}
			/>
		</div>
	);
}
