"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/table";
import { HashValue } from "@/components/hash";
import { AssetBadge, Money } from "@/components/money";
import { PaymentStatusPill } from "@/components/status-pill";
import type { Transaction } from "@/features/payroll/types";
import { formatDate } from "@/lib/format";
import { routes } from "@/lib/routes";

/** The employee's payments: date, amount, asset, status, reference. Rows open the payment. */
export function PaymentsTable({ payments, showCycle }: { payments: Transaction[]; showCycle?: boolean }) {
	return (
		<div className="overflow-x-auto">
			<Table>
				<TableHeader>
					<TableRow className="hover:bg-transparent">
						<TableHead className="pl-5">Date</TableHead>
						{showCycle && <TableHead className="hidden md:table-cell">Payroll cycle</TableHead>}
						<TableHead className="text-right">Amount</TableHead>
						<TableHead className="hidden sm:table-cell">Asset</TableHead>
						<TableHead>Status</TableHead>
						<TableHead className="hidden md:table-cell">Transaction</TableHead>
						<TableHead className="hidden w-10 pr-5 sm:table-cell" />
					</TableRow>
				</TableHeader>
				<TableBody>
					{payments.map((p) => (
						<TableRow key={p.id} className="group relative">
							<TableCell className="pl-5 whitespace-nowrap">
								<Link
									href={routes.me.payment(p.id)}
									className="font-medium text-foreground after:absolute after:inset-0 hover:text-primary"
								>
									{formatDate(p.confirmed_at ?? p.created_at)}
								</Link>
							</TableCell>
							{showCycle && (
								<TableCell className="max-w-48 truncate text-muted-foreground">{p.payroll_run_name || "Payroll"}</TableCell>
							)}
							<TableCell className="text-right font-medium">
								<Money value={p.amount} asset={p.asset} />
							</TableCell>
							<TableCell className="hidden sm:table-cell">
								<AssetBadge asset={p.asset} />
							</TableCell>
							<TableCell>
								<PaymentStatusPill status={p.status} />
							</TableCell>
							<TableCell className="relative z-10 hidden md:table-cell">
								<HashValue value={p.stellar_tx_hash} />
							</TableCell>
							<TableCell className="hidden pr-5 text-muted-foreground sm:table-cell">
								<ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
