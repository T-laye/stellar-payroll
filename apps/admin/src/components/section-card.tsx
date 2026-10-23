import type { ReactNode } from "react";
import { cn } from "@repo/ui/lib/utils";

/** A white panel with a title row (and optional action) above its content. */
export function SectionCard({
	title,
	description,
	action,
	children,
	className,
	contentClassName,
	flush,
}: {
	title?: ReactNode;
	description?: ReactNode;
	action?: ReactNode;
	children: ReactNode;
	className?: string;
	contentClassName?: string;
	/** Content runs to the edges (tables). */
	flush?: boolean;
}) {
	return (
		<section className={cn("min-w-0 overflow-hidden rounded-xl border border-border bg-card shadow-xs", className)}>
			{(title || action) && (
				<div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
					<div className="min-w-0">
						{title && <h2 className="font-semibold text-foreground">{title}</h2>}
						{description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
					</div>
					{action && <div className="shrink-0">{action}</div>}
				</div>
			)}
			<div className={cn(!flush && "p-5", contentClassName)}>{children}</div>
		</section>
	);
}

/** Label / value pairs for detail pages. */
export function DetailList({
	items,
	className,
	columns = 1,
}: {
	items: { label: string; value: ReactNode; hidden?: boolean }[];
	className?: string;
	columns?: 1 | 2;
}) {
	return (
		<dl className={cn("grid gap-x-6 gap-y-4", columns === 2 && "sm:grid-cols-2", className)}>
			{items
				.filter((item) => !item.hidden)
				.map((item) => (
					<div key={item.label} className="min-w-0">
						<dt className="text-xs font-medium text-muted-foreground">{item.label}</dt>
						<dd className="mt-1 min-w-0 text-sm text-foreground">{item.value}</dd>
					</div>
				))}
		</dl>
	);
}
