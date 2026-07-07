"use client";

import { Send } from "lucide-react";
import { CompanyPaymentRequestsManager } from "@/features/payments/components/company-payment-requests-manager";
import { MyPaymentRequestsManager } from "@/features/payments/components/my-payment-requests-manager";
import FadeUp from "@/components/shared/FadeUp";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	hasAnyPermission,
	hasPermission,
	useAuthStore,
} from "@/lib/stores/auth-store";

export default function PaymentsPage() {
	const user = useAuthStore((state) => state.user);
	const canViewCompanyRequests = hasAnyPermission(user, [
		"*",
		"employees:read",
		"employees:update",
	]);
	const canReviewRequests = hasPermission(user, "employees:update");

	return (
		<div className="space-y-6 sm:space-y-8">
			<FadeUp>
				<div>
					<h1 className="text-2xl font-bold text-foreground sm:text-3xl">
						Payments
					</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						{canViewCompanyRequests
							? "Review employee payment requests and keep track of your own payment activity."
							: "Track your payment activity and raise a request when a payout needs review."}
					</p>
				</div>
			</FadeUp>

			<FadeUp delay={60}>
				<Card className="overflow-hidden">
					<div className="flex items-center gap-3 border-b bg-muted/20 px-5 py-4 sm:px-6">
						<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
							<Send className="h-4 w-4 text-primary" />
						</div>
						<div>
							<h2 className="text-sm font-semibold text-foreground">
								Payment Center
							</h2>
							<p className="text-xs text-muted-foreground">
								Requests, review workflows, and personal payout visibility in
								one place.
							</p>
						</div>
					</div>
					<div className="p-5 sm:p-6">
						<Tabs defaultValue="my-activity" className="space-y-6">
							<TabsList className="flex h-auto flex-wrap justify-start gap-2 bg-transparent p-0">
								<TabsTrigger value="my-activity">My Activity</TabsTrigger>
								{canViewCompanyRequests && (
									<TabsTrigger value="company-requests">
										Company Requests
									</TabsTrigger>
								)}
							</TabsList>

							<TabsContent value="my-activity" className="mt-0">
								<MyPaymentRequestsManager />
							</TabsContent>

							{canViewCompanyRequests && (
								<TabsContent value="company-requests" className="mt-0">
									<CompanyPaymentRequestsManager
										canReview={canReviewRequests}
									/>
								</TabsContent>
							)}
						</Tabs>
					</div>
				</Card>
			</FadeUp>
		</div>
	);
}
