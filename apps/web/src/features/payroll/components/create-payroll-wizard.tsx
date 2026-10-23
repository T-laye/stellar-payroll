"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarCheck, CheckCircle2, FileClock, Loader2, Send } from "lucide-react";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/select";
import { toast } from "@repo/ui/sonner";
import { Textarea } from "@repo/ui/textarea";
import { cn } from "@repo/ui/lib/utils";
import { FormField } from "@/components/form-field";
import { SectionCard } from "@/components/section-card";
import { ErrorState, TableSkeleton } from "@/components/states";
import { Stepper } from "@/components/stepper";
import { hasAnyPermission, useAuthStore } from "@/features/auth/store";
import { useEmployees } from "@/features/employees/hooks";
import { EmployeePicker, selectionTotal } from "@/features/payroll/components/employee-picker";
import { PayrollReview } from "@/features/payroll/components/payroll-review";
import { toastPayrollError } from "@/features/payroll/components/run-actions";
import { RunProgress } from "@/features/payroll/components/run-progress";
import {
	useApproveRun,
	useCreateRun,
	useGroups,
	useRunReview,
	usePayNow,
	useRun,
	useSyncLineItems,
	useUpdateRun,
} from "@/features/payroll/hooks";
import type { Asset } from "@/features/payroll/types";
import { errorMessage, newIdempotencyKey } from "@/lib/api/request";
import { isPositiveAmount, toInputAmount } from "@/lib/decimal";
import { formatDateTime, formatMoney, toDateInput } from "@/lib/format";
import { routes } from "@/lib/routes";
import { useMountTime } from "@/lib/use-now";

const STEPS = [
	{ label: "Cycle details", description: "Name, asset and pay date" },
	{ label: "Select employees", description: "Who gets paid, and how much" },
	{ label: "Review & summary", description: "Check totals and missing info" },
	{ label: "Confirm & execute", description: "Pay now or schedule" },
	{ label: "Processing & results", description: "Watch payments settle" },
];

type Outcome = "pay" | "schedule" | "draft";

function defaults() {
	const now = new Date();
	const start = new Date(now.getFullYear(), now.getMonth(), 1);
	const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
	const tomorrow = new Date(now.getTime() + 86_400_000);
	const payDate = end > tomorrow ? end : tomorrow;
	return {
		name: `${now.toLocaleString("en-US", { month: "long", year: "numeric" })} payroll`,
		currency: "USDC" as Asset,
		period_start: toDateInput(start),
		period_end: toDateInput(end),
		pay_date: toDateInput(payDate),
		notes: "",
	};
}

/** Pay at 09:00 local time on the chosen day (the API wants a future RFC 3339 timestamp). */
const payDateToIso = (date: string) => new Date(`${date}T09:00:00`).toISOString();

/**
 * PRD §4 and §11.2: payroll creation as a guided flow rather than one long form. The draft run is
 * created when you move from selection to review, so the review shows the API's own totals and
 * checks; going back and changing the selection updates that same draft.
 */
