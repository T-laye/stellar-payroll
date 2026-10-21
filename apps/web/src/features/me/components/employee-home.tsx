"use client";

import Link from "next/link";
import { ArrowRight, CalendarCheck, History, Wallet, WalletCards } from "lucide-react";
import { Button } from "@repo/ui/button";
import { HashValue } from "@/components/hash";
import { PageHeader } from "@/components/page-header";
import { PaymentTimeline } from "@/components/payment-timeline";
import { SectionCard } from "@/components/section-card";
import { StatCard } from "@/components/stat-card";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/states";
import { PaymentStatusPill } from "@/components/status-pill";
import { useAuthStore } from "@/features/auth/store";
import { useMyTransactions } from "@/features/me/hooks";
import { PaymentsTable } from "@/features/me/components/payments-table";
import { formatDate, formatMoney } from "@/lib/format";
import { routes } from "@/lib/routes";
import { paymentStatus } from "@/lib/status";

function greeting(date = new Date()) {
	const hour = date.getHours();
	return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
}

/** PRD §5: what I've been paid, my latest payment and where it stands, and my history. */
export function EmployeeHome() {
	const user = useAuthStore((state) => state.user);
	const payments = useMyTransactions();
	const list = payments.data ?? [];
	const confirmed = list.filter((t) => t.status === "CONFIRMED");
	const totals = confirmed.reduce<Record<string, number>>(
		(acc, t) => ({ ...acc, [t.asset]: (acc[t.asset] ?? 0) + Number(t.amount) }),
		{},
	);
	const assets = Object.keys(totals).sort((a, b) => (totals[b] ?? 0) - (totals[a] ?? 0));
	const mainAsset = assets[0] ?? "USDC";
	const latest = list[0];
	const inFlight = list.find((t) => t.status === "PENDING" || t.status === "SUBMITTED");
	// The address payroll last paid; balances sit behind the wallet PIN on the profile page.
	const walletAddress = list.find((t) => t.to_address)?.to_address;

	return (
		<>
			<PageHeader title={`${greeting()}, ${user?.first_name ?? "there"}`} description="Here's an overview of your payments." />

			{payments.isError ? (
				<SectionCard>
					<ErrorState message="We couldn't load your payments." onRetry={() => payments.refetch()} />
				</SectionCard>
			) : (
				<div className="space-y-6">
					<div className="grid gap-4 sm:grid-cols-3">
						<StatCard
							index={0}
							label="Total Payments Received"
							icon={WalletCards}
							loading={payments.isLoading}
							value={formatMoney(totals[mainAsset] ?? 0, mainAsset)}
							hint={`${confirmed.length} payment${confirmed.length === 1 ? "" : "s"}${
								assets.length > 1
									? ` · + ${assets
											.slice(1)
											.map((a) => formatMoney(totals[a], a))
											.join(", ")}`
									: ""
							}`}
						/>
						<StatCard
							index={1}
							label="Latest Payment"
							icon={CalendarCheck}
							tone="info"
							loading={payments.isLoading}
							value={latest ? formatMoney(latest.amount, latest.asset) : "--"}
							hint={latest ? formatDate(latest.confirmed_at ?? latest.created_at) : "No payments yet"}
							href={latest ? routes.me.payment(latest.id) : undefined}
						/>
						<StatCard
							index={2}
							label="Current Status"
							icon={History}
							tone={latest ? paymentStatus(latest.status).tone : "neutral"}
							loading={payments.isLoading}
							value={latest ? paymentStatus(latest.status).label : "--"}
							hint={latest ? paymentStatus(latest.status).description : undefined}
						/>
					</div>

					{inFlight && (
						<SectionCard
							title="Payment in progress"
							description={`${formatMoney(inFlight.amount, inFlight.asset, { withCode: true })}${inFlight.payroll_run_name ? ` · ${inFlight.payroll_run_name}` : ""}`}
							action={<PaymentStatusPill status={inFlight.status} />}
							className="border-info/30"
						>
							<PaymentTimeline
								status={inFlight.status}
								createdAt={inFlight.created_at}
								submittedAt={inFlight.submitted_at}
								confirmedAt={inFlight.confirmed_at}
							/>
						</SectionCard>
					)}

					<div className="grid gap-6 lg:grid-cols-3">
						<SectionCard
							className="lg:col-span-2"
							title="Recent Payments"
							flush
							action={
								<Link href={routes.me.payments} className="text-sm font-medium text-primary hover:underline">
									View all
								</Link>
							}
						>
							{payments.isLoading ? (
								<TableSkeleton rows={4} />
							) : list.length === 0 ? (
								<EmptyState
									compact
									icon={History}
									title="No payments yet"
									description="Your payments will appear here once your employer runs payroll."
								/>
							) : (
								<PaymentsTable payments={list.slice(0, 5)} />
							)}
						</SectionCard>

						<SectionCard title="Your wallet" action={<Wallet className="size-4 text-muted-foreground" />}>
							{walletAddress ? (
								<div className="space-y-4">
									<div>
										<p className="text-xs font-medium text-muted-foreground">Receiving address</p>
										<HashValue value={walletAddress} kind="account" className="mt-1" />
									</div>
									<p className="text-xs text-muted-foreground">Balances and transfers are protected by your wallet PIN.</p>
									<Button asChild variant="outline" className="w-full">
										<Link href={routes.dashboardRoutes.PROFILE}>
											Manage wallet <ArrowRight />
										</Link>
									</Button>
								</div>
							) : (
								<EmptyState
									compact
									icon={Wallet}
									title="Your wallet"
									description="Check your Stellar wallet so payroll can reach you."
									action={
										<Button asChild size="sm">
											<Link href={routes.dashboardRoutes.PROFILE}>Open wallet</Link>
										</Button>
									}
								/>
							)}
						</SectionCard>
					</div>
				</div>
			)}
		</>
	);
}
