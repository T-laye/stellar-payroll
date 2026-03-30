"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Star } from "lucide-react";

// ─── Scroll Animation Hook ────────────────────────────────────────────────────
function useInView(threshold = 0.15) {
	const ref = useRef<HTMLDivElement>(null);
	const [inView, setInView] = useState(false);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					setInView(true);
					observer.disconnect();
				}
			},
			{ threshold },
		);
		observer.observe(el);
		return () => observer.disconnect();
	}, [threshold]);

	return { ref, inView };
}

// ─── Animation Wrappers ───────────────────────────────────────────────────────
function FadeUp({
	children,
	delay = 0,
	className,
}: {
	children: React.ReactNode;
	delay?: number;
	className?: string;
}) {
	const { ref, inView } = useInView();
	return (
		<div
			ref={ref}
			className={className}
			style={{
				opacity: inView ? 1 : 0,
				transform: inView ? "translateY(0)" : "translateY(32px)",
				transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
			}}
		>
			{children}
		</div>
	);
}


// ─── TESTIMONIALS ─────────────────────────────────────────────────────────────
const testimonials = [
	{
		name: "Sarah Chen",
		role: "CFO at TechVenture",
		content:
			"Stellar has transformed how we manage payroll. We went from spending 20 hours a week on manual processes to just 2 hours. The transparency is incredible.",
		rating: 5,
	},
	{
		name: "Marcus Johnson",
		role: "Operations Manager at GlobalCorp",
		content:
			"Our international team is spread across 15 countries. Stellar makes it simple to pay everyone on time, every time. Customer support is outstanding.",
		rating: 5,
	},
	{
		name: "Emma Rodriguez",
		role: "HR Director at CreativeStudio",
		content:
			"The interface is intuitive, the fees are transparent, and the payments are instant. We have saved thousands of dollars compared to our previous solution.",
		rating: 5,
	},
	{
		name: "David Kim",
		role: "Founder at StartupXYZ",
		content:
			"As a startup founder, I needed a payroll solution that scales. Stellar grows with us, and the pricing is fair. Highly recommended for growing teams.",
		rating: 5,
	},
];

const stats = [
	{ value: "10,000+", label: "Companies" },
	{ value: "500K+", label: "Employees Paid" },
	{ value: "$5B+", label: "Payroll Processed" },
];

export function TestimonialsSection() {
	return (
		<section className="py-16 sm:py-20 md:py-32">
			<div className="container mx-auto max-w-7xl px-4 sm:px-6">
				<FadeUp className="text-center space-y-4 mb-12 sm:mb-16">
					<h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
						Trusted by <span className="text-primary">Global Teams</span>
					</h2>
					<p className="text-base sm:text-lg text-foreground/70 max-w-2xl mx-auto">
						Join thousands of companies that rely on Stellar for their
						international payroll.
					</p>
				</FadeUp>

				<div className="grid gap-5 sm:gap-6 md:grid-cols-2">
					{testimonials.map((t, i) => (
						<FadeUp key={t.name} delay={i * 80}>
							<Card className="p-6 sm:p-8 flex flex-col h-full hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 group">
								<div className="flex gap-1 mb-4">
									{Array.from({ length: t.rating }).map((_, j) => (
										<Star
											key={j}
											className="h-4 w-4 fill-primary text-primary"
										/>
									))}
								</div>
								<p className="text-sm sm:text-base text-foreground/80 leading-relaxed flex-1 mb-6 italic">
									"{t.content}"
								</p>
								<div className="flex items-center gap-3">
									<div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
										{t.name[0]}
									</div>
									<div>
										<p className="font-semibold text-foreground text-sm">
											{t.name}
										</p>
										<p className="text-xs text-foreground/60">{t.role}</p>
									</div>
								</div>
							</Card>
						</FadeUp>
					))}
				</div>

				<div className="grid gap-6 sm:gap-8 md:grid-cols-3 pt-12 sm:pt-16 border-t mt-12 sm:mt-16">
					{stats.map((stat, i) => (
						<FadeUp key={stat.label} delay={i * 100} className="text-center">
							<p className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary mb-2">
								{stat.value}
							</p>
							<p className="text-sm sm:text-base text-foreground/70">
								{stat.label}
							</p>
						</FadeUp>
					))}
				</div>
			</div>
		</section>
	);
}


