"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, MoreHorizontal, Pencil, Power, Search, UserPlus, Users } from "lucide-react";
import { Button } from "@repo/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@repo/ui/dropdown-menu";
import { Input } from "@repo/ui/input";
import { toast } from "@repo/ui/sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/table";
import { FilterTabs } from "@/components/filter-tabs";
import { AssetBadge, Money } from "@/components/money";
import { PageHeader } from "@/components/page-header";
import { PersonCell } from "@/components/person";
import { RequirePermission } from "@/components/require-permission";
import { SectionCard } from "@/components/section-card";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/states";
import { EmployeeStatusPill } from "@/components/status-pill";
import { hasAnyPermission, useAuthStore } from "@/features/auth/store";
import { useEmployees, useSetEmployeeStatus } from "@/features/employees/hooks";
import type { CompanyEmployee } from "@/features/employees/types";
import { useGroups } from "@/features/payroll/hooks";
import { errorMessage } from "@/lib/api/request";
import { formatFrequency } from "@/lib/format";
import { routes } from "@/lib/routes";
import { employeePhase, type EmployeePhase } from "@/lib/status";

type Filter = "all" | Exclude<EmployeePhase, "terminated">;

const FILTERS: { value: Filter; label: string }[] = [
	{ value: "all", label: "All" },
	{ value: "active", label: "Active" },
	{ value: "pending", label: "Pending" },
	{ value: "inactive", label: "Inactive" },
];

