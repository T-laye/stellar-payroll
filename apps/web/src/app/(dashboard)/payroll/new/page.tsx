"use client";

import { PageHeader } from "@/components/page-header";
import { RequirePermission } from "@/components/require-permission";
import { CreatePayrollWizard } from "@/features/payroll/components/create-payroll-wizard";
import { routes } from "@/lib/routes";

export default function CreatePayrollPage() {
	return (
		<RequirePermission any={["payroll:create"]}>
			<PageHeader
				title="Create Payroll"
				description="A few guided steps from picking people to paying them."
				breadcrumbs={[{ label: "Payroll", href: routes.payroll.list }, { label: "Create" }]}
			/>
			<CreatePayrollWizard />
		</RequirePermission>
	);
}
