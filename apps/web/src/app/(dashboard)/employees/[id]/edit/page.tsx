"use client";

import { useParams } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { RequirePermission } from "@/components/require-permission";
import { SectionCard } from "@/components/section-card";
import { CardSkeleton, ErrorState } from "@/components/states";
import { EmployeeForm } from "@/features/employees/components/employee-form";
import { useEmployee } from "@/features/employees/hooks";
import { routes } from "@/lib/routes";

function EditEmployee() {
	const { id } = useParams<{ id: string }>();
	const { data, isLoading, isError, refetch } = useEmployee(id);
	const name = data ? `${data.first_name} ${data.last_name}` : "Employee";

	return (
		<div className="mx-auto max-w-3xl">
			<PageHeader
				title="Edit Employee"
				description="Update employee details and payment information."
				breadcrumbs={[
					{ label: "Employees", href: routes.employees.list },
					{ label: name, href: routes.employees.detail(id) },
					{ label: "Edit" },
				]}
			/>
			{isLoading ? (
				<div className="space-y-6">
					<CardSkeleton className="h-48" />
					<CardSkeleton className="h-48" />
				</div>
			) : isError || !data ? (
				<SectionCard>
					<ErrorState title="Couldn't load this employee" onRetry={() => refetch()} />
				</SectionCard>
			) : (
				<EmployeeForm key={data.updated_at} employee={data} />
			)}
		</div>
	);
}

export default function EditEmployeePage() {
	return (
		<RequirePermission any={["employees:update"]}>
			<EditEmployee />
		</RequirePermission>
	);
}
