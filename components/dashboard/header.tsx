"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Zap, LogOut, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/stores/auth-store";
import { toast } from "sonner";
import Logo from "../ui/logo";
import { routes } from "../../lib/utils/routes";

interface DashboardHeaderProps {
	onMenuClick?: () => void;
	sidebarOpen?: boolean;
}

export function DashboardHeader({
	onMenuClick,
	sidebarOpen,
}: DashboardHeaderProps) {
	const { user, logout } = useAuthStore();
	const router = useRouter();
	const pathname = usePathname();

	// Derive page title from pathname
	const pageTitle = (() => {
		if (pathname === "/dashboard") return "Overview";
		const segment = pathname.split("/").pop() ?? "";
		return (
			segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ")
		);
	})();

	const handleLogout = async () => {
		await logout();
		toast.success("Signed out successfully", {
			description: "See you next time!",
		});
		router.push(routes.authRoutes.SIGN_IN);
	};

	return (
		<header className="border-b bg-card sticky top-0 z-40 shadow-sm shadow-black/5">
			<div className="flex h-16 md:h-20 items-center justify-between px-4 sm:px-6 gap-4">
				{/* Left: hamburger + logo + page title */}
				<div className="flex items-center gap-3">
					<Button
						variant="ghost"
						size="icon"
						onClick={onMenuClick}
						className="md:hidden h-9 w-9 shrink-0"
						aria-label="Toggle sidebar"
					>
						<Menu
							className={cn(
								"h-5 w-5 transition-transform duration-200",
								sidebarOpen && "rotate-90",
							)}
						/>
					</Button>

					{/* Logo */}
					<Logo />

					{/* Divider + page title (md+) */}
					<div className="hidden md:flex items-center gap-3">
						<div className="h-5 w-px bg-border" />
						<span className="text-sm font-medium text-muted-foreground">
							{pageTitle}
						</span>
					</div>
				</div>

				{/* Right: user info + logout */}
				<div className="flex items-center gap-2 sm:gap-3">
					{/* Role badge */}
					{user?.role && (
						<span className="hidden sm:inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary capitalize">
							{user.role.replace(/-/g, " ")}
						</span>
					)}

					{/* User info */}
					<div className="text-right hidden sm:block">
						<p className="text-sm font-medium text-foreground leading-tight">
							{user?.name}
						</p>
						<p className="text-xs text-muted-foreground leading-tight">
							{user?.email}
						</p>
					</div>

					{/* Avatar */}
					<div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
						<span className="text-xs font-semibold text-primary">
							{user?.name?.[0]?.toUpperCase() ?? "U"}
						</span>
					</div>

					{/* Logout — icon only on small, text on sm+ */}
					<Button
						variant="ghost"
						size="sm"
						onClick={handleLogout}
						className="gap-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
					>
						<LogOut className="h-4 w-4" />
						<span className="hidden sm:inline text-xs">Logout</span>
					</Button>
				</div>
			</div>
		</header>
	);
}
