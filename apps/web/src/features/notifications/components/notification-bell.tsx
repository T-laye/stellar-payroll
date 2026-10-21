"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@repo/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@repo/ui/popover";
import { Skeleton } from "@repo/ui/skeleton";
import { isPayrollAdmin, useAuthStore } from "@/features/auth/store";
import { NotificationItem } from "@/features/notifications/components/notification-item";
import {
	notificationHref,
	useMarkAllNotificationsRead,
	useMarkNotificationRead,
	useNotifications,
} from "@/features/notifications/hooks";
import { routes } from "@/lib/routes";

/** The header bell: unread count, the latest few, and a way to the full list. */
export function NotificationBell() {
	const [open, setOpen] = useState(false);
	const isAdmin = useAuthStore((state) => isPayrollAdmin(state.user));
	const { data, isLoading, isError } = useNotifications();
	const markRead = useMarkNotificationRead();
	const markAll = useMarkAllNotificationsRead();
	const unread = data?.meta?.unread_count ?? 0;
	const latest = data?.data.slice(0, 5) ?? [];

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className="relative"
					aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
				>
					<Bell className="size-5" />
					{unread > 0 && (
						<span className="animate-pop absolute top-1 right-1 flex min-w-4 items-center justify-center rounded-full bg-brand-magenta px-1 text-[10px] leading-4 font-semibold text-white tabular-nums">
							{unread > 9 ? "9+" : unread}
						</span>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent align="end" className="w-[min(92vw,380px)] p-0">
				<div className="flex items-center justify-between border-b border-border px-4 py-3">
					<p className="font-semibold text-foreground">Notifications</p>
					{unread > 0 && (
						<Button
							variant="ghost"
							size="sm"
							className="h-7 text-xs text-primary"
							onClick={() => markAll.mutate()}
							disabled={markAll.isPending}
						>
							<CheckCheck className="size-3.5" /> Mark all read
						</Button>
					)}
				</div>
				<div className="max-h-96 divide-y divide-border overflow-y-auto">
					{isLoading ? (
						Array.from({ length: 3 }, (_, i) => (
							<div key={i} className="flex gap-3 px-4 py-3">
								<Skeleton className="size-9 rounded-full" />
								<div className="flex-1 space-y-2">
									<Skeleton className="h-3.5 w-32" />
									<Skeleton className="h-3 w-full" />
								</div>
							</div>
						))
					) : isError ? (
						<p className="px-4 py-8 text-center text-sm text-muted-foreground">Couldn&apos;t load notifications.</p>
					) : latest.length === 0 ? (
						<div className="px-4 py-10 text-center">
							<p className="font-medium text-foreground">You&apos;re all caught up</p>
							<p className="text-sm text-muted-foreground">No notifications at the moment.</p>
						</div>
					) : (
						latest.map((n) => (
							<NotificationItem
								key={n.id}
								compact
								notification={n}
								href={notificationHref(n, isAdmin)}
								onOpen={() => {
									if (!n.read_at) markRead.mutate(n.id);
									setOpen(false);
								}}
							/>
						))
					)}
				</div>
				<Link
					href={routes.dashboardRoutes.NOTIFICATIONS}
					onClick={() => setOpen(false)}
					className="block border-t border-border px-4 py-2.5 text-center text-sm font-medium text-primary hover:bg-accent/60"
				>
					View all notifications
				</Link>
			</PopoverContent>
		</Popover>
	);
}
