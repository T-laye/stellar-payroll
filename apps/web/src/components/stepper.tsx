import { Check } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";

export interface Step {
	label: string;
	description?: string;
}

/**
 * Where you are in a guided flow. A numbered column beside the form on wide screens; a compact
 * "Step 2 of 5" bar on phones.
 */
export function Stepper({ steps, current, className }: { steps: Step[]; current: number; className?: string }) {
	const active = steps[current];
	return (
		<nav aria-label="Progress" className={className}>
			<div className="lg:hidden">
				<p className="text-xs font-medium text-muted-foreground">
					Step {current + 1} of {steps.length}
				</p>
				<p className="font-semibold text-foreground">{active?.label}</p>
				<div className="mt-2 flex gap-1">
					{steps.map((step, index) => (
						<span key={step.label} className={cn("h-1 flex-1 rounded-full", index <= current ? "bg-primary" : "bg-muted")} />
					))}
				</div>
			</div>
			<ol className="hidden space-y-1 lg:block">
				{steps.map((step, index) => {
					const done = index < current;
					const isCurrent = index === current;
					return (
						<li key={step.label} className="relative flex gap-3 pb-6 last:pb-0">
							{index < steps.length - 1 && (
								<span
									className={cn("absolute top-8 left-3.5 h-[calc(100%-2rem)] w-px", done ? "bg-primary" : "bg-border")}
									aria-hidden
								/>
							)}
							<span
								className={cn(
									"relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
									done && "bg-primary text-primary-foreground",
									isCurrent && "bg-primary text-primary-foreground ring-4 ring-primary/15",
									!done && !isCurrent && "border border-border bg-card text-muted-foreground",
								)}
								aria-current={isCurrent ? "step" : undefined}
							>
								{done ? <Check className="size-3.5" /> : index + 1}
							</span>
							<span className="pt-0.5">
								<span
									className={cn(
										"block text-sm font-medium",
										isCurrent ? "text-primary" : done ? "text-foreground" : "text-muted-foreground",
									)}
								>
									{step.label}
								</span>
								{step.description && <span className="block text-xs text-muted-foreground">{step.description}</span>}
							</span>
						</li>
					);
				})}
			</ol>
		</nav>
	);
}
