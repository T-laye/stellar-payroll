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
import { Separator } from "@/components/ui/separator";
import { countries, currencies } from "@/lib/utils/constants";
import { useCreateEmployee, useUpdateEmployee } from "@/hooks/employee.hook";
import { useCompanyRoles } from "@/hooks/role.hook";
import { useAuthStore } from "@/lib/stores/auth-store";
import { type CompanyEmployee } from "@/services/employee.service";
import {
	User,
	Mail,
	Phone,
	MapPin,
	Building,
	Briefcase,
	DollarSign,
	Calendar,
	Tag,
	Users,
	Loader2,
	AlertCircle,
} from "lucide-react";

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

function Field({
	label,
	icon: Icon,
	error,
	children,
}: {
	label: string;
	icon: React.ElementType;
	error?: string;
	children: React.ReactNode;
}) {
	return (
		<div className="space-y-1.5">
			<label className="text-sm font-medium text-foreground flex items-center gap-1.5">
				<Icon className="h-3.5 w-3.5 text-muted-foreground" />
				{label}
			</label>
			{children}
			{error && (
				<p className="text-xs text-destructive flex items-center gap-1">
					<AlertCircle className="h-3 w-3 shrink-0" />
					{error}
				</p>
			)}
		</div>
	);
}

function SectionHeading({
	icon: Icon,
	title,
}: {
	icon: React.ElementType;
	title: string;
}) {
	return (
		<div className="space-y-2">
			<h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
				<Icon className="h-3.5 w-3.5" />
				{title}
			</h3>
			<Separator />
		</div>
	);
}

