"use client";

import { ProtectedRoute } from "@/components/providers/ProtectedRoute";
import { AppSidebar } from "@/components/layouts/AppSidebar";
import { AppTopbar } from "@/components/layouts/AppTopbar";
import { PendingInvitations } from "@/features/auth/components/pending-invitations";
import { useCurrentUser } from "@/features/user/hooks";

/** The signed-in shell: dark sidebar, top bar, and the page in a scrolling column. */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
	useCurrentUser();

	return (
		<ProtectedRoute>
			<div className="flex h-dvh overflow-hidden bg-background">
				<AppSidebar />
				<div className="flex min-w-0 flex-1 flex-col">
					<AppTopbar />
					<main className="flex-1 overflow-y-auto">
						<div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
							<PendingInvitations />
							{children}
						</div>
					</main>
				</div>
			</div>
		</ProtectedRoute>
	);
}
