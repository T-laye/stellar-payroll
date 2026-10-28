"use client";

import { useState } from "react";
import { cn } from "@repo/ui/lib/utils";
import { initials } from "@/lib/format";

/**
 * A company's own logo (Settings → Logo URL), on a white tile so transparent and dark logos both
 * read on the night sidebar. Missing, non-https or broken images fall back to the initials, so a
 * bad URL never shows the browser's broken-image icon. A plain <img>: the URL is arbitrary, and
 * `next/image` would need every host allow-listed (and the optimizer doesn't reach this app
 * behind Vercel Services).
 */
export function CompanyLogo({ name, src, className }: { name: string; src?: string | null; className?: string }) {
	const url = src?.trim() && /^https:\/\//i.test(src.trim()) ? src.trim() : null;
	// Keyed by URL: a new URL gets a fresh chance to load.
	const [failed, setFailed] = useState<string | null>(null);
	const showImage = url && failed !== url;

	return (
		<span
			className={cn(
				"flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg text-xs font-semibold",
				showImage ? "bg-white p-1" : "bg-primary/15 text-primary",
				className,
			)}
		>
			{showImage ? (
				// eslint-disable-next-line @next/next/no-img-element
				<img
					src={url}
					alt=""
					referrerPolicy="no-referrer"
					loading="lazy"
					decoding="async"
					className="size-full object-contain"
					onError={() => setFailed(url)}
				/>
			) : (
				<span aria-hidden>{initials(name || "?")}</span>
			)}
		</span>
	);
}
