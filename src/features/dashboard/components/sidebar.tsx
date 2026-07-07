"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
	Users,
	Briefcase,
	Send,
	BarChart3,
	Wallet,
	ShieldCheck,
	Settings,
	LogOut,
	ChevronRight,
} from "lucide-react";
import { capitalizeWords, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
	getUserDisplayName,
	hasAnyPermission,
	useAuthStore,
} from "@/lib/stores/auth-store";
import { toast } from "sonner";
import { routes } from "@/lib/utils/routes";

interface DashboardSidebarProps {
	isOpen?: boolean;
	onClose?: () => void;
}

export function DashboardSidebar({
	isOpen = true,
	onClose,
}: DashboardSidebarProps) {
	const pathname = usePathname();
	const { user, logout } = useAuthStore();
	const router = useRouter();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	const navItems = [
		{
			label: "Overview",
			href: routes.dashboardRoutes.OVERVIEW,
			icon: BarChart3,
			visible: true,
		},
		{
			label: "Employees",
			href: routes.dashboardRoutes.EMPLOYEES,
			icon: Users,
			visible: hasAnyPermission(user, ["*", "employees:read"]),
		},
		{
			label: "Payroll Groups",
			href: routes.dashboardRoutes.PAYROLL_GROUPS,
			icon: Briefcase,
			visible: hasAnyPermission(user, [
				"*",
				"payroll:read",
				"payroll:create",
				"payroll:update",
				"payroll:approve",
				"payroll:execute",
				"payroll:cancel",
				"company:update",
			]),
		},
		{
			label: "Payments",
			href: routes.dashboardRoutes.PAYMENTS,
			icon: Send,
			visible: true,
		},
		{
			label: "Wallets",
			href: routes.dashboardRoutes.WALLETS,
			icon: Wallet,
			visible: true,
		},
		{
			label: "Roles",
			href: routes.dashboardRoutes.ROLES,
			icon: ShieldCheck,
			visible: hasAnyPermission(user, ["*", "roles:read", "roles:manage"]),
		},
		{
			label: "Settings",
			href: routes.dashboardRoutes.SETTINGS,
			icon: Settings,
			visible: true,
		},
	].filter((item) => item.visible);

	const displayName = getUserDisplayName(user);
	const userInitial = displayName.charAt(0).toUpperCase() || "U";

	const handleLogout = async () => {
		await logout();
		toast.success("Signed out successfully", {
			description: "See you next time!",
		});
		router.push(routes.authRoutes.SIGN_IN);
	};

	return (
		<>
			<div
				className={cn(
					"fixed inset-0 z-30 bg-black/50 transition-opacity duration-200 md:hidden",
					isOpen
						? "pointer-events-auto opacity-100"
						: "pointer-events-none opacity-0",
				)}
				onClick={onClose}
			/>

			<aside
				className={cn(
					"fixed left-0 top-16 z-40 flex h-[calc(100vh-4rem)] w-64 flex-col border-r bg-sidebar transition-transform duration-200 ease-in-out",
					"md:relative md:top-0 md:h-full md:translate-x-0",
					isOpen ? "translate-x-0" : "-translate-x-full",
				)}
			>
				<nav className="mt-3 flex flex-1 flex-col gap-1 p-4">
					{navItems.map((item, index) => {
						const Icon = item.icon;
						const isActive =
							item.href === routes.dashboardRoutes.OVERVIEW
								? pathname === routes.dashboardRoutes.OVERVIEW
								: pathname === item.href || pathname.startsWith(item.href + "/");

						return (
							<Link
								key={item.href}
								href={item.href}
								onClick={onClose}
								style={{
									opacity: mounted ? 1 : 0,
									transform: mounted ? "translateX(0)" : "translateX(-12px)",
									transition: `opacity 0.3s ease ${index * 50}ms, transform 0.3s ease ${index * 50}ms`,
								}}
								className={cn(
									"group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
									isActive
										? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm shadow-primary/20"
										: "text-sidebar-foreground hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground",
								)}
							>
								<Icon
									className={cn(
										"h-4 w-4 shrink-0 transition-transform duration-150",
										!isActive && "group-hover:scale-110",
									)}
								/>
								<span className="flex-1">{item.label}</span>
								{isActive && <ChevronRight className="h-3.5 w-3.5 opacity-60" />}
							</Link>
						);
					})}
				</nav>

				<div className="border-t p-4">
					<div className="mb-3 rounded-xl bg-muted/50 p-3">
						<div className="flex items-center gap-3">
							<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
								<span className="text-xs font-semibold text-primary">
									{userInitial}
								</span>
							</div>
							<div className="min-w-0 flex-1">
								<p className="truncate text-sm font-medium text-foreground">
									{capitalizeWords(displayName)}
								</p>
								<p className="truncate text-xs text-muted-foreground">
									{user?.email}
								</p>
							</div>
						</div>
					</div>

					<Button
						variant="ghost"
						size="sm"
						onClick={handleLogout}
						className="w-full justify-start gap-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
					>
						<LogOut className="h-4 w-4" />
						Sign out
					</Button>
				</div>
			</aside>
		</>
	);
}
