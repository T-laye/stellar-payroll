"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, RotateCw } from "lucide-react";
import { Button } from "@repo/ui/button";
import { toast } from "@repo/ui/sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/table";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { HashValue } from "@/components/hash";
import { AssetBadge, Money } from "@/components/money";
import { PersonCell } from "@/components/person";
import { PaymentStatusPill } from "@/components/status-pill";
import { useRetryPayment } from "@/features/payroll/hooks";
import type { Transaction } from "@/features/payroll/types";
import { errorMessage, newIdempotencyKey } from "@/lib/api/request";
import { formatDate, formatMoney } from "@/lib/format";
import { routes } from "@/lib/routes";
import { canRetry, failureInfo, shortHash } from "@/lib/stellar";

/**
 * Payments for admins: employee, amount, asset, status, date, hash, and the failure reason with a
 * retry where it's allowed (PRD §7, §8). `names` fills in employees when the API row has no name.
 */
export function TransactionsTable({
	payments,
	names,
	showRun = true,
	canRetryPayments,
}: {
	payments: Transaction[];
	names?: Map<string, string>;
	showRun?: boolean;
	canRetryPayments?: boolean;
}) {
	const retry = useRetryPayment();
	const [target, setTarget] = useState<{ tx: Transaction; key: string } | null>(null);
	const nameOf = (t: Transaction) =>
		t.employee_name || (t.employee_id && names?.get(t.employee_id)) || shortHash(t.to_address, 5, 4);

	return (
		<>
			<div className="overflow-x-auto">
				<Table>
					<TableHeader>
						<TableRow className="hover:bg-transparent">
							<TableHead className="pl-4 sm:pl-5">Employee</TableHead>
							<TableHead className="text-right">Amount</TableHead>
							<TableHead className="hidden sm:table-cell">Asset</TableHead>
							<TableHead className="hidden sm:table-cell sm:pr-2">Status</TableHead>
							<TableHead className="hidden xl:table-cell">Date</TableHead>
							{showRun && <TableHead className="hidden 2xl:table-cell">Payroll</TableHead>}
							<TableHead className="hidden xl:table-cell">Transaction</TableHead>
							<TableHead className="hidden w-24 pr-5 text-right sm:table-cell">
								<span className="sr-only">Actions</span>
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{payments.map((t) => {
							const failure = t.status === "FAILED" ? failureInfo(t) : null;
							return (
								<TableRow key={t.id} className="group relative">
									<TableCell className="max-w-36 pl-4 sm:max-w-56 sm:pl-5">
										<Link
											href={routes.transactions.detail(t.id)}
											className="absolute inset-0 sm:hidden"
											aria-label={`View payment to ${nameOf(t)}`}
										/>
										<PersonCell
											name={nameOf(t)}
											subtitle={failure ? <span className="text-destructive">{failure.category}</span> : undefined}
											size="sm"
										/>
										{/* Phones: the status sits under the name instead of in its own column. */}
										<div className="mt-1.5 pl-10 sm:hidden">
											<PaymentStatusPill status={t.status} />
										</div>
									</TableCell>
									<TableCell className="text-right font-medium">
										<Money value={t.amount} asset={t.asset} />
									</TableCell>
									<TableCell className="hidden sm:table-cell">
										<AssetBadge asset={t.asset} />
									</TableCell>
									<TableCell className="hidden sm:table-cell sm:pr-2">
										<PaymentStatusPill status={t.status} />
									</TableCell>
									<TableCell className="hidden whitespace-nowrap text-muted-foreground xl:table-cell">
										{formatDate(t.confirmed_at ?? t.created_at)}
									</TableCell>
									{showRun && (
										<TableCell className="hidden max-w-44 2xl:table-cell">
											<Link
												href={routes.payroll.detail(t.payroll_run_id)}
												className="block truncate text-muted-foreground hover:text-primary"
											>
												{t.payroll_run_name || "View payroll"}
											</Link>
										</TableCell>
									)}
									<TableCell className="hidden xl:table-cell">
										<HashValue value={t.stellar_tx_hash} />
									</TableCell>
									<TableCell className="hidden pr-5 text-right sm:table-cell">
										<div className="flex items-center justify-end gap-1">
											{failure && canRetryPayments && canRetry(t) && (
												<Button
													variant="outline"
													size="sm"
													className="h-7 px-2 text-xs"
													onClick={() => setTarget({ tx: t, key: newIdempotencyKey() })}
												>
													<RotateCw className="size-3" /> Retry
												</Button>
											)}
											<Button asChild variant="ghost" size="icon-sm" aria-label="View transaction">
												<Link href={routes.transactions.detail(t.id)}>
													<ChevronRight />
												</Link>
											</Button>
										</div>
									</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			</div>
			<ConfirmDialog
				open={!!target}
				onOpenChange={(open) => !open && setTarget(null)}
				title="Retry this payment?"
				description={
					target
						? `${formatMoney(target.tx.amount, target.tx.asset)} to ${nameOf(target.tx)} will be sent again as a new attempt. ${failureInfo(target.tx).action}`
						: undefined
				}
				confirmLabel="Retry payment"
				loading={retry.isPending}
				onConfirm={() =>
					target &&
					retry.mutate(
						{ id: target.tx.id, key: target.key },
						{
							onSuccess: () => {
								toast.success("Payment queued for retry");
								setTarget(null);
							},
							onError: (error) => {
								// A repeated key replays the first response: the next try needs a new one.
								setTarget((current) => current && { ...current, key: newIdempotencyKey() });
								toast.error(errorMessage(error, "Couldn't retry this payment"));
							},
						},
					)
				}
			/>
		</>
	);
}
