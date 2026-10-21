"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import { Button } from "@repo/ui/button";
import { cn } from "@repo/ui/lib/utils";
import Logo from "@/components/Logo";
import { NAV } from "@/features/landing/content";
import { APP_LINKS } from "@/lib/site";

export function LandingHeader() {
	const [scrolled, setScrolled] = useState(false);
	const [open, setOpen] = useState(false);

	useEffect(() => {
		const onScroll = () => setScrolled(window.scrollY > 12);
		onScroll();
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	return (
		<>
			<div className="bg-brand-night px-4 py-2 text-center text-xs text-white/80 sm:text-sm">
				<span className="mr-1.5 inline-block size-1.5 rounded-full bg-brand-cyan align-middle" aria-hidden />
				PayOrbit runs on Stellar — pay your team in USDC.{" "}
				<a href={APP_LINKS.signUp} className="font-semibold text-white underline-offset-4 hover:underline">
					Start paying your team today
				</a>
			</div>
			<header
				className={cn(
					"sticky top-0 z-50 border-b transition-colors duration-300",
					scrolled || open ? "border-border bg-background/85 backdrop-blur-md" : "border-transparent bg-transparent",
				)}
			>
				<div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:h-18 sm:px-6">
					<Logo w="w-32 sm:w-36" />
					<nav className="hidden items-center gap-1 md:flex" aria-label="Main">
						{NAV.map((item) => (
							<a
								key={item.href}
								href={item.href}
								className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
							>
								{item.label}
							</a>
						))}
					</nav>
					<div className="hidden items-center gap-2 md:flex">
						<Button asChild variant="ghost">
							<a href={APP_LINKS.signIn}>Sign in</a>
						</Button>
						<Button asChild className="shadow-md shadow-primary/25">
							<a href={APP_LINKS.signUp}>
								Get Started Free <ArrowRight />
							</a>
						</Button>
					</div>
					<Button
						variant="ghost"
						size="icon"
						className="md:hidden"
						onClick={() => setOpen((v) => !v)}
						aria-label={open ? "Close menu" : "Open menu"}
						aria-expanded={open}
					>
						{open ? <X /> : <Menu />}
					</Button>
				</div>
				{open && (
					<div className="animate-rise border-t border-border px-4 pb-5 md:hidden">
						<nav className="flex flex-col py-2" aria-label="Mobile">
							{NAV.map((item) => (
								<a
									key={item.href}
									href={item.href}
									onClick={() => setOpen(false)}
									className="rounded-lg px-2 py-3 text-base font-medium text-foreground"
								>
									{item.label}
								</a>
							))}
						</nav>
						<div className="grid grid-cols-2 gap-2">
							<Button asChild variant="outline">
								<a href={APP_LINKS.signIn}>Sign in</a>
							</Button>
							<Button asChild>
								<a href={APP_LINKS.signUp}>Get started</a>
							</Button>
						</div>
					</div>
				)}
			</header>
		</>
	);
}
