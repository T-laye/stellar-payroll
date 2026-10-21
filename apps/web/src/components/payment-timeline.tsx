import { Check, Clock, Loader2, X } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import { formatDateTime } from "@/lib/format";
import { paymentPhase } from "@/lib/status";

/**
 * Pending → Processing → Completed, or → Failed (PRD §5). Each step lights up as the API moves the
 * payment; Completed only appears once it is CONFIRMED.
 */
export function PaymentTimeline({
	status,
	createdAt,
	submittedAt,
	confirmedAt,
	className,
}: {
	status: string;
	createdAt?: string | null;
	submittedAt?: string | null;
	confirmedAt?: string | null;
	className?: string;
}) {
	const phase = paymentPhase(status);
	const failed = phase === "failed";
	const reached = { pending: 0, processing: 1, completed: 2, failed: 2 }[phase];
	const steps = [
		{ label: "Pending", detail: "Payment created", at: createdAt },
		{ label: "Processing", detail: "Sent to the Stellar network", at: submittedAt },
		failed
			? { label: "Failed", detail: "Not received", at: submittedAt }
			: { label: "Completed", detail: "Confirmed on the network", at: confirmedAt },
	];

	return (
		<ol className={cn("grid grid-cols-3 gap-2", className)} aria-label="Payment progress">
			{steps.map((step, index) => {
				const done = index < reached || (index === reached && (phase === "completed" || failed));
				const current = index === reached && !done;
				const isFailStep = failed && index === 2;
				return (
					<li key={step.label} className="relative flex flex-col items-center text-center">
						{index > 0 && (
							<span
								aria-hidden
								className={cn(
									"absolute top-4 right-1/2 h-0.5 w-full -translate-y-1/2",
									index <= reached ? (isFailStep ? "bg-destructive/40" : "bg-primary") : "bg-border",
								)}
							/>
						)}
						<span
							className={cn(
								"relative z-10 flex size-8 items-center justify-center rounded-full border-2 transition-colors",
								done && !isFailStep && "border-success bg-success text-white",
								isFailStep && "border-destructive bg-destructive text-white",
								current && "animate-signal border-info bg-card text-info",
								!done && !current && "border-border bg-card text-muted-foreground",
							)}
						>
							{isFailStep ? (
								<X className="size-4" />
							) : done ? (
								<Check className="size-4" />
							) : current ? (
								index === 0 ? (
									<Clock className="size-4" />
								) : (
									<Loader2 className="size-4 animate-spin" />
								)
							) : (
								<span className="text-xs font-semibold">{index + 1}</span>
							)}
						</span>
						<span
							className={cn(
								"mt-2 text-xs font-semibold",
								isFailStep ? "text-destructive" : done || current ? "text-foreground" : "text-muted-foreground",
							)}
						>
							{step.label}
						</span>
						<span className="text-[11px] text-muted-foreground">
							{index <= reached && step.at ? formatDateTime(step.at) : step.detail}
						</span>
					</li>
				);
			})}
		</ol>
	);
}
