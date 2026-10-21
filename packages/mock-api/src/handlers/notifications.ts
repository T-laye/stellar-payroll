import { read, update } from "../db";
import { HttpError, me, ok, route } from "../router";

/**
 * Proposed (docs/PLAN.md §10): the signed-in user's in-app notifications, newest first.
 * `?unread=true` filters; `meta.unread_count` drives the header bell.
 */

route("GET", "/notifications", "user", (ctx) => {
	const mine = read().notifications.filter((n) => n.user_id === me(ctx).id);
	const unreadOnly = ctx.query.get("unread") === "true";
	const limit = Math.min(100, Math.max(1, Number(ctx.query.get("limit")) || 50));
	const list = unreadOnly ? mine.filter((n) => !n.read_at) : mine;
	return { ...ok(list.slice(0, limit)), meta: { total: list.length, unread_count: mine.filter((n) => !n.read_at).length } };
});

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
