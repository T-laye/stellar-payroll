"use client";

import Link from "next/link";
import { Zap } from "lucide-react";
import Logo from "../ui/logo";

// ─── FOOTER ───────────────────────────────────────────────────────────────────
const footerLinks = {
	Product: [
		{ label: "Features", href: "#features" },
		{ label: "Pricing", href: "#pricing" },
		{ label: "Security", href: "#" },
		{ label: "Roadmap", href: "#" },
	],
	Company: [
		{ label: "About", href: "#" },
		{ label: "Blog", href: "#" },
		{ label: "Careers", href: "#" },
		{ label: "Contact", href: "#" },
	],
	Legal: [
		{ label: "Privacy", href: "#" },
		{ label: "Terms", href: "#" },
		{ label: "Compliance", href: "#" },
		{ label: "Security", href: "#" },
	],
};

export function LandingFooter() {
	return (
		<footer className="border-t bg-background">
			<div className="container mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16">
				<div className="grid gap-8 sm:gap-12 md:grid-cols-2 lg:grid-cols-5 mb-12">
					<div className="lg:col-span-2">
						{/* Logo inline */}
						<Logo w="w-30 sm:w-40" />
						<p className=" text-sm mt-5 text-foreground/60 md:text-base max-w-xs leading-relaxed">
							Global payroll made simple. Pay your team worldwide instantly with
							blockchain-powered transactions.
						</p>
					</div>

					{Object.entries(footerLinks).map(([title, links]) => (
						<div key={title}>
							<h3 className="font-semibold text-foreground mb-4 text-sm">
								{title}
							</h3>
							<ul className="space-y-3">
								{links.map((link) => (
									<li key={link.label}>
										<Link
											href={link.href}
											className="text-sm text-foreground/60 hover:text-foreground transition-colors hover:underline underline-offset-2"
										>
											{link.label}
										</Link>
									</li>
								))}
							</ul>
						</div>
					))}
				</div>

				<div className="border-t pt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
					<p className="text-xs sm:text-sm text-foreground/60">
						© {new Date().getFullYear()} PayOrbit. All rights reserved.
					</p>
					<div className="flex gap-5">
						{[
							{
								label: "Twitter",
								path: "M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z",
							},
							{
								label: "LinkedIn",
								path: "M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2zM4 6a2 2 0 100-4 2 2 0 000 4z",
							},
							{
								label: "GitHub",
								path: "M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.868-.013-1.703-2.782.603-3.369-1.343-3.369-1.343-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.547 2.914 1.186.092-.923.35-1.547.636-1.903-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z",
							},
						].map((social) => (
							<a
								key={social.label}
								href="#"
								aria-label={social.label}
								className="text-foreground/50 hover:text-foreground transition-colors hover:scale-110 inline-block"
							>
								<svg
									className="h-5 w-5"
									fill="currentColor"
									viewBox="0 0 24 24"
								>
									<path d={social.path} />
								</svg>
							</a>
						))}
					</div>
				</div>
			</div>
		</footer>
	);
}
