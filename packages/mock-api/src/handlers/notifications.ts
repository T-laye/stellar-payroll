import { read, update } from "../db";
import { HttpError, me, ok, paged, route } from "../router";

/**
 * The signed-in user's in-app notifications, newest first (frontend-integration.md §3).
 * `?unread=true&page_size=50`; `meta.unread_count` is always the full unread total.
 */

const mine = (userId: string) => read().notifications.filter((n) => n.user_id === userId);

route("GET", "/notifications", "user", (ctx) => {
	const all = mine(me(ctx).id);
	const list = ctx.query.get("unread") === "true" ? all.filter((n) => !n.read_at) : all;
	return paged(ctx, list, { unread_count: all.filter((n) => !n.read_at).length });
});

/** Cheap enough to poll every 30–60 seconds for the bell. */
route("GET", "/notifications/unread-count", "user", (ctx) => ok({ unread_count: mine(me(ctx).id).filter((n) => !n.read_at).length }));

route("PATCH", "/notifications/:id/read", "user", (ctx) => {
	const notification = update((db) => {
		const n = db.notifications.find((x) => x.id === ctx.params.id && x.user_id === me(ctx).id);
		if (!n) throw new HttpError(404, "notification not found");
		n.read_at ??= new Date().toISOString();
		return n;
	});
	return ok(notification, "notification marked as read");
});

route("POST", "/notifications/read-all", "user", (ctx) => {
	const count = update((db) => {
		const unread = db.notifications.filter((n) => n.user_id === me(ctx).id && !n.read_at);
		const now = new Date().toISOString();
		for (const n of unread) n.read_at = now;
		return unread.length;
	});
	return ok({ updated: count }, "all notifications marked as read");
});
