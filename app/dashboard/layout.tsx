"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/dashboard/protected-route";
import { DashboardHeader } from "../../components/dashboard/header";
import { DashboardSidebar } from "../../components/dashboard/sidebar";

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const pathname = usePathname();

	// Auto-close sidebar on route change (mobile)
	useEffect(() => {
		setSidebarOpen(false);
	}, [pathname]);

	return (
		<ProtectedRoute>
			<div className="flex h-screen flex-col bg-background overflow-hidden">
				<DashboardHeader
					onMenuClick={() => setSidebarOpen((v) => !v)}
					sidebarOpen={sidebarOpen}
				/>
				<div className="flex flex-1 overflow-hidden">
					<DashboardSidebar
						isOpen={sidebarOpen}
						onClose={() => setSidebarOpen(false)}
					/>
					<main className="flex-1 overflow-auto scroll-smooth">
						<div className="container mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
							{children}
						</div>
					</main>
				</div>
			</div>
		</ProtectedRoute>
	);
}
