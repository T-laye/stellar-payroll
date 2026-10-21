"use client";

import { Suspense, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeftRight, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/select";
import { PageHeader } from "@/components/page-header";
import { RequirePermission } from "@/components/require-permission";
import { SectionCard } from "@/components/section-card";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/states";
import { hasAnyPermission, useAuthStore } from "@/features/auth/store";
import { useEmployees } from "@/features/employees/hooks";
import { TransactionsTable } from "@/features/payroll/components/transactions-table";
import { useGroups, useRuns, useTransactions } from "@/features/payroll/hooks";
import { runName } from "@/features/payroll/utils";
import { PAYMENT_FILTERS } from "@/lib/status";

const PAGE_SIZE = 20;
const ALL = "all";

/** Filters live in the URL, so dashboard links like `?status=FAILED` land pre-filtered. */
function Transactions() {
	const router = useRouter();
	const pathname = usePathname();
	const params = useSearchParams();
	const canRetry = useAuthStore((state) => hasAnyPermission(state.user, ["payroll:execute"]));
	const filters = {
		status: params.get("status") ?? "",
		employee_id: params.get("employee") ?? "",
		payroll_run_id: params.get("run") ?? "",
		from: params.get("from") ?? "",
		to: params.get("to") ?? "",
		q: params.get("q") ?? "",
		page: Number(params.get("page")) || 1,
	};
	const [search, setSearch] = useState(filters.q);
	const { data, isLoading, isError, refetch, isFetching } = useTransactions({ ...filters, page_size: PAGE_SIZE });
	const employees = useEmployees();
	const runs = useRuns();
	const groups = useGroups();
	const names = new Map((employees.data ?? []).map((e) => [e.id, `${e.first_name} ${e.last_name}`]));
	const rows = data?.data ?? [];
	const total = data?.meta?.total ?? rows.length;
	const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
	const filtered = Boolean(
		filters.status || filters.employee_id || filters.payroll_run_id || filters.from || filters.to || filters.q,
	);

	const set = (changes: Record<string, string | number | null>) => {
		const next = new URLSearchParams(params.toString());
		for (const [key, value] of Object.entries(changes)) {
			if (value === null || value === "" || value === ALL) next.delete(key);
			else next.set(key, String(value));
		}
		if (!("page" in changes)) next.delete("page");
		router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
	};

	// A combined status from a dashboard link ("PENDING,SUBMITTED") shows as its first option.
	const statusValue = PAYMENT_FILTERS.some((f) => f.value === filters.status)
		? filters.status || ALL
		: filters.status.split(",")[0] || ALL;

	return (
		<>
			<PageHeader
				title="Transactions"
				description="Every payroll payment, its status and its Stellar reference."
				breadcrumbs={[{ label: "Payroll", href: "/payroll" }, { label: "Transactions" }]}
			/>
			<SectionCard flush>
				<div className="grid grid-cols-1 gap-3 border-b border-border p-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))_minmax(0,1.4fr)]">
					<div className="flex min-w-0 items-center gap-2 sm:col-span-2 2xl:col-span-1">
						<Input
							type="date"
							aria-label="From date"
							value={filters.from}
							max={filters.to || undefined}
							onChange={(e) => set({ from: e.target.value })}
							className="min-w-0 flex-1"
						/>
						<span className="text-sm text-muted-foreground" aria-hidden>
							to
						</span>
						<Input
							type="date"
							aria-label="To date"
							value={filters.to}
							min={filters.from || undefined}
							onChange={(e) => set({ to: e.target.value })}
							className="min-w-0 flex-1"
						/>
					</div>
					<form
						role="search"
						className="relative sm:col-span-2 lg:col-span-1 2xl:order-last"
						onSubmit={(e) => {
							e.preventDefault();
							set({ q: search.trim() });
						}}
					>
						<Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							onBlur={() => search.trim() !== filters.q && set({ q: search.trim() })}
							placeholder="Search hash or name"
							className="pl-9"
							aria-label="Search transactions"
						/>
					</form>
					<Select value={filters.employee_id || ALL} onValueChange={(v) => set({ employee: v })}>
						<SelectTrigger className="w-full" aria-label="Employee">
							<SelectValue placeholder="Employee" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={ALL}>All employees</SelectItem>
							{(employees.data ?? []).map((e) => (
								<SelectItem key={e.id} value={e.id}>
									{e.first_name} {e.last_name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Select value={filters.payroll_run_id || ALL} onValueChange={(v) => set({ run: v })}>
						<SelectTrigger className="w-full" aria-label="Payroll cycle">
							<SelectValue placeholder="Payroll cycle" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={ALL}>All payroll cycles</SelectItem>
							{(runs.data ?? [])
								.filter((r) => r.executed_at)
								.map((r) => (
									<SelectItem key={r.id} value={r.id}>
										{runName(r, groups.data)}
									</SelectItem>
								))}
						</SelectContent>
					</Select>
					<Select value={statusValue} onValueChange={(v) => set({ status: v })}>
						<SelectTrigger className="w-full" aria-label="Status">
							<SelectValue placeholder="Status" />
						</SelectTrigger>
						<SelectContent>
							{PAYMENT_FILTERS.map((f) => (
								<SelectItem key={f.value || ALL} value={f.value || ALL}>
									{f.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				{filtered && (
					<div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-2 text-sm">
						<span className="text-muted-foreground">
							{total} matching payment{total === 1 ? "" : "s"}
						</span>
						<Button
							variant="ghost"
							size="sm"
							className="h-7"
							onClick={() => {
								setSearch("");
								router.replace(pathname, { scroll: false });
							}}
						>
							<X /> Clear filters
						</Button>
					</div>
				)}
				{isLoading ? (
					<TableSkeleton rows={8} columns={6} />
				) : isError ? (
					<ErrorState message="We couldn't load transactions." onRetry={() => refetch()} />
				) : rows.length === 0 ? (
					<EmptyState
						icon={ArrowLeftRight}
						title={filtered ? "No payments match these filters" : "No transactions yet"}
						description={
							filtered
								? "Try a wider date range or another status."
								: "Payments appear here as soon as a payroll run is executed."
						}
					/>
				) : (
					<div className={isFetching ? "opacity-70 transition-opacity" : "transition-opacity"}>
						<TransactionsTable payments={rows} names={names} canRetryPayments={canRetry} />
					</div>
				)}
				{pages > 1 && (
					<div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm text-muted-foreground">
						<span>
							{(filters.page - 1) * PAGE_SIZE + 1}–{Math.min(filters.page * PAGE_SIZE, total)} of {total}
						</span>
						<div className="flex gap-1">
							<Button
								variant="outline"
								size="icon-sm"
								disabled={filters.page <= 1}
								onClick={() => set({ page: filters.page - 1 })}
								aria-label="Previous page"
							>
								<ChevronLeft />
							</Button>
							<Button
								variant="outline"
								size="icon-sm"
								disabled={filters.page >= pages}
								onClick={() => set({ page: filters.page + 1 })}
								aria-label="Next page"
							>
								<ChevronRight />
							</Button>
						</div>
					</div>
				)}
			</SectionCard>
		</>
	);
}

export default function TransactionsPage() {
	return (
		<RequirePermission any={["payroll:read"]}>
			<Suspense fallback={<TableSkeleton rows={8} />}>
				<Transactions />
			</Suspense>
		</RequirePermission>
	);
}
