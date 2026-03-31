"use client";

// ============================================================
// ENHANCED STELLAR LANDING PAGE — All components in one file
// Drop-in replacements for your existing components
// ============================================================

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import FadeUp from "../shared/FadeUp";
import { routes } from "../../lib/utils/routes";

// ─── PRICING ──────────────────────────────────────────────────────────────────
const plans = [
	{
		name: "Starter",
		price: "Free",
		period: "Forever",
		description: "Perfect for small teams getting started",
		features: [
			"Up to 10 employees",
			"Basic payroll management",
			"Email support",
			"Monthly payroll runs",
			"Standard security",
		],
		cta: "Get Started",
		highlighted: false,
	},
	{
		name: "Professional",
		price: "$299",
		period: "/month",
		description: "For growing companies",
		features: [
			"Up to 500 employees",
			"Advanced payroll features",
			"Priority email & chat support",
			"Weekly & bi-weekly payrolls",
			"Advanced analytics",
			"Custom integrations",
			"Compliance reporting",
		],
		cta: "Start Free Trial",
		highlighted: true,
	},
	{
		name: "Enterprise",
		price: "Custom",
		period: "pricing",
		description: "For large organizations",
		features: [
			"Unlimited employees",
			"White-label solutions",
			"Dedicated support team",
			"Custom workflows",
			"Advanced security & compliance",
			"SLA guarantees",
			"Custom integrations",
			"Training included",
		],
		cta: "Contact Sales",
		highlighted: false,
	},
];

export function PricingSection() {
	return (
		<section id="pricing" className="py-16 sm:py-20 md:py-32 bg-muted/30">
			<div className="container mx-auto max-w-7xl px-4 sm:px-6">
				<FadeUp className="text-center space-y-4 mb-12 sm:mb-16">
					<h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
						Transparent <span className="text-primary">Pricing</span>
					</h2>
					<p className="text-base sm:text-lg text-foreground/70 max-w-2xl mx-auto">
						Choose the perfect plan for your business. Always transparent, no
						hidden fees.
					</p>
				</FadeUp>

				<div className="grid gap-6 sm:gap-8 md:grid-cols-3 items-start">
					{plans.map((plan, i) => (
						<FadeUp key={plan.name} delay={i * 100} className="h-full">
							<Card
								className={cn(
									"relative p-6 sm:p-8 flex flex-col h-full transition-all duration-300 hover:shadow-lg",
									plan.highlighted
										? "ring-2 ring-primary shadow-lg shadow-primary/10 md:scale-105 md:hover:scale-[1.07]"
										: "hover:-translate-y-1",
								)}
							>
								{plan.highlighted && (
									<div className="absolute -top-4 left-1/2 -translate-x-1/2">
										<div className="bg-primary text-primary-foreground px-4 py-1.5 rounded-full text-xs font-semibold shadow-md shadow-primary/30">
											Most Popular
										</div>
									</div>
								)}

								<div className="space-y-2 mb-6">
									<h3 className="text-xl sm:text-2xl font-bold text-foreground">
										{plan.name}
									</h3>
									<p className="text-sm text-foreground/60">
										{plan.description}
									</p>
								</div>

								<div className="mb-6">
									<div className="flex items-baseline gap-1">
										<span className="text-3xl sm:text-4xl font-bold text-foreground">
											{plan.price}
										</span>
										<span className="text-sm text-foreground/60">
											{plan.period}
										</span>
									</div>
								</div>

								<Button
									className={cn(
										"w-full mb-8 transition-transform active:scale-95",
										plan.highlighted && "shadow-md shadow-primary/20",
									)}
									variant={plan.highlighted ? "default" : "outline"}
									asChild
								>
									<Link href={routes.authRoutes.SIGN_UP}>{plan.cta}</Link>
								</Button>

								<div className="space-y-3 flex-1">
									{plan.features.map((feature) => (
										<div key={feature} className="flex items-start gap-3">
											<Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
											<span className="text-sm text-foreground/70">
												{feature}
											</span>
										</div>
									))}
								</div>
							</Card>
						</FadeUp>
					))}
				</div>
			</div>
		</section>
	);
}
