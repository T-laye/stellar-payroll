"use client";

import { ShieldCheck } from "lucide-react";
import FadeUp from "@/components/shared/FadeUp";
import { RolesManager } from "@/components/settings/roles-manager";
import { Card } from "@/components/ui/card";

export default function RolesPage() {
	return (
		<div className="space-y-6 sm:space-y-8">
			<FadeUp>
				<div>
					<h1 className="text-2xl font-bold text-foreground sm:text-3xl">
						Roles & Permissions
					</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Create custom roles, review default access levels, and assign the
						right permissions for each company workflow.
					</p>
				</div>
			</FadeUp>

			<FadeUp delay={60}>
				<Card className="overflow-hidden">
					<div className="flex items-center gap-3 border-b bg-muted/20 px-5 py-4 sm:px-6">
						<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
							<ShieldCheck className="h-4 w-4 text-primary" />
						</div>
						<div>
							<h2 className="text-sm font-semibold text-foreground">
								Access Control
							</h2>
							<p className="text-xs text-muted-foreground">
								Manage system roles and company-defined permission sets.
							</p>
						</div>
					</div>
					<div className="p-5 sm:p-6">
						<RolesManager />
					</div>
				</Card>
			</FadeUp>
		</div>
	);
}
