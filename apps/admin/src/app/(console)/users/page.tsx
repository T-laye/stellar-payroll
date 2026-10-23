"use client";

import { Suspense, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Users } from "lucide-react";
import { FilterTabs } from "@/components/filter-tabs";
import { PageHeader } from "@/components/page-header";
import { Pager } from "@/components/pager";
import { SectionCard } from "@/components/section-card";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/states";
import { CompanySelect, FilterSelect, SearchBox } from "@/features/admin/components/filters";
import { UsersTable } from "@/features/admin/components/users-table";
import { usePlatformAdmins, useUsers } from "@/features/admin/hooks";
import { errorMessage } from "@/lib/api/request";
import { useDebounced } from "@/lib/use-debounced";

type Status = "all" | "active" | "deactivated";

const STATUSES: { value: Status; label: string }[] = [
	{ value: "all", label: "All" },
	{ value: "active", label: "Active" },
	{ value: "deactivated", label: "Deactivated" },
];

/** Role filter values are the role's name in lower case, words joined by "-". */
const ROLES = [
	{ value: "", label: "All roles" },
	{ value: "owner", label: "Owner" },
	{ value: "admin", label: "Admin" },
	{ value: "hr-manager", label: "HR manager" },
	{ value: "viewer", label: "Viewer" },
	{ value: "employee", label: "Employee" },
];

const LIMIT = 20;

function UsersList() {
	const router = useRouter();
	const pathname = usePathname();
	const params = useSearchParams();
	const companyId = params.get("company") ?? "";
	const [status, setStatus] = useState<Status>("all");
	const [role, setRole] = useState("");
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
	const term = useDebounced(search.trim());
	const admins = usePlatformAdmins();
	const { data, isLoading, isError, error, refetch } = useUsers({
		page,
		limit: LIMIT,
		search: term || undefined,
		role: role || undefined,
		company_id: companyId || undefined,
		is_active: status === "all" ? undefined : status === "active" ? "true" : "false",
	});
	const users = data?.data ?? [];
	const adminIds = new Set((admins.data ?? []).map((a) => a.user_id));
	const filtered = status !== "all" || !!role || !!companyId || !!term;

	const setCompany = (value: string) => {
		setPage(1);
		router.replace(value ? `${pathname}?company=${value}` : pathname, { scroll: false });
	};

	return (
		<>
			<PageHeader title="Users" description="Everyone with a PayOrbit account, in every company." />
			<SectionCard flush>
				<div className="flex flex-col gap-3 border-b border-border p-4">
					<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
						<FilterTabs
							options={STATUSES}
							value={status}
							onChange={(value) => {
								setStatus(value);
								setPage(1);
							}}
							label="Filter users by status"
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
					<div className="flex flex-col gap-3 sm:flex-row">
						<CompanySelect value={companyId} onChange={setCompany} className="sm:w-64" />
						<FilterSelect
							value={role}
							onChange={(value) => {
								setRole(value);
								setPage(1);
							}}
							options={ROLES}
							label="Role"
						/>
					</div>
				</div>
				{isLoading ? (
					<TableSkeleton rows={6} columns={5} />
				) : isError ? (
					<ErrorState message={errorMessage(error, "We couldn't load users.")} onRetry={() => refetch()} />
				) : users.length === 0 ? (
					<EmptyState icon={Users} title={filtered ? "No users match" : "No users yet"} description={filtered ? "Try other filters." : undefined} />
				) : (
					<UsersTable users={users} adminIds={adminIds} />
				)}
				<Pager page={page} limit={LIMIT} total={data?.meta?.total ?? 0} onPage={setPage} />
			</SectionCard>
		</>
	);
}

export default function UsersPage() {
	return (
		<Suspense>
			<UsersList />
		</Suspense>
	);
}
