import { cn } from "@repo/ui/lib/utils";
import { formatMoney } from "@/lib/format";

/** An amount that lines up in columns. */
export function Money({
	value,
	asset = "USDC",
	className,
	withCode,
}: {
	value: number | string | null | undefined;
	asset?: string;
	className?: string;
	withCode?: boolean;
}) {
	return <span className={cn("tabular-nums", className)}>{formatMoney(value, asset, { withCode })}</span>;
}

const ASSET_STYLES: Record<string, string> = {
	USDC: "bg-[#2775ca] text-white",
	XLM: "bg-foreground text-background",
};

/** The asset with a small coin mark. */
export function AssetBadge({ asset, className }: { asset: string; className?: string }) {
	return (
		<span className={cn("inline-flex items-center gap-1.5 text-sm font-medium text-foreground", className)}>
			<span
				className={cn(
					"flex size-4.5 items-center justify-center rounded-full text-[9px] font-bold",
					ASSET_STYLES[asset] ?? "bg-muted text-muted-foreground",
				)}
				aria-hidden
			>
				{asset === "USDC" ? "$" : asset === "XLM" ? "✦" : asset.slice(0, 1)}
			</span>
			{asset}
		</span>
	);
}
