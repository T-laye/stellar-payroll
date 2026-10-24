"use client";

import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/table";
import { actionLabel } from "@/features/admin/labels";
import { useCompanyNames, useUserNames } from "@/features/admin/lookups";
import type { AuditLog } from "@/features/admin/types";
import { formatDateTime } from "@/lib/format";

/** What a metadata object says, briefly ("status: ACTIVE · amount: 500"). */
function metadataSummary(metadata: Record<string, unknown> | undefined) {
	return Object.entries(metadata ?? {})
		.filter(([, v]) => v !== null && v !== "" && typeof v !== "object")
		.slice(0, 3)
		.map(([k, v]) => `${k.replace(/_/g, " ")}: ${String(v)}`)
		.join(" · ");
}

export function AuditTable({ logs, showCompany = true }: { logs: AuditLog[]; showCompany?: boolean }) {
	const companyName = useCompanyNames();
	const userName = useUserNames();
	return (
		<div className="overflow-x-auto">
			<Table>
				<TableHeader>
					<TableRow className="hover:bg-transparent">
						<TableHead className="pl-5">Action</TableHead>
						<TableHead className="hidden sm:table-cell">By</TableHead>
						{showCompany && <TableHead className="hidden md:table-cell">Company</TableHead>}
						<TableHead className="hidden xl:table-cell">IP address</TableHead>
						<TableHead className="pr-5 text-right">When</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{logs.map((log) => {
						const detail = metadataSummary(log.metadata);
						return (
							<TableRow key={log.id}>
								<TableCell className="max-w-80 pl-5">
									<span className="block font-medium">{actionLabel(log.action)}</span>
									<span className="block truncate text-xs text-muted-foreground" title={detail || undefined}>
										{log.resource_type.replace(/_/g, " ")}
										{log.resource_id ? ` ${log.resource_id.slice(0, 8)}` : ""}
										{detail ? ` · ${detail}` : ""}
									</span>
								</TableCell>
								<TableCell className="hidden max-w-44 truncate sm:table-cell">
									{log.actor_id ? (
										<Link href={`/users/${log.actor_id}`} className="hover:text-primary">
											{userName(log.actor_id)}
										</Link>
									) : (
										<span className="text-muted-foreground">System</span>
									)}
								</TableCell>
								{showCompany && (
									<TableCell className="hidden max-w-44 truncate md:table-cell">
										<Link href={`/companies/${log.company_id}`} className="hover:text-primary">
											{companyName(log.company_id)}
										</Link>
									</TableCell>
								)}
								<TableCell className="hidden font-mono text-xs text-muted-foreground xl:table-cell">
									{log.ip_address || "--"}
								</TableCell>
								<TableCell className="pr-5 text-right whitespace-nowrap text-muted-foreground">
									{formatDateTime(log.created_at)}
								</TableCell>
							</TableRow>
						);
					})}
				</TableBody>
			</Table>
		</div>
	);
}
