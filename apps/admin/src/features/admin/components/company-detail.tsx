"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeftRight, Ban, Building2, RotateCcw, ScrollText, Users } from "lucide-react";
import { Button } from "@repo/ui/button";
import { toast } from "@repo/ui/sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { CopyButton } from "@/components/hash";
import { PageHeader } from "@/components/page-header";
import { DetailList, SectionCard } from "@/components/section-card";
import { CardSkeleton, EmptyState, ErrorState, TableSkeleton } from "@/components/states";
import { TonePill } from "@/components/status-pill";
import { AuditTable } from "@/features/admin/components/audit-table";
import { TransactionsTable } from "@/features/admin/components/transactions-table";
import { UsersTable } from "@/features/admin/components/users-table";
import {
	useAuditLogs,
	useCompany,
	usePlatformAdmins,
	useSetCompanyActive,
	useTransactions,
	useUsers,
} from "@/features/admin/hooks";
import { countryName } from "@/features/admin/labels";
import { useAdminSession } from "@/features/auth/session";
import { ApiError } from "@/lib/api/client";
import { errorMessage, newIdempotencyKey } from "@/lib/api/request";
import { formatCount, formatDate, formatDateTime } from "@/lib/format";

const PREVIEW = 8;

function ViewAll({ href, total }: { href: string; total?: number }) {
	if (!total || total <= PREVIEW) return null;
	return (
		<Link href={href} className="text-sm font-medium text-primary hover:underline">
			View all {formatCount(total)}
		</Link>
	);
}

