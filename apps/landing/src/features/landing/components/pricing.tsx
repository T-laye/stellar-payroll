import { Check } from "lucide-react";
import { Button } from "@repo/ui/button";
import FadeUp from "@repo/ui/fade-up";
import { cn } from "@repo/ui/lib/utils";
import { PLANS } from "@/features/landing/content";
import { APP_LINKS } from "@/lib/site";

export function PricingSection() {
	return (
		<section id="pricing" className="scroll-mt-20 bg-card py-20 sm:py-28">
			<div className="mx-auto max-w-7xl px-4 sm:px-6">
				<FadeUp className="mx-auto mb-14 max-w-2xl text-center">
					<h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
						Transparent <span className="text-brand-gradient">Pricing</span>
					</h2>
					<p className="mt-4 text-muted-foreground">
						Choose the perfect plan for your business. Always transparent, no hidden fees.
					</p>
				</FadeUp>
				<div className="grid gap-6 lg:grid-cols-3">
					{PLANS.map((plan, i) => (
						<FadeUp key={plan.name} delay={i * 80}>
							<div
								className={cn(
									"relative flex h-full flex-col rounded-3xl border p-7",
									plan.popular
										? "border-transparent bg-brand-night text-white shadow-2xl shadow-brand-purple/30"
										: "border-border bg-background",
								)}
							>
								{plan.popular && (
									<span className="absolute -top-3 left-7 rounded-full bg-brand-gradient px-3 py-1 text-xs font-semibold text-white">
										Most Popular
									</span>
								)}
								<h3 className="text-lg font-semibold">{plan.name}</h3>
								<p className={cn("mt-1 text-sm", plan.popular ? "text-white/65" : "text-muted-foreground")}>{plan.description}</p>
								<p className="mt-6 flex items-baseline gap-1.5">
									<span className="text-4xl font-semibold tracking-tight">{plan.price}</span>
									<span className={cn("text-sm", plan.popular ? "text-white/65" : "text-muted-foreground")}>{plan.period}</span>
								</p>
								<ul className="mt-6 flex-1 space-y-3">
									{plan.features.map((f) => (
										<li key={f} className="flex items-start gap-2.5 text-sm">
											<Check className={cn("mt-0.5 size-4 shrink-0", plan.popular ? "text-brand-cyan" : "text-primary")} />
											{f}
										</li>
									))}
								</ul>
								<Button
									asChild
									size="lg"
									variant={plan.popular ? "default" : "outline"}
									className={cn("mt-8 w-full", plan.popular && "bg-white text-brand-night hover:bg-white/90")}
								>
									<a href={plan.name === "Enterprise" ? "mailto:support@payorbit.io" : APP_LINKS.signUp}>{plan.cta}</a>
								</Button>
							</div>
						</FadeUp>
					))}
				</div>
			</div>
		</section>
	);
}
