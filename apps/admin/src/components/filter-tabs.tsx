"use client";

import { cn } from "@repo/ui/lib/utils";

/** Pill tabs for filtering a list, each with an optional count. Scrolls sideways on phones. */
export function FilterTabs<T extends string>({
	options,
	value,
	onChange,
	counts,
	className,
	label = "Filter",
}: {
	options: { value: T; label: string }[];
	value: T;
	onChange: (value: T) => void;
	counts?: Partial<Record<T, number>>;
	className?: string;
	label?: string;
}) {
	return (
		<div role="tablist" aria-label={label} className={cn("-mx-1 flex gap-1 overflow-x-auto px-1 pb-1", className)}>
			{options.map((option) => {
				const active = option.value === value;
				const count = counts?.[option.value];
				return (
					<button
						key={option.value}
						type="button"
						role="tab"
						aria-selected={active}
						onClick={() => onChange(option.value)}
						className={cn(
							"inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
							active
								? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
								: "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
						)}
					>
						{option.label}
						{count !== undefined && (
							<span
								className={cn(
									"rounded-full px-1.5 text-xs tabular-nums",
									active ? "bg-white/20" : "bg-muted text-muted-foreground",
								)}
							>
								{count}
							</span>
						)}
					</button>
				);
			})}
		</div>
	);
}
