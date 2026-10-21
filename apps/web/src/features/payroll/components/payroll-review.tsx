"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock, Coins, Loader2, Trash2, Users, XCircle } from "lucide-react";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { toast } from "@repo/ui/sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/table";
import { AssetBadge, Money } from "@/components/money";
import { PersonCell } from "@/components/person";
import { SectionCard } from "@/components/section-card";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/states";
import { TonePill } from "@/components/status-pill";
import { useLineItems, useRemoveLineItem, useUpdateLineItem } from "@/features/payroll/hooks";
import type { LineItem, PayrollRun } from "@/features/payroll/types";
import { errorMessage } from "@/lib/api/request";
import { formatDateTime, formatMoney } from "@/lib/format";
import { routes } from "@/lib/routes";
import { estimatePayout } from "@/lib/stellar";

export const isIncomplete = (item: Pick<LineItem, "wallet_address" | "amount">) =>
	!item.wallet_address || !(Number(item.amount) > 0);

/**
 * The review before approval (PRD §4): number of employees, total, each amount, the asset, the
 * network estimate, and who is missing payment information. Drafts can be edited in place.
 */
export function PayrollReview({
	run,
	editable,
	onEditSelection,
}: {
	run: PayrollRun;
	editable: boolean;
	onEditSelection?: () => void;
}) {
	const { data: items, isLoading, isError, refetch } = useLineItems(run.id);
	const list = items ?? [];
	const incomplete = list.filter(isIncomplete);
	const total = list.reduce((sum, i) => sum + Number(i.amount), 0);
	const estimate = estimatePayout(list.length);

	return (
		<div className="grid gap-6 lg:grid-cols-[280px_1fr]">
			<SectionCard title="Summary" className="h-fit">
				<ul className="space-y-5">
					<SummaryRow icon={Users} label="Employees" value={isLoading ? "…" : String(list.length)} />
					<SummaryRow
						icon={Coins}
						label="Total amount"
						value={<Money value={total} asset={run.currency} withCode={run.currency === "USDC"} />}
					/>
					<SummaryRow icon={Coins} label="Payment asset" value={<AssetBadge asset={run.currency} />} />
					<SummaryRow
						icon={Clock}
						label="Estimated transaction"
						value={
							<span className="text-sm">
								{estimate.transactions} Stellar transaction{estimate.transactions === 1 ? "" : "s"}, ~{estimate.seconds}s
								<span className="block text-xs text-muted-foreground">Network fee ≈ {estimate.feeXlm} XLM</span>
							</span>
						}
					/>
					<SummaryRow icon={Clock} label="Pay date" value={<span className="text-sm">{formatDateTime(run.scheduled_at)}</span>} />
				</ul>
			</SectionCard>

			<div className="min-w-0 space-y-4">
				{incomplete.length > 0 && (
					<div
						role="alert"
						className="animate-rise flex flex-col gap-3 rounded-xl border border-warning/30 bg-warning/8 p-4 sm:flex-row sm:items-center"
					>
						<AlertTriangle className="size-5 shrink-0 text-warning" />
						<div className="min-w-0 flex-1 text-sm">
							<p className="font-medium text-foreground">
								{incomplete.length} employee{incomplete.length === 1 ? " has" : "s have"} incomplete payment information.
							</p>
							<p className="text-muted-foreground">
								Add the missing wallet address or remove them from this payroll. It can&apos;t be approved until then.
							</p>
						</div>
						{incomplete.length === 1 && (
							<Button asChild size="sm" variant="outline" className="shrink-0">
								<Link href={routes.employees.edit(incomplete[0]!.employee_id)}>Resolve now</Link>
							</Button>
						)}
					</div>
				)}
				{!isLoading && list.length > 0 && incomplete.length === 0 && (
					<div className="flex items-center gap-3 rounded-xl border border-success/25 bg-success/8 p-4 text-sm">
						<CheckCircle2 className="size-5 shrink-0 text-success" />
						<p className="text-foreground">Every employee has a wallet and an amount. This payroll is ready to approve.</p>
					</div>
				)}

				<SectionCard
					title="Employee details"
					flush
					action={
						editable &&
						onEditSelection && (
							<Button variant="outline" size="sm" onClick={onEditSelection}>
								Edit selection
							</Button>
						)
					}
				>
					{isLoading ? (
						<TableSkeleton rows={4} columns={4} />
					) : isError ? (
						<ErrorState onRetry={() => refetch()} />
					) : list.length === 0 ? (
						<EmptyState
							compact
							icon={Users}
							title="No employees in this payroll"
							description="Add at least one employee before it can be approved."
						/>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow className="hover:bg-transparent">
										<TableHead className="pl-5">Name</TableHead>
										<TableHead className="text-right">Amount</TableHead>
										<TableHead className="hidden sm:table-cell">Asset</TableHead>
										<TableHead className="hidden sm:table-cell">Status</TableHead>
										{editable && <TableHead className="w-12 pr-3 sm:pr-5" />}
									</TableRow>
								</TableHeader>
								<TableBody>
									{list.map((item) => (
										<ReviewRow key={`${item.id}-${item.amount}`} item={item} run={run} editable={editable} />
									))}
								</TableBody>
							</Table>
						</div>
					)}
				</SectionCard>
			</div>
		</div>
	);
}

