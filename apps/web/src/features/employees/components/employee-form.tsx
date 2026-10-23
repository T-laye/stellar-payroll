"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, ChevronDown, Loader2, Wallet } from "lucide-react";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/select";
import { Switch } from "@repo/ui/switch";
import { toast } from "@repo/ui/sonner";
import { cn } from "@repo/ui/lib/utils";
import { FormField } from "@/components/form-field";
import { SectionCard } from "@/components/section-card";
import { useCreateEmployee, useLinkWallet, useUpdateEmployee } from "@/features/employees/hooks";
import { EmployeeSchema, splitName, type EmployeeFormData } from "@/features/employees/schema";
import type { CompanyEmployee } from "@/features/employees/types";
import { useGroups } from "@/features/payroll/hooks";
import { errorMessage, newIdempotencyKey } from "@/lib/api/request";
import { toInputAmount } from "@/lib/decimal";
import { countries } from "@/lib/constants";
import { toDateInput } from "@/lib/format";
import { routes } from "@/lib/routes";
import { useMountTime } from "@/lib/use-now";

const NONE = "none";

/**
 * Add or edit an employee (PRD §9): who they are, where their pay goes, and how much and how
 * often. A missing wallet is allowed but flagged, because payroll can't pay them without one.
 */
export function EmployeeForm({ employee }: { employee?: CompanyEmployee }) {
	const router = useRouter();
	const editing = !!employee;
	const groups = useGroups();
	const create = useCreateEmployee();
	const update = useUpdateEmployee(employee?.id ?? "");
	const linkWallet = useLinkWallet(employee?.id ?? "");
	const [custodial, setCustodial] = useState(false);
	const [invite, setInvite] = useState(true);
	const [moreOpen, setMoreOpen] = useState(!editing);
	// Made when the form opens (again after a failure), so a double submit can't add the person twice.
	const [createKey, setCreateKey] = useState(newIdempotencyKey);
	const now = useMountTime();

	const form = useForm<EmployeeFormData>({
		resolver: zodResolver(EmployeeSchema),
		defaultValues: {
			full_name: employee ? `${employee.first_name} ${employee.last_name}` : "",
			email: employee?.email ?? "",
			job_title: employee?.job_title ?? "",
			department: employee?.department ?? "",
			employment_type: employee?.employment_type ?? "FULL_TIME",
			country: employee?.country ?? "",
			phone: employee?.phone ?? "",
			start_date: employee?.start_date?.slice(0, 10) ?? toDateInput(now),
			wallet_address: employee?.wallet?.stellar_address ?? "",
			salary_amount: employee ? toInputAmount(employee.salary_amount) : "",
			salary_currency: employee?.salary_currency ?? "USDC",
			pay_frequency: employee?.pay_frequency ?? "MONTHLY",
			group_id: employee?.group_id ?? "",
		},
	});
	const { register, control, handleSubmit, setValue, formState } = form;
	const { errors } = formState;
	const wallet = useWatch({ control, name: "wallet_address" });
	const busy = create.isPending || update.isPending || linkWallet.isPending;

	const onSubmit = async (values: EmployeeFormData) => {
		const { first_name, last_name } = splitName(values.full_name);
		const shared = {
			first_name,
			last_name,
			job_title: values.job_title,
			department: values.department,
			employment_type: values.employment_type,
			phone: values.phone ?? "",
			salary_amount: values.salary_amount,
			salary_currency: values.salary_currency,
			pay_frequency: values.pay_frequency,
			group_id: values.group_id || undefined,
		};
		const address = values.wallet_address.trim() || undefined;
		try {
			if (editing) {
				await update.mutateAsync({ payload: { ...shared, group_id: values.group_id || null }, walletAddress: address });
				if (!address && custodial && !employee.wallet) await linkWallet.mutateAsync(undefined);
				toast.success("Employee updated");
				router.push(routes.employees.detail(employee.id));
			} else {
				const created = await create.mutateAsync({
					payload: {
						...shared,
						email: values.email,
						country: values.country,
						// The API takes RFC 3339; the date input gives YYYY-MM-DD.
						start_date: `${values.start_date}T00:00:00Z`,
					},
					walletAddress: address,
					custodial: !address && custodial,
					invite,
					key: createKey,
				});
				toast.success(`${first_name} ${last_name} added`, {
					description: invite ? "They'll get an email to set their password and see their payments." : undefined,
				});
				router.push(routes.employees.detail(created.id));
			}
		} catch (error) {
			if (!editing) setCreateKey(newIdempotencyKey());
			toast.error(errorMessage(error, "Couldn't save this employee"));
		}
	};

	return (
		<form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-6">
			<SectionCard title="Employee details">
				<div className="grid gap-5 sm:grid-cols-2">
					<FormField label="Full name" htmlFor="full_name" required error={errors.full_name?.message}>
						<Input
							id="full_name"
							placeholder="John Doe"
							autoComplete="off"
							{...register("full_name")}
							aria-invalid={!!errors.full_name}
						/>
					</FormField>
					<FormField
						label="Email address"
						htmlFor="email"
						required
						error={errors.email?.message}
						hint={editing ? "The email can't be changed." : "Their invite goes here."}
					>
						<Input
							id="email"
							type="email"
							placeholder="john@company.com"
							disabled={editing}
							{...register("email")}
							aria-invalid={!!errors.email}
						/>
					</FormField>
					<FormField label="Role" htmlFor="job_title" required error={errors.job_title?.message}>
						<Input id="job_title" placeholder="Senior Engineer" {...register("job_title")} aria-invalid={!!errors.job_title} />
					</FormField>
					<FormField label="Department" htmlFor="department" required error={errors.department?.message}>
						<Input id="department" placeholder="Engineering" {...register("department")} aria-invalid={!!errors.department} />
					</FormField>
				</div>
			</SectionCard>

			<SectionCard title="Payment details" description="Where and how this person is paid on Stellar.">
				<div className="space-y-5">
					<FormField
						label="Wallet / payment address"
						htmlFor="wallet_address"
						error={errors.wallet_address?.message}
						hint={
							employee?.wallet
								? `Current: ${employee.wallet.stellar_address.slice(0, 8)}…`
								: "A Stellar public key, starting with G."
						}
					>
						<div className="relative">
							<Wallet className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								id="wallet_address"
								placeholder="GDUKMGUGDZQK6YH…"
								className="pl-9 font-mono text-xs"
								autoComplete="off"
								spellCheck={false}
								disabled={custodial}
								{...register("wallet_address", { setValueAs: (v: string) => v.trim().toUpperCase() })}
								aria-invalid={!!errors.wallet_address}
							/>
						</div>
					</FormField>
					{(!editing || !employee.wallet) && (
						<label className="flex items-center justify-between gap-4 rounded-lg border border-border p-3 text-sm">
							<span>
								<span className="block font-medium">Create a PayOrbit wallet instead</span>
								<span className="block text-muted-foreground">
									A custodial wallet held for them; they can move funds out with their PIN.
								</span>
							</span>
							<Switch
								checked={custodial}
								onCheckedChange={(on) => {
									setCustodial(on);
									if (on) setValue("wallet_address", "");
								}}
							/>
						</label>
					)}
					<div className="grid gap-5 sm:grid-cols-3">
						<FormField label="Salary / payment amount" htmlFor="salary_amount" required error={errors.salary_amount?.message}>
							<Input
								id="salary_amount"
								type="number"
								min="0"
								step="0.01"
								inputMode="decimal"
								placeholder="0.00"
								{...register("salary_amount")}
								aria-invalid={!!errors.salary_amount}
							/>
						</FormField>
						<FormField label="Payment asset" required>
							<Controller
								control={control}
								name="salary_currency"
								render={({ field }) => (
									<Select value={field.value} onValueChange={field.onChange}>
										<SelectTrigger className="w-full" aria-label="Payment asset">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="USDC">USDC</SelectItem>
											<SelectItem value="XLM">XLM</SelectItem>
										</SelectContent>
									</Select>
								)}
							/>
						</FormField>
						<FormField label="Payment frequency" required>
							<Controller
								control={control}
								name="pay_frequency"
								render={({ field }) => (
									<Select value={field.value} onValueChange={field.onChange}>
										<SelectTrigger className="w-full" aria-label="Payment frequency">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="WEEKLY">Weekly</SelectItem>
											<SelectItem value="BIWEEKLY">Bi-weekly</SelectItem>
											<SelectItem value="MONTHLY">Monthly</SelectItem>
										</SelectContent>
									</Select>
								)}
							/>
						</FormField>
					</div>
					{!wallet && !custodial && (!editing || !employee.wallet) && (
						<div role="status" className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/8 p-3 text-sm">
							<AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
							<p className="text-foreground">
								Incomplete payment details will prevent payroll execution. You can save now and add the wallet later; they&apos;ll
								show as <strong>Pending</strong>.
							</p>
						</div>
					)}
				</div>
			</SectionCard>

			<SectionCard>
				<button
					type="button"
					onClick={() => setMoreOpen((v) => !v)}
					className="flex w-full items-center justify-between text-left"
					aria-expanded={moreOpen}
				>
					<span>
						<span className="block font-semibold">Employment details</span>
						<span className="block text-sm text-muted-foreground">Country, start date, contract type and pay group.</span>
					</span>
					<ChevronDown className={cn("size-4 text-muted-foreground transition-transform", moreOpen && "rotate-180")} />
				</button>
				{moreOpen && (
					<div className="animate-rise mt-5 grid gap-5 sm:grid-cols-2">
						<FormField
							label="Country"
							required
							error={errors.country?.message}
							hint={editing ? "Set when the employee was added." : undefined}
						>
							<Controller
								control={control}
								name="country"
								render={({ field }) => (
									<Select value={field.value || undefined} onValueChange={field.onChange} disabled={editing}>
										<SelectTrigger className="w-full" aria-label="Country" aria-invalid={!!errors.country}>
											<SelectValue placeholder="Choose a country" />
										</SelectTrigger>
										<SelectContent className="max-h-72">
											{countries.map((c) => (
												<SelectItem key={c} value={c}>
													{c}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								)}
							/>
						</FormField>
						<FormField label="Start date" htmlFor="start_date" required error={errors.start_date?.message}>
							<Input id="start_date" type="date" disabled={editing} {...register("start_date")} />
						</FormField>
						<FormField label="Employment type" required>
							<Controller
								control={control}
								name="employment_type"
								render={({ field }) => (
									<Select value={field.value} onValueChange={field.onChange}>
										<SelectTrigger className="w-full" aria-label="Employment type">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="FULL_TIME">Full-time</SelectItem>
											<SelectItem value="PART_TIME">Part-time</SelectItem>
											<SelectItem value="CONTRACTOR">Contractor</SelectItem>
										</SelectContent>
									</Select>
								)}
							/>
						</FormField>
						<FormField label="Pay group" hint="Optional. Groups make it quicker to pick people for a payroll.">
							<Controller
								control={control}
								name="group_id"
								render={({ field }) => (
									<Select value={field.value || NONE} onValueChange={(v) => field.onChange(v === NONE ? "" : v)}>
										<SelectTrigger className="w-full" aria-label="Pay group">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value={NONE}>No group</SelectItem>
											{(groups.data ?? []).map((g) => (
												<SelectItem key={g.id} value={g.id}>
													{g.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								)}
							/>
						</FormField>
						<FormField label="Phone" htmlFor="phone">
							<Input id="phone" type="tel" placeholder="+1 555 0100" {...register("phone")} />
						</FormField>
					</div>
				)}
			</SectionCard>

			{!editing && (
				<label className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 text-sm shadow-xs">
					<span>
						<span className="block font-medium">Invite to the employee portal</span>
						<span className="block text-muted-foreground">
							Emails them a link to set a password and see their payments. You can send it later from their profile.
						</span>
					</span>
					<Switch checked={invite} onCheckedChange={setInvite} aria-label="Invite to the employee portal" />
				</label>
			)}

			<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
				<Button asChild variant="outline">
					<Link href={editing ? routes.employees.detail(employee.id) : routes.employees.list}>Cancel</Link>
				</Button>
				<Button type="submit" disabled={busy}>
					{busy && <Loader2 className="animate-spin" />}
					{editing ? "Save Changes" : "Save Employee"}
				</Button>
			</div>
		</form>
	);
}
