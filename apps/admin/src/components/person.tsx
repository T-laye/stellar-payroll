import type { ReactNode } from "react";
import { cn } from "@repo/ui/lib/utils";
import { initials } from "@/lib/format";

/** Brand-adjacent tints for initials, picked by name so a person keeps their colour. */
const TINTS = [
	"bg-primary/12 text-primary",
	"bg-[#00d69e]/15 text-[#007a5a]",
	"bg-brand-magenta/12 text-[#b8007a]",
	"bg-brand-blue/15 text-[#0077a3]",
	"bg-warning/15 text-[#a35f00]",
];

function tint(name: string) {
	let hash = 0;
	for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
	return TINTS[hash % TINTS.length];
}

export function Avatar({ name, size = "md", className }: { name: string; size?: "sm" | "md" | "lg"; className?: string }) {
	return (
		<span
			aria-hidden
			className={cn(
				"flex shrink-0 items-center justify-center rounded-full font-semibold",
				size === "sm" && "size-7 text-[11px]",
				size === "md" && "size-9 text-xs",
				size === "lg" && "size-14 text-lg",
				tint(name),
				className,
			)}
		>
			{initials(name)}
		</span>
	);
}

/** Avatar, name and a second line (email, role), for table cells and headers. */
export function PersonCell({
	name,
	subtitle,
	size = "md",
	className,
}: {
	name: string;
	subtitle?: ReactNode;
	size?: "sm" | "md";
	className?: string;
}) {
	return (
		<span className={cn("flex min-w-0 items-center gap-3", className)}>
			<Avatar name={name || "?"} size={size} />
			<span className="min-w-0">
				<span className="block truncate text-sm font-medium text-foreground">{name || "Unknown"}</span>
				{subtitle && <span className="block truncate text-xs text-muted-foreground">{subtitle}</span>}
			</span>
		</span>
	);
}
