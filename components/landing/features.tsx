"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	Zap,
	Users,
	Clock,
	TrendingUp,
	Lock,
	DollarSign,
	FileText,
	Menu,
	X,
} from "lucide-react";
import { cn } from "@/lib/utils";

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



// ─── HEADER ──────────────────────────────────────────────────────────────────
export function LandingHeader() {
	const [scrolled, setScrolled] = useState(false);
	const [mobileOpen, setMobileOpen] = useState(false);

	useEffect(() => {
		const onScroll = () => setScrolled(window.scrollY > 16);
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	// Close mobile menu on link click
	const handleNavClick = () => setMobileOpen(false);

	return (
		<header
			className={cn(
				"sticky top-0 z-50 w-full border-b transition-all duration-300",
				scrolled
					? "bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 shadow-sm"
					: "bg-transparent border-transparent",
			)}
		>
			<div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
				{/* Logo */}
				<Link href="/" className="flex items-center gap-2 shrink-0">
					<div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
						<Zap className="h-4 w-4 text-primary-foreground" />
					</div>
					<span className="font-bold text-lg text-foreground tracking-tight">
						Stellar
					</span>
				</Link>

				{/* Desktop Nav */}
				<nav className="hidden gap-8 md:flex">
					{["Features", "How It Works", "Pricing"].map((item) => (
						<Link
							key={item}
							href={`#${item.toLowerCase().replace(/ /g, "-")}`}
							className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors relative group"
						>
							{item}
							<span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full rounded-full" />
						</Link>
					))}
				</nav>

				{/* Desktop Actions */}
				<div className="hidden md:flex gap-3">
					<Button variant="ghost" asChild>
						<Link href="/signin">Sign In</Link>
					</Button>
					<Button asChild className="shadow-sm">
						<Link href="/signup">Get Started</Link>
					</Button>
				</div>

				{/* Mobile Menu Button */}
				<button
					className="md:hidden p-2 rounded-md text-foreground/70 hover:text-foreground hover:bg-muted transition-colors"
					onClick={() => setMobileOpen((v) => !v)}
					aria-label="Toggle menu"
				>
					{mobileOpen ? (
						<X className="h-5 w-5" />
					) : (
						<Menu className="h-5 w-5" />
					)}
				</button>
			</div>

			{/* Mobile Menu */}
			<div
				className={cn(
					"md:hidden border-t bg-background overflow-hidden transition-all duration-300",
					mobileOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0",
				)}
			>
				<nav className="flex flex-col px-4 py-4 gap-1">
					{[
						{ label: "Features", href: "#features" },
						{ label: "How It Works", href: "#how-it-works" },
						{ label: "Pricing", href: "#pricing" },
					].map((item) => (
						<Link
							key={item.label}
							href={item.href}
							onClick={handleNavClick}
							className="px-3 py-3 text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-muted rounded-lg transition-colors"
						>
							{item.label}
						</Link>
					))}
					<div className="flex gap-3 pt-3 border-t mt-2">
						<Button variant="outline" asChild className="flex-1">
							<Link href="/signin" onClick={handleNavClick}>
								Sign In
							</Link>
						</Button>
						<Button asChild className="flex-1">
							<Link href="/signup" onClick={handleNavClick}>
								Get Started
							</Link>
						</Button>
					</div>
				</nav>
			</div>
		</header>
	);
}

// ─── FEATURES ─────────────────────────────────────────────────────────────────
const features = [
	{
		icon: Users,
		title: "Employee Management",
		description:
			"Manage employee data, wallet addresses, and payment preferences in one place.",
	},
	{
		icon: Clock,
		title: "Automated Payroll",
		description:
			"Schedule recurring payrolls and let Stellar handle the rest automatically.",
	},
	{
		icon: TrendingUp,
		title: "Real-time Analytics",
		description:
			"Track payroll costs, payment status, and financial insights in real-time.",
	},
	{
		icon: Lock,
		title: "Bank-Grade Security",
		description:
			"Secure payments with blockchain technology and multi-signature authentication.",
	},
	{
		icon: DollarSign,
		title: "Multi-Currency Support",
		description:
			"Support 150+ currencies with real-time exchange rates and transparent fees.",
	},
	{
		icon: FileText,
		title: "Compliance & Reporting",
		description:
			"Automatic compliance reporting and audit trails for regulatory requirements.",
	},
];

export function FeaturesSection() {
	return (
		<section id="features" className="py-20 md:py-32">
			<div className="container mx-auto max-w-7xl px-4 sm:px-6">
				<FadeUp className="text-center space-y-4 mb-12 sm:mb-16">
					<h2 className="text-3xl font-bold md:text-4xl lg:text-5xl text-foreground">
						Everything You Need for{" "}
						<span className="text-primary">Global Payroll</span>
					</h2>
					<p className="text-lg text-foreground/70 max-w-2xl mx-auto">
						Powerful features designed to make cross-border payroll simple,
						fast, and reliable.
					</p>
				</FadeUp>

				<div className="grid gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
					{features.map((feature, i) => {
						const Icon = feature.icon;
						return (
							<FadeUp key={feature.title} delay={i * 80}>
								<Card className="group relative overflow-hidden border bg-card/50 p-6 transition-all duration-300 hover:bg-card hover:shadow-lg hover:-translate-y-1 h-full">
									<div className="absolute inset-0 bg-linear-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
									<div className="relative space-y-4">
										<div className="inline-flex rounded-xl bg-primary/10 p-3 transition-transform duration-300 group-hover:scale-110 group-hover:bg-primary/15">
											<Icon className="h-6 w-6 text-primary" />
										</div>
										<div>
											<h3 className="font-semibold text-foreground">
												{feature.title}
											</h3>
											<p className="mt-2 text-sm text-foreground/70 leading-relaxed">
												{feature.description}
											</p>
										</div>
									</div>
								</Card>
							</FadeUp>
						);
					})}
				</div>
			</div>
		</section>
	);
}
