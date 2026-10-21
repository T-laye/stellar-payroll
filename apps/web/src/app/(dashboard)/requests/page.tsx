"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/tabs";
import { PageHeader } from "@/components/page-header";
import { CompanyPaymentRequestsManager } from "@/features/payments/components/company-payment-requests-manager";
import { MyPaymentRequestsManager } from "@/features/payments/components/my-payment-requests-manager";
import { hasAnyPermission, hasPermission, isPayrollAdmin, useAuthStore } from "@/features/auth/store";

/** Requests for missed or extra payments: employees raise them, approvers review them. */
export default function RequestsPage() {
	const user = useAuthStore((state) => state.user);
	const canReview = hasPermission(user, "payroll:approve");
	const canSeeCompany = hasAnyPermission(user, ["payroll:read", "payroll:approve"]);
	const admin = isPayrollAdmin(user);

	return (
		<>
			<PageHeader
				title="Payment requests"
				description={
					admin
						? "Review employees' requests for missed or extra payments."
						: "Ask for a missed or extra payment and follow its review."
				}
			/>
			{canSeeCompany ? (
				<Tabs defaultValue="company" className="space-y-4">
					<TabsList>
						<TabsTrigger value="company">Company requests</TabsTrigger>
						<TabsTrigger value="mine">My requests</TabsTrigger>
					</TabsList>
					<TabsContent value="company" className="mt-0">
						<CompanyPaymentRequestsManager canReview={canReview} />
					</TabsContent>
					<TabsContent value="mine" className="mt-0">
						<MyPaymentRequestsManager />
					</TabsContent>
				</Tabs>
			) : (
				<MyPaymentRequestsManager />
			)}
		</>
	);
}
