"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2, Search } from "lucide-react";
import { Button } from "@repo/ui/button";
import { Checkbox } from "@repo/ui/checkbox";
import { Input } from "@repo/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/select";
import { toast } from "@repo/ui/sonner";
import { FormField } from "@/components/form-field";
import { Money } from "@/components/money";
import { PersonCell } from "@/components/person";
import { SectionCard } from "@/components/section-card";
import { TableSkeleton } from "@/components/states";
import { Stepper } from "@/components/stepper";
import { useEmployees } from "@/features/employees/hooks";
import { ScheduleNotice } from "@/features/payroll/components/schedule-notice";
import { useCreateSchedule } from "@/features/payroll/hooks";
import type { Asset, PayCycle } from "@/features/payroll/types";
import { DRAFT_LEAD_DAYS, payDates } from "@/features/payroll/utils";
import { errorMessage } from "@/lib/api/request";
import { formatDate, formatFrequency, formatMoney, toDateInput } from "@/lib/format";
import { routes } from "@/lib/routes";
import { useMountTime } from "@/lib/use-now";

const STEPS = [
	{ label: "Schedule details", description: "Name, frequency, first pay date" },
	{ label: "Employee selection", description: "Who this schedule pays" },
	{ label: "Review & confirm", description: "Upcoming cycles" },
];

const toIso = (date: string) => new Date(`${date}T09:00:00`).toISOString();

