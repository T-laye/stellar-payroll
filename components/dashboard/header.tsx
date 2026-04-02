"use client";

import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { getUserDisplayName, useAuthStore } from "@/lib/stores/auth-store";
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

	const pageTitle = (() => {
		if (pathname === "/dashboard") return "Overview";
		const segment = pathname.split("/").pop() ?? "";
		return (
			segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ")
		);
	})();

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
		<header className="sticky top-0 z-40 border-b bg-card shadow-sm shadow-black/5">
			<div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 md:h-20">
				<div className="flex items-center gap-3">
					<Button
						variant="ghost"
						size="icon"
						onClick={onMenuClick}
						className="h-9 w-9 shrink-0 md:hidden"
						aria-label="Toggle sidebar"
					>
						<Menu
							className={cn(
								"h-5 w-5 transition-transform duration-200",
								sidebarOpen && "rotate-90",
							)}
						/>
					</Button>

					<Logo />

					<div className="hidden items-center gap-3 md:flex">
						<div className="h-5 w-px bg-border" />
						<span className="text-sm font-medium text-muted-foreground">
							{pageTitle}
						</span>
					</div>
				</div>

				<div className="flex items-center gap-2 sm:gap-3">
					{user?.role_name && (
						<span className="hidden rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary sm:inline-flex">
							{user.role_name}
						</span>
					)}

					<div className="hidden text-right sm:block">
						<p className="text-sm font-medium leading-tight text-foreground">
							{displayName}
						</p>
						<p className="text-xs leading-tight text-muted-foreground">
							{user?.email}
						</p>
					</div>

					<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10">
						<span className="text-xs font-semibold text-primary">
							{userInitial}
						</span>
					</div>

					<Button
						variant="ghost"
						size="sm"
						onClick={handleLogout}
						className="gap-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
					>
						<LogOut className="h-4 w-4" />
						<span className="hidden text-xs sm:inline">Logout</span>
					</Button>
				</div>
			</div>
		</header>
	);
}
