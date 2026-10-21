import type { LucideIcon } from "lucide-react";
import { AlertTriangle, RotateCw } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@repo/ui/button";
import { Skeleton } from "@repo/ui/skeleton";
import { cn } from "@repo/ui/lib/utils";

/** Nothing here yet: what this place is for, and the one action that fills it. */
export function EmptyState({
	icon: Icon,
	title,
	description,
	action,
	className,
	compact,
}: {
	icon: LucideIcon;
	title: string;
	description?: ReactNode;
	action?: ReactNode;
	className?: string;
	compact?: boolean;
}) {
	return (
		<div
			className={cn(
				"animate-pop flex flex-col items-center justify-center text-center",
				compact ? "gap-2 px-4 py-8" : "gap-3 px-6 py-14",
				className,
			)}
		>
			<span
				className={cn("flex items-center justify-center rounded-2xl bg-primary/8 text-primary", compact ? "size-10" : "size-12")}
			>
				<Icon className={compact ? "size-5" : "size-6"} aria-hidden />
			</span>
			<div className="max-w-sm space-y-1">
				<p className="font-semibold text-foreground">{title}</p>
				{description && <p className="text-sm text-muted-foreground">{description}</p>}
			</div>
			{action && <div className="mt-1">{action}</div>}
		</div>
	);
}

/** A request failed: say so plainly and offer to try again. */
export function ErrorState({
	title = "Couldn't load this",
	message,
	onRetry,
	className,
}: {
	title?: string;
	message?: string;
	onRetry?: () => void;
	className?: string;
}) {
	return (
		<div role="alert" className={cn("flex flex-col items-center justify-center gap-3 px-6 py-12 text-center", className)}>
			<span className="flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
				<AlertTriangle className="size-6" aria-hidden />
			</span>
			<div className="max-w-sm space-y-1">
				<p className="font-semibold text-foreground">{title}</p>
				<p className="text-sm text-muted-foreground">{message ?? "Something went wrong on our side. Please try again."}</p>
			</div>
			{onRetry && (
				<Button variant="outline" size="sm" onClick={onRetry}>
					<RotateCw /> Try again
				</Button>
			)}
		</div>
	);
}

/** Placeholder rows while a table loads. */
export function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
	return (
		<div className="divide-y divide-border" aria-busy aria-label="Loading">
			{Array.from({ length: rows }, (_, row) => (
				<div key={row} className="flex items-center gap-4 px-4 py-3.5">
					<Skeleton className="size-8 shrink-0 rounded-full" />
					{Array.from({ length: columns - 1 }, (_, col) => (
						<Skeleton key={col} className={cn("h-4", col === 0 ? "w-40" : "hidden w-20 sm:block")} />
					))}
				</div>
			))}
		</div>
	);
}

export function CardSkeleton({ className }: { className?: string }) {
	return (
		<div className={cn("space-y-3 rounded-xl border border-border bg-card p-5", className)} aria-busy>
			<Skeleton className="h-4 w-24" />
			<Skeleton className="h-8 w-32" />
			<Skeleton className="h-3 w-20" />
		</div>
	);
}
