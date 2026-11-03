"use client";

import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/select";
import { toast } from "@repo/ui/sonner";
import { useSwitchCompany } from "@/features/auth/hooks";
import { useAuthStore } from "@/features/auth/store";
import { routes } from "@/lib/routes";

/** Moves someone who belongs to several companies between them. Hidden for everyone else. */
export function CompanySwitcher() {
	const router = useRouter();
	const companies = useAuthStore((state) => state.companies);
	const currentId = useAuthStore((state) => state.user?.company_id);
	const switchTo = useSwitchCompany();

	if (companies.length < 2) return null;

	return (
		<Select
			value={currentId}
			disabled={switchTo.isPending}
			onValueChange={(companyId) =>
				switchTo.mutate(companyId, {
					onSuccess: () => {
						const name = companies.find((c) => c.company_id === companyId)?.company_name;
						toast.success(name ? `Switched to ${name}` : "Company switched");
						router.push(routes.dashboardRoutes.OVERVIEW);
					},
					onError: (error) => toast.error(error instanceof Error ? error.message : "Couldn't switch company"),
				})
			}
		>
			<SelectTrigger className="w-full border-sidebar-border bg-sidebar-accent text-white" aria-label="Switch company">
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				{companies.map((company) => (
					<SelectItem key={company.company_id} value={company.company_id}>
						{company.company_name}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
