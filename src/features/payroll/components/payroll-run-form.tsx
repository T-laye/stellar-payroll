"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PayrollRunSchema, type PayrollRunFormData } from "@/lib/schemas";
import { useCompanyStore } from "@/lib/stores/company-store";
import {
	useCreatePayrollRun,
	useUpdatePayrollRun,
} from "@/hooks/payroll.hook";
import { type PayrollGroup, type PayrollRun } from "@/services/payroll.service";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface PayrollRunFormProps {
	groups: PayrollGroup[];
	run?: PayrollRun;
	onSuccess?: () => void;
}

const payrollCurrencies = [
	{ label: "USDC", value: "USDC" },
	{ label: "Stellar Lumens (XLM)", value: "XLM" },
] as const;

function getSupportedCurrency(
	currency?: string,
): PayrollRunFormData["currency"] {
	return currency === "USDC" || currency === "XLM" ? currency : "USDC";
}

function toLocalDateTimeValue(value?: string | null) {
	if (!value) {
		return "";
	}

	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return "";
	}

	const year = date.getFullYear();
	const month = `${date.getMonth() + 1}`.padStart(2, "0");
	const day = `${date.getDate()}`.padStart(2, "0");
	const hours = `${date.getHours()}`.padStart(2, "0");
	const minutes = `${date.getMinutes()}`.padStart(2, "0");
	return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function toIsoDateStart(value: string) {
	return new Date(`${value}T00:00:00`).toISOString();
}

function toIsoDateEnd(value: string) {
	return new Date(`${value}T23:59:59`).toISOString();
}

export function PayrollRunForm({ groups, run, onSuccess }: PayrollRunFormProps) {
	const company = useCompanyStore((state) => state.company);
	const { mutateAsync: createRun, isPending: isCreating } = useCreatePayrollRun();
	const { mutateAsync: updateRun, isPending: isUpdating } = useUpdatePayrollRun(
		run?.id ?? "",
	);

	const defaultValues = useMemo(
		() => ({
			group_id: run?.group_id ?? groups[0]?.id ?? "",
			currency: getSupportedCurrency(run?.currency ?? company?.default_currency),
			notes: run?.notes ?? "",
			period_start: run?.period_start ? run.period_start.split("T")[0] : "",
			period_end: run?.period_end ? run.period_end.split("T")[0] : "",
			scheduled_at: toLocalDateTimeValue(run?.scheduled_at),
		}),
		[company?.default_currency, groups, run],
	);

	const {
		register,
		handleSubmit,
		setValue,
		formState: { errors },
	} = useForm<PayrollRunFormData>({
		resolver: zodResolver(PayrollRunSchema),
		defaultValues,
	});

	const isSubmitting = isCreating || isUpdating;

	const onSubmit = async (data: PayrollRunFormData) => {
		const payload = {
			group_id: data.group_id,
			currency: data.currency,
			notes: data.notes?.trim() || "",
			period_start: toIsoDateStart(data.period_start),
			period_end: toIsoDateEnd(data.period_end),
			scheduled_at: new Date(data.scheduled_at).toISOString(),
		};

		try {
			if (run) {
				await updateRun({
					notes: payload.notes,
					scheduled_at: payload.scheduled_at,
				});
			} else {
				await createRun(payload);
			}

			onSuccess?.();
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to save payroll run.",
			);
		}
	};

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
			<div className="space-y-2">
				<label className="text-sm font-medium text-foreground">
					Payroll Group
				</label>
				<Select
					defaultValue={defaultValues.group_id}
					onValueChange={(value) =>
						setValue("group_id", value, { shouldDirty: true })
					}
					disabled={Boolean(run)}
				>
					<SelectTrigger>
						<SelectValue placeholder="Select a group" />
					</SelectTrigger>
					<SelectContent>
						{groups.map((group) => (
							<SelectItem key={group.id} value={group.id}>
								{group.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				{errors.group_id && (
					<p className="text-xs text-red-500">{errors.group_id.message}</p>
				)}
			</div>

			<div className="grid gap-4 sm:grid-cols-2">
				<div className="space-y-2">
					<label className="text-sm font-medium text-foreground">
						Period Start
					</label>
					<Input
						{...register("period_start")}
						type="date"
						disabled={Boolean(run)}
					/>
					{errors.period_start && (
						<p className="text-xs text-red-500">
							{errors.period_start.message}
						</p>
					)}
				</div>

				<div className="space-y-2">
					<label className="text-sm font-medium text-foreground">
						Period End
					</label>
					<Input
						{...register("period_end")}
						type="date"
						disabled={Boolean(run)}
					/>
					{errors.period_end && (
						<p className="text-xs text-red-500">
							{errors.period_end.message}
						</p>
					)}
				</div>
			</div>

			<div className="grid gap-4 sm:grid-cols-2">
				<div className="space-y-2">
					<label className="text-sm font-medium text-foreground">
						Currency
					</label>
					<Select
						defaultValue={defaultValues.currency}
						onValueChange={(value) =>
							setValue("currency", value as PayrollRunFormData["currency"], {
								shouldDirty: true,
								shouldValidate: true,
							})
						}
						disabled={Boolean(run)}
					>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{payrollCurrencies.map((currency) => (
								<SelectItem key={currency.value} value={currency.value}>
									{currency.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					{errors.currency && (
						<p className="text-xs text-red-500">{errors.currency.message}</p>
					)}
				</div>

				<div className="space-y-2">
					<label className="text-sm font-medium text-foreground">
						Scheduled For
					</label>
					<Input {...register("scheduled_at")} type="datetime-local" />
					{errors.scheduled_at && (
						<p className="text-xs text-red-500">
							{errors.scheduled_at.message}
						</p>
					)}
				</div>
			</div>

			<div className="space-y-2">
				<label className="text-sm font-medium text-foreground">Notes</label>
				<Textarea
					{...register("notes")}
					placeholder="Optional notes for approvers or reviewers"
				/>
			</div>

			<div className="flex justify-end gap-3 pt-4">
				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting
						? "Saving..."
						: run
							? "Update Run"
							: "Create Run"}
				</Button>
			</div>
		</form>
	);
}
