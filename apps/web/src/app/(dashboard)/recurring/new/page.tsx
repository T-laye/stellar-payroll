"use client";

import { PageHeader } from "@/components/page-header";
import { RequirePermission } from "@/components/require-permission";
import { ScheduleForm } from "@/features/payroll/components/schedule-form";
import { routes } from "@/lib/routes";

export default function CreateSchedulePage() {
	return (
		<RequirePermission any={["payroll:create"]}>
			<PageHeader
				title="Create Payroll Schedule"
				description="Pay the same team on a regular cycle."
				breadcrumbs={[{ label: "Recurring Payroll", href: routes.recurring.list }, { label: "Create Schedule" }]}
			/>
			<ScheduleForm />
		</RequirePermission>
	);
}
