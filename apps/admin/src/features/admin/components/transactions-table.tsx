"use client";

import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/table";
import { HashValue } from "@/components/hash";
import { Money } from "@/components/money";
import { PaymentStatusPill } from "@/components/status-pill";
import { useCompanyNames } from "@/features/admin/lookups";
import type { PlatformTransaction } from "@/features/admin/types";
import { formatDateTime } from "@/lib/format";
import { assetCode } from "@/lib/stellar";

/** Payments across companies, newest first. */
export function TransactionsTable({
	transactions,
	showCompany = true,
}: {
	transactions: PlatformTransaction[];
	showCompany?: boolean;
}) {
	const companyName = useCompanyNames();
	return (
		<div className="overflow-x-auto">
			<Table>
				<TableHeader>
					<TableRow className="hover:bg-transparent">
						<TableHead className="pl-5">Recipient</TableHead>
						{showCompany && <TableHead className="hidden md:table-cell">Company</TableHead>}
						<TableHead className="text-right">Amount</TableHead>
						<TableHead className="hidden xl:table-cell">Transaction</TableHead>
						<TableHead className="hidden sm:table-cell">Date</TableHead>
						<TableHead className="pr-5">Status</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{transactions.map((t) => (
						<TableRow key={t.id}>
							<TableCell className="max-w-56 pl-5">
								<Link href={`/transactions/${t.id}`} className="block hover:text-primary">
									<span className="block truncate font-medium">{t.employee_name || "Employee"}</span>
									<span className="block truncate text-xs text-muted-foreground">{t.payroll_run_name || "Payroll payment"}</span>
								</Link>
							</TableCell>
							{showCompany && (
								<TableCell className="hidden max-w-48 truncate md:table-cell">
									<Link href={`/companies/${t.company_id}`} className="hover:text-primary">
										{companyName(t.company_id)}
									</Link>
								</TableCell>
							)}
							<TableCell className="text-right font-medium whitespace-nowrap">
								<Money value={t.amount} asset={assetCode(t.asset)} withCode />
							</TableCell>
							<TableCell className="hidden xl:table-cell">
								{t.stellar_tx_hash ? <HashValue value={t.stellar_tx_hash} /> : <span className="text-muted-foreground">--</span>}
							</TableCell>
							<TableCell className="hidden whitespace-nowrap text-muted-foreground sm:table-cell">
								{formatDateTime(t.created_at)}
							</TableCell>
							<TableCell className="pr-5">
								<PaymentStatusPill status={t.status} />
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
