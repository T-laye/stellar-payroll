"use client";

import { useState } from "react";
import { BellOff, CheckCheck } from "lucide-react";
import { Button } from "@repo/ui/button";
import { Skeleton } from "@repo/ui/skeleton";
import { toast } from "@repo/ui/sonner";
import { FilterTabs } from "@/components/filter-tabs";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { EmptyState, ErrorState } from "@/components/states";
import { isPayrollAdmin, useAuthStore } from "@/features/auth/store";
import type { AppNotification } from "@/features/notifications/api";
import { NotificationItem } from "@/features/notifications/components/notification-item";
import {
	notificationHref,
	useMarkAllNotificationsRead,
	useMarkNotificationRead,
	useNotifications,
} from "@/features/notifications/hooks";

function groupByDay(list: AppNotification[]) {
	const today = new Date().toDateString();
	const yesterday = new Date(Date.now() - 86_400_000).toDateString();
	const groups = new Map<string, AppNotification[]>();
	for (const n of list) {
		const day = new Date(n.created_at).toDateString();
		const label =
			day === today
				? "Today"
				: day === yesterday
					? "Yesterday"
					: new Date(n.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
		groups.set(label, [...(groups.get(label) ?? []), n]);
	}
	return [...groups.entries()];
}

/** PRD §10: payroll and payment updates for this user. */
export default function NotificationsPage() {
	const [filter, setFilter] = useState<"all" | "unread">("all");
	const isAdmin = useAuthStore((state) => isPayrollAdmin(state.user));
	const { data, isLoading, isError, refetch } = useNotifications();
	const markRead = useMarkNotificationRead();
	const markAll = useMarkAllNotificationsRead();
	const list = data?.data ?? [];
	const unread = data?.meta?.unread_count ?? 0;
	const shown = filter === "unread" ? list.filter((n) => !n.read_at) : list;

	return (
		<>
			<PageHeader
				title="Notifications"
				description={isAdmin ? "Payroll reviews, payouts, failures and upcoming schedules." : "Updates about your payments."}
				actions={
					unread > 0 && (
						<Button
							variant="outline"
							onClick={() => markAll.mutate(undefined, { onSuccess: () => toast.success("All notifications marked as read") })}
							disabled={markAll.isPending}
						>
							<CheckCheck /> Mark all as read
						</Button>
					)
				}
			/>
			<SectionCard flush>
				<div className="border-b border-border px-4 pt-4 pb-3">
					<FilterTabs
						options={[
							{ value: "all", label: "All" },
							{ value: "unread", label: "Unread" },
						]}
						value={filter}
						onChange={setFilter}
						counts={{ all: list.length, unread }}
					/>
				</div>
				{isLoading ? (
					<div className="divide-y divide-border">
						{Array.from({ length: 5 }, (_, i) => (
							<div key={i} className="flex gap-3 px-4 py-4">
								<Skeleton className="size-9 rounded-full" />
								<div className="flex-1 space-y-2">
									<Skeleton className="h-4 w-48" />
									<Skeleton className="h-3 w-full max-w-md" />
								</div>
							</div>
						))}
					</div>
				) : isError ? (
					<ErrorState title="Failed to load notifications" message="Please try again." onRetry={() => refetch()} />
				) : shown.length === 0 ? (
					<EmptyState
						icon={BellOff}
						title="You're all caught up!"
						description={filter === "unread" ? "No unread notifications." : "No notifications at the moment."}
					/>
				) : (
					groupByDay(shown).map(([label, items]) => (
						<div key={label}>
							<p className="bg-muted/50 px-4 py-1.5 text-xs font-semibold text-muted-foreground">{label}</p>
							<div className="divide-y divide-border">
								{items.map((n) => (
									<NotificationItem
										key={n.id}
										notification={n}
										href={notificationHref(n, isAdmin)}
										onOpen={() => !n.read_at && markRead.mutate(n.id)}
									/>
								))}
							</div>
						</div>
					))
				)}
			</SectionCard>
		</>
	);
}
