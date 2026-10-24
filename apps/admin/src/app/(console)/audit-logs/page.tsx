"use client";

import { Suspense, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ScrollText } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Pager } from "@/components/pager";
import { SectionCard } from "@/components/section-card";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/states";
import { AuditTable } from "@/features/admin/components/audit-table";
import { CompanySelect, FilterSelect, SearchBox } from "@/features/admin/components/filters";
import { useAuditLogs } from "@/features/admin/hooks";
import { errorMessage } from "@/lib/api/request";
import { useDebounced } from "@/lib/use-debounced";

const RESOURCES = [
	{ value: "", label: "Everything" },
	{ value: "company", label: "Companies" },
	{ value: "user", label: "Users" },
	{ value: "employee", label: "Employees" },
	{ value: "payroll_run", label: "Payroll runs" },
	{ value: "payroll_schedule", label: "Recurring schedules" },
	{ value: "payroll_group", label: "Payroll groups" },
	{ value: "wallet", label: "Wallets" },
	{ value: "role", label: "Roles" },
];

const LIMIT = 25;

function AuditLogs() {
	const router = useRouter();
	const pathname = usePathname();
	const params = useSearchParams();
	const companyId = params.get("company") ?? "";
	const [resource, setResource] = useState("");
	const [action, setAction] = useState("");
	const [page, setPage] = useState(1);
	const actionTerm = useDebounced(action.trim().toLowerCase().replace(/\s+/g, "_"));
	const { data, isLoading, isError, error, refetch } = useAuditLogs({
		page,
		limit: LIMIT,
		company_id: companyId || undefined,
		resource_type: resource || undefined,
		action: actionTerm || undefined,
	});
	const logs = data?.data ?? [];
	const filtered = !!companyId || !!resource || !!actionTerm;

	const setCompany = (value: string) => {
		setPage(1);
		router.replace(value ? `${pathname}?company=${value}` : pathname, { scroll: false });
	};

	return (
		<>
			<PageHeader title="Audit log" description="Who did what, in every company. Entries can't be edited or removed." />
			<SectionCard flush>
				<div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:flex-wrap sm:items-center">
					<CompanySelect value={companyId} onChange={setCompany} className="sm:w-64" />
					<FilterSelect
						value={resource}
						onChange={(value) => {
							setResource(value);
							setPage(1);
						}}
						options={RESOURCES}
						label="Resource"
					/>
					<SearchBox
						value={action}
						onChange={(value) => {
							setAction(value);
							setPage(1);
						}}
						label="Action, e.g. payroll_run.approve"
						className="lg:ml-auto"
					/>
				</div>
				{isLoading ? (
					<TableSkeleton rows={8} columns={4} />
				) : isError ? (
					<ErrorState message={errorMessage(error, "We couldn't load the audit log.")} onRetry={() => refetch()} />
				) : logs.length === 0 ? (
					<EmptyState
						icon={ScrollText}
						title={filtered ? "No entries match" : "No activity yet"}
						description={filtered ? "Try other filters." : undefined}
					/>
				) : (
					<AuditTable logs={logs} />
				)}
				<Pager page={page} limit={LIMIT} total={data?.meta?.total ?? 0} onPage={setPage} />
			</SectionCard>
		</>
	);
}

export default function AuditLogsPage() {
	return (
		<Suspense>
			<AuditLogs />
		</Suspense>
	);
}
