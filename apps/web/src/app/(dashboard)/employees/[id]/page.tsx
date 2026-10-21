"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertTriangle, History, Pencil, Power, Wallet } from "lucide-react";
import { Button } from "@repo/ui/button";
import { toast } from "@repo/ui/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/tabs";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { HashValue } from "@/components/hash";
import { AssetBadge, Money } from "@/components/money";
import { PageHeader } from "@/components/page-header";
import { Avatar } from "@/components/person";
import { RequirePermission } from "@/components/require-permission";
import { DetailList, SectionCard } from "@/components/section-card";
import { CardSkeleton, EmptyState, ErrorState, TableSkeleton } from "@/components/states";
import { EmployeeStatusPill } from "@/components/status-pill";
import { hasAnyPermission, useAuthStore } from "@/features/auth/store";
import { useEmployee, useLinkWallet, useSetEmployeeStatus } from "@/features/employees/hooks";
import { TransactionsTable } from "@/features/payroll/components/transactions-table";
import { useGroups, useTransactions } from "@/features/payroll/hooks";
import { DemoEmailLink } from "@/features/auth/components/demo-mode";
import { errorMessage } from "@/lib/api/request";
import { formatDate, formatFrequency, formatMoney } from "@/lib/format";
import { routes } from "@/lib/routes";
import { employeePhase } from "@/lib/status";

const EMPLOYMENT: Record<string, string> = { FULL_TIME: "Full-time", PART_TIME: "Part-time", CONTRACTOR: "Contractor" };

