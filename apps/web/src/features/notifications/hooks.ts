"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	getNotifications,
	markAllNotificationsRead,
	markNotificationRead,
	type AppNotification,
} from "@/features/notifications/api";
import { routes } from "@/lib/routes";

/** Polls gently: the bell should notice a payroll finishing without a reload. */
export function useNotifications(unread = false) {
	return useQuery({
		queryKey: ["notifications", { unread }],
		queryFn: () => getNotifications(unread),
		refetchInterval: 15_000,
		staleTime: 5_000,
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

/** Where a notification leads. Employees open their own payment; admins the run or payment. */
export function notificationHref(n: AppNotification, isAdmin: boolean) {
	if (!n.resource_id) return null;
	switch (n.resource_type) {
		case "payroll_run":
			return isAdmin ? routes.payroll.detail(n.resource_id) : null;
		case "transaction":
			return isAdmin ? routes.transactions.detail(n.resource_id) : routes.me.payment(n.resource_id);
		case "schedule":
			return isAdmin ? routes.recurring.detail(n.resource_id) : null;
		case "employee":
			return isAdmin ? routes.employees.detail(n.resource_id) : null;
		default:
			return null;
	}
}
