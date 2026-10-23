import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@repo/ui/button";

/** "21–40 of 87" and previous / next, under a paged table. Hidden when everything fits on one page. */
export function Pager({ page, limit, total, onPage }: { page: number; limit: number; total: number; onPage: (page: number) => void }) {
	const pages = Math.max(1, Math.ceil(total / limit));
	if (pages <= 1) return null;
	return (
		<div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm text-muted-foreground">
			<span className="tabular-nums">
				{(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
			</span>
			<div className="flex gap-1">
				<Button variant="outline" size="icon-sm" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page">
					<ChevronLeft />
				</Button>
				<Button variant="outline" size="icon-sm" disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Next page">
					<ChevronRight />
				</Button>
			</div>
		</div>
	);
}
