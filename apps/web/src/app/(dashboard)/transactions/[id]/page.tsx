"use client";

import { useParams } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { RequirePermission } from "@/components/require-permission";
import { SectionCard } from "@/components/section-card";
import { CardSkeleton, ErrorState } from "@/components/states";
import { hasAnyPermission, useAuthStore } from "@/features/auth/store";
import { PaymentDetail } from "@/features/payroll/components/payment-detail";
import { useTransaction } from "@/features/payroll/hooks";
import { ApiError } from "@/lib/api/client";
import { routes } from "@/lib/routes";

function TransactionDetails() {
	const { id } = useParams<{ id: string }>();
	const canRetry = useAuthStore((state) => hasAnyPermission(state.user, ["payroll:execute"]));
	const { data, isLoading, isError, error, refetch } = useTransaction(id);

	return (
		<>
			<PageHeader
				title="Transaction Details"
				description="Everything about this payment, and how to verify it on Stellar."
				breadcrumbs={[{ label: "Transactions", href: routes.transactions.list }, { label: data?.employee_name || "Payment" }]}
			/>
			{isLoading ? (
				<div className="grid gap-6 lg:grid-cols-3">
					<CardSkeleton className="h-64 lg:col-span-2" />
					<CardSkeleton className="h-64" />
				</div>
			) : isError || !data ? (
				<SectionCard>
					<ErrorState
						title={error instanceof ApiError && error.status === 404 ? "Transaction not found" : "Couldn't load this transaction"}
						onRetry={() => refetch()}
					/>
				</SectionCard>
			) : (
				<PaymentDetail payment={data} audience="admin" canRetryPayments={canRetry} />
			)}
		</>
	);
}

export default function TransactionPage() {
	return (
		<RequirePermission any={["payroll:read"]}>
			<TransactionDetails />
		</RequirePermission>
	);
}
