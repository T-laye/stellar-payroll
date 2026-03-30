"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
	Users,
	Briefcase,
	Send,
	BarChart3,
	Settings,
	X,
	LogOut,
	ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/stores/auth-store";
import { toast } from "sonner";

const navItems = [
	{ label: "Overview", href: "/dashboard", icon: BarChart3 },
	{ label: "Employees", href: "/dashboard/employees", icon: Users },
	{ label: "Payroll Groups", href: "/dashboard/payroll", icon: Briefcase },
	{ label: "Payments", href: "/dashboard/payments", icon: Send },
	{ label: "Settings", href: "/dashboard/settings", icon: Settings },
];

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

	const handleLogout = () => {
		logout();
		toast.success("Signed out successfully", {
			description: "See you next time!",
		});
		router.push("/");
	};

	return (
		<>
			{/* Mobile overlay — animated */}
			<div
				className={cn(
					"fixed inset-0 bg-black/50 md:hidden z-30 transition-opacity duration-200",
					isOpen
						? "opacity-100 pointer-events-auto"
						: "opacity-0 pointer-events-none",
				)}
				onClick={onClose}
			/>

			{/* Sidebar */}
			<aside
				className={cn(
					"fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 border-r bg-sidebar flex flex-col",
					"transition-transform duration-200 ease-in-out z-40",
					"md:relative md:top-0 md:translate-x-0 md:h-full",
					isOpen ? "translate-x-0" : "-translate-x-full",
				)}
			>
				{/* Mobile close button */}
				{/* <div className="flex items-center justify-between px-4 pt-4 md:hidden">
					<span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
						Navigation
					</span>
					<Button
						variant="ghost"
						size="icon"
						onClick={onClose}
						className="h-8 w-8"
					>
						<X className="h-4 w-4" />
					</Button>
				</div> */}

				{/* Nav items */}
				<nav className="flex flex-col gap-1 p-4 flex-1 mt-3">
					{/* Section label */}
					{/* <p className="hidden md:block text-xs font-semibold uppercase tracking-widest text-muted-foreground px-3 mb-2">
						Main Menu
					</p> */}

					{navItems.map((item, i) => {
						const Icon = item.icon;
						const isActive =
							item.href === "/dashboard"
								? pathname === "/dashboard"
								: pathname === item.href ||
									pathname.startsWith(item.href + "/");

						return (
							<Link
								key={item.href}
								href={item.href}
								onClick={onClose}
								style={{
									opacity: mounted ? 1 : 0,
									transform: mounted ? "translateX(0)" : "translateX(-12px)",
									transition: `opacity 0.3s ease ${i * 50}ms, transform 0.3s ease ${i * 50}ms`,
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
								{isActive && (
									<ChevronRight className="h-3.5 w-3.5 opacity-60" />
								)}
							</Link>
						);
					})}
				</nav>

				{/* Bottom — user info + logout */}
				<div className="border-t p-4">
					<div className="rounded-xl bg-muted/50 p-3 mb-3">
						<div className="flex items-center gap-3">
							{/* Avatar */}
							<div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
								<span className="text-xs font-semibold text-primary">
									{user?.name?.[0]?.toUpperCase() ?? "U"}
								</span>
							</div>
							<div className="flex-1 min-w-0">
								<p className="text-sm font-medium text-foreground truncate">
									{user?.name ?? "User"}
								</p>
								<p className="text-xs text-muted-foreground truncate">
									{user?.email}
								</p>
							</div>
						</div>
					</div>

					<Button
						variant="ghost"
						size="sm"
						onClick={handleLogout}
						className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
					>
						<LogOut className="h-4 w-4" />
						Sign out
					</Button>
				</div>
			</aside>
		</>
	);
}



