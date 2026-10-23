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
import { useMyEmployee, useMyPaymentsSummary, useMyTransactions } from "@/features/me/hooks";
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
	const summary = useMyPaymentsSummary();
	const me = useMyEmployee();
	const list = payments.data ?? [];
	// Totals per asset come from the API (no client-side money arithmetic); the largest leads.
	const totals = [...(summary.data?.total_received ?? [])].sort((a, b) => Number(b.amount) - Number(a.amount));
	const main = totals[0];
	const received = totals.reduce((n, t) => n + (t.count ?? 0), 0);
	const latest = summary.data?.latest_payment ?? list[0];
	const currentStatus = summary.data?.current_status ?? latest?.status;
	const inFlight = list.find((t) => t.status === "PENDING" || t.status === "SUBMITTED");
	// The wallet on the employee record; balances sit behind the wallet PIN on the profile page.
	const walletAddress = me.data?.wallet_address || list.find((t) => t.to_address)?.to_address;
	const loadingCards = summary.isLoading && payments.isLoading;

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
							loading={loadingCards}
							value={formatMoney(main?.amount ?? 0, main?.asset ?? me.data?.payment_asset ?? "USDC")}
							hint={`${received} payment${received === 1 ? "" : "s"}${
								totals.length > 1
									? ` · + ${totals
											.slice(1)
											.map((t) => formatMoney(t.amount, t.asset))
											.join(", ")}`
									: ""
							}`}
						/>
						<StatCard
							index={1}
							label="Latest Payment"
							icon={CalendarCheck}
							tone="info"
							loading={loadingCards}
							value={latest ? formatMoney(latest.amount, latest.asset) : "--"}
							hint={latest ? formatDate(latest.confirmed_at ?? latest.created_at) : "No payments yet"}
							href={latest ? routes.me.payment(latest.id) : undefined}
						/>
						<StatCard
							index={2}
							label="Current Status"
							icon={History}
							tone={currentStatus ? paymentStatus(currentStatus).tone : "neutral"}
							loading={loadingCards}
							value={currentStatus ? paymentStatus(currentStatus).label : "--"}
							hint={currentStatus ? paymentStatus(currentStatus).description : undefined}
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
