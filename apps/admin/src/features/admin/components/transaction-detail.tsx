"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Button } from "@repo/ui/button";
import { HashValue } from "@/components/hash";
import { Money } from "@/components/money";
import { PageHeader } from "@/components/page-header";
import { DetailList, SectionCard } from "@/components/section-card";
import { CardSkeleton, ErrorState } from "@/components/states";
import { PaymentStatusPill, StatusPill } from "@/components/status-pill";
import { useTransaction } from "@/features/admin/hooks";
import { useCompanyNames } from "@/features/admin/lookups";
import { errorMessage } from "@/lib/api/request";
import { formatDateTime } from "@/lib/format";
import { paymentStatus } from "@/lib/status";
import { assetCode, failureInfo, paymentExplorerUrl } from "@/lib/stellar";

export function TransactionDetail({ id }: { id: string }) {
	const { data: t, isLoading, isError, error, refetch } = useTransaction(id);
	const companyName = useCompanyNames();

	if (isError) {
		return (
			<>
				<PageHeader title="Payment" breadcrumbs={[{ label: "Transactions", href: "/transactions" }, { label: "Not found" }]} />
				<SectionCard>
					<ErrorState title="We couldn't load this payment" message={errorMessage(error)} onRetry={() => refetch()} />
				</SectionCard>
			</>
		);
	}

	const explorer = t ? paymentExplorerUrl(t) : null;
	const failure = t?.status === "FAILED" ? failureInfo(t) : null;

	return (
		<>
			<PageHeader
				title={t ? `Payment to ${t.employee_name || "employee"}` : "Payment"}
				breadcrumbs={[{ label: "Transactions", href: "/transactions" }, { label: t?.employee_name || "Payment" }]}
				badge={t && <PaymentStatusPill status={t.status} />}
				description={t && paymentStatus(t.status).description}
				actions={
					explorer && (
						<Button variant="outline" asChild>
							<a href={explorer} target="_blank" rel="noreferrer">
								View on Stellar Expert <ExternalLink />
							</a>
						</Button>
					)
				}
			/>

			{isLoading || !t ? (
				<SectionCard>
					<CardSkeleton className="h-48" />
				</SectionCard>
			) : (
				<div className="space-y-6">
					{failure && (
						<div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm">
							<p className="font-medium text-destructive">{failure.category}</p>
							<p className="mt-0.5 text-muted-foreground">{failure.summary}</p>
							<p className="mt-0.5 text-muted-foreground">{failure.action}</p>
						</div>
					)}

					<SectionCard title="Payment">
						<DetailList
							columns={2}
							items={[
								{ label: "Amount", value: <Money value={t.amount} asset={assetCode(t.asset)} withCode className="font-semibold" /> },
								{ label: "Recipient", value: t.employee_name || "--" },
								{
									label: "Company",
									value: (
										<Link href={`/companies/${t.company_id}`} className="font-medium text-primary hover:underline">
											{companyName(t.company_id)}
										</Link>
									),
								},
								{ label: "Payroll run", value: t.payroll_run_name || <span className="font-mono text-xs">{t.payroll_run_id}</span> },
								{ label: "Created", value: formatDateTime(t.created_at) },
								{ label: "Submitted", value: t.submitted_at ? formatDateTime(t.submitted_at) : "--" },
								{ label: "Confirmed", value: t.confirmed_at ? formatDateTime(t.confirmed_at) : "--" },
								{ label: "Attempt", value: t.attempt ?? (t.retry_count ?? 0) + 1 },
							]}
						/>
					</SectionCard>

					<SectionCard title="On the network" description="Stellar testnet">
						<DetailList
							columns={2}
							items={[
								{ label: "Transaction hash", value: t.stellar_tx_hash ? <HashValue value={t.stellar_tx_hash} /> : "Not submitted yet" },
								{ label: "Ledger", value: t.ledger_sequence ?? "--" },
								{ label: "From", value: t.from_address ? <HashValue value={t.from_address} kind="account" /> : "--" },
								{ label: "To", value: t.to_address ? <HashValue value={t.to_address} kind="account" /> : "--" },
								{ label: "Network fee", value: t.fee_amount ? `${t.fee_amount} XLM` : "--", hidden: !t.fee_amount },
							]}
						/>
					</SectionCard>

					{(t.attempts?.length ?? 0) > 1 && (
						<SectionCard title="Attempts" flush>
							<ul className="divide-y divide-border">
								{t.attempts!.map((a) => (
									<li key={a.attempt} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-3 text-sm">
										<span className="font-medium">Attempt {a.attempt}</span>
										<StatusPill view={paymentStatus(a.status)} />
										<span className="min-w-0 flex-1 truncate text-muted-foreground">{a.error ?? ""}</span>
										<span className="text-xs text-muted-foreground">{formatDateTime(a.at)}</span>
									</li>
								))}
							</ul>
						</SectionCard>
					)}
				</div>
			)}
		</>
	);
}
