import { Info } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import { DRAFT_LEAD_DAYS } from "@/features/payroll/utils";

/**
 * PRD §6: the UI must not imply funds move without an admin action. A schedule drafts each run;
 * an admin reviews and approves it.
 */
export function ScheduleNotice({ className }: { className?: string }) {
	return (
		<div className={cn("flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm", className)}>
			<Info className="mt-0.5 size-4 shrink-0 text-primary" />
			<p className="text-foreground">
				<span className="font-medium">Schedules prepare payroll; they don&apos;t pay it.</span>{" "}
				<span className="text-muted-foreground">
					{DRAFT_LEAD_DAYS} days before each pay date a draft payroll is created and admins are notified. Nothing is sent until
					someone reviews and approves it.
				</span>
			</p>
		</div>
	);
}
