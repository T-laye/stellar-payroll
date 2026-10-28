"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { CalendarClock, Coins, Pause, Pencil, Play, Users, XCircle } from "lucide-react";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { toast } from "@repo/ui/sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/table";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { FormField } from "@/components/form-field";
import { Money } from "@/components/money";
import { PageHeader } from "@/components/page-header";
import { PersonCell } from "@/components/person";
import { RequirePermission } from "@/components/require-permission";
import { SectionCard } from "@/components/section-card";
import { StatCard } from "@/components/stat-card";
import { CardSkeleton, EmptyState, ErrorState } from "@/components/states";
import { RunStatusPill, ScheduleStatusPill, TonePill } from "@/components/status-pill";
import { hasAnyPermission, useAuthStore } from "@/features/auth/store";
import { ScheduleNotice } from "@/features/payroll/components/schedule-notice";
import { useSchedule, useScheduleAction, useUpdateSchedule } from "@/features/payroll/hooks";
import { errorMessage } from "@/lib/api/request";
import { formatDate, formatFrequency, formatMoney, formatRelative } from "@/lib/format";
import { routes } from "@/lib/routes";

type Dialog = "pause" | "resume" | "cancel" | "rename" | null;

function ScheduleDetails() {
	const { id } = useParams<{ id: string }>();
	const params = useSearchParams();
	const canManage = useAuthStore((state) => hasAnyPermission(state.user, ["payroll:create", "payroll:update"]));
	const { data: s, isLoading, isError, refetch } = useSchedule(id);
	const action = useScheduleAction();
	const update = useUpdateSchedule(id);
	const [dialog, setDialog] = useState<Dialog>(params.get("cancel") ? "cancel" : null);
	const [newName, setNewName] = useState("");

	if (isLoading) return <CardSkeleton className="h-64" />;
	if (isError || !s) {
		return (
			<SectionCard>
				<ErrorState title="Couldn't load this schedule" onRetry={() => refetch()} />
			</SectionCard>
		);
	}

	const close = () => setDialog(null);
	const doAction = (kind: "pause" | "resume" | "cancel") =>
		action.mutate(
			{ id: s.id, action: kind },
			{
				onSuccess: () => {
					toast.success(kind === "pause" ? "Schedule paused" : kind === "resume" ? "Schedule resumed" : "Schedule cancelled");
					close();
				},
				onError: (error) => toast.error(errorMessage(error)),
			},
		);

	return (
		<>
			<PageHeader
				breadcrumbs={[{ label: "Recurring Payroll", href: routes.recurring.list }, { label: s.name }]}
				title={s.name}
				badge={<ScheduleStatusPill status={s.status} />}
				description={`${formatFrequency(s.frequency)} · ${s.employee_count} employees · ${s.asset}`}
				actions={
					canManage &&
					s.status !== "CANCELLED" && (
						<>
							<Button
								variant="outline"
								onClick={() => {
									setNewName(s.name);
									setDialog("rename");
								}}
							>
								<Pencil /> Rename
							</Button>
							{s.status === "ACTIVE" ? (
								<Button variant="outline" onClick={() => setDialog("pause")}>
									<Pause /> Pause Schedule
								</Button>
							) : (
								<Button onClick={() => setDialog("resume")}>
									<Play /> Resume Schedule
								</Button>
							)}
							<Button
								variant="ghost"
								className="text-destructive hover:bg-destructive/10 hover:text-destructive"
								onClick={() => setDialog("cancel")}
							>
								<XCircle /> Cancel Schedule
							</Button>
						</>
					)
				}
			/>

			<div className="space-y-6">
				<div className="grid gap-4 sm:grid-cols-3">
					<StatCard
						index={0}
						label="Total scheduled amount"
						icon={Coins}
						value={formatMoney(s.amount_per_cycle, s.asset)}
						hint="Per cycle, at current salaries"
					/>
					<StatCard
						index={1}
						label="Upcoming cycle"
						icon={CalendarClock}
						tone={s.status === "ACTIVE" ? "brand" : "neutral"}
						value={s.next_run_at && s.status !== "CANCELLED" ? formatDate(s.next_run_at) : "—"}
						hint={
							s.status === "PAUSED"
								? "Paused: no drafts until resumed"
								: s.next_run_at && s.status === "ACTIVE"
									? formatRelative(s.next_run_at)
									: undefined
						}
					/>
					<StatCard
						index={2}
						label="Employees"
						icon={Users}
						tone="info"
						value={s.employee_count}
						hint={`${s.employees?.filter((e) => !e.has_wallet).length ?? 0} without a wallet`}
					/>
				</div>

				{s.status !== "CANCELLED" && <ScheduleNotice />}

				<div className="grid gap-6 xl:grid-cols-2">
					<SectionCard title="Upcoming payroll cycles" flush>
						{s.upcoming.length === 0 ? (
							<EmptyState compact icon={CalendarClock} title="No upcoming cycles" description="This schedule was cancelled." />
						) : (
							<Table>
								<TableHeader>
									<TableRow className="hover:bg-transparent">
										<TableHead className="pl-5">Date</TableHead>
										<TableHead className="hidden text-right sm:table-cell">Employees</TableHead>
										<TableHead className="pr-5 text-right sm:pr-2">Amount</TableHead>
										<TableHead className="hidden pr-5 sm:table-cell">Status</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{s.upcoming.map((c) => {
										const status =
											c.run_id && c.run_status ? (
												<Link href={routes.payroll.detail(c.run_id)} className="hover:opacity-80">
													<RunStatusPill run={{ status: c.run_status, scheduled_at: c.date, executed_at: null }} />
												</Link>
											) : s.status === "PAUSED" ? (
												<TonePill label="Paused" tone="warning" />
											) : (
												<span className="text-xs text-muted-foreground">Draft on {formatDate(c.drafts_at)}</span>
											);
										return (
											<TableRow key={c.date}>
												<TableCell className="pl-5 whitespace-nowrap">
													{formatDate(c.date)}
													{/* Phones: the status sits under the date instead of in its own column. */}
													<div className="mt-1.5 sm:hidden">{status}</div>
												</TableCell>
												<TableCell className="hidden text-right tabular-nums sm:table-cell">{c.employee_count}</TableCell>
												<TableCell className="pr-5 text-right sm:pr-2">
													<Money value={c.amount} asset={s.asset} />
												</TableCell>
												<TableCell className="hidden pr-5 sm:table-cell">{status}</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						)}
					</SectionCard>

					<SectionCard title="Employees" description="Paid their current salary each cycle." flush>
						<ul className="max-h-80 divide-y divide-border overflow-y-auto">
							{(s.employees ?? []).map((e) => (
								<li key={e.id} className="flex items-center gap-3 px-5 py-3">
									<Link href={routes.employees.detail(e.id)} className="min-w-0 flex-1 hover:[&_span]:text-primary">
										<PersonCell name={e.name} subtitle={e.job_title} size="sm" />
									</Link>
									{!e.has_wallet && <TonePill label="No wallet" tone="warning" />}
									{e.status !== "ACTIVE" && <TonePill label="Inactive" tone="neutral" />}
									<Money value={e.salary_amount} asset={e.salary_currency} className="text-sm font-medium" />
								</li>
							))}
						</ul>
					</SectionCard>
				</div>

				<SectionCard title="Past payroll from this schedule" flush>
					{(s.runs ?? []).length === 0 ? (
						<EmptyState
							compact
							icon={CalendarClock}
							title="No payroll yet"
							description="Each draft this schedule prepares appears here."
						/>
					) : (
						<ul className="divide-y divide-border">
							{s.runs!.map((r) => (
								<li key={r.id}>
									<Link
										href={routes.payroll.detail(r.id)}
										className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-accent/40"
									>
										<span className="min-w-0 flex-1">
											<span className="block truncate text-sm font-medium">{r.name}</span>
											<span className="block text-xs text-muted-foreground">{formatDate(r.scheduled_at)}</span>
										</span>
										<Money value={r.total_amount} asset={r.currency} className="text-sm font-medium" />
										<RunStatusPill
											run={{
												status: r.status,
												scheduled_at: r.scheduled_at,
												executed_at: r.status === "FAILED" ? r.scheduled_at : null,
											}}
										/>
									</Link>
								</li>
							))}
						</ul>
					)}
				</SectionCard>
			</div>

			<ConfirmDialog
				open={dialog === "pause"}
				onOpenChange={(open) => !open && close()}
				title="Pause this schedule?"
				description="No new draft payroll is prepared while it's paused. Drafts that already exist stay as they are."
				confirmLabel="Pause schedule"
				loading={action.isPending}
				onConfirm={() => doAction("pause")}
			/>
			<ConfirmDialog
				open={dialog === "resume"}
				onOpenChange={(open) => !open && close()}
				title="Resume this schedule?"
				description="Pay dates missed while paused are skipped. The next draft is prepared before the next upcoming date."
				confirmLabel="Resume schedule"
				loading={action.isPending}
				onConfirm={() => doAction("resume")}
			/>
			<ConfirmDialog
				open={dialog === "cancel"}
				onOpenChange={(open) => !open && close()}
				title="Cancel this schedule?"
				description="It stops for good, and its draft that hasn't been paid is cancelled too. Past payroll stays in your history."
				confirmLabel="Cancel schedule"
				tone="destructive"
				loading={action.isPending}
				onConfirm={() => doAction("cancel")}
			/>
			<ConfirmDialog
				open={dialog === "rename"}
				onOpenChange={(open) => !open && close()}
				title="Rename this schedule"
				description="The name shows on the schedule and on the drafts it prepares."
				confirmLabel="Save name"
				loading={update.isPending}
				onConfirm={() =>
					newName.trim().length < 3
						? toast.error("Give the schedule a name")
						: update.mutate(
								{ name: newName.trim() },
								{
									onSuccess: () => {
										toast.success("Schedule renamed");
										close();
									},
									onError: (error) => toast.error(errorMessage(error)),
								},
							)
				}
			>
				<FormField label="Schedule name" htmlFor="schedule-name">
					<Input id="schedule-name" value={newName} onChange={(e) => setNewName(e.target.value)} />
				</FormField>
			</ConfirmDialog>
		</>
	);
}

export default function SchedulePage() {
	return (
		<RequirePermission any={["payroll:read"]}>
			<Suspense fallback={<CardSkeleton className="h-64" />}>
				<ScheduleDetails />
			</Suspense>
		</RequirePermission>
	);
}
