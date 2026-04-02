"use client";

import { Wallet } from "lucide-react";
import { CompanyWalletsManager } from "@/components/settings/company-wallets-manager";
import FadeUp from "@/components/shared/FadeUp";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PersonalWalletManager } from "@/components/wallets/personal-wallet-manager";
import { hasAnyPermission, useAuthStore } from "@/lib/stores/auth-store";

export default function WalletsPage() {
	const user = useAuthStore((state) => state.user);
	const canViewCompanyWallets = hasAnyPermission(user, [
		"*",
		"wallets:read",
		"wallets:create",
		"wallets:manage",
	]);

	return (
		<div className="space-y-6 sm:space-y-8">
			<FadeUp>
				<div>
					<h1 className="text-2xl font-bold text-foreground sm:text-3xl">
						Wallets
					</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						{canViewCompanyWallets
							? "Manage company wallet operations while keeping your own wallet access close at hand."
							: "Inspect your balances, verify your wallet PIN, and move funds when needed."}
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
								Wallet Center
							</h2>
							<p className="text-xs text-muted-foreground">
								Personal wallet access for every user, with company wallet tools
								when your permissions allow it.
							</p>
						</div>
					</div>
					<div className="p-5 sm:p-6">
						<Tabs defaultValue="my-wallet" className="space-y-6">
							<TabsList className="flex h-auto flex-wrap justify-start gap-2 bg-transparent p-0">
								<TabsTrigger value="my-wallet">My Wallet</TabsTrigger>
								{canViewCompanyWallets && (
									<TabsTrigger value="company-wallets">
										Company Wallets
									</TabsTrigger>
								)}
							</TabsList>

							<TabsContent value="my-wallet" className="mt-0">
								<PersonalWalletManager />
							</TabsContent>

							{canViewCompanyWallets && (
								<TabsContent value="company-wallets" className="mt-0">
									<CompanyWalletsManager />
								</TabsContent>
							)}
						</Tabs>
					</div>
				</Card>
			</FadeUp>
		</div>
	);
}
