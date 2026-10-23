"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import Logo from "@/components/Logo";
import { useAuthStore } from "@/features/auth/store";
import { useUnreadCount } from "@/features/notifications/hooks";
import { USE_MOCK_API } from "@/lib/api/source";
import { routes } from "@/lib/routes";
import { isActive, navFor } from "@/components/layouts/nav";

/** The nav itself, shared by the desktop rail and the mobile drawer. */
export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
	const pathname = usePathname();
	const user = useAuthStore((state) => state.user);
	const unread = useUnreadCount().data ?? 0;
	const groups = navFor(user);

	return (
		<div className="flex h-full flex-col">
			<div className="flex h-16 items-center px-5">
				<Logo variant="white" w="w-32" href={routes.dashboardRoutes.OVERVIEW} />
			</div>
			<nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4" aria-label="Main">
				{groups.map((group, index) => (
					<div key={group.label ?? index} className="space-y-1">
						{group.label && (
							<p className="px-3 pb-1 text-[11px] font-semibold tracking-wider text-sidebar-foreground/50 uppercase">
								{group.label}
							</p>
						)}
						{group.items.map((item) => {
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
										className={cn(
											"size-4.5 shrink-0",
											active ? "text-white" : "text-sidebar-foreground/70 group-hover:text-white",
										)}
										aria-hidden
									/>
									<span className="flex-1 truncate">{item.label}</span>
									{item.badge === "notifications" && unread > 0 && (
										<span
											className={cn(
												"min-w-5 rounded-full px-1.5 text-center text-[11px] font-semibold tabular-nums",
												active ? "bg-white/25 text-white" : "bg-brand-magenta text-white",
											)}
										>
											{unread > 99 ? "99+" : unread}
										</span>
									)}
								</Link>
							);
						})}
					</div>
				))}
			</nav>
			<div className="space-y-3 border-t border-sidebar-border p-4">
				{USE_MOCK_API && (
					<p className="rounded-lg bg-sidebar-accent px-3 py-2 text-xs text-sidebar-foreground">
						<span className="font-semibold text-white">Demo mode.</span> Sample data in your browser; payments settle on a fast
						clock.
					</p>
				)}
				<a
					href="https://stellar.expert/explorer/testnet"
					target="_blank"
					rel="noreferrer"
					className="flex items-center gap-2 px-1 text-xs text-sidebar-foreground/70 transition-colors hover:text-white"
				>
					<span className="size-1.5 rounded-full bg-brand-cyan" aria-hidden />
					Stellar Testnet
					<ExternalLink className="size-3" />
				</a>
			</div>
		</div>
	);
}

export function AppSidebar() {
	return (
		<aside className="hidden w-64 shrink-0 bg-sidebar text-sidebar-foreground lg:block">
			<SidebarNav />
		</aside>
	);
}
