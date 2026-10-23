"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	getNotifications,
	getUnreadCount,
	markAllNotificationsRead,
	markNotificationRead,
	type AppNotification,
} from "@/features/notifications/api";
import { routes } from "@/lib/routes";

/** The list. `enabled` lets the bell fetch it only when opened. */
export function useNotifications(unread = false, enabled = true) {
	return useQuery({
		queryKey: ["notifications", { unread }],
		queryFn: () => getNotifications(unread),
		enabled,
		staleTime: 5_000,
	});
}

/** The bell's number: the cheap endpoint, polled every 30 seconds. */
export function useUnreadCount() {
	return useQuery({
		queryKey: ["notifications", "unread-count"],
		queryFn: getUnreadCount,
		select: (response) => response.data.unread_count,
		refetchInterval: 30_000,
		staleTime: 10_000,
	});
}

export function useMarkNotificationRead() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: markNotificationRead,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
	});
}

export function useMarkAllNotificationsRead() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: markAllNotificationsRead,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
	});
}

/** Where a notification leads. Employees always get a transaction (their own); no resource, no link. */
export function notificationHref(n: AppNotification, isAdmin: boolean) {
	if (!n.resource_id) return null;
	switch (n.resource_type) {
		case "payroll_run":
			return isAdmin ? routes.payroll.detail(n.resource_id) : null;
		case "transaction":
			return isAdmin ? routes.transactions.detail(n.resource_id) : routes.me.payment(n.resource_id);
		case "schedule":
			return isAdmin ? routes.recurring.detail(n.resource_id) : null;
		default:
			return null;
	}
}
