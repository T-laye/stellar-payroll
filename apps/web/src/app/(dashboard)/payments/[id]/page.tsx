"use client";

import { useParams } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { CardSkeleton, ErrorState } from "@/components/states";
import { PaymentDetail } from "@/features/payroll/components/payment-detail";
import { useMyTransaction } from "@/features/me/hooks";
import { ApiError } from "@/lib/api/client";
import { routes } from "@/lib/routes";

export default function MyPaymentPage() {
	const { id } = useParams<{ id: string }>();
	const { data, isLoading, isError, error, refetch } = useMyTransaction(id);

	return (
		<>
			<PageHeader
				title="Payment Details"
				breadcrumbs={[{ label: "Payment History", href: routes.me.payments }, { label: "Details" }]}
			/>
			{isLoading ? (
				<div className="grid gap-6 lg:grid-cols-3">
					<CardSkeleton className="h-64 lg:col-span-2" />
					<CardSkeleton className="h-64" />
				</div>
			) : isError || !data ? (
				<SectionCard>
					<ErrorState
						title={error instanceof ApiError && error.status === 404 ? "Payment not found" : "Couldn't load this payment"}
						message={error instanceof ApiError && error.status === 404 ? "It may belong to another account." : undefined}
						onRetry={() => refetch()}
					/>
				</SectionCard>
			) : (
				<PaymentDetail payment={data} audience="employee" />
			)}
		</>
	);
}
