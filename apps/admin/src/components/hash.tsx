"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { Button } from "@repo/ui/button";
import { toast } from "@repo/ui/sonner";
import { cn } from "@repo/ui/lib/utils";
import { explorerAccountUrl, explorerTxUrl, shortHash } from "@/lib/stellar";

export function CopyButton({ value, label = "Copy", className }: { value: string; label?: string; className?: string }) {
	const [copied, setCopied] = useState(false);
	const copy = async () => {
		try {
			await navigator.clipboard.writeText(value);
			setCopied(true);
			toast.success("Copied to clipboard");
			setTimeout(() => setCopied(false), 1500);
		} catch {
			toast.error("Couldn't copy. Select the text and copy it instead.");
		}
	};
	return (
		<Button
			type="button"
			variant="ghost"
			size="icon-sm"
			onClick={copy}
			aria-label={label}
			title={label}
			className={cn("size-7 text-muted-foreground hover:text-foreground", className)}
		>
			{copied ? <Check className="animate-pop size-3.5 text-success" /> : <Copy className="size-3.5" />}
		</Button>
	);
}

/**
 * A transaction hash (or account address), shortened, with copy and a Stellar Expert link.
 * Shows a dash until the payment has a hash.
 */
export function HashValue({
	value,
	kind = "tx",
	full,
	className,
}: {
	value: string | null | undefined;
	kind?: "tx" | "account";
	full?: boolean;
	className?: string;
}) {
	if (!value) return <span className="text-muted-foreground">--</span>;
	const href = kind === "tx" ? explorerTxUrl(value) : explorerAccountUrl(value);
	return (
		<span className={cn("inline-flex min-w-0 items-center gap-0.5", className)}>
			<span className={cn("font-mono text-xs text-foreground", full ? "break-all" : "truncate")} title={value}>
				{full ? value : shortHash(value)}
			</span>
			<CopyButton value={value} label={kind === "tx" ? "Copy transaction hash" : "Copy address"} />
			<a
				href={href}
				target="_blank"
				rel="noreferrer"
				aria-label="View on Stellar Expert"
				title="View on Stellar Expert (Testnet)"
				className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
			>
				<ExternalLink className="size-3.5" />
			</a>
		</span>
	);
}
