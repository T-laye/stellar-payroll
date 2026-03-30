"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Zap, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import Logo from "../ui/logo";

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
			<div className="container mx-auto flex h-16 sm:h-22 max-w-7xl items-center justify-between px-4 sm:px-6">
				{/* Logo */}
				<Logo />
				{/* <Link href="/" className="flex items-center gap-2 shrink-0">
					<div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
						<Zap className="h-4 w-4 text-primary-foreground" />
					</div>
					<span className="font-bold text-lg text-foreground tracking-tight">
						Stellar
					</span>
				</Link> */}

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
