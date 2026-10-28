"use client";

import Link from "next/link";
import { CalendarClock, ChevronRight, MoreHorizontal, Pause, Play, Plus, XCircle } from "lucide-react";
import { Button } from "@repo/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@repo/ui/dropdown-menu";
import { toast } from "@repo/ui/sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/table";
import { Money } from "@/components/money";
import { PageHeader } from "@/components/page-header";
import { RequirePermission } from "@/components/require-permission";
import { SectionCard } from "@/components/section-card";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/states";
import { ScheduleStatusPill } from "@/components/status-pill";
import { hasAnyPermission, useAuthStore } from "@/features/auth/store";
import { ScheduleNotice } from "@/features/payroll/components/schedule-notice";
import { useScheduleAction, useSchedules } from "@/features/payroll/hooks";
import type { PayrollSchedule } from "@/features/payroll/types";
import { errorMessage } from "@/lib/api/request";
import { formatDate, formatFrequency, formatRelative } from "@/lib/format";
import { routes } from "@/lib/routes";

/** PRD §6: recurring payroll schedules, their next pay date, and pause / resume / cancel. */
function RecurringPayroll() {
	const canManage = useAuthStore((state) => hasAnyPermission(state.user, ["payroll:create", "payroll:update"]));
	const { data, isLoading, isError, refetch } = useSchedules();
	const action = useScheduleAction();
	const list = data ?? [];

	const run = (s: PayrollSchedule, kind: "pause" | "resume" | "cancel") =>
		action.mutate(
			{ id: s.id, action: kind },
			{
				onSuccess: () => toast.success(`${s.name} ${kind === "pause" ? "paused" : kind === "resume" ? "resumed" : "cancelled"}`),
				onError: (error) => toast.error(errorMessage(error)),
			},
		);

	return (
		<>
			<PageHeader
				title="Recurring Payroll Schedules"
				description="Pay the same people on a regular cycle without rebuilding the payroll each time."
				breadcrumbs={[{ label: "Payroll", href: routes.payroll.list }, { label: "Recurring" }]}
				actions={
					canManage && (
						<Button asChild>
							<Link href={routes.recurring.create}>
								<Plus /> Create Schedule
							</Link>
						</Button>
					)
				}
			/>
			<ScheduleNotice className="mb-6" />
			<SectionCard flush>
				{isLoading ? (
					<TableSkeleton rows={4} />
				) : isError ? (
					<ErrorState message="We couldn't load your schedules." onRetry={() => refetch()} />
				) : list.length === 0 ? (
					<EmptyState
						icon={CalendarClock}
						title="No recurring payroll yet"
						description="Create a schedule for a team you pay weekly, every two weeks or monthly."
						action={
							canManage && (
								<Button asChild>
									<Link href={routes.recurring.create}>
										<Plus /> Create Schedule
									</Link>
								</Button>
							)
						}
					/>
				) : (
					<div className="overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow className="hover:bg-transparent">
									<TableHead className="pl-4 sm:pl-5">Schedule name</TableHead>
									<TableHead className="hidden sm:table-cell">Frequency</TableHead>
									<TableHead className="hidden text-right xl:table-cell">Employees</TableHead>
									<TableHead className="text-right">Amount</TableHead>
									<TableHead className="hidden sm:table-cell">Next payment</TableHead>
									<TableHead className="hidden sm:table-cell">Status</TableHead>
									<TableHead className="w-12 pr-3 sm:w-20 sm:pr-5" />
								</TableRow>
							</TableHeader>
							<TableBody>
								{list.map((s) => (
									<TableRow key={s.id} className={s.status === "CANCELLED" ? "opacity-60" : undefined}>
										<TableCell className="pl-4 whitespace-normal sm:pl-5 sm:whitespace-nowrap">
											<Link href={routes.recurring.detail(s.id)} className="font-medium text-foreground hover:text-primary">
												{s.name}
											</Link>
											{/* Phones: status and next date sit under the name instead of in their own columns. */}
											<div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 sm:hidden">
												<ScheduleStatusPill status={s.status} />
												{s.next_run_at && s.status !== "CANCELLED" && (
													<span className="text-xs text-muted-foreground">Next {formatDate(s.next_run_at)}</span>
												)}
											</div>
										</TableCell>
										<TableCell className="hidden sm:table-cell">{formatFrequency(s.frequency)}</TableCell>
										<TableCell className="hidden text-right tabular-nums xl:table-cell">
											{s.employee_count}
										</TableCell>
										<TableCell className="text-right font-medium">
											<Money value={s.amount_per_cycle} asset={s.asset} />
										</TableCell>
										<TableCell className="hidden whitespace-nowrap sm:table-cell">
											{s.next_run_at && s.status !== "CANCELLED" ? (
												<>
													{formatDate(s.next_run_at)}
													<span className="block text-xs text-muted-foreground">
														{s.status === "PAUSED" ? "Paused" : formatRelative(s.next_run_at)}
													</span>
												</>
											) : (
												<span className="text-muted-foreground">—</span>
											)}
										</TableCell>
										<TableCell className="hidden sm:table-cell">
											<ScheduleStatusPill status={s.status} />
										</TableCell>
										<TableCell className="pr-3 text-right sm:pr-5">
											<div className="flex items-center justify-end">
												{canManage && s.status !== "CANCELLED" && (
													<DropdownMenu>
														<DropdownMenuTrigger asChild>
															<Button variant="ghost" size="icon-sm" aria-label={`Actions for ${s.name}`}>
																<MoreHorizontal />
															</Button>
														</DropdownMenuTrigger>
														<DropdownMenuContent align="end">
															{s.status === "ACTIVE" ? (
																<DropdownMenuItem onSelect={() => run(s, "pause")}>
																	<Pause /> Pause schedule
																</DropdownMenuItem>
															) : (
																<DropdownMenuItem onSelect={() => run(s, "resume")}>
																	<Play /> Resume schedule
																</DropdownMenuItem>
															)}
															<DropdownMenuSeparator />
															<DropdownMenuItem asChild variant="destructive">
																<Link href={`${routes.recurring.detail(s.id)}?cancel=1`}>
																	<XCircle /> Cancel schedule
																</Link>
															</DropdownMenuItem>
														</DropdownMenuContent>
													</DropdownMenu>
												)}
												{/* Phones: the name already links here, and the column has no room for two buttons. */}
												<Button asChild variant="ghost" size="icon-sm" className="hidden sm:inline-flex" aria-label={`View ${s.name}`}>
													<Link href={routes.recurring.detail(s.id)}>
														<ChevronRight />
													</Link>
												</Button>
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				)}
			</SectionCard>
		</>
	);
}

export default function RecurringPage() {
	return (
		<RequirePermission any={["payroll:read"]}>
			<RecurringPayroll />
		</RequirePermission>
	);
}
