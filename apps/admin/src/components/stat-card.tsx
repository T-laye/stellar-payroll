import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { Skeleton } from "@repo/ui/skeleton";
import { cn } from "@repo/ui/lib/utils";
import { TONE_CLASSES, type Tone } from "@/lib/status";

/** A headline number: label, value, an icon in the status colour, and an optional trend or hint. */
export function StatCard({
	label,
	value,
	icon: Icon,
	tone = "brand",
	hint,
	trend,
	href,
	loading,
	className,
	index = 0,
}: {
	label: string;
	value: ReactNode;
	icon: LucideIcon;
	tone?: Tone;
	hint?: ReactNode;
	/** Percent change, positive or negative. */
	trend?: { value: number; label: string } | null;
	href?: string;
	loading?: boolean;
	className?: string;
	/** Stagger position for the entrance. */
	index?: number;
}) {
	const body = (
		<>
			<div className="flex items-start justify-between gap-3">
				<p className="text-sm font-medium text-muted-foreground">{label}</p>
				<span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", TONE_CLASSES[tone].icon)}>
					<Icon className="size-4.5" aria-hidden />
				</span>
			</div>
			{loading ? (
				<Skeleton className="mt-2 h-8 w-28" />
			) : (
				<p className="mt-1 truncate text-2xl font-semibold tracking-tight text-foreground tabular-nums">{value}</p>
			)}
			{(trend || hint) && !loading && (
				<div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
					{trend && (
						<span
							className={cn(
								"inline-flex items-center gap-0.5 font-medium",
								trend.value >= 0 ? "text-success" : "text-destructive",
							)}
						>
							{trend.value >= 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
							{Math.abs(trend.value).toFixed(0)}%<span className="font-normal text-muted-foreground">{trend.label}</span>
						</span>
					)}
					{hint}
				</div>
			)}
		</>
	);
	const classes = cn(
		"animate-rise block rounded-xl border border-border bg-card p-5 shadow-xs",
		href && "transition-colors hover:border-primary/40 hover:shadow-sm",
		className,
	);
	return href ? (
		<Link href={href} className={classes} style={{ "--i": index } as React.CSSProperties}>
			{body}
		</Link>
	) : (
		<div className={classes} style={{ "--i": index } as React.CSSProperties}>
			{body}
		</div>
	);
}
