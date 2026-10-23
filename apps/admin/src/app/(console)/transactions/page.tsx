"use client";

import { Suspense, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeftRight } from "lucide-react";
import { Input } from "@repo/ui/input";
import { PageHeader } from "@/components/page-header";
import { Pager } from "@/components/pager";
import { SectionCard } from "@/components/section-card";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/states";
import { CompanySelect, FilterSelect } from "@/features/admin/components/filters";
import { TransactionsTable } from "@/features/admin/components/transactions-table";
import { useTransactions } from "@/features/admin/hooks";
import { ApiError } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/request";
import { PAYMENT_FILTERS } from "@/lib/status";

const LIMIT = 20;

/** A date input's day as the RFC 3339 instant the API wants; `to` is exclusive, so it's the next midnight. */
const dayStart = (date: string) => (date ? `${date}T00:00:00Z` : undefined);
function dayAfter(date: string) {
	if (!date) return undefined;
	const next = new Date(`${date}T00:00:00Z`);
	next.setUTCDate(next.getUTCDate() + 1);
	return next.toISOString().replace(".000Z", "Z");
}

function Transactions() {
	const router = useRouter();
	const pathname = usePathname();
	const params = useSearchParams();
	const companyId = params.get("company") ?? "";
	const [status, setStatus] = useState("");
	const [from, setFrom] = useState("");
	const [to, setTo] = useState("");
	const [page, setPage] = useState(1);
	const { data, isLoading, isError, error, refetch } = useTransactions({
		page,
		limit: LIMIT,
		company_id: companyId || undefined,
		status: status || undefined,
		from: dayStart(from),
		to: dayAfter(to),
	});
	const transactions = data?.data ?? [];
	const filtered = !!status || !!companyId || !!from || !!to;
	const serverFault = error instanceof ApiError && error.status >= 500;

	const setCompany = (value: string) => {
		setPage(1);
		router.replace(value ? `${pathname}?company=${value}` : pathname, { scroll: false });
	};

	return (
		<>
			<PageHeader title="Transactions" description="Every payroll payment on PayOrbit, one row per payment attempt." />
			<SectionCard flush>
				<div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:flex-wrap sm:items-center">
					<CompanySelect value={companyId} onChange={setCompany} className="sm:w-64" />
					<FilterSelect
						value={status}
						onChange={(value) => {
							setStatus(value);
							setPage(1);
						}}
						options={PAYMENT_FILTERS}
						label="Status"
					/>
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						<Input
							type="date"
							value={from}
							max={to || undefined}
							onChange={(e) => {
								setFrom(e.target.value);
								setPage(1);
							}}
							aria-label="From date"
							className="w-full sm:w-40"
						/>
						<span>to</span>
						<Input
							type="date"
							value={to}
							min={from || undefined}
							onChange={(e) => {
								setTo(e.target.value);
								setPage(1);
							}}
							aria-label="To date"
							className="w-full sm:w-40"
						/>
					</div>
				</div>
				{isLoading ? (
					<TableSkeleton rows={6} columns={5} />
				) : isError ? (
					<ErrorState
						title={serverFault ? "The payments list isn't available right now" : undefined}
						message={
							serverFault
								? "The API answered with a server error. Nothing is wrong with your filters; try again shortly."
								: errorMessage(error, "We couldn't load payments.")
						}
						onRetry={() => refetch()}
					/>
				) : transactions.length === 0 ? (
					<EmptyState
						icon={ArrowLeftRight}
						title={filtered ? "No payments match" : "No payments yet"}
						description={filtered ? "Try other filters or dates." : "Payments appear here once a company runs payroll."}
					/>
				) : (
					<TransactionsTable transactions={transactions} />
				)}
				<Pager page={page} limit={LIMIT} total={data?.meta?.total ?? 0} onPage={setPage} />
			</SectionCard>
		</>
	);
}

export default function TransactionsPage() {
	return (
		<Suspense>
			<Transactions />
		</Suspense>
	);
}
