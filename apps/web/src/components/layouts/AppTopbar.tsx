"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, Menu, Search, Settings, UserRound } from "lucide-react";
import { Button } from "@repo/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@repo/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle } from "@repo/ui/sheet";
import { toast } from "@repo/ui/sonner";
import Logo from "@/components/Logo";
import { Avatar } from "@/components/person";
import { SidebarNav } from "@/components/layouts/AppSidebar";
import { getUserDisplayName, hasAnyPermission, isPayrollAdmin, useAuthStore } from "@/features/auth/store";
import { NotificationBell } from "@/features/notifications/components/notification-bell";
import { routes } from "@/lib/routes";

/** Search (admins: employees), notifications, and the account menu. Opens the nav drawer on phones. */
export function AppTopbar() {
	const router = useRouter();
	const user = useAuthStore((state) => state.user);
	const logout = useAuthStore((state) => state.logout);
	const [menuOpen, setMenuOpen] = useState(false);
	const [query, setQuery] = useState("");
	const name = getUserDisplayName(user);
	const canSearch = isPayrollAdmin(user) && hasAnyPermission(user, ["employees:read"]);

	const signOut = async () => {
		try {
			await logout();
		} finally {
			toast.success("Signed out");
			router.replace(routes.authRoutes.SIGN_IN);
		}
	};

	return (
		<header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-card/90 px-4 backdrop-blur sm:px-6">
			<Button variant="ghost" size="icon" className="shrink-0 lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Open menu">
				<Menu className="size-5" />
			</Button>
			<Logo mark w="w-7" href={routes.dashboardRoutes.OVERVIEW} className="sm:hidden" />
			<Sheet open={menuOpen} onOpenChange={setMenuOpen}>
				<SheetContent side="left" className="w-72 border-0 bg-sidebar p-0 text-sidebar-foreground [&>button]:text-white">
					<SheetTitle className="sr-only">Menu</SheetTitle>
					<SidebarNav onNavigate={() => setMenuOpen(false)} />
				</SheetContent>
			</Sheet>

			{canSearch ? (
				<form
					role="search"
					className="relative hidden max-w-md flex-1 sm:block"
					onSubmit={(event) => {
						event.preventDefault();
						router.push(`${routes.employees.list}${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ""}`);
					}}
				>
					<Search
						className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
						aria-hidden
					/>
					<input
						type="search"
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						placeholder="Search employees…"
						aria-label="Search employees"
						className="h-9 w-full rounded-lg border border-transparent bg-muted pr-3 pl-9 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:bg-card focus:ring-3 focus:ring-ring/20"
					/>
				</form>
			) : null}

			{/* Always the far end of the bar, whatever sits before it. */}
			<div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
				<NotificationBell />
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<button
							type="button"
							className="flex items-center gap-2.5 rounded-lg p-1 pr-2 transition-colors hover:bg-accent"
							aria-label="Account menu"
						>
							<Avatar name={name} size="sm" />
							<span className="hidden text-left md:block">
								<span className="block max-w-40 truncate text-sm leading-tight font-medium text-foreground">{name}</span>
								<span className="block text-xs leading-tight text-muted-foreground">{user?.role_name ?? ""}</span>
							</span>
							<ChevronDown className="hidden size-4 text-muted-foreground md:block" />
						</button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-56">
						<DropdownMenuLabel>
							<span className="block truncate">{name}</span>
							<span className="block truncate text-xs font-normal text-muted-foreground">{user?.email}</span>
						</DropdownMenuLabel>
						<DropdownMenuSeparator />
						{!isPayrollAdmin(user) && (
							<DropdownMenuItem onSelect={() => router.push(routes.dashboardRoutes.PROFILE)}>
								<UserRound /> Profile &amp; wallet
							</DropdownMenuItem>
						)}
						<DropdownMenuItem onSelect={() => router.push(routes.dashboardRoutes.SETTINGS)}>
							<Settings /> Settings
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem variant="destructive" onSelect={signOut}>
							<LogOut /> Sign out
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</header>
	);
}
