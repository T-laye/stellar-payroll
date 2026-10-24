"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/table";
import { PersonCell } from "@/components/person";
import { TonePill } from "@/components/status-pill";
import { fullName } from "@/features/admin/labels";
import { useCompanyNames } from "@/features/admin/lookups";
import type { PlatformUser } from "@/features/admin/types";
import { formatDate, formatRelative } from "@/lib/format";

/** People across companies. `adminIds` marks platform admins; the company column hides inside a company page. */
export function UsersTable({
	users,
	adminIds,
	showCompany = true,
}: {
	users: PlatformUser[];
	adminIds?: Set<string>;
	showCompany?: boolean;
}) {
	const companyName = useCompanyNames();
	return (
		<div className="overflow-x-auto">
			<Table>
				<TableHeader>
					<TableRow className="hover:bg-transparent">
						<TableHead className="pl-5">Name</TableHead>
						{showCompany && <TableHead className="hidden md:table-cell">Company</TableHead>}
						<TableHead className="hidden sm:table-cell">Role</TableHead>
						<TableHead className="hidden xl:table-cell">Last sign-in</TableHead>
						<TableHead className="hidden xl:table-cell">Joined</TableHead>
						<TableHead className="pr-5">Status</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{users.map((u) => (
						<TableRow key={u.id}>
							<TableCell className="max-w-56 pl-5 sm:max-w-72">
								<Link href={`/users/${u.id}`} className="flex items-center gap-2 hover:[&_span]:text-primary">
									<PersonCell name={fullName(u)} subtitle={u.email} className="min-w-0" />
									{adminIds?.has(u.id) && <ShieldCheck className="size-4 shrink-0 text-primary" aria-label="Platform admin" />}
								</Link>
							</TableCell>
							{showCompany && (
								<TableCell className="hidden max-w-48 truncate md:table-cell">
									<Link href={`/companies/${u.company_id}`} className="hover:text-primary">
										{companyName(u.company_id)}
									</Link>
								</TableCell>
							)}
							<TableCell className="hidden text-muted-foreground sm:table-cell">{u.role_name || "--"}</TableCell>
							<TableCell className="hidden text-muted-foreground xl:table-cell">
								{u.last_login_at ? formatRelative(u.last_login_at) : "Never"}
							</TableCell>
							<TableCell className="hidden text-muted-foreground xl:table-cell">{formatDate(u.created_at)}</TableCell>
							<TableCell className="pr-5">
								<TonePill label={u.is_active ? "Active" : "Deactivated"} tone={u.is_active ? "success" : "neutral"} />
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
