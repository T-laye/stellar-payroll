"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
	ArrowLeftRight,
	Building2,
	ExternalLink,
	LayoutDashboard,
	LogOut,
	Menu,
	ScrollText,
	ShieldCheck,
	Users,
} from "lucide-react";
import { Button } from "@repo/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@repo/ui/sheet";
import { cn } from "@repo/ui/lib/utils";
import { Avatar } from "@/components/person";
import { signOut, useAdminSession } from "@/features/auth/session";
import { USE_MOCK_API } from "@/lib/api/source";
import { APP_URL, withBasePath } from "@/lib/site";

const NAV = [
	{ href: "/", label: "Overview", icon: LayoutDashboard },
	{ href: "/companies", label: "Companies", icon: Building2 },
	{ href: "/users", label: "Users", icon: Users },
	{ href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
	{ href: "/audit-logs", label: "Audit log", icon: ScrollText },
	{ href: "/admins", label: "Platform admins", icon: ShieldCheck },
];

const isActive = (pathname: string, href: string) =>
	href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

function Nav({ onNavigate }: { onNavigate?: () => void }) {
	const pathname = usePathname();
	return (
		<div className="flex h-full flex-col">
			<Link href="/" onClick={onNavigate} className="flex h-16 items-center gap-2.5 px-5">
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img src={withBasePath("/images/logo-white.svg")} alt="PayOrbit" width={120} height={26} className="h-auto w-28" />
				<span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[11px] font-semibold tracking-wide text-white/80 uppercase">
					Admin
				</span>
			</Link>
			<nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Console">
				{NAV.map((item) => {
					const active = isActive(pathname, item.href);
					return (
						<Link
							key={item.href}
							href={item.href}
							onClick={onNavigate}
							aria-current={active ? "page" : undefined}
							className={cn(
								"group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
								active
									? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md shadow-black/20"
									: "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
							)}
						>
							<item.icon
								className={cn("size-4.5 shrink-0", active ? "text-white" : "text-sidebar-foreground/70 group-hover:text-white")}
								aria-hidden
							/>
							{item.label}
						</Link>
					);
				})}
			</nav>
			<div className="space-y-3 border-t border-sidebar-border p-4">
				{USE_MOCK_API && (
					<p className="rounded-lg bg-sidebar-accent px-3 py-2 text-xs text-sidebar-foreground">
						<span className="font-semibold text-white">Demo mode.</span> Sample data in this browser; changes touch no real
						accounts.
					</p>
				)}
				<a
					href={APP_URL}
					className="flex items-center gap-2 px-1 text-xs text-sidebar-foreground/70 transition-colors hover:text-white"
				>
					Open the PayOrbit app <ExternalLink className="size-3" />
				</a>
			</div>
		</div>
	);
}

/** Dark rail on desktop, a drawer below `lg`; the top bar holds who's signed in and sign out. */
export function AdminShell({ children }: { children: React.ReactNode }) {
	const router = useRouter();
	const queryClient = useQueryClient();
	const user = useAdminSession((s) => s.user);
	const [open, setOpen] = useState(false);
	const name = user ? `${user.first_name} ${user.last_name}`.trim() || user.email : "Admin";

	const logout = async () => {
		await signOut();
		// The next person to sign in on this tab shouldn't see this session's cached data.
		queryClient.clear();
		router.replace("/sign-in");
	};

	return (
		<div className="flex h-dvh overflow-hidden bg-background">
			<aside className="hidden w-64 shrink-0 bg-sidebar text-sidebar-foreground lg:block">
				<Nav />
			</aside>
			<div className="flex min-w-0 flex-1 flex-col">
				<header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-card/90 px-4 backdrop-blur sm:px-6">
					<Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
						<Menu className="size-5" />
					</Button>
					<Sheet open={open} onOpenChange={setOpen}>
						<SheetContent side="left" className="w-72 border-0 bg-sidebar p-0 text-sidebar-foreground [&>button]:text-white">
							<SheetTitle className="sr-only">Menu</SheetTitle>
							<Nav onNavigate={() => setOpen(false)} />
						</SheetContent>
					</Sheet>
					<p className="hidden text-sm text-muted-foreground sm:block">PayOrbit platform console</p>
					<div className="ml-auto flex items-center gap-3">
						<Avatar name={name} size="sm" />
						<span className="hidden text-left md:block">
							<span className="block max-w-48 truncate text-sm leading-tight font-medium text-foreground">{name}</span>
							<span className="block text-xs leading-tight text-muted-foreground">Platform admin</span>
						</span>
						<Button variant="ghost" size="sm" onClick={logout} aria-label="Sign out">
							<LogOut /> <span className="hidden sm:inline">Sign out</span>
						</Button>
					</div>
				</header>
				<main className="flex-1 overflow-y-auto">
					<div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
				</main>
			</div>
		</div>
	);
}
