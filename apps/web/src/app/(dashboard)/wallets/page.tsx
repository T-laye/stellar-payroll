"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/tabs";
import { PageHeader } from "@/components/page-header";
import { CompanyWalletsManager } from "@/features/wallets/components/company-wallets-manager";
import { PersonalWalletManager } from "@/features/wallets/components/personal-wallet-manager";
import { hasAnyPermission, useAuthStore } from "@/features/auth/store";

/** Company treasury (the operational wallet payroll pays from), and the user's own wallet. */
export default function WalletsPage() {
	const user = useAuthStore((state) => state.user);
	const canViewCompanyWallets = hasAnyPermission(user, ["wallets:read", "wallets:create", "wallets:manage"]);

	return (
		<>
			<PageHeader
				title="Wallets"
				description={
					canViewCompanyWallets
						? "Fund the operational wallet payroll pays from, and manage trustlines."
						: "Your balances, wallet PIN and transfers."
				}
			/>
			<Tabs defaultValue={canViewCompanyWallets ? "company" : "mine"} className="space-y-4">
				<TabsList>
					{canViewCompanyWallets && <TabsTrigger value="company">Company wallets</TabsTrigger>}
					<TabsTrigger value="mine">My wallet</TabsTrigger>
				</TabsList>
				{canViewCompanyWallets && (
					<TabsContent value="company" className="mt-0">
						<CompanyWalletsManager />
					</TabsContent>
				)}
				<TabsContent value="mine" className="mt-0">
					<PersonalWalletManager />
				</TabsContent>
			</Tabs>
		</>
	);
}