function SummaryRow({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: React.ReactNode }) {
	return (
		<li className="flex gap-3">
			<span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary">
				<Icon className="size-4" />
			</span>
			<span className="min-w-0">
				<span className="block text-xs text-muted-foreground">{label}</span>
				<span className="block font-semibold text-foreground">{value}</span>
			</span>
		</li>
	);
}

function ReviewRow({ item, run, editable }: { item: LineItem; run: PayrollRun; editable: boolean }) {
	const [amount, setAmount] = useState(item.amount);
	const update = useUpdateLineItem(run.id);
	const remove = useRemoveLineItem(run.id);
	const missingWallet = !item.wallet_address;

	const save = () => {
		if (Number(amount) === Number(item.amount)) return;
		if (!(Number(amount) > 0)) {
			toast.error("Amount must be greater than zero");
			setAmount(item.amount);
			return;
		}
		update.mutate(
			{ itemId: item.id, amount },
			{
				onSuccess: () => toast.success(`Updated ${item.employee_name}'s amount`),
				onError: (error) => {
					toast.error(errorMessage(error));
					setAmount(item.amount);
				},
			},
		);
	};

	const status = missingWallet ? (
		<Link
			href={routes.employees.edit(item.employee_id)}
			className="inline-flex items-center gap-1.5 text-xs font-medium text-destructive hover:underline"
		>
			<XCircle className="size-3.5" /> Missing wallet
		</Link>
	) : (
		<TonePill label="Complete" tone="success" />
	);

	return (
		<TableRow>
			<TableCell className="max-w-40 pl-4 sm:max-w-none sm:pl-5">
				<PersonCell
					name={item.employee_name}
					subtitle={<span className="hidden sm:inline">{item.employee_email}</span>}
					size="sm"
				/>
				{/* Phones: the status sits under the name instead of in its own column. */}
				<div className="mt-1.5 pl-10 sm:hidden">{status}</div>
			</TableCell>
			<TableCell className="text-right">
				{editable ? (
					<div className="ml-auto flex w-28 items-center gap-1 sm:w-36">
						<Input
							type="number"
							min="0"
							step="0.01"
							inputMode="decimal"
							value={amount}
							onChange={(e) => setAmount(e.target.value)}
							onBlur={save}
							onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
							aria-label={`Amount for ${item.employee_name}`}
							className="h-8 [appearance:textfield] text-right tabular-nums [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
						/>
						{update.isPending && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
					</div>
				) : (
					<Money value={item.amount} asset={item.currency} className="font-medium" />
				)}
			</TableCell>
			<TableCell className="hidden sm:table-cell">
				<AssetBadge asset={item.currency} />
			</TableCell>
			<TableCell className="hidden sm:table-cell">{status}</TableCell>
			{editable && (
				<TableCell className="pr-3 sm:pr-5">
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label={`Remove ${item.employee_name}`}
						disabled={remove.isPending}
						onClick={() =>
							remove.mutate(item.id, {
								onSuccess: () => toast.success(`Removed ${item.employee_name} (${formatMoney(item.amount, item.currency)})`),
								onError: (error) => toast.error(errorMessage(error)),
							})
						}
						className="text-muted-foreground hover:text-destructive"
					>
						<Trash2 />
					</Button>
				</TableCell>
			)}
		</TableRow>
	);
}
