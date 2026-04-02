"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PayrollGroupSchema, type PayrollGroupFormData } from "@/lib/schemas";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useCompanyStore } from "@/lib/stores/company-store";
import {
	useCreatePayrollGroup,
	useUpdatePayrollGroup,
} from "@/hooks/payroll.hook";
import { type PayrollGroup } from "@/services/payroll.service";
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
import { currencies } from "@/lib/utils/constants";

interface PayrollFormProps {
	group?: PayrollGroup;
	onSuccess?: () => void;
}

const payCycles = ["WEEKLY", "BIWEEKLY", "MONTHLY"] as const;

export function PayrollForm({ group, onSuccess }: PayrollFormProps) {
	const companyId = useAuthStore((state) => state.user?.company_id);
	const company = useCompanyStore((state) => state.company);
	const { mutateAsync: createGroup, isPending: isCreating } =
		useCreatePayrollGroup(companyId ?? undefined);
	const { mutateAsync: updateGroup, isPending: isUpdating } = useUpdatePayrollGroup(
		group?.id ?? "",
		companyId ?? undefined,
	);

	const defaultValues = useMemo(
		() => ({
			name: group?.name ?? "",
			description: group?.description ?? "",
			currency: group?.currency ?? company?.default_currency ?? "USDC",
			pay_cycle:
				(group?.pay_cycle as PayrollGroupFormData["pay_cycle"]) ?? "MONTHLY",
			timezone: group?.timezone ?? company?.timezone ?? "",
		}),
		[group, company?.default_currency, company?.timezone],
	);

	const {
		register,
		handleSubmit,
		setValue,
		formState: { errors },
	} = useForm<PayrollGroupFormData>({
		resolver: zodResolver(PayrollGroupSchema),
		defaultValues,
	});

	const isSubmitting = isCreating || isUpdating;

	const onSubmit = async (data: PayrollGroupFormData) => {
		const payload = {
			name: data.name.trim(),
			description: data.description.trim(),
			currency: data.currency.trim().toUpperCase(),
			pay_cycle: data.pay_cycle,
			timezone: data.timezone.trim(),
		};

		if (group) {
			await updateGroup({
				...payload,
				is_active: group.is_active,
			});
		} else {
			await createGroup(payload);
		}

		onSuccess?.();
	};

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
			<div className="space-y-2">
				<label className="text-sm font-medium text-foreground">
					Group Name
				</label>
				<Input {...register("name")} placeholder="Engineering Team" />
				{errors.name && (
					<p className="text-xs text-red-500">{errors.name.message}</p>
				)}
			</div>

			<div className="space-y-2">
				<label className="text-sm font-medium text-foreground">
					Description
				</label>
				<Textarea
					{...register("description")}
					placeholder="Monthly payroll for the engineering team"
				/>
				{errors.description && (
					<p className="text-xs text-red-500">{errors.description.message}</p>
				)}
			</div>

			<div className="grid gap-4 sm:grid-cols-2">
				<div className="space-y-2">
					<label className="text-sm font-medium text-foreground">
						Pay Cycle
					</label>
					<Select
						defaultValue={defaultValues.pay_cycle}
						onValueChange={(value) =>
							setValue("pay_cycle", value as PayrollGroupFormData["pay_cycle"], {
								shouldDirty: true,
							})
						}
					>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{payCycles.map((cycle) => (
								<SelectItem key={cycle} value={cycle}>
									{cycle.replace(/_/g, " ")}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					{errors.pay_cycle && (
						<p className="text-xs text-red-500">{errors.pay_cycle.message}</p>
					)}
				</div>

				<div className="space-y-2">
					<label className="text-sm font-medium text-foreground">
						Currency
					</label>
					<Select
						defaultValue={defaultValues.currency}
						onValueChange={(value) =>
							setValue("currency", value, { shouldDirty: true })
						}
					>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{currencies.map((currency) => (
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
			</div>

			<div className="space-y-2">
				<label className="text-sm font-medium text-foreground">Timezone</label>
				<Input {...register("timezone")} placeholder="Africa/Lagos" />
				{errors.timezone && (
					<p className="text-xs text-red-500">{errors.timezone.message}</p>
				)}
			</div>

			<div className="flex justify-end gap-3 pt-4">
				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting
						? "Saving..."
						: group
							? "Update Group"
							: "Create Group"}
				</Button>
			</div>
		</form>
	);
}
