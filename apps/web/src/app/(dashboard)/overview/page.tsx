"use client";

import { AdminDashboard } from "@/features/overview/components/admin-dashboard";
import { EmployeeHome } from "@/features/me/components/employee-home";
import { isPayrollAdmin, useAuthStore } from "@/features/auth/store";

/** People who run payroll get the admin dashboard; employees get their own payments. */
export default function OverviewPage() {
	const isAdmin = useAuthStore((state) => isPayrollAdmin(state.user));
	return isAdmin ? <AdminDashboard /> : <EmployeeHome />;
}