/** PRD §9: everyone on payroll, with status Active / Pending / Inactive. */
function Employees() {
	const router = useRouter();
	const pathname = usePathname();
	const params = useSearchParams();
	const user = useAuthStore((state) => state.user);
	const canCreate = hasAnyPermission(user, ["employees:create"]);
	const canUpdate = hasAnyPermission(user, ["employees:update"]);
	const filter = (FILTERS.some((f) => f.value === params.get("status")) ? params.get("status") : "all") as Filter;
	const [search, setSearch] = useState(params.get("q") ?? "");
	const { data, isLoading, isError, refetch } = useEmployees();
	const groups = useGroups();
	const setStatus = useSetEmployeeStatus();
	const all = data ?? [];
	// Terminated people stay for history but count as Inactive here.
	const phaseOf = (e: CompanyEmployee): Filter => {
		const phase = employeePhase(e);
		return phase === "terminated" ? "inactive" : phase;
	};
	const counts = all.reduce<Partial<Record<Filter, number>>>(
		(acc, e) => {
			acc[phaseOf(e)] = (acc[phaseOf(e)] ?? 0) + 1;
			return acc;
		},
		{ all: all.length },
	);
	const term = search.trim().toLowerCase();
	const shown = all
		.filter((e) => filter === "all" || phaseOf(e) === filter)
		.filter(
			(e) => !term || `${e.first_name} ${e.last_name} ${e.email} ${e.job_title} ${e.department}`.toLowerCase().includes(term),
		)
		.sort((a, b) => `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`));
	const frequencyOf = (e: CompanyEmployee) => e.pay_frequency ?? groups.data?.find((g) => g.id === e.group_id)?.pay_cycle;

	const setFilter = (value: Filter) => {
		const next = new URLSearchParams(params.toString());
		if (value === "all") next.delete("status");
		else next.set("status", value);
		router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
	};

	const toggleActive = (e: CompanyEmployee) => {
		// Pending and active people can be deactivated; activating needs a wallet (409 without one).
		const status = e.status === "INACTIVE" ? "ACTIVE" : "INACTIVE";
		setStatus.mutate(
			{ id: e.id, status },
			{
				onSuccess: () => toast.success(`${e.first_name} ${e.last_name} is now ${status === "ACTIVE" ? "active" : "inactive"}`),
				onError: (error) => toast.error(errorMessage(error)),
			},
		);
	};

	return (
		<>
			<PageHeader
				title="Employees"
				description="Your team, their payment details, and who's ready to be paid."
				actions={
					canCreate && (
						<Button asChild>
							<Link href={routes.employees.create}>
								<UserPlus /> Add Employee
							</Link>
						</Button>
					)
				}
			/>
			<SectionCard flush>
				<div className="flex flex-col gap-3 border-b border-border p-4 xl:flex-row xl:items-center xl:justify-between">
					<FilterTabs options={FILTERS} value={filter} onChange={setFilter} counts={counts} label="Filter employees by status" />
					<div className="relative xl:w-72">
						<Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Search employees"
							className="pl-9"
							aria-label="Search employees"
						/>
					</div>
				</div>
				{isLoading ? (
					<TableSkeleton rows={6} columns={6} />
				) : isError ? (
					<ErrorState message="We couldn't load your employees." onRetry={() => refetch()} />
				) : shown.length === 0 ? (
					<EmptyState
						icon={Users}
						title={all.length === 0 ? "No employees yet" : "No employees match"}
						description={
							all.length === 0
								? "Add your team with their wallet and salary to start running payroll."
								: "Try another status or search."
						}
						action={
							all.length === 0 &&
							canCreate && (
								<Button asChild>
									<Link href={routes.employees.create}>
										<UserPlus /> Add Employee
									</Link>
								</Button>
							)
						}
					/>
				) : (
					<div className="overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow className="hover:bg-transparent">
									<TableHead className="pl-5">Name</TableHead>
									<TableHead className="hidden 2xl:table-cell">Email</TableHead>
									<TableHead className="hidden xl:table-cell">Role</TableHead>
									<TableHead className="text-right">Salary</TableHead>
									<TableHead className="hidden sm:table-cell">Asset</TableHead>
									<TableHead className="hidden xl:table-cell">Frequency</TableHead>
									<TableHead className="hidden sm:table-cell">Status</TableHead>
									<TableHead className="hidden w-20 pr-5 text-right sm:table-cell">
										<span className="sr-only">Actions</span>
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{shown.map((e) => (
									<TableRow key={e.id} className="group">
										<TableCell className="max-w-44 pl-5 sm:max-w-64">
											<Link href={routes.employees.detail(e.id)} className="block hover:[&_span]:text-primary">
												<PersonCell
													name={`${e.first_name} ${e.last_name}`}
													subtitle={<span className="hidden sm:inline 2xl:hidden">{e.email}</span>}
												/>
											</Link>
											{/* Phones: the status sits under the name instead of in its own column. */}
											<div className="mt-1.5 pl-12 sm:hidden">
												<EmployeeStatusPill employee={e} />
											</div>
										</TableCell>
										<TableCell className="hidden max-w-56 truncate text-muted-foreground 2xl:table-cell">{e.email}</TableCell>
										<TableCell className="hidden max-w-48 truncate xl:table-cell">
											{e.job_title}
										</TableCell>
										<TableCell className="text-right font-medium">
											<Money value={e.salary_amount} asset={e.salary_currency} />
										</TableCell>
										<TableCell className="hidden sm:table-cell">
											<AssetBadge asset={e.salary_currency} />
										</TableCell>
										<TableCell className="hidden text-muted-foreground xl:table-cell">
											{formatFrequency(frequencyOf(e))}
										</TableCell>
										<TableCell className="hidden sm:table-cell">
											<EmployeeStatusPill employee={e} />
										</TableCell>
										<TableCell className="hidden pr-5 text-right sm:table-cell">
											<div className="flex items-center justify-end">
												{canUpdate && e.status !== "TERMINATED" && (
													<DropdownMenu>
														<DropdownMenuTrigger asChild>
															<Button variant="ghost" size="icon-sm" aria-label={`Actions for ${e.first_name}`}>
																<MoreHorizontal />
															</Button>
														</DropdownMenuTrigger>
														<DropdownMenuContent align="end">
															<DropdownMenuItem asChild>
																<Link href={routes.employees.edit(e.id)}>
																	<Pencil /> Edit
																</Link>
															</DropdownMenuItem>
															<DropdownMenuSeparator />
															<DropdownMenuItem
																onSelect={() => toggleActive(e)}
																variant={e.status === "INACTIVE" ? "default" : "destructive"}
															>
																<Power /> {e.status === "INACTIVE" ? "Activate" : "Deactivate"}
															</DropdownMenuItem>
														</DropdownMenuContent>
													</DropdownMenu>
												)}
												<Button asChild variant="ghost" size="icon-sm" aria-label={`View ${e.first_name}`}>
													<Link href={routes.employees.detail(e.id)}>
														<ChevronRight />
													</Link>
												</Button>
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				)}
				{shown.length > 0 && (
					<p className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
						{shown.length} of {all.length} employees
					</p>
				)}
			</SectionCard>
		</>
	);
}

export default function EmployeesPage() {
	return (
		<RequirePermission any={["employees:read"]}>
			<Suspense fallback={<TableSkeleton rows={6} />}>
				<Employees />
			</Suspense>
		</RequirePermission>
	);
}
