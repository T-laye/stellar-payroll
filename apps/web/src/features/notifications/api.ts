import { api, type PageMeta } from "@/lib/api/request";

/** In-app notifications (frontend-integration.md §3). Employees' always point at their own transaction. */

export interface AppNotification {
	id: string;
	/** e.g. payroll.ready_for_review, payment.failed, schedule.approaching, payroll.blocked, employee.payment_completed */
	kind: string;
	title: string;
	body: string;
	tone: "info" | "success" | "warning" | "error";
	resource_type: "payroll_run" | "transaction" | "schedule" | null;
	resource_id: string | null;
	read_at: string | null;
	created_at: string;
}

/** `unread_count` is always the full unread total. */
export type NotificationMeta = PageMeta & { unread_count: number };

export const NOTIFICATION_ENDPOINTS = {
	list: "/notifications",
	unreadCount: "/notifications/unread-count",
	read: (id: string) => `/notifications/${id}/read`,
	readAll: "/notifications/read-all",
} as const;

export const getNotifications = (unread = false, pageSize = 50) =>
	api.get<AppNotification[], NotificationMeta>(NOTIFICATION_ENDPOINTS.list, { unread: unread || undefined, page_size: pageSize });
/** Live answers `{ unread }`; the mock `{ unread_count }`. */
export const getUnreadCount = () =>
	api
		.get<{ unread_count?: number; unread?: number }>(NOTIFICATION_ENDPOINTS.unreadCount)
		.then((response) => ({ ...response, data: { unread_count: response.data.unread_count ?? response.data.unread ?? 0 } }));
export const markNotificationRead = (id: string) => api.patch<AppNotification>(NOTIFICATION_ENDPOINTS.read(id));
export const markAllNotificationsRead = () => api.post<{ updated: number }>(NOTIFICATION_ENDPOINTS.readAll);
