"use client";

import Link from "next/link";
import { Settings } from "lucide-react";
import { Button } from "@repo/ui/button";
import { PageHeader } from "@/components/page-header";
import { Avatar } from "@/components/person";
import { SectionCard, DetailList } from "@/components/section-card";
import { CompanyMemberships } from "@/features/auth/components/company-memberships";
import { PersonalWalletManager } from "@/features/wallets/components/personal-wallet-manager";
import { getUserDisplayName, useAuthStore } from "@/features/auth/store";
import { formatDate, formatFrequency } from "@/lib/format";
import { HashValue } from "@/components/hash";
import { AssetBadge, Money } from "@/components/money";
import { CardSkeleton } from "@/components/states";
import { EmployeeStatusPill } from "@/components/status-pill";
import { useMyEmployee } from "@/features/me/hooks";
import { routes } from "@/lib/routes";

/** The employee's profile and the wallet their pay arrives in. */
export default function ProfilePage() {
	const user = useAuthStore((state) => state.user);
	const name = getUserDisplayName(user);

	return (
		<>
			<PageHeader title="Profile & Wallet" description="Your details and the wallet your pay arrives in." />
			<div className="space-y-6">
				<SectionCard
					title="Profile"
					action={
						<Button asChild variant="ghost" size="sm">
							<Link href={routes.dashboardRoutes.SETTINGS}>
								<Settings /> Edit
							</Link>
						</Button>
					}
				>
					<div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:items-center">
						<div className="flex min-w-0 items-center gap-4">
							<Avatar name={name} size="lg" />
							<div className="min-w-0">
								<p className="truncate text-lg font-semibold">{name}</p>
								<p className="text-sm text-muted-foreground">{user?.role_name}</p>
							</div>
						</div>
						<DetailList
							className="sm:grid-cols-3"
							items={[
								{ label: "Email", value: <span className="break-all">{user?.email}</span> },
								{ label: "Company", value: user?.company ?? "--" },
								{ label: "Member since", value: formatDate(user?.created_at) },
							]}
						/>
					</div>
				</SectionCard>
				<MyPay />
				<PersonalWalletManager />
				<CompanyMemberships />
			</div>
		</>
	);
}

/** The employee's own pay record (GET /users/me/employee). Admins without an employee record see nothing here. */
function MyPay() {
	const { data: me, isLoading, isError } = useMyEmployee();
	if (isError || (!isLoading && !me)) return null;
	return (
		<SectionCard title="Your pay" description="Set by your employer. Ask them if anything here looks wrong.">
			{isLoading || !me ? (
				<CardSkeleton className="h-24 border-0 p-0" />
			) : (
				<DetailList
					columns={2}
					className="lg:grid-cols-4"
					items={[
						{ label: "Salary", value: <Money value={me.salary_amount} asset={me.payment_asset} className="font-semibold" /> },
						{ label: "Payment asset", value: <AssetBadge asset={me.payment_asset} /> },
						{ label: "Frequency", value: formatFrequency(me.pay_frequency) },
						{
							label: "Status",
							value: <EmployeeStatusPill employee={{ status: me.status, wallet: me.wallet_address || null }} />,
						},
						{ label: "Role", value: me.role || "--" },
						{
							label: "Wallet",
							value: me.wallet_address ? (
								<HashValue value={me.wallet_address} kind="account" />
							) : (
								<span className="text-warning">Not linked yet</span>
							),
						},
					]}
				/>
			)}
		</SectionCard>
	);
}
