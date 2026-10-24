"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarClock, ChevronRight, FileText, Plus, Search } from "lucide-react";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/table";
import { FilterTabs } from "@/components/filter-tabs";
import { Money } from "@/components/money";
import { PageHeader } from "@/components/page-header";
import { RequirePermission } from "@/components/require-permission";
import { SectionCard } from "@/components/section-card";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/states";
import { RunStatusPill } from "@/components/status-pill";
import { hasAnyPermission, useAuthStore } from "@/features/auth/store";
import { useGroups, useRuns } from "@/features/payroll/hooks";
import type { PayrollRun } from "@/features/payroll/types";
import { runName } from "@/features/payroll/utils";
import { formatDate, formatPeriod } from "@/lib/format";
import { routes } from "@/lib/routes";
import { RUN_FILTERS, runPhase, type RunPhase } from "@/lib/status";

type Filter = "all" | RunPhase;

/** Payroll history (PRD §4): every cycle, filtered by Pending / Scheduled / Processing / Completed / Failed. */
function PayrollHistory() {
	const router = useRouter();
	const pathname = usePathname();
	const params = useSearchParams();
	const canCreate = useAuthStore((state) => hasAnyPermission(state.user, ["payroll:create"]));
	const filter = (RUN_FILTERS.some((f) => f.value === params.get("status")) ? params.get("status") : "all") as Filter;
	const [search, setSearch] = useState("");
	const { data, isLoading, isError, refetch } = useRuns();
	const groups = useGroups();
	const runs = data ?? [];

	const counts = runs.reduce<Partial<Record<Filter, number>>>(
		(acc, run) => {
			const phase = runPhase(run);
			// Cancelled runs sit under Failed, where the API puts them.
			const key = phase === "cancelled" ? "failed" : phase;
			acc[key] = (acc[key] ?? 0) + 1;
			return acc;
		},
		{ all: runs.length },
	);
	const term = search.trim().toLowerCase();
	const shown = runs.filter((run) => {
		const phase = runPhase(run);
		const matches = filter === "all" || phase === filter || (filter === "failed" && phase === "cancelled");
		return matches && (!term || runName(run, groups.data).toLowerCase().includes(term));
	});

	const setFilter = (value: Filter) =>
		router.replace(value === "all" ? pathname : `${pathname}?status=${value}`, { scroll: false });

	return (
		<>
			<PageHeader
				title="Payroll History"
				description="Every payroll cycle, from draft to paid."
				actions={
					<>
						<Button asChild variant="outline">
							<Link href={routes.recurring.list}>
								<CalendarClock /> Recurring
							</Link>
						</Button>
						{canCreate && (
							<Button asChild>
								<Link href={routes.payroll.create}>
									<Plus /> Create Payroll
								</Link>
							</Button>
						)}
					</>
				}
			/>
			<SectionCard flush>
				<div className="flex flex-col gap-3 border-b border-border p-4 xl:flex-row xl:items-center xl:justify-between">
					<FilterTabs
						options={RUN_FILTERS}
						value={filter}
						onChange={setFilter}
						counts={counts}
						label="Filter payroll by status"
					/>
					<div className="relative xl:w-56">
						<Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Search cycles"
							className="pl-9"
							aria-label="Search payroll cycles"
						/>
					</div>
				</div>
				{isLoading ? (
					<TableSkeleton rows={6} />
				) : isError ? (
					<ErrorState message="We couldn't load payroll history." onRetry={() => refetch()} />
				) : shown.length === 0 ? (
					<EmptyState
						icon={FileText}
						title={runs.length === 0 ? "No payroll yet" : "No payroll matches"}
						description={
							runs.length === 0
								? "Create your first payroll: pick the people, review the amounts, and pay them on Stellar."
								: "Try another status or search."
						}
						action={
							runs.length === 0 &&
							canCreate && (
								<Button asChild>
									<Link href={routes.payroll.create}>
										<Plus /> Create Payroll
									</Link>
								</Button>
							)
						}
					/>
				) : (
					<RunsTable runs={shown} groups={groups.data} />
				)}
			</SectionCard>
		</>
	);
}

function RunsTable({ runs, groups }: { runs: PayrollRun[]; groups?: Parameters<typeof runName>[1] }) {
	return (
		<div className="overflow-x-auto">
			<Table>
				<TableHeader>
					<TableRow className="hover:bg-transparent">
						<TableHead className="pl-5">Cycle name</TableHead>
						<TableHead className="hidden text-right sm:table-cell">Employees</TableHead>
						<TableHead className="text-right">Total amount</TableHead>
						<TableHead className="hidden md:table-cell">Pay date</TableHead>
						<TableHead className="hidden sm:table-cell">Status</TableHead>
						<TableHead className="hidden xl:table-cell">Payments</TableHead>
						<TableHead className="hidden w-10 pr-5 sm:table-cell" />
					</TableRow>
				</TableHeader>
				<TableBody>
					{runs.map((run) => {
						const p = run.payments;
						const settled = p ? p.confirmed + p.failed : 0;
						const all = p ? settled + p.pending : 0;
						return (
							<TableRow key={run.id} className="group relative">
								<TableCell className="max-w-40 pl-5 sm:max-w-72">
									<Link
										href={routes.payroll.detail(run.id)}
										className="block truncate font-medium text-foreground after:absolute after:inset-0 hover:text-primary"
									>
										{runName(run, groups)}
									</Link>
									<span className="block text-xs text-muted-foreground">{formatPeriod(run.period_start, run.period_end)}</span>
									{/* Phones: the status sits under the name instead of in its own column. */}
									<span className="mt-1.5 block sm:hidden">
										<RunStatusPill run={run} />
									</span>
								</TableCell>
								<TableCell className="hidden text-right tabular-nums sm:table-cell">{run.employee_count ?? "—"}</TableCell>
								<TableCell className="text-right font-medium">
									<Money value={run.total_amount} asset={run.currency} />
								</TableCell>
								<TableCell className="hidden whitespace-nowrap text-muted-foreground md:table-cell">
									{formatDate(run.scheduled_at)}
								</TableCell>
								<TableCell className="hidden sm:table-cell">
									<RunStatusPill run={run} />
								</TableCell>
								<TableCell className="hidden text-sm text-muted-foreground xl:table-cell">
									{all > 0 ? (
										<span className="tabular-nums">
											<span className="text-success">{p!.confirmed} paid</span>
											{p!.failed > 0 && <span className="text-destructive"> · {p!.failed} failed</span>}
											{p!.pending > 0 && <span> · {p!.pending} in progress</span>}
										</span>
									) : (
										"—"
									)}
								</TableCell>
								<TableCell className="hidden pr-5 text-muted-foreground sm:table-cell">
									<ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
								</TableCell>
							</TableRow>
						);
					})}
				</TableBody>
			</Table>
		</div>
	);
}

export default function PayrollPage() {
	return (
		<RequirePermission any={["payroll:read"]}>
			<Suspense fallback={<TableSkeleton rows={6} />}>
				<PayrollHistory />
			</Suspense>
		</RequirePermission>
	);
}
