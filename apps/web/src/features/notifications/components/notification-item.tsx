"use client";

import Link from "next/link";
import { AlertTriangle, Bell, CheckCircle2, Clock, XCircle } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import type { AppNotification } from "@/features/notifications/api";
import { formatRelative } from "@/lib/format";

const TONES = {
	info: { icon: Clock, className: "bg-info/10 text-info" },
	success: { icon: CheckCircle2, className: "bg-success/10 text-success" },
	warning: { icon: AlertTriangle, className: "bg-warning/10 text-warning" },
	error: { icon: XCircle, className: "bg-destructive/10 text-destructive" },
} as const;

/** One notification: tone icon, title, body, age, unread dot. Opens its record when it has one. */
export function NotificationItem({
	notification,
	href,
	onOpen,
	compact,
}: {
	notification: AppNotification;
	href: string | null;
	onOpen?: () => void;
	compact?: boolean;
}) {
	const tone = TONES[notification.tone] ?? { icon: Bell, className: "bg-muted text-muted-foreground" };
	const Icon = tone.icon;
	const unread = !notification.read_at;
	const body = (
		<>
			<span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", tone.className)}>
				<Icon className="size-4" aria-hidden />
			</span>
			<span className="min-w-0 flex-1">
				<span className="flex items-start justify-between gap-2">
					<span className={cn("text-sm text-foreground", unread ? "font-semibold" : "font-medium")}>{notification.title}</span>
					<span className="shrink-0 text-[11px] text-muted-foreground">{formatRelative(notification.created_at)}</span>
				</span>
				<span className={cn("mt-0.5 block text-sm text-muted-foreground", compact && "line-clamp-2")}>{notification.body}</span>
			</span>
			{unread && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />}
		</>
	);
	const classes = cn(
		"flex w-full gap-3 px-4 py-3 text-left transition-colors",
		unread ? "bg-primary/3" : "",
		(href || onOpen) && "hover:bg-accent/60",
	);
	if (href) {
		return (
			<Link href={href} onClick={onOpen} className={classes}>
				{body}
			</Link>
		);
	}
	return (
		<button type="button" onClick={onOpen} className={classes}>
			{body}
		</button>
	);
}
