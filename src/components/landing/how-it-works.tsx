"use client";
import { Card } from "@/components/ui/card";
import FadeUp from "../shared/FadeUp";



// ─── HOW IT WORKS ─────────────────────────────────────────────────────────────
const steps = [
	{
		number: 1,
		title: "Add Your Employees",
		description:
			"Upload employee data with their wallet addresses and payment preferences. Support for 130+ countries.",
	},
	{
		number: 2,
		title: "Create Payroll Groups",
		description:
			"Organize employees by department or payment frequency. Set up recurring payroll schedules.",
	},
	{
		number: 3,
		title: "Review & Approve",
		description:
			"Review all payment details and exchange rates before processing. Full transparency and control.",
	},
	{
		number: 4,
		title: "Instant Settlement",
		description:
			"Payments settle in real-time using Stellar blockchain. Employees receive funds instantly.",
	},
];

export function HowItWorksSection() {
	return (
		<section id="how-it-works" className="py-16 sm:py-20 md:py-32 bg-muted/30">
			<div className="container mx-auto max-w-7xl px-4 sm:px-6">
				<FadeUp className="text-center space-y-4 mb-12 sm:mb-16">
					<h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
						Simple <span className="text-primary">4-Step</span> Process
					</h2>
					<p className="text-base sm:text-lg text-foreground/70 max-w-2xl mx-auto">
						Get your global payroll running in just a few minutes.
					</p>
				</FadeUp>

				<div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
					{steps.map((step, i) => (
						<FadeUp key={step.number} delay={i * 100}>
							<Card className="relative overflow-hidden p-6 sm:p-8 flex flex-col h-full group hover:shadow-md transition-all duration-300">
								<div className="absolute top-0 right-0 h-24 w-24 bg-primary/5 rounded-full -mr-12 -mt-12 transition-all duration-300 group-hover:bg-primary/10 group-hover:scale-125" />

								{/* Connector line for lg */}
								{step.number < steps.length && (
									<div className="absolute -right-3 top-10 hidden lg:block z-10">
										<div className="w-6 h-0.5 bg-linear-to-r from-primary/60 to-primary/20" />
									</div>
								)}

								<div className="relative space-y-4">
									<div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg shadow-md shadow-primary/25 transition-transform duration-300 group-hover:scale-110">
										{step.number}
									</div>
									<div className="space-y-2">
										<h3 className="text-base sm:text-lg font-semibold text-foreground">
											{step.title}
										</h3>
										<p className="text-sm text-foreground/70 leading-relaxed">
											{step.description}
										</p>
									</div>
								</div>
							</Card>
						</FadeUp>
					))}
				</div>
			</div>
		</section>
	);
}
