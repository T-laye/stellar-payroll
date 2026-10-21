"use client";

import Link from "next/link";
import { Settings } from "lucide-react";
import { Button } from "@repo/ui/button";
import { PageHeader } from "@/components/page-header";
import { Avatar } from "@/components/person";
import { SectionCard, DetailList } from "@/components/section-card";
import { PersonalWalletManager } from "@/features/wallets/components/personal-wallet-manager";
import { getUserDisplayName, useAuthStore } from "@/features/auth/store";
import { formatDate } from "@/lib/format";
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
				<PersonalWalletManager />
			</div>
		</>
	);
}