export function EmployeeForm({ employee, onSuccess }: EmployeeFormProps) {
	const companyId = useAuthStore((state) => state.user?.company_id);
	const {
		data: roleResponse,
		isLoading: rolesIsLoading,
		isError: rolesIsError,
	} = useCompanyRoles(companyId);
	const roles = roleResponse?.data ?? [];
	const { mutateAsync: createEmployee, isPending: isCreating } =
		useCreateEmployee(companyId ?? undefined);
	const { mutateAsync: updateEmployee, isPending: isUpdating } =
		useUpdateEmployee(employee?.id ?? "", companyId ?? undefined);

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
			role_slug: employee?.role_slug ?? "",
			job_title: employee?.job_title ?? "",
			phone: employee?.phone ?? "",
			salary_amount: employee?.salary_amount ?? "",
			salary_currency: employee?.salary_currency ?? "USDC",
			start_date: employee?.start_date ? employee.start_date.split("T")[0] : "",
			status:
				(employee?.status as EmployeeFormData["status"]) ?? ("ACTIVE" as const),
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
			job_title: data.job_title.trim(),
			phone: data.phone.trim(),
			salary_amount: data.salary_amount.trim(),
			salary_currency: data.salary_currency.trim().toUpperCase(),
			start_date: data.start_date,
			role_slug: data.role_slug,
			...(data.external_id?.trim()
				? { external_id: data.external_id.trim() }
				: {}),
			...(data.group_id?.trim() ? { group_id: data.group_id.trim() } : {}),
		};

		if (employee) {
			await updateEmployee({
				...payload,
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
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
			{/* Personal Information */}
			<div className="space-y-4">
				<SectionHeading icon={User} title="Personal Information" />
				<div className="grid gap-4 sm:grid-cols-2">
					<Field
						label="First Name"
						icon={User}
						error={errors.first_name?.message}
					>
						<Input {...register("first_name")} placeholder="John" />
					</Field>
					<Field
						label="Last Name"
						icon={User}
						error={errors.last_name?.message}
					>
						<Input {...register("last_name")} placeholder="Doe" />
					</Field>
					<Field label="Email" icon={Mail} error={errors.email?.message}>
						<Input
							{...register("email")}
							type="email"
							placeholder="john@example.com"
							disabled={Boolean(employee)}
						/>
					</Field>
					<Field label="Phone" icon={Phone} error={errors.phone?.message}>
						<Input {...register("phone")} placeholder="+234..." />
					</Field>
				</div>
			</div>

			{/* Employment Details */}
			<div className="space-y-4">
				<SectionHeading icon={Briefcase} title="Employment Details" />
				<div className="grid gap-4 sm:grid-cols-2">
					<Field label="Country" icon={MapPin} error={errors.country?.message}>
						<Select
							value={watch("country")}
							onValueChange={(value) =>
								setValue("country", value, { shouldDirty: true })
							}
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
					</Field>
					<Field
						label="Department"
						icon={Building}
						error={errors.department?.message}
					>
						<Input {...register("department")} placeholder="Operations" />
					</Field>
					<Field
						label="Role"
						icon={Users}
						error={
							errors.role_slug?.message ??
							(rolesIsError
								? "Unable to load roles. Please refresh."
								: undefined)
						}
					>
						<Select
							value={watch("role_slug")}
							onValueChange={(value) =>
								setValue("role_slug", value, { shouldDirty: true })
							}
							disabled={rolesIsLoading || Boolean(rolesIsError)}
						>
							<SelectTrigger>
								<SelectValue
									placeholder={
										rolesIsLoading ? "Loading roles..." : "Select role"
									}
								/>
							</SelectTrigger>
							<SelectContent>
								{rolesIsLoading ? (
									<SelectItem value="_loading" disabled>
										<span className="flex items-center gap-2">
											<Loader2 className="h-3.5 w-3.5 animate-spin" />
											Loading...
										</span>
									</SelectItem>
								) : roles.length === 0 ? (
									<SelectItem value="_empty" disabled>
										No roles available
									</SelectItem>
								) : (
									roles.map((role) => (
										<SelectItem key={role.slug} value={role.slug}>
											{role.name}
										</SelectItem>
									))
								)}
							</SelectContent>
						</Select>
					</Field>
					<Field
						label="Job Title"
						icon={Briefcase}
						error={errors.job_title?.message}
					>
						<Input {...register("job_title")} placeholder="Software Engineer" />
					</Field>
					<Field
						label="Employment Type"
						icon={Calendar}
						error={errors.employment_type?.message}
					>
						<Select
							value={watch("employment_type")}
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
					</Field>
					<Field
						label="Start Date"
						icon={Calendar}
						error={errors.start_date?.message}
					>
						<Input {...register("start_date")} type="date" />
					</Field>
				</div>
			</div>

			{/* Compensation */}
			<div className="space-y-4">
				<SectionHeading icon={DollarSign} title="Compensation" />
				<div className="grid gap-4 sm:grid-cols-2">
					<Field
						label="Salary Amount"
						icon={DollarSign}
						error={errors.salary_amount?.message}
					>
						<Input
							{...register("salary_amount")}
							type="number"
							step="0.01"
							placeholder="5000.00"
						/>
					</Field>
					<Field
						label="Salary Currency"
						icon={DollarSign}
						error={errors.salary_currency?.message}
					>
						<Select
							value={watch("salary_currency")}
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
					</Field>
				</div>
			</div>

			{/* Additional Information */}
			<div className="space-y-4">
				<SectionHeading icon={Tag} title="Additional Information" />
				<div className="grid gap-4 sm:grid-cols-2">
					<Field label="External ID" icon={Tag}>
						<Input {...register("external_id")} placeholder="EMP-001" />
					</Field>
					<Field label="Group ID" icon={Users}>
						<Input
							{...register("group_id")}
							placeholder="Optional payroll group"
						/>
					</Field>
					{employee && (
						<Field label="Status" icon={Briefcase}>
							<Select
								value={watch("status")}
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
						</Field>
					)}
					{employee && currentStatus === "TERMINATED" && (
						<Field
							label="End Date"
							icon={Calendar}
							error={errors.end_date?.message}
						>
							<Input {...register("end_date")} type="date" />
						</Field>
					)}
				</div>
			</div>

			{/* Submit */}
			<div className="flex justify-end pt-4 border-t">
				<Button
					type="submit"
					disabled={isSubmitting || rolesIsLoading}
					className="min-w-35"
				>
					{isSubmitting ? (
						<>
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							Saving...
						</>
					) : employee ? (
						"Update Employee"
					) : (
						"Create Employee"
					)}
				</Button>
			</div>
		</form>
	);
}
