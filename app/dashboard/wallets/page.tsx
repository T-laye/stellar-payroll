"use client";

import { Wallet } from "lucide-react";
import FadeUp from "@/components/shared/FadeUp";
import { Card } from "@/components/ui/card";
import { CompanyWalletsManager } from "@/components/settings/company-wallets-manager";

export default function WalletsPage() {
	return (
		<div className="space-y-6 sm:space-y-8">
			<FadeUp>
				<div>
					<h1 className="text-2xl font-bold text-foreground sm:text-3xl">
						Company Wallets
					</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Manage operational wallets, inspect balances, and add trustlines for
						payroll activity.
					</p>
				</div>
			</FadeUp>

			<FadeUp delay={60}>
				<Card className="overflow-hidden">
					<div className="flex items-center gap-3 border-b bg-muted/20 px-5 py-4 sm:px-6">
						<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
							<Wallet className="h-4 w-4 text-primary" />
						</div>
						<div>
							<h2 className="text-sm font-semibold text-foreground">
								Wallet Operations
							</h2>
							<p className="text-xs text-muted-foreground">
								All company wallets, balances, and trustlines in one place.
							</p>
						</div>
					</div>
					<div className="p-5 sm:p-6">
						<CompanyWalletsManager />
					</div>
				</Card>
			</FadeUp>
		</div>
	);
}
