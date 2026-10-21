import { api } from "@/lib/api/request";

/** Proposed (docs/PLAN.md §10): in-app notifications. The mock serves these until the API does. */

export interface AppNotification {
	id: string;
	kind: string;
	title: string;
	body: string;
	tone: "info" | "success" | "warning" | "error";
	resource_type: "payroll_run" | "transaction" | "schedule" | "employee" | null;
	resource_id: string | null;
	read_at: string | null;
	created_at: string;
}

export interface NotificationMeta {
	total: number;
	unread_count: number;
}

export const NOTIFICATION_ENDPOINTS = {
	list: "/notifications",
	read: (id: string) => `/notifications/${id}/read`,
	readAll: "/notifications/read-all",
} as const;

export const getNotifications = (unread = false) =>
	api.get<AppNotification[], NotificationMeta>(NOTIFICATION_ENDPOINTS.list, { unread: unread || undefined });
export const markNotificationRead = (id: string) => api.patch<AppNotification>(NOTIFICATION_ENDPOINTS.read(id));
export const markAllNotificationsRead = () => api.post<{ updated: number }>(NOTIFICATION_ENDPOINTS.readAll);
