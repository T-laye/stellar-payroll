import { Info } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import { DRAFT_LEAD_DAYS } from "@/features/payroll/utils";

/**
 * PRD §6 and frontend-integration.md §3: a schedule drafts each run 3 days ahead; an admin approves it,
 * then it is paid at the pay date. Copy must never say payroll runs by itself.
 */
export function ScheduleNotice({ className }: { className?: string }) {
	return (
		<div className={cn("flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm", className)}>
			<Info className="mt-0.5 size-4 shrink-0 text-primary" />
			<p className="text-foreground">
				<span className="font-medium">A draft is created {DRAFT_LEAD_DAYS} days before each pay date; approve it to schedule payment.</span>{" "}
				<span className="text-muted-foreground">
					Nothing is paid without that approval. If a pay date passes without an approved run, nothing is sent and admins are notified.
				</span>
			</p>
		</div>
	);
}
