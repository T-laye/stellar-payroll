"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { EmployeeSchema, type EmployeeFormData } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { countries, currencies } from "@/lib/utils/constants";
import { useCreateEmployee, useUpdateEmployee } from "@/hooks/employee.hook";
import { useAuthStore } from "@/lib/stores/auth-store";
import { type CompanyEmployee } from "@/services/employee.service";

interface EmployeeFormProps {
	employee?: CompanyEmployee;
	onSuccess?: () => void;
}

const employmentTypes = [
	"FULL_TIME",
	"PART_TIME",
	"CONTRACT",
	"INTERN",
	"TEMPORARY",
] as const;

const employeeStatuses = ["ACTIVE", "INACTIVE", "TERMINATED"] as const;

export function EmployeeForm({ employee, onSuccess }: EmployeeFormProps) {
	const companyId = useAuthStore((state) => state.user?.company_id);
	const { mutateAsync: createEmployee, isPending: isCreating } =
		useCreateEmployee(companyId ?? undefined);
	const { mutateAsync: updateEmployee, isPending: isUpdating } = useUpdateEmployee(
		employee?.id ?? "",
		companyId ?? undefined,
	);

	const defaultValues = useMemo(
		() => ({
			first_name: employee?.first_name ?? "",
			last_name: employee?.last_name ?? "",
			email: employee?.email ?? "",
			country: employee?.country ?? "",
			department: employee?.department ?? "",
			employment_type:
				(employee?.employment_type as EmployeeFormData["employment_type"]) ??
				"FULL_TIME",
			external_id: employee?.external_id ?? "",
			group_id: employee?.group_id ?? "",
			job_title: employee?.job_title ?? "",
			phone: employee?.phone ?? "",
			salary_amount: employee?.salary_amount ?? "",
			salary_currency: employee?.salary_currency ?? "USDC",
			start_date: employee?.start_date
				? employee.start_date.split("T")[0]
				: "",
			status:
				(employee?.status as EmployeeFormData["status"]) ??
				("ACTIVE" as const),
			end_date: employee?.end_date ? employee.end_date.split("T")[0] : "",
		}),
		[employee],
	);

	const {
		register,
		handleSubmit,
		setValue,
		watch,
		formState: { errors },
	} = useForm<EmployeeFormData>({
		resolver: zodResolver(EmployeeSchema),
		defaultValues,
	});

	const currentStatus = watch("status");
	const isSubmitting = isCreating || isUpdating;

	const onSubmit = async (data: EmployeeFormData) => {
		const payload = {
			first_name: data.first_name.trim(),
			last_name: data.last_name.trim(),
			email: data.email.trim(),
			country: data.country.trim(),
			department: data.department.trim(),
			employment_type: data.employment_type,
			external_id: data.external_id?.trim() || undefined,
			group_id: data.group_id?.trim() || undefined,
			job_title: data.job_title.trim(),
			phone: data.phone.trim(),
			salary_amount: data.salary_amount.trim(),
			salary_currency: data.salary_currency.trim().toUpperCase(),
			start_date: data.start_date,
		};

		if (employee) {
			await updateEmployee({
				first_name: payload.first_name,
				last_name: payload.last_name,
				department: payload.department,
				employment_type: payload.employment_type,
				external_id: payload.external_id,
				group_id: payload.group_id,
				job_title: payload.job_title,
				phone: payload.phone,
				salary_amount: payload.salary_amount,
				salary_currency: payload.salary_currency,
				status: data.status,
				end_date:
					data.status === "TERMINATED"
						? data.end_date || new Date().toISOString().split("T")[0]
						: data.end_date || undefined,
			});
		} else {
			await createEmployee(payload);
		}

		onSuccess?.();
	};

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
			<div className="grid gap-4 sm:grid-cols-2">
				<div className="space-y-2">
					<label className="text-sm font-medium text-foreground">
						First Name
					</label>
					<Input {...register("first_name")} placeholder="John" />
					{errors.first_name && (
						<p className="text-xs text-red-500">{errors.first_name.message}</p>
					)}
				</div>

				<div className="space-y-2">
					<label className="text-sm font-medium text-foreground">
						Last Name
					</label>
					<Input {...register("last_name")} placeholder="Doe" />
					{errors.last_name && (
						<p className="text-xs text-red-500">{errors.last_name.message}</p>
					)}
				</div>
			</div>

			<div className="grid gap-4 sm:grid-cols-2">
				<div className="space-y-2">
					<label className="text-sm font-medium text-foreground">Email</label>
					<Input
						{...register("email")}
						type="email"
						placeholder="john@example.com"
						disabled={Boolean(employee)}
					/>
					{errors.email && (
						<p className="text-xs text-red-500">{errors.email.message}</p>
					)}
				</div>

				<div className="space-y-2">
					<label className="text-sm font-medium text-foreground">Phone</label>
					<Input {...register("phone")} placeholder="+234..." />
					{errors.phone && (
						<p className="text-xs text-red-500">{errors.phone.message}</p>
					)}
				</div>
			</div>

			<div className="grid gap-4 sm:grid-cols-2">
				<div className="space-y-2">
					<label className="text-sm font-medium text-foreground">Country</label>
					<Select
						defaultValue={defaultValues.country}
						onValueChange={(value) => setValue("country", value, { shouldDirty: true })}
					>
						<SelectTrigger>
							<SelectValue placeholder="Select country" />
						</SelectTrigger>
						<SelectContent>
							{countries.map((country) => (
								<SelectItem key={country} value={country}>
									{country}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					{errors.country && (
						<p className="text-xs text-red-500">{errors.country.message}</p>
					)}
				</div>

				<div className="space-y-2">
					<label className="text-sm font-medium text-foreground">
						Department
					</label>
					<Input {...register("department")} placeholder="Operations" />
					{errors.department && (
						<p className="text-xs text-red-500">{errors.department.message}</p>
					)}
				</div>
			</div>

			<div className="grid gap-4 sm:grid-cols-2">
				<div className="space-y-2">
					<label className="text-sm font-medium text-foreground">
						Job Title
					</label>
					<Input {...register("job_title")} placeholder="Payroll Analyst" />
					{errors.job_title && (
						<p className="text-xs text-red-500">{errors.job_title.message}</p>
					)}
				</div>

				<div className="space-y-2">
					<label className="text-sm font-medium text-foreground">
						Employment Type
					</label>
					<Select
						defaultValue={defaultValues.employment_type}
						onValueChange={(value) =>
							setValue(
								"employment_type",
								value as EmployeeFormData["employment_type"],
								{ shouldDirty: true },
							)
						}
					>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{employmentTypes.map((type) => (
								<SelectItem key={type} value={type}>
									{type.replace(/_/g, " ")}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					{errors.employment_type && (
						<p className="text-xs text-red-500">
							{errors.employment_type.message}
						</p>
					)}
				</div>
			</div>

			<div className="grid gap-4 sm:grid-cols-2">
				<div className="space-y-2">
					<label className="text-sm font-medium text-foreground">
						Salary Amount
					</label>
					<Input
						{...register("salary_amount")}
						type="number"
						step="0.01"
						placeholder="5000"
					/>
					{errors.salary_amount && (
						<p className="text-xs text-red-500">
							{errors.salary_amount.message}
						</p>
					)}
				</div>

				<div className="space-y-2">
					<label className="text-sm font-medium text-foreground">
						Salary Currency
					</label>
					<Select
						defaultValue={defaultValues.salary_currency}
						onValueChange={(value) =>
							setValue("salary_currency", value, { shouldDirty: true })
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
					{errors.salary_currency && (
						<p className="text-xs text-red-500">
							{errors.salary_currency.message}
						</p>
					)}
				</div>
			</div>

			<div className="grid gap-4 sm:grid-cols-2">
				<div className="space-y-2">
					<label className="text-sm font-medium text-foreground">
						Start Date
					</label>
					<Input {...register("start_date")} type="date" />
					{errors.start_date && (
						<p className="text-xs text-red-500">{errors.start_date.message}</p>
					)}
				</div>

				{employee && (
					<div className="space-y-2">
						<label className="text-sm font-medium text-foreground">Status</label>
						<Select
							defaultValue={defaultValues.status}
							onValueChange={(value) =>
								setValue("status", value as EmployeeFormData["status"], {
									shouldDirty: true,
								})
							}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{employeeStatuses.map((status) => (
									<SelectItem key={status} value={status}>
										{status.replace(/_/g, " ")}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				)}
			</div>

			<div className="grid gap-4 sm:grid-cols-2">
				<div className="space-y-2">
					<label className="text-sm font-medium text-foreground">
						External ID
					</label>
					<Input {...register("external_id")} placeholder="EMP-001" />
				</div>

				<div className="space-y-2">
					<label className="text-sm font-medium text-foreground">
						Group ID
					</label>
					<Input {...register("group_id")} placeholder="Optional payroll group" />
				</div>
			</div>

			{employee && currentStatus === "TERMINATED" && (
				<div className="space-y-2">
					<label className="text-sm font-medium text-foreground">End Date</label>
					<Input {...register("end_date")} type="date" />
				</div>
			)}

			<div className="flex justify-end gap-3 pt-4">
				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting
						? "Saving..."
						: employee
							? "Update Employee"
							: "Create Employee"}
				</Button>
			</div>
		</form>
	);
}
