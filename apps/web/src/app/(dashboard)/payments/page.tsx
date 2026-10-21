"use client";

import { useState } from "react";
import { History } from "lucide-react";
import { FilterTabs } from "@/components/filter-tabs";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/states";
import { PaymentsTable } from "@/features/me/components/payments-table";
import { useMyTransactions } from "@/features/me/hooks";
import { paymentPhase, type PaymentPhase } from "@/lib/status";

const FILTERS: { value: "all" | PaymentPhase; label: string }[] = [
	{ value: "all", label: "All" },
	{ value: "pending", label: "Pending" },
	{ value: "processing", label: "Processing" },
	{ value: "completed", label: "Completed" },
	{ value: "failed", label: "Failed" },
];

/** The employee's payment history (PRD §5). */
export default function PaymentHistoryPage() {
	const [filter, setFilter] = useState<"all" | PaymentPhase>("all");
	const { data, isLoading, isError, refetch } = useMyTransactions();
	const list = data ?? [];
	const counts = list.reduce<Partial<Record<"all" | PaymentPhase, number>>>(
		(acc, t) => {
			const phase = paymentPhase(t.status);
			acc[phase] = (acc[phase] ?? 0) + 1;
			return acc;
		},
		{ all: list.length },
	);
	const shown = filter === "all" ? list : list.filter((t) => paymentPhase(t.status) === filter);

	return (
		<>
			<PageHeader
				title="Payment History"
				description="Every payment from your employer, with its status and Stellar reference."
			/>
			<SectionCard flush>
				<div className="border-b border-border px-4 pt-4 pb-3">
					<FilterTabs options={FILTERS} value={filter} onChange={setFilter} counts={counts} label="Filter payments" />
				</div>
				{isLoading ? (
					<TableSkeleton />
				) : isError ? (
					<ErrorState message="We couldn't load your payments." onRetry={() => refetch()} />
				) : shown.length === 0 ? (
					<EmptyState
						icon={History}
						title={
							filter === "all" ? "No payments yet" : `No ${FILTERS.find((f) => f.value === filter)?.label.toLowerCase()} payments`
						}
						description={filter === "all" ? "Payments appear here as soon as your employer runs payroll." : "Try another filter."}
					/>
				) : (
					<PaymentsTable payments={shown} showCycle />
				)}
			</SectionCard>
		</>
	);
}