function EmployeeProfile() {
	const { id } = useParams<{ id: string }>();
	const user = useAuthStore((state) => state.user);
	const canUpdate = hasAnyPermission(user, ["employees:update"]);
	const canSeePayments = hasAnyPermission(user, ["payroll:read"]);
	const canRetry = hasAnyPermission(user, ["payroll:execute"]);
	const { data: e, isLoading, isError, refetch } = useEmployee(id);
	const groups = useGroups();
	const payments = useTransactions({ employee_id: id, page_size: 100 }, canSeePayments);
	const setStatus = useSetEmployeeStatus();
	const linkWallet = useLinkWallet(id);
	const [confirmStatus, setConfirmStatus] = useState(false);

	if (isLoading) {
		return (
			<div className="space-y-6">
				<CardSkeleton className="h-24" />
				<div className="grid gap-6 lg:grid-cols-2">
					<CardSkeleton className="h-56" />
					<CardSkeleton className="h-56" />
				</div>
			</div>
		);
	}
	if (isError || !e) {
		return (
			<SectionCard>
				<ErrorState title="Couldn't load this employee" onRetry={() => refetch()} />
			</SectionCard>
		);
	}

	const name = `${e.first_name} ${e.last_name}`;
	const group = groups.data?.find((g) => g.id === e.group_id);
	const list = canSeePayments ? (payments.data?.data ?? []) : [];
	const paid = list.filter((t) => t.status === "CONFIRMED");
	const phase = employeePhase(e);
	const nextStatus = e.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

	const toggleStatus = () =>
		setStatus.mutate(
			{ id: e.id, status: nextStatus },
			{
				onSuccess: () => {
					toast.success(`${name} is now ${nextStatus === "ACTIVE" ? "active" : "inactive"}`);
					setConfirmStatus(false);
				},
				onError: (error) => toast.error(errorMessage(error)),
			},
		);

	return (
		<>
			<PageHeader
				breadcrumbs={[{ label: "Employees", href: routes.employees.list }, { label: name }]}
				title={
					<span className="flex items-center gap-3">
						<Avatar name={name} />
						{name}
					</span>
				}
				badge={<EmployeeStatusPill employee={e} />}
				description={`${e.job_title} · ${e.email}`}
				actions={
					canUpdate &&
					e.status !== "TERMINATED" && (
						<>
							<Button variant="outline" onClick={() => setConfirmStatus(true)}>
								<Power /> {e.status === "ACTIVE" ? "Deactivate" : "Activate"}
							</Button>
							<Button asChild>
								<Link href={routes.employees.edit(e.id)}>
									<Pencil /> Edit
								</Link>
							</Button>
						</>
					)
				}
			/>

			{phase === "pending" && (
				<div
					role="status"
					className="mb-6 flex flex-col gap-3 rounded-xl border border-warning/30 bg-warning/8 p-4 text-sm sm:flex-row sm:items-center"
				>
					<AlertTriangle className="size-5 shrink-0 text-warning" />
					<p className="flex-1 text-foreground">
						{!e.wallet
							? "No wallet yet: payroll can't pay this employee until one is added."
							: "Invite not accepted yet: they can't see their payments until they sign in."}
					</p>
					{!e.wallet && canUpdate && (
						<div className="flex gap-2">
							<Button asChild size="sm" variant="outline">
								<Link href={routes.employees.edit(e.id)}>Add address</Link>
							</Button>
							<Button
								size="sm"
								disabled={linkWallet.isPending}
								onClick={() =>
									linkWallet.mutate(undefined, {
										onSuccess: () => toast.success("Custodial wallet created"),
										onError: (error) => toast.error(errorMessage(error)),
									})
								}
							>
								<Wallet /> Create wallet
							</Button>
						</div>
					)}
				</div>
			)}

			{e.invite_status === "PENDING" && (
				<div className="mb-6">
					<DemoEmailLink
						href={`${routes.authRoutes.COMPLETE_PROFILE}?token=invite-${e.id.slice(0, 8)}`}
						label={`Open ${e.first_name}'s invite as them`}
					/>
				</div>
			)}

			<Tabs defaultValue="overview" className="space-y-6">
				<TabsList>
					<TabsTrigger value="overview">Overview</TabsTrigger>
					{canSeePayments && <TabsTrigger value="payments">Payment History</TabsTrigger>}
				</TabsList>

				<TabsContent value="overview" className="mt-0 space-y-6">
					<div className="grid gap-6 lg:grid-cols-2">
						<SectionCard title="Personal information">
							<DetailList
								columns={2}
								items={[
									{ label: "Full name", value: name },
									{ label: "Email address", value: <span className="break-all">{e.email}</span> },
									{ label: "Role", value: e.job_title },
									{ label: "Department", value: e.department },
									{ label: "Employment", value: EMPLOYMENT[e.employment_type] ?? e.employment_type },
									{ label: "Country", value: e.country },
									{ label: "Start date", value: formatDate(e.start_date) },
									{ label: "Employee no.", value: <span className="font-mono text-xs">{e.employee_number}</span> },
								]}
							/>
						</SectionCard>
						<SectionCard title="Payment configuration">
							<DetailList
								columns={2}
								items={[
									{
										label: "Salary / amount",
										value: <Money value={e.salary_amount} asset={e.salary_currency} className="font-semibold" />,
									},
									{ label: "Payment asset", value: <AssetBadge asset={e.salary_currency} /> },
									{ label: "Frequency", value: formatFrequency(e.pay_frequency ?? group?.pay_cycle) },
									{ label: "Pay group", value: group?.name ?? "No group" },
									{
										label: "Wallet address",
										value: e.wallet ? (
											<HashValue value={e.wallet.stellar_address} kind="account" />
										) : (
											<span className="font-medium text-warning">Missing</span>
										),
									},
									{
										label: "Total received",
										value: canSeePayments
											? formatMoney(
													paid.reduce((s, t) => s + Number(t.amount), 0),
													e.salary_currency,
												)
											: "--",
									},
								]}
							/>
						</SectionCard>
					</div>
					{canSeePayments && (
						<SectionCard title="Recent payments" flush>
							<PaymentsBlock loading={payments.isLoading} empty={list.length === 0}>
								<TransactionsTable payments={list.slice(0, 5)} canRetryPayments={canRetry} />
							</PaymentsBlock>
						</SectionCard>
					)}
				</TabsContent>

				{canSeePayments && (
					<TabsContent value="payments" className="mt-0">
						<SectionCard
							title="Payment history"
							description={`${list.length} payment${list.length === 1 ? "" : "s"} · ${paid.length} completed`}
							flush
						>
							<PaymentsBlock loading={payments.isLoading} empty={list.length === 0}>
								<TransactionsTable payments={list} canRetryPayments={canRetry} />
							</PaymentsBlock>
						</SectionCard>
					</TabsContent>
				)}
			</Tabs>

			<ConfirmDialog
				open={confirmStatus}
				onOpenChange={setConfirmStatus}
				title={nextStatus === "INACTIVE" ? `Deactivate ${name}?` : `Activate ${name}?`}
				description={
					nextStatus === "INACTIVE"
						? "They won't be added to new payroll or schedules. Their payment history stays, and you can activate them again."
						: "They can be included in payroll again."
				}
				confirmLabel={nextStatus === "INACTIVE" ? "Deactivate" : "Activate"}
				tone={nextStatus === "INACTIVE" ? "destructive" : "default"}
				loading={setStatus.isPending}
				onConfirm={toggleStatus}
			/>
		</>
	);
}

function PaymentsBlock({ loading, empty, children }: { loading: boolean; empty: boolean; children: React.ReactNode }) {
	if (loading) return <TableSkeleton rows={3} />;
	if (empty)
		return (
			<EmptyState
				compact
				icon={History}
				title="No payments yet"
				description="Payments appear here once this employee is included in a payroll run."
			/>
		);
	return <>{children}</>;
}

export default function EmployeePage() {
	return (
		<RequirePermission any={["employees:read"]}>
			<EmployeeProfile />
		</RequirePermission>
	);
}