export function CreatePayrollWizard() {
	const user = useAuthStore((state) => state.user);
	const canApprove = hasAnyPermission(user, ["payroll:approve"]);
	const canExecute = hasAnyPermission(user, ["payroll:execute"]);
	const [step, setStep] = useState(0);
	const now = useMountTime();
	const [details, setDetails] = useState(defaults);
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [selection, setSelection] = useState<Record<string, string> | null>(null);
	const [runId, setRunId] = useState<string | null>(null);
	const [outcome, setOutcome] = useState<Outcome>(canApprove && canExecute ? "pay" : canApprove ? "schedule" : "draft");
	const [finished, setFinished] = useState<Outcome | null>(null);
	// Made when the wizard opens (and again after a failure), so a double click can't create two runs or pay twice.
	const [createKey, setCreateKey] = useState(newIdempotencyKey);
	const [confirmKey, setConfirmKey] = useState(newIdempotencyKey);

	const employees = useEmployees();
	const groups = useGroups();
	const run = useRun(runId ?? undefined);
	const review = useRunReview(runId ?? undefined);
	const createRun = useCreateRun();
	const syncItems = useSyncLineItems(runId ?? undefined);
	const updateRun = useUpdateRun(runId ?? "");
	const approve = useApproveRun();
	const payNow = usePayNow();

	// Active and pending people can be picked; pending ones (no wallet yet) are flagged in the review.
	const payable = (employees.data ?? []).filter((e) => e.status === "ACTIVE" || e.status === "PENDING");
	// First visit to the picker: everyone payable who is paid in this cycle's asset.
	const picked =
		selection ??
		Object.fromEntries(payable.filter((e) => e.salary_currency === details.currency).map((e) => [e.id, toInputAmount(e.salary_amount)]));
	const busy = createRun.isPending || syncItems.isPending || updateRun.isPending || approve.isPending || payNow.isPending;
	const incomplete = review.data ? review.data.issues.length + (review.data.employee_count ? 0 : 1) : 0;

	const validateDetails = () => {
		const next: Record<string, string> = {};
		if (details.name.trim().length < 3) next.name = "Give the cycle a name";
		if (!details.period_start || !details.period_end) next.period = "Choose the pay period";
		else if (details.period_end < details.period_start) next.period = "The period must end after it starts";
		if (!details.pay_date) next.pay_date = "Choose a pay date";
		else if (Date.parse(payDateToIso(details.pay_date)) <= Date.now()) next.pay_date = "The pay date must be in the future";
		setErrors(next);
		return Object.keys(next).length === 0;
	};

	const toReview = async () => {
		const chosen = Object.entries(picked);
		if (chosen.length === 0) return toast.error("Select at least one employee");
		const bad = chosen.find(([, amount]) => !isPositiveAmount(amount));
		if (bad) return toast.error("Every selected employee needs an amount greater than zero");
		const lineItems = chosen.map(([employee_id, amount]) => ({ employee_id, amount }));
		try {
			if (!runId) {
				const created = await createRun.mutateAsync({
					run: {
						name: details.name.trim(),
						currency: details.currency,
						// RFC 3339 for the API: the period runs from the first day's start to the last day's end.
						period_start: `${details.period_start}T00:00:00Z`,
						period_end: `${details.period_end}T23:59:59Z`,
						scheduled_at: payDateToIso(details.pay_date),
						notes: details.notes.trim() || undefined,
					},
					items: lineItems,
					key: createKey,
				});
				setRunId(created.id);
			} else {
				await updateRun.mutateAsync({
					name: details.name.trim(),
					notes: details.notes.trim(),
					scheduled_at: payDateToIso(details.pay_date),
				});
				await syncItems.mutateAsync(lineItems);
			}
			setStep(2);
		} catch (error) {
			setCreateKey(newIdempotencyKey());
			toast.error(errorMessage(error, "Couldn't save the payroll draft"));
		}
	};

	const confirm = async () => {
		if (!run.data) return;
		const allowed = outcome === "draft" || (incomplete === 0 && canApprove && (outcome === "schedule" || canExecute));
		if (!allowed) return toast.error("Choose one of the available options");
		try {
			if (outcome === "pay") await payNow.mutateAsync({ run: run.data, key: confirmKey });
			if (outcome === "schedule") await approve.mutateAsync({ id: run.data.id, key: confirmKey });
			// "draft" leaves the run as it is: Pending, and approvers were told when it was created.
			setFinished(outcome);
			setStep(4);
		} catch (error) {
			setConfirmKey(newIdempotencyKey());
			toastPayrollError(error, "Couldn't complete this step");
		}
	};

	const footer = (back: (() => void) | null, next: React.ReactNode) => (
		<div className="mt-6 flex items-center justify-between gap-3 border-t border-border pt-5">
			{back ? (
				<Button variant="outline" onClick={back} disabled={busy}>
					<ArrowLeft /> Back
				</Button>
			) : (
				<Button asChild variant="ghost">
					<Link href={routes.payroll.list}>Cancel</Link>
				</Button>
			)}
			{next}
		</div>
	);

	return (
		<div className="grid gap-6 lg:grid-cols-[240px_1fr]">
			<SectionCard className="h-fit lg:sticky lg:top-6">
				<Stepper steps={STEPS} current={step} />
			</SectionCard>

			<div className="min-w-0">
				{step === 0 && (
					<SectionCard title="Cycle details" description="Name your payroll cycle and choose when it's paid.">
						<form
							noValidate
							onSubmit={(e) => {
								e.preventDefault();
								if (validateDetails()) setStep(1);
							}}
							className="space-y-5"
						>
							<FormField label="Payroll cycle name" htmlFor="name" required error={errors.name}>
								<Input
									id="name"
									value={details.name}
									onChange={(e) => setDetails({ ...details, name: e.target.value })}
									placeholder="October 2026 payroll"
								/>
							</FormField>
							<div className="grid gap-5 sm:grid-cols-2">
								<FormField
									label="Payment asset"
									required
									hint={runId ? "Fixed once the draft exists." : "Employees are paid in this asset on Stellar."}
								>
									<Select
										value={details.currency}
										disabled={!!runId}
										onValueChange={(v) => {
											setDetails({ ...details, currency: v as Asset });
											setSelection(null);
										}}
									>
										<SelectTrigger className="w-full" aria-label="Payment asset">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="USDC">USDC (USD Coin)</SelectItem>
											<SelectItem value="XLM">XLM (Stellar Lumens)</SelectItem>
										</SelectContent>
									</Select>
								</FormField>
								<FormField
									label="Pay date"
									htmlFor="pay_date"
									required
									error={errors.pay_date}
									hint="Approved payroll is paid automatically on this date."
								>
									<Input
										id="pay_date"
										type="date"
										min={toDateInput(now + 86_400_000)}
										value={details.pay_date}
										onChange={(e) => setDetails({ ...details, pay_date: e.target.value })}
									/>
								</FormField>
							</div>
							<FormField
								label="Pay period"
								required
								error={errors.period}
								hint={runId ? "Fixed once the draft exists." : undefined}
							>
								<div className="grid grid-cols-2 gap-3">
									<Input
										type="date"
										aria-label="Period start"
										disabled={!!runId}
										value={details.period_start}
										onChange={(e) => setDetails({ ...details, period_start: e.target.value })}
									/>
									<Input
										type="date"
										aria-label="Period end"
										disabled={!!runId}
										value={details.period_end}
										onChange={(e) => setDetails({ ...details, period_end: e.target.value })}
									/>
								</div>
							</FormField>
							<FormField label="Notes" htmlFor="notes" hint="Optional. Visible to admins on the payroll details.">
								<Textarea
									id="notes"
									rows={3}
									value={details.notes}
									onChange={(e) => setDetails({ ...details, notes: e.target.value })}
									placeholder="e.g. Includes October bonuses"
								/>
							</FormField>
							{footer(
								null,
								<Button type="submit">
									Next: Select employees <ArrowRight />
								</Button>,
							)}
						</form>
					</SectionCard>
				)}

				{step === 1 && (
					<SectionCard
						title="Select employees"
						description={`Choose who is paid in ${details.name}. Amounts start at each salary and can be changed for this cycle.`}
					>
						{employees.isLoading ? (
							<TableSkeleton rows={5} columns={3} />
						) : employees.isError ? (
							<ErrorState onRetry={() => employees.refetch()} />
						) : (
							<EmployeePicker
								employees={payable}
								groups={groups.data ?? []}
								asset={details.currency}
								selection={picked}
								onChange={setSelection}
							/>
						)}
						<div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/60 px-4 py-3 text-sm">
							<span className="text-muted-foreground">
								Total selected: <span className="font-semibold text-foreground">{Object.keys(picked).length}</span>
							</span>
							<span className="text-muted-foreground">
								Total amount:{" "}
								<span className="font-semibold text-foreground tabular-nums">
									{formatMoney(selectionTotal(picked), details.currency, { withCode: true })}
								</span>
							</span>
						</div>
						{footer(
							() => setStep(0),
							<Button onClick={toReview} disabled={busy || Object.keys(picked).length === 0}>
								{busy && <Loader2 className="animate-spin" />} Next: Review employees <ArrowRight />
							</Button>,
						)}
					</SectionCard>
				)}

				{step === 2 && (
					<>
						{run.data ? (
							<PayrollReview run={run.data} editable onEditSelection={() => setStep(1)} />
						) : (
							<SectionCard>
								<TableSkeleton rows={4} />
							</SectionCard>
						)}
						{footer(
							() => setStep(1),
							<Button onClick={() => setStep(3)} disabled={!run.data || review.isLoading}>
								Next: Confirm <ArrowRight />
							</Button>,
						)}
					</>
				)}

				{step === 3 && run.data && (
					<SectionCard title="Confirm & execute" description="Choose what happens to this payroll.">
						<div className="mb-5 grid gap-3 rounded-xl bg-muted/60 p-4 text-sm sm:grid-cols-3">
							<div>
								<p className="text-muted-foreground">Employees</p>
								<p className="text-lg font-semibold">{review.data?.employee_count ?? run.data.employee_count ?? 0}</p>
							</div>
							<div>
								<p className="text-muted-foreground">Total</p>
								<p className="text-lg font-semibold tabular-nums">
									{formatMoney(run.data.total_amount, run.data.currency, { withCode: true })}
								</p>
							</div>
							<div>
								<p className="text-muted-foreground">Pay date</p>
								<p className="text-lg font-semibold">{formatDateTime(run.data.scheduled_at)}</p>
							</div>
						</div>
						<fieldset className="space-y-3">
							<legend className="sr-only">What should happen</legend>
							<OutcomeOption
								value="pay"
								current={outcome}
								onSelect={setOutcome}
								disabled={!canApprove || !canExecute || incomplete > 0}
								icon={Send}
								title="Approve and pay now"
								description="Payments are sent on Stellar right away and settle in seconds."
								reason={
									!canApprove || !canExecute
										? "Requires approve and execute permissions."
										: incomplete > 0
											? "Fix the incomplete payment information first."
											: undefined
								}
							/>
							<OutcomeOption
								value="schedule"
								current={outcome}
								onSelect={setOutcome}
								disabled={!canApprove || incomplete > 0}
								icon={CalendarCheck}
								title={`Approve and schedule for ${formatDateTime(run.data.scheduled_at)}`}
								description="Approved payroll is paid automatically at the scheduled time. You can cancel it before then."
								reason={
									!canApprove
										? "Requires the approve permission."
										: incomplete > 0
											? "Fix the incomplete payment information first."
											: undefined
								}
							/>
							<OutcomeOption
								value="draft"
								current={outcome}
								onSelect={setOutcome}
								icon={FileClock}
								title={canApprove ? "Save as draft" : "Submit for approval"}
								description={
									canApprove
										? "Keep it as Pending and come back to it later. Nothing is paid."
										: "An approver is notified to review and approve it. Nothing is paid until then."
								}
							/>
						</fieldset>
						{footer(
							() => setStep(2),
							<Button onClick={confirm} disabled={busy}>
								{busy && <Loader2 className="animate-spin" />}
								{outcome === "pay"
									? `Pay ${formatMoney(run.data.total_amount, run.data.currency)}`
									: outcome === "schedule"
										? "Confirm payroll"
										: canApprove
											? "Save draft"
											: "Submit for approval"}
							</Button>,
						)}
					</SectionCard>
				)}

				{step === 4 && run.data && (
					<div className="space-y-6">
						<SectionCard>
							<div className="flex flex-col items-center gap-3 py-4 text-center">
								<span className="animate-pop flex size-14 items-center justify-center rounded-full bg-success/10 text-success">
									{finished === "pay" ? <Send className="size-6" /> : <CheckCircle2 className="size-7" />}
								</span>
								<h2 className="text-xl font-semibold">
									{finished === "pay"
										? "Payroll is processing"
										: finished === "schedule"
											? "Payroll scheduled"
											: canApprove
												? "Draft saved"
												: "Submitted for approval"}
								</h2>
								<p className="max-w-md text-sm text-muted-foreground">
									{finished === "pay" &&
										"Payments are being sent on Stellar. Each one shows Completed once the network confirms it."}
									{finished === "schedule" &&
										`${details.name} will be paid automatically on ${formatDateTime(run.data.scheduled_at)}.`}
									{finished === "draft" &&
										(canApprove
											? "It's waiting under Pending in payroll history. Nothing has been paid."
											: "Approvers have been notified. Nothing is paid until one of them approves it.")}
								</p>
								<div className="flex flex-wrap justify-center gap-2 pt-2">
									<Button asChild>
										<Link href={routes.payroll.detail(run.data.id)}>View payroll details</Link>
									</Button>
									<Button asChild variant="outline">
										<Link href={routes.payroll.list}>Back to payroll</Link>
									</Button>
								</div>
							</div>
						</SectionCard>
						{finished === "pay" && <RunProgress run={run.data} />}
					</div>
				)}
			</div>
		</div>
	);
}

function OutcomeOption({
	value,
	current,
	onSelect,
	disabled,
	icon: Icon,
	title,
	description,
	reason,
}: {
	value: Outcome;
	current: Outcome;
	onSelect: (value: Outcome) => void;
	disabled?: boolean;
	icon: typeof Send;
	title: string;
	description: string;
	reason?: string;
}) {
	const selected = current === value && !disabled;
	return (
		<label
			className={cn(
				"flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors",
				selected ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-primary/40",
				disabled && "cursor-not-allowed opacity-60 hover:border-border",
			)}
		>
			<input
				type="radio"
				name="outcome"
				value={value}
				checked={selected}
				disabled={disabled}
				onChange={() => onSelect(value)}
				className="sr-only"
			/>
			<span
				className={cn(
					"flex size-9 shrink-0 items-center justify-center rounded-lg",
					selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
				)}
			>
				<Icon className="size-4" />
			</span>
			<span className="min-w-0">
				<span className="block font-medium text-foreground">{title}</span>
				<span className="block text-sm text-muted-foreground">{description}</span>
				{disabled && reason && <span className="mt-1 block text-xs text-warning">{reason}</span>}
			</span>
		</label>
	);
}
