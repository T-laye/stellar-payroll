"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Building2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/table";
import { FilterTabs } from "@/components/filter-tabs";
import { PageHeader } from "@/components/page-header";
import { Pager } from "@/components/pager";
import { SectionCard } from "@/components/section-card";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/states";
import { TonePill } from "@/components/status-pill";
import { SearchBox } from "@/features/admin/components/filters";
import { useCompanies, useOverview } from "@/features/admin/hooks";
import { countryName } from "@/features/admin/labels";
import { formatDate } from "@/lib/format";
import { useDebounced } from "@/lib/use-debounced";

type Status = "all" | "active" | "suspended";

const STATUSES: { value: Status; label: string }[] = [
	{ value: "all", label: "All" },
	{ value: "active", label: "Active" },
	{ value: "suspended", label: "Suspended" },
];

const LIMIT = 20;

function Companies() {
	const router = useRouter();
	const pathname = usePathname();
	const params = useSearchParams();
	const status = (STATUSES.some((s) => s.value === params.get("status")) ? params.get("status") : "all") as Status;
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
	const term = useDebounced(search.trim());
	const overview = useOverview();
	const { data, isLoading, isError, refetch } = useCompanies({
		page,
		limit: LIMIT,
		search: term || undefined,
		is_active: status === "all" ? undefined : status === "active" ? "true" : "false",
	});
	const companies = data?.data ?? [];
	const o = overview.data;

	const setStatus = (value: Status) => {
		setPage(1);
		router.replace(value === "all" ? pathname : `${pathname}?status=${value}`, { scroll: false });
	};

	return (
		<>
			<PageHeader title="Companies" description="Every workspace on PayOrbit. Suspending one signs its people out and stops them signing in." />
			<SectionCard flush>
				<div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
					<FilterTabs
						options={STATUSES}
						value={status}
						onChange={setStatus}
						counts={o ? { all: o.total_companies, active: o.active_companies, suspended: o.suspended_companies } : undefined}
						label="Filter companies by status"
					/>
					<SearchBox
						value={search}
						onChange={(value) => {
							setSearch(value);
							setPage(1);
						}}
						label="Search by name or email"
					/>
				</div>
				{isLoading ? (
					<TableSkeleton rows={6} columns={5} />
				) : isError ? (
					<ErrorState message="We couldn't load companies." onRetry={() => refetch()} />
				) : companies.length === 0 ? (
					<EmptyState icon={Building2} title="No companies match" description="Try another status or search." />
				) : (
					<div className="overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow className="hover:bg-transparent">
									<TableHead className="pl-5">Company</TableHead>
									<TableHead className="hidden md:table-cell">Country</TableHead>
									<TableHead className="hidden lg:table-cell">Currency</TableHead>
									<TableHead className="hidden sm:table-cell">Joined</TableHead>
									<TableHead className="pr-5">Status</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{companies.map((c) => (
									<TableRow key={c.id}>
										<TableCell className="max-w-64 pl-5 sm:max-w-80">
											<Link href={`/companies/${c.id}`} className="flex items-center gap-3 hover:[&_.name]:text-primary">
												<span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary">
													<Building2 className="size-4" />
												</span>
												<span className="min-w-0">
													<span className="name block truncate font-medium">{c.name}</span>
													<span className="block truncate text-xs text-muted-foreground">{c.email}</span>
												</span>
											</Link>
										</TableCell>
										<TableCell className="hidden md:table-cell">{countryName(c.country)}</TableCell>
										<TableCell className="hidden text-muted-foreground lg:table-cell">{c.default_currency || "--"}</TableCell>
										<TableCell className="hidden text-muted-foreground sm:table-cell">{formatDate(c.created_at)}</TableCell>
										<TableCell className="pr-5">
											<TonePill label={c.is_active ? "Active" : "Suspended"} tone={c.is_active ? "success" : "danger"} />
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				)}
				<Pager page={page} limit={LIMIT} total={data?.meta?.total ?? 0} onPage={setPage} />
			</SectionCard>
		</>
	);
}

export default function CompaniesPage() {
	return (
		<Suspense>
			<Companies />
		</Suspense>
	);
}
