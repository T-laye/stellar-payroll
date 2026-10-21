"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@repo/ui/button";
import { EmptyState } from "@/components/states";
import { hasAnyPermission, useAuthStore } from "@/features/auth/store";
import { routes } from "@/lib/routes";

/**
 * Renders its children only for users holding one of `any`. Pages put their hooks in the child
 * component, so nothing is called after this early return.
 */
export function RequirePermission({ any, children }: { any: string[]; children: ReactNode }) {
	const user = useAuthStore((state) => state.user);
	if (!hasAnyPermission(user, any)) {
		return (
			<div className="rounded-xl border border-border bg-card">
				<EmptyState
					icon={Lock}
					title="You don't have access to this page"
					description="Ask a workspace owner or admin for access if you need it."
					action={
						<Button asChild variant="outline">
							<Link href={routes.dashboardRoutes.OVERVIEW}>Back to home</Link>
						</Button>
					}
				/>
			</div>
		);
	}
	return <>{children}</>;
}
