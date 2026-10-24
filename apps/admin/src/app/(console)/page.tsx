"use client";

import Link from "next/link";
import { AlertTriangle, ArrowLeftRight, ArrowRight, Building2, Coins, ScrollText, ShieldCheck, Users } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Avatar } from "@/components/person";
import { SectionCard } from "@/components/section-card";
import { StatCard } from "@/components/stat-card";
import { CardSkeleton, EmptyState, ErrorState } from "@/components/states";
import { TonePill } from "@/components/status-pill";
import { useAuditLogs, useCompanies, useOverview, usePlatformAdmins } from "@/features/admin/hooks";
import { actionLabel, countryName, fullName } from "@/features/admin/labels";
import { useCompanyNames, useUserNames } from "@/features/admin/lookups";
import { formatCount, formatDate, formatRelative } from "@/lib/format";

/** The platform at a glance: how many companies and people, what has moved, and what changed lately. */
export default function OverviewPage() {
	const overview = useOverview();
	const recent = useCompanies({ limit: 6 });
	const activity = useAuditLogs({ limit: 8 });
	const admins = usePlatformAdmins();
	const companyName = useCompanyNames();
	const userName = useUserNames();
	const o = overview.data;

	return (
		<>
			<PageHeader title="Platform overview" description="Every PayOrbit workspace, at a glance." />

			{overview.isError ? (
				<SectionCard>
					<ErrorState message="We couldn't load the platform totals." onRetry={() => overview.refetch()} />
				</SectionCard>
			) : (
				<div className="space-y-6">
					{(o?.suspended_companies ?? 0) > 0 && (
						<Link
							href="/companies?status=suspended"
							className="animate-rise flex items-center gap-3 rounded-xl border border-warning/25 bg-warning/5 px-4 py-3 transition-colors hover:bg-warning/10"
						>
							<AlertTriangle className="size-5 shrink-0 text-warning" />
							<span className="flex-1 text-sm font-medium text-foreground">
								{o!.suspended_companies} suspended compan{o!.suspended_companies === 1 ? "y" : "ies"}: their people can&apos;t
								sign in.
							</span>
							<span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
								Review <ArrowRight className="size-3" />
							</span>
						</Link>
					)}

					<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
						<StatCard
							index={0}
							label="Companies"
							icon={Building2}
							loading={overview.isLoading}
							value={formatCount(o?.total_companies)}
							hint={o ? `${formatCount(o.active_companies)} active · ${formatCount(o.suspended_companies)} suspended` : undefined}
							href="/companies"
						/>
						<StatCard
							index={1}
							label="Users"
							icon={Users}
							tone="info"
							loading={overview.isLoading}
							value={formatCount(o?.total_users)}
							href="/users"
						/>
						<StatCard
							index={2}
							label="Payments"
							icon={ArrowLeftRight}
							tone="success"
							loading={overview.isLoading}
							value={formatCount(o?.total_transactions)}
							hint="Every attempt, all companies"
							href="/transactions"
						/>
						<StatCard
							index={3}
							label="Paid out, all time"
							icon={Coins}
							tone="brand"
							loading={overview.isLoading}
							value={o ? Number(o.total_disbursed_all_time).toLocaleString("en-US", { maximumFractionDigits: 2 }) : "--"}
							hint="Confirmed payments; USDC and XLM added together"
						/>
					</div>

					<div className="grid gap-6 lg:grid-cols-3">
						<SectionCard
							className="lg:col-span-2"
							title="Newest companies"
							flush
							action={
								<Link href="/companies" className="text-sm font-medium text-primary hover:underline">
									All companies
								</Link>
							}
						>
							{recent.isLoading ? (
								<div className="space-y-3 p-5">
									{Array.from({ length: 4 }, (_, i) => (
										<CardSkeleton key={i} className="h-12" />
									))}
								</div>
							) : (recent.data?.data.length ?? 0) === 0 ? (
								<EmptyState compact icon={Building2} title="No companies yet" />
							) : (
								<ul className="divide-y divide-border">
									{recent.data!.data.map((c) => (
										<li key={c.id}>
											<Link
												href={`/companies/${c.id}`}
												className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-accent/40"
											>
												<span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary">
													<Building2 className="size-4" />
												</span>
												<span className="min-w-0 flex-1">
													<span className="block truncate text-sm font-medium text-foreground">{c.name}</span>
													<span className="block truncate text-xs text-muted-foreground">
														{c.email} · {countryName(c.country)}
													</span>
												</span>
												<span className="hidden text-xs text-muted-foreground sm:block">{formatDate(c.created_at)}</span>
												<TonePill label={c.is_active ? "Active" : "Suspended"} tone={c.is_active ? "success" : "danger"} />
											</Link>
										</li>
									))}
								</ul>
							)}
						</SectionCard>

						<SectionCard
							title="Platform admins"
							flush
							action={
								<Link href="/admins" className="text-sm font-medium text-primary hover:underline">
									Manage
								</Link>
							}
						>
							{admins.isLoading ? (
								<div className="p-5">
									<CardSkeleton className="h-12" />
								</div>
							) : (
								<ul className="divide-y divide-border">
									{(admins.data ?? []).map((a) => (
										<li key={a.user_id}>
											<Link
												href={`/users/${a.user_id}`}
												className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-accent/40"
											>
												<Avatar name={fullName(a)} size="sm" />
												<span className="min-w-0 flex-1">
													<span className="block truncate text-sm font-medium">{fullName(a)}</span>
													<span className="block truncate text-xs text-muted-foreground">{a.email}</span>
												</span>
												<ShieldCheck className="size-4 text-primary" aria-label="Platform admin" />
											</Link>
										</li>
									))}
								</ul>
							)}
						</SectionCard>
					</div>

					<SectionCard
						title="Recent activity"
						description="The audit trail across every company"
						flush
						action={
							<Link href="/audit-logs" className="text-sm font-medium text-primary hover:underline">
								Full audit log
							</Link>
						}
					>
						{activity.isLoading ? (
							<div className="space-y-3 p-5">
								{Array.from({ length: 4 }, (_, i) => (
									<CardSkeleton key={i} className="h-10" />
								))}
							</div>
						) : activity.isError ? (
							<ErrorState message="We couldn't load the audit log." onRetry={() => activity.refetch()} />
						) : (activity.data?.data.length ?? 0) === 0 ? (
							<EmptyState compact icon={ScrollText} title="No activity yet" />
						) : (
							<ul className="divide-y divide-border">
								{activity.data!.data.map((log) => (
									<li key={log.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-3 text-sm">
										<span className="min-w-0 flex-1">
											<span className="font-medium text-foreground">{actionLabel(log.action)}</span>
											<span className="text-muted-foreground">
												{" "}
												by {userName(log.actor_id)} in{" "}
												<Link href={`/companies/${log.company_id}`} className="text-foreground hover:text-primary">
													{companyName(log.company_id)}
												</Link>
											</span>
										</span>
										<span className="text-xs text-muted-foreground">{formatRelative(log.created_at)}</span>
									</li>
								))}
							</ul>
						)}
					</SectionCard>
				</div>
			)}
		</>
	);
}
