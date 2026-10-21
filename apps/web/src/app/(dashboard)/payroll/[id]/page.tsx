"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { CalendarClock, Info } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { RequirePermission } from "@/components/require-permission";
import { SectionCard } from "@/components/section-card";
import { CardSkeleton, ErrorState } from "@/components/states";
import { RunStatusPill } from "@/components/status-pill";
import { hasAnyPermission, useAuthStore } from "@/features/auth/store";
import { PayrollReview } from "@/features/payroll/components/payroll-review";
import { RunActions } from "@/features/payroll/components/run-actions";
import { RunProgress } from "@/features/payroll/components/run-progress";
import { useGroups, useRun } from "@/features/payroll/hooks";
import { runName, runReference } from "@/features/payroll/utils";
import { ApiError } from "@/lib/api/client";
import { formatDate, formatDateTime, formatPeriod } from "@/lib/format";
import { routes } from "@/lib/routes";
import { runPhase, runStatus } from "@/lib/status";

/** A payroll cycle: the review while it's a draft, then its payments as they settle (PRD §4, §7). */
function PayrollDetails() {
	const { id } = useParams<{ id: string }>();
	const user = useAuthStore((state) => state.user);
	const canEdit = hasAnyPermission(user, ["payroll:update", "payroll:create"]);
	const canApprove = hasAnyPermission(user, ["payroll:approve"]);
	const canRetry = hasAnyPermission(user, ["payroll:execute"]);
	const { data: run, isLoading, isError, error, refetch } = useRun(id);
	const groups = useGroups();

	if (isLoading) {
		return (
			<div className="space-y-6">
				<CardSkeleton className="h-20" />
				<div className="grid gap-4 sm:grid-cols-4">
					{Array.from({ length: 4 }, (_, i) => (
						<CardSkeleton key={i} />
					))}
				</div>
				<CardSkeleton className="h-64" />
			</div>
		);
	}
	if (isError || !run) {
		return (
			<SectionCard>
				<ErrorState
					title={error instanceof ApiError && error.status === 404 ? "Payroll not found" : "Couldn't load this payroll"}
					onRetry={() => refetch()}
				/>
			</SectionCard>
		);
	}

	const phase = runPhase(run);
	const name = runName(run, groups.data);
	const status = runStatus(run);

	return (
		<>
			<PageHeader
				breadcrumbs={[{ label: "Payroll", href: routes.payroll.list }, { label: name }]}
				title={name}
				badge={<RunStatusPill run={run} />}
				description={
					<>
						{formatPeriod(run.period_start, run.period_end)} · {run.employee_count ?? "—"} employees · Created{" "}
						{formatDate(run.created_at)} · <span className="font-mono text-xs">{runReference(run)}</span>
					</>
				}
				actions={<RunActions run={run} />}
			/>

			<div
				className={
					phase === "failed"
						? "mb-6 flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm"
						: "mb-6 flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-sm"
				}
			>
				{phase === "scheduled" ? (
					<CalendarClock className="mt-0.5 size-4 shrink-0 text-primary" />
				) : (
					<Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
				)}
				<p className="text-muted-foreground">
					<span className="font-medium text-foreground">{status.label}. </span>
					{phase === "pending" &&
						(canApprove
							? "Review the amounts below, then approve it for its pay date or pay it now."
							: "An approver needs to review and approve it before anything is paid.")}
					{phase === "scheduled" &&
						`Approved${run.approved_at ? ` on ${formatDate(run.approved_at)}` : ""}. It will be paid automatically on ${formatDateTime(run.scheduled_at)}.`}
					{phase === "processing" && "Payments are being sent and confirmed on Stellar. This page updates by itself."}
					{phase === "completed" &&
						`Every payment was confirmed${run.executed_at ? `; paid out on ${formatDateTime(run.executed_at)}` : ""}.`}
					{phase === "failed" &&
						"Some payments failed. Each one shows why; fix the cause and retry it without recreating the payroll."}
					{phase === "cancelled" && "This run was cancelled before any payment was sent."}
					{run.schedule_id && (
						<>
							{" "}
							Drafted by a{" "}
							<Link href={routes.recurring.detail(run.schedule_id)} className="font-medium text-primary hover:underline">
								recurring schedule
							</Link>
							.
						</>
					)}
				</p>
			</div>

			{run.status === "DRAFT" || phase === "scheduled" || phase === "cancelled" ? (
				<PayrollReview run={run} editable={run.status === "DRAFT" && canEdit} />
			) : (
				<RunProgress run={run} canRetryPayments={canRetry} />
			)}

			{run.notes && (
				<SectionCard title="Notes" className="mt-6">
					<p className="text-sm whitespace-pre-line text-muted-foreground">{run.notes}</p>
				</SectionCard>
			)}
		</>
	);
}

export default function PayrollRunPage() {
	return (
		<RequirePermission any={["payroll:read"]}>
			<PayrollDetails />
		</RequirePermission>
	);
}
