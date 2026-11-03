"use client";

import { useState } from "react";
import { Button } from "@repo/ui/button";
import { toast } from "@repo/ui/sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { SectionCard } from "@/components/section-card";
import { useLeaveCompany } from "@/features/auth/hooks";
import { expireSession, useAuthStore } from "@/features/auth/store";
import type { CompanyMembership } from "@/features/auth/types";

/**
 * The companies someone belongs to, and a way out of one (say, an invite accepted by mistake).
 * Hidden with only one company: nobody can leave their last. The API also refuses a company's only owner.
 */
export function CompanyMemberships() {
	const companies = useAuthStore((state) => state.companies);
	const setCompanies = useAuthStore((state) => state.setCompanies);
	const currentId = useAuthStore((state) => state.user?.company_id);
	const leave = useLeaveCompany();
	const [leaving, setLeaving] = useState<CompanyMembership | null>(null);

	if (companies.length < 2) return null;

	const leavingCurrent = leaving?.company_id === currentId;

	return (
		<SectionCard title="Your companies" description="The companies you belong to. Use the switcher in the sidebar to move between them.">
			<ul className="divide-y divide-border">
				{companies.map((company) => (
					<li key={company.company_id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
						<div className="min-w-0">
							<p className="truncate text-sm font-medium text-foreground">{company.company_name}</p>
							<p className="text-xs text-muted-foreground">
								{company.role}
								{company.company_id === currentId ? " · Signed in now" : ""}
							</p>
						</div>
						<Button variant="outline" size="sm" onClick={() => setLeaving(company)}>
							Leave
						</Button>
					</li>
				))}
			</ul>

			<ConfirmDialog
				open={!!leaving}
				onOpenChange={(next) => !next && setLeaving(null)}
				title={`Leave ${leaving?.company_name ?? "this company"}?`}
				description={`You won't be able to sign in to it any more, and its records stay with the company.${leavingCurrent ? " You're signed in to it now, so you'll be signed out." : ""}`}
				confirmLabel="Leave company"
				tone="destructive"
				loading={leave.isPending}
				onConfirm={() => {
					if (!leaving) return;
					leave.mutate(leaving.company_id, {
						onSuccess: (remaining) => {
							toast.success(`You've left ${leaving.company_name}`);
							setLeaving(null);
							if (leavingCurrent) expireSession();
							else setCompanies(remaining ?? []);
						},
						onError: (error) => {
							setLeaving(null);
							toast.error(error instanceof Error ? error.message : "Couldn't leave this company");
						},
					});
				}}
			/>
		</SectionCard>
	);
}
