"use client";

import { PageHeader } from "@/components/page-header";
import { RequirePermission } from "@/components/require-permission";
import { EmployeeForm } from "@/features/employees/components/employee-form";
import { routes } from "@/lib/routes";

export default function AddEmployeePage() {
	return (
		<RequirePermission any={["employees:create"]}>
			<div className="mx-auto max-w-3xl">
				<PageHeader
					title="Add Employee"
					description="Add a new team member and their payment details."
					breadcrumbs={[{ label: "Employees", href: routes.employees.list }, { label: "Add Employee" }]}
				/>
				<EmployeeForm />
			</div>
		</RequirePermission>
	);
}