/** PRD §6: create a recurring payroll schedule in three short steps. */
export function ScheduleForm() {
	const router = useRouter();
	const employees = useEmployees();
	const create = useCreateSchedule();
	const [step, setStep] = useState(0);
	const now = useMountTime();
	const [name, setName] = useState("Monthly team payroll");
	const [frequency, setFrequency] = useState<PayCycle>("MONTHLY");
	const [asset, setAsset] = useState<Asset>("USDC");
	const [firstDate, setFirstDate] = useState(() => {
		const now = new Date();
		return toDateInput(
			new Date(now.getFullYear(), now.getMonth() + 1, 0) > new Date(now.getTime() + 86_400_000)
				? new Date(now.getFullYear(), now.getMonth() + 1, 0)
				: now.getTime() + 7 * 86_400_000,
		);
	});
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [picked, setPicked] = useState<Set<string> | null>(null);
	const [search, setSearch] = useState("");

	const active = (employees.data ?? []).filter((e) => e.status === "ACTIVE");
	const selected =
		picked ??
		new Set(active.filter((e) => e.salary_currency === asset && (e.pay_frequency ?? "MONTHLY") === frequency).map((e) => e.id));
	const chosen = active.filter((e) => selected.has(e.id));
	const amount = chosen.reduce((sum, e) => sum + Number(e.salary_amount), 0);
	const term = search.trim().toLowerCase();
	const visible = active.filter((e) => !term || `${e.first_name} ${e.last_name} ${e.job_title}`.toLowerCase().includes(term));
	const upcoming = firstDate ? payDates(Date.parse(toIso(firstDate)), frequency, 3) : [];

	const validate = () => {
		const next: Record<string, string> = {};
		if (name.trim().length < 3) next.name = "Give the schedule a name";
		if (!firstDate) next.date = "Choose the next payment date";
		else if (Date.parse(toIso(firstDate)) <= Date.now()) next.date = "The date must be in the future";
		setErrors(next);
		return Object.keys(next).length === 0;
	};

	const toggle = (id: string, on: boolean) => {
		const next = new Set(selected);
		if (on) next.add(id);
		else next.delete(id);
		setPicked(next);
	};

	const submit = () =>
		create.mutate(
			{ name: name.trim(), frequency, asset, employee_ids: [...selected], next_run_at: toIso(firstDate) },
			{
				onSuccess: (response) => {
					toast.success("Schedule created", {
						description: `The first draft payroll is prepared ${DRAFT_LEAD_DAYS} days before ${formatDate(upcoming[0])}.`,
					});
					router.push(routes.recurring.detail(response.data.id));
				},
				onError: (error) => toast.error(errorMessage(error, "Couldn't create the schedule")),
			},
		);

	return (
		<div className="grid gap-6 lg:grid-cols-[240px_1fr]">
			<SectionCard className="h-fit">
				<Stepper steps={STEPS} current={step} />
			</SectionCard>
			<div className="min-w-0 space-y-6">
				{step === 0 && (
					<SectionCard title="Schedule details">
						<form
							noValidate
							className="space-y-5"
							onSubmit={(e) => {
								e.preventDefault();
								if (validate()) setStep(1);
							}}
						>
							<FormField label="Schedule name" htmlFor="schedule-name" required error={errors.name}>
								<Input
									id="schedule-name"
									value={name}
									onChange={(e) => setName(e.target.value)}
									placeholder="Monthly team payroll"
								/>
							</FormField>
							<div className="grid gap-5 sm:grid-cols-3">
								<FormField label="Frequency" required>
									<Select
										value={frequency}
										onValueChange={(v) => {
											setFrequency(v as PayCycle);
											setPicked(null);
										}}
									>
										<SelectTrigger className="w-full" aria-label="Frequency">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="WEEKLY">Weekly</SelectItem>
											<SelectItem value="BIWEEKLY">Bi-weekly</SelectItem>
											<SelectItem value="MONTHLY">Monthly</SelectItem>
										</SelectContent>
									</Select>
								</FormField>
								<FormField label="Payment asset" required>
									<Select
										value={asset}
										onValueChange={(v) => {
											setAsset(v as Asset);
											setPicked(null);
										}}
									>
										<SelectTrigger className="w-full" aria-label="Payment asset">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="USDC">USDC</SelectItem>
											<SelectItem value="XLM">XLM</SelectItem>
										</SelectContent>
									</Select>
								</FormField>
								<FormField label="Next payment date" htmlFor="first-date" required error={errors.date}>
									<Input
										id="first-date"
										type="date"
										min={toDateInput(now + 86_400_000)}
										value={firstDate}
										onChange={(e) => setFirstDate(e.target.value)}
									/>
								</FormField>
							</div>
							<ScheduleNotice />
							<div className="flex justify-between border-t border-border pt-5">
								<Button asChild variant="ghost">
									<Link href={routes.recurring.list}>Cancel</Link>
								</Button>
								<Button type="submit">
									Next <ArrowRight />
								</Button>
							</div>
						</form>
					</SectionCard>
				)}

				{step === 1 && (
					<SectionCard title="Employee selection" description="Each cycle pays these people their current salary.">
						<div className="relative mb-3">
							<Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								placeholder="Search employees"
								className="pl-9"
								aria-label="Search employees"
							/>
						</div>
						{employees.isLoading ? (
							<TableSkeleton rows={5} columns={3} />
						) : (
							<ul className="max-h-[420px] divide-y divide-border overflow-y-auto rounded-xl border border-border">
								{visible.map((e) => (
									<li key={e.id}>
										<label className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-accent/40">
											<Checkbox
												checked={selected.has(e.id)}
												onCheckedChange={(v) => toggle(e.id, v === true)}
												aria-label={`Select ${e.first_name} ${e.last_name}`}
											/>
											<PersonCell
												name={`${e.first_name} ${e.last_name}`}
												subtitle={`${e.job_title} · ${formatFrequency(e.pay_frequency)}`}
												size="sm"
												className="flex-1"
											/>
											<Money value={e.salary_amount} asset={e.salary_currency} className="text-sm font-medium" />
										</label>
									</li>
								))}
							</ul>
						)}
						<p className="mt-3 text-sm text-muted-foreground">
							{chosen.length} selected · <span className="font-medium text-foreground">{formatMoney(amount, asset)}</span> per
							cycle
						</p>
						<div className="mt-5 flex justify-between border-t border-border pt-5">
							<Button variant="outline" onClick={() => setStep(0)}>
								<ArrowLeft /> Back
							</Button>
							<Button onClick={() => (chosen.length ? setStep(2) : toast.error("Select at least one employee"))}>
								Next <ArrowRight />
							</Button>
						</div>
					</SectionCard>
				)}

				{step === 2 && (
					<SectionCard title="Review & confirm">
						<div className="grid gap-4 rounded-xl bg-muted/60 p-4 text-sm sm:grid-cols-4">
							<Summary label="Schedule" value={name} />
							<Summary label="Frequency" value={formatFrequency(frequency)} />
							<Summary label="Employees" value={String(chosen.length)} />
							<Summary label="Per cycle" value={formatMoney(amount, asset, { withCode: true })} />
						</div>
						<h3 className="mt-6 mb-2 text-sm font-semibold">Upcoming payroll cycles</h3>
						<ul className="divide-y divide-border rounded-xl border border-border">
							{upcoming.map((d, i) => (
								<li key={d} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
									<span>
										<span className="font-medium">{formatDate(d)}</span>
										<span className="block text-xs text-muted-foreground">
											Draft prepared {formatDate(d - DRAFT_LEAD_DAYS * 86_400_000)}
										</span>
									</span>
									<span className="text-muted-foreground">{i === 0 ? "Next" : `Cycle ${i + 1}`}</span>
								</li>
							))}
						</ul>
						<ScheduleNotice className="mt-5" />
						<div className="mt-5 flex justify-between border-t border-border pt-5">
							<Button variant="outline" onClick={() => setStep(1)} disabled={create.isPending}>
								<ArrowLeft /> Back
							</Button>
							<Button onClick={submit} disabled={create.isPending}>
								{create.isPending && <Loader2 className="animate-spin" />} Create schedule
							</Button>
						</div>
					</SectionCard>
				)}
			</div>
		</div>
	);
}

function Summary({ label, value }: { label: string; value: string }) {
	return (
		<div className="min-w-0">
			<p className="text-muted-foreground">{label}</p>
			<p className="truncate font-semibold">{value}</p>
		</div>
	);
}
