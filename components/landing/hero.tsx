"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Globe, Zap, Shield } from "lucide-react";

export function HeroSection() {
	const [mounted, setMounted] = useState(false);
	useEffect(() => {
		const t = setTimeout(() => setMounted(true), 50);
		return () => clearTimeout(t);
	}, []);

	return (
		<section className="relative overflow-hidden pt-20 pb-32 md:pt-32 md:pb-48">
			{/* Background blobs */}
			<div className="pointer-events-none absolute inset-0 overflow-hidden">
				<div className="absolute -top-32 left-1/2 -translate-x-1/2 h-150 w-150 rounded-full bg-primary/8 blur-3xl" />
				<div className="absolute top-40 -right-32 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
				<div className="absolute -bottom-10 -left-20 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
			</div>

			<div className="container mx-auto max-w-7xl px-4 sm:px-6 relative">
				<div className="grid gap-12 md:grid-cols-2 md:items-center">
					{/* Left column */}
					<div className="space-y-8">
						<div
							className="space-y-6"
							style={{
								opacity: mounted ? 1 : 0,
								transform: mounted ? "translateY(0)" : "translateY(24px)",
								transition: "opacity 0.7s ease 0.1s, transform 0.7s ease 0.1s",
							}}
						>
							{/* Badge */}
							<div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5">
								<span className="relative flex h-2 w-2">
									<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
									<span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
								</span>
								<span className="text-xs font-medium text-primary">
									Blockchain-Powered Payroll
								</span>
							</div>

							<h1 className="text-4xl font-bold leading-tight text-foreground md:text-5xl lg:text-6xl">
								Global Payroll{" "}
								<span className="relative">
									<span className="text-primary">Made Simple</span>
									<svg
										className="absolute -bottom-2 left-0 w-full"
										viewBox="0 0 300 8"
										preserveAspectRatio="none"
									>
										<path
											d="M0 6 Q75 0 150 6 Q225 12 300 6"
											stroke="currentColor"
											strokeWidth="2.5"
											fill="none"
											className="text-primary/40"
										/>
									</svg>
								</span>
							</h1>
							<p className="text-lg text-foreground/70 md:text-xl max-w-lg">
								Pay your global team in minutes with Stellar. Fast, secure, and
								transparent cross-border payments powered by blockchain.
							</p>
						</div>

						<div
							className="flex flex-col gap-4 sm:flex-row sm:gap-3"
							style={{
								opacity: mounted ? 1 : 0,
								transform: mounted ? "translateY(0)" : "translateY(24px)",
								transition: "opacity 0.7s ease 0.3s, transform 0.7s ease 0.3s",
							}}
						>
							<Button
								size="lg"
								asChild
								className="gap-2 group shadow-md shadow-primary/20"
							>
								<Link href="/signup">
									Get Started Now
									<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
								</Link>
							</Button>
							<Button size="lg" variant="outline" asChild>
								<Link href="#features">Learn More</Link>
							</Button>
						</div>

						<div
							className="grid grid-cols-3 gap-4 sm:gap-6 border-t pt-8"
							style={{
								opacity: mounted ? 1 : 0,
								transition: "opacity 0.7s ease 0.5s",
							}}
						>
							{[
								{ value: "130+", label: "Countries Supported" },
								{ value: "$1B+", label: "Payroll Processed" },
								{ value: "2M+", label: "Employees Paid" },
							].map((stat, i) => (
								<div key={stat.label}>
									<p className="text-2xl font-bold text-primary md:text-3xl">
										{stat.value}
									</p>
									<p className="text-xs sm:text-sm text-foreground/60 mt-0.5">
										{stat.label}
									</p>
								</div>
							))}
						</div>
					</div>

					{/* Right column — floating card */}
					<div
						className="relative"
						style={{
							opacity: mounted ? 1 : 0,
							transform: mounted
								? "translateY(0) scale(1)"
								: "translateY(20px) scale(0.97)",
							transition: "opacity 0.8s ease 0.4s, transform 0.8s ease 0.4s",
						}}
					>
						<div className="absolute -top-10 -right-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
						<div className="absolute top-40 -left-10 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />

						<div
							className="relative rounded-2xl border bg-card/80 backdrop-blur p-6 sm:p-8 shadow-xl shadow-primary/5"
							style={{ animation: "floatCard 6s ease-in-out infinite" }}
						>
							{/* Live indicator */}
							<div className="flex items-center justify-between mb-6">
								<div className="flex items-center gap-2">
									<Globe className="h-5 w-5 text-primary" />
									<span className="font-semibold text-foreground text-sm sm:text-base">
										Instant Global Transfers
									</span>
								</div>
								<div className="flex items-center gap-1.5 text-xs text-green-500 bg-green-500/10 px-2 py-1 rounded-full">
									<span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
									Live
								</div>
							</div>

							{/* Simulated transfer rows */}
							{[
								{
									country: "🇺🇸 United States",
									amount: "$4,200.00",
									time: "Just now",
									color: "text-green-500",
								},
								{
									country: "🇬🇧 United Kingdom",
									amount: "£3,100.00",
									time: "2s ago",
									color: "text-green-500",
								},
								{
									country: "🇩🇪 Germany",
									amount: "€2,890.00",
									time: "5s ago",
									color: "text-blue-500",
								},
								{
									country: "🇯🇵 Japan",
									amount: "¥180,000",
									time: "12s ago",
									color: "text-blue-500",
								},
							].map((row, i) => (
								<div
									key={row.country}
									className="flex items-center justify-between py-2.5 border-b last:border-0"
									style={{
										opacity: mounted ? 1 : 0,
										transition: `opacity 0.4s ease ${0.6 + i * 0.1}s`,
									}}
								>
									<div>
										<p className="text-sm font-medium text-foreground">
											{row.country}
										</p>
										<p className="text-xs text-foreground/50">{row.time}</p>
									</div>
									<span className={`text-sm font-semibold ${row.color}`}>
										{row.amount}
									</span>
								</div>
							))}

							<div className="mt-5 space-y-2.5">
								<div className="flex items-center gap-2">
									<Zap className="h-4 w-4 text-accent shrink-0" />
									<span className="text-sm text-foreground">
										Lightning-fast settlements
									</span>
								</div>
								<div className="flex items-center gap-2">
									<Shield className="h-4 w-4 text-accent shrink-0" />
									<span className="text-sm text-foreground">
										Bank-grade security
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Float animation */}
			<style>{`
        @keyframes floatCard {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
		</section>
	);
}
