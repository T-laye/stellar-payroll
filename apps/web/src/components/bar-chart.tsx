import { cn } from "@repo/ui/lib/utils";

/**
 * A small column chart for a handful of values (monthly payouts). Plain markup, so it needs no
 * chart library in the app; the latest column is highlighted.
 */
export function BarChart({
	data,
	format,
	className,
}: {
	data: { label: string; value: number }[];
	format: (value: number) => string;
	className?: string;
}) {
	const max = Math.max(1, ...data.map((d) => d.value));
	return (
		<div
			className={cn("flex h-36 items-end gap-2", className)}
			role="img"
			aria-label={data.map((d) => `${d.label}: ${format(d.value)}`).join(", ")}
		>
			{data.map((d, index) => {
				const latest = index === data.length - 1;
				return (
					<div key={d.label} className="group flex h-full flex-1 flex-col items-center justify-end gap-1.5">
						<span
							className={cn(
								"text-[10px] font-medium tabular-nums opacity-0 transition-opacity group-hover:opacity-100",
								latest ? "text-primary opacity-100" : "text-muted-foreground",
							)}
						>
							{format(d.value)}
						</span>
						<div className="flex w-full flex-1 items-end justify-center">
							<div
								className={cn(
									"w-full max-w-10 rounded-t-md transition-all",
									latest ? "bg-brand-gradient" : "bg-primary/15 group-hover:bg-primary/30",
								)}
								style={{ height: `${Math.max(4, (d.value / max) * 100)}%` }}
							/>
						</div>
						<span className="text-[11px] text-muted-foreground">{d.label}</span>
					</div>
				);
			})}
		</div>
	);
}