export function CompanyDetail({ id }: { id: string }) {
	const me = useAdminSession((s) => s.user);
	const company = useCompany(id);
	const users = useUsers({ company_id: id, limit: PREVIEW });
	const payments = useTransactions({ company_id: id, limit: PREVIEW });
	const activity = useAuditLogs({ company_id: id, limit: PREVIEW });
	const admins = usePlatformAdmins();
	const setActive = useSetCompanyActive();
	const [confirming, setConfirming] = useState(false);
	const [key, setKey] = useState(newIdempotencyKey);
	const c = company.data;
	const own = !!c && c.id === me?.company_id;
	const adminIds = new Set((admins.data ?? []).map((a) => a.user_id));
	const accounts = users.data ? (users.data.meta?.total ?? users.data.data.length) : null;

	if (company.isError) {
		return (
			<>
				<PageHeader title="Company" breadcrumbs={[{ label: "Companies", href: "/companies" }, { label: "Not found" }]} />
				<SectionCard>
					<ErrorState
						title="We couldn't load this company"
						message={errorMessage(company.error)}
						onRetry={() => company.refetch()}
					/>
				</SectionCard>
			</>
		);
	}

	const toggle = () => {
		if (!c) return;
		const active = !c.is_active;
		setActive.mutate(
			{ id: c.id, active, key },
			{
				onSuccess: () => {
					toast.success(active ? `${c.name} is active again` : `${c.name} is suspended`);
					setConfirming(false);
					setKey(newIdempotencyKey());
				},
				onError: (error) => {
					toast.error(errorMessage(error));
					setKey(newIdempotencyKey());
				},
			},
		);
	};

	return (
		<>
			<PageHeader
				title={c?.name ?? "Company"}
				breadcrumbs={[{ label: "Companies", href: "/companies" }, { label: c?.name ?? "…" }]}
				badge={c && <TonePill label={c.is_active ? "Active" : "Suspended"} tone={c.is_active ? "success" : "danger"} />}
				description={c ? `${c.email} · ${countryName(c.country)}` : undefined}
				actions={
					c &&
					(c.is_active ? (
						<Button
							variant="outline"
							className="text-destructive hover:text-destructive"
							disabled={own}
							title={own ? "You can't suspend your own company" : undefined}
							onClick={() => setConfirming(true)}
						>
							<Ban /> Suspend
						</Button>
					) : (
						<Button onClick={() => setConfirming(true)}>
							<RotateCcw /> Reactivate
						</Button>
					))
				}
			/>

			<div className="space-y-6">
				{c && !c.is_active && (
					<p className="animate-rise rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
						This company is suspended. Its people can&apos;t sign in until you reactivate it.
					</p>
				)}

				<SectionCard title="Profile">
					{company.isLoading || !c ? (
						<CardSkeleton className="h-32" />
					) : (
						<DetailList
							columns={2}
							items={[
								{ label: "Name", value: c.name },
								{ label: "Slug", value: <span className="font-mono text-xs">{c.slug}</span> },
								{ label: "Email", value: c.email },
								{ label: "Country", value: countryName(c.country) },
								{ label: "Time zone", value: c.timezone || "--" },
								{ label: "Default currency", value: c.default_currency || "--" },
								{ label: "Joined", value: formatDateTime(c.created_at) },
								{ label: "Last updated", value: formatDateTime(c.updated_at) },
								{
									label: "Company ID",
									value: (
										<span className="flex items-center gap-1">
											<span className="truncate font-mono text-xs">{c.id}</span>
											<CopyButton value={c.id} label="Copy company ID" />
										</span>
									),
								},
							]}
						/>
					)}
				</SectionCard>

				<SectionCard
					title="People"
					description={accounts === null ? undefined : `${formatCount(accounts)} account${accounts === 1 ? "" : "s"}`}
					flush
					action={<ViewAll href={`/users?company=${id}`} total={users.data?.meta?.total} />}
				>
					{users.isLoading ? (
						<TableSkeleton rows={3} columns={4} />
					) : users.isError ? (
						<ErrorState message={errorMessage(users.error)} onRetry={() => users.refetch()} />
					) : (users.data?.data.length ?? 0) === 0 ? (
						<EmptyState compact icon={Users} title="No accounts yet" />
					) : (
						<UsersTable users={users.data!.data} adminIds={adminIds} showCompany={false} />
					)}
				</SectionCard>

				<SectionCard
					title="Payments"
					flush
					action={<ViewAll href={`/transactions?company=${id}`} total={payments.data?.meta?.total} />}
				>
					{payments.isLoading ? (
						<TableSkeleton rows={3} columns={4} />
					) : payments.isError ? (
						<ErrorState
							message={
								payments.error instanceof ApiError && payments.error.status >= 500
									? "The API answered with a server error listing payments. Try again shortly."
									: errorMessage(payments.error)
							}
							onRetry={() => payments.refetch()}
						/>
					) : (payments.data?.data.length ?? 0) === 0 ? (
						<EmptyState compact icon={ArrowLeftRight} title="No payments yet" />
					) : (
						<TransactionsTable transactions={payments.data!.data} showCompany={false} />
					)}
				</SectionCard>

				<SectionCard
					title="Activity"
					flush
					action={<ViewAll href={`/audit-logs?company=${id}`} total={activity.data?.meta?.total} />}
				>
					{activity.isLoading ? (
						<TableSkeleton rows={3} columns={3} />
					) : activity.isError ? (
						<ErrorState message={errorMessage(activity.error)} onRetry={() => activity.refetch()} />
					) : (activity.data?.data.length ?? 0) === 0 ? (
						<EmptyState compact icon={ScrollText} title="No activity yet" />
					) : (
						<AuditTable logs={activity.data!.data} showCompany={false} />
					)}
				</SectionCard>
			</div>

			{c && (
				<ConfirmDialog
					open={confirming}
					onOpenChange={setConfirming}
					title={c.is_active ? `Suspend ${c.name}?` : `Reactivate ${c.name}?`}
					description={
						c.is_active
							? "Everyone in this company is signed out and can't sign in until you reactivate it. Nothing is deleted."
							: "Its people can sign in again."
					}
					confirmLabel={c.is_active ? "Suspend company" : "Reactivate"}
					tone={c.is_active ? "destructive" : "default"}
					loading={setActive.isPending}
					onConfirm={toggle}
				>
					<p className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm">
						<Building2 className="size-4 text-muted-foreground" /> {c.name} · {formatDate(c.created_at)}
					</p>
				</ConfirmDialog>
			)}
		</>
	);
}
