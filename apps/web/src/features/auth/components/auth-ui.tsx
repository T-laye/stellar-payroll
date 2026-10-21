"use client";

import { useState, type InputHTMLAttributes, type ReactNode } from "react";
import Link from "next/link";
import { Input } from "@repo/ui/input";
import { cn } from "@repo/ui/lib/utils";
import { Eye, EyeOff, ShieldCheck, Zap, Globe2 } from "lucide-react";
import { LANDING_URL, withBasePath } from "@/lib/site";

export function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
	return (
		<div className="space-y-1.5">
			<label className="text-sm font-medium text-foreground">{label}</label>
			{children}
			{error && (
				<p className="text-xs text-destructive" role="alert">
					{error}
				</p>
			)}
		</div>
	);
}

export function PasswordInput({ placeholder = "••••••••", className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
	const [show, setShow] = useState(false);
	return (
		<div className="relative">
			<Input {...props} type={show ? "text" : "password"} placeholder={placeholder} className={cn("pr-10", className)} />
			<button
				type="button"
				onClick={() => setShow((value) => !value)}
				className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
				tabIndex={-1}
				aria-label={show ? "Hide password" : "Show password"}
			>
				{show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
			</button>
		</div>
	);
}

/** The planet from the brand: the network map wrapped in a sphere, with PayOrbit's orbit rings. */
function OrbitGlobe() {
	return (
		<div className="pointer-events-none relative mx-auto aspect-square w-[min(78%,420px)]" aria-hidden>
			<div className="absolute inset-[8%] rounded-full bg-brand-purple/40 blur-3xl" />
			<div
				className="absolute inset-[12%] overflow-hidden rounded-full shadow-[inset_-30px_-20px_60px_rgba(0,0,0,0.65),0_0_80px_rgba(85,1,255,0.45)]"
				style={{ background: "radial-gradient(circle at 35% 30%, #4a1fd0 0%, #22086e 45%, #0d0020 80%)" }}
			>
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img
					src={withBasePath("/images/map.webp")}
					alt=""
					className="absolute top-1/2 left-1/2 h-[120%] max-w-none translate-x-[-38%] -translate-y-1/2 opacity-60 mix-blend-screen"
				/>
				<div
					className="absolute inset-0 rounded-full"
					style={{ background: "radial-gradient(circle at 70% 75%, transparent 30%, rgba(13,0,32,0.85) 75%)" }}
				/>
			</div>
			<svg viewBox="0 0 400 400" className="absolute inset-0 size-full">
				<defs>
					<linearGradient id="orbit-a" x1="0" x2="1">
						<stop offset="0" stopColor="#00ffbb" stopOpacity="0" />
						<stop offset="0.5" stopColor="#00ffbb" stopOpacity="0.9" />
						<stop offset="1" stopColor="#ff00a6" stopOpacity="0.8" />
					</linearGradient>
				</defs>
				<ellipse
					cx="200"
					cy="200"
					rx="190"
					ry="62"
					fill="none"
					stroke="url(#orbit-a)"
					strokeWidth="1.5"
					transform="rotate(-22 200 200)"
				/>
				<ellipse
					cx="200"
					cy="200"
					rx="176"
					ry="48"
					fill="none"
					stroke="#ffffff"
					strokeOpacity="0.18"
					strokeWidth="1"
					transform="rotate(28 200 200)"
				/>
				<circle cx="372" cy="128" r="5" fill="#00ffbb" />
				<circle cx="52" cy="268" r="3.5" fill="#ff00a6" />
			</svg>
		</div>
	);
}

/**
 * Every auth page, as in the design: the whole screen is the deep-night brand surface. The logo,
 * the promise and the orbit globe sit on the left; the white form card floats on the right.
 * On phones the globe drops away and the card follows the logo.
 */
export function AuthShell({
	title,
	description,
	children,
	footer,
}: {
	title: string;
	description: string;
	children: ReactNode;
	footer?: ReactNode;
}) {
	return (
		<div className="relative min-h-dvh overflow-hidden bg-brand-night text-white">
			<div className="pointer-events-none absolute inset-0" aria-hidden>
				<div className="absolute -top-48 right-[-10%] size-130 rounded-full bg-brand-purple/25 blur-3xl" />
				<div className="absolute bottom-[-20%] left-[-10%] size-140 rounded-full bg-brand-purple/30 blur-3xl" />
				<div className="absolute top-1/3 right-1/3 size-72 rounded-full bg-brand-magenta/10 blur-3xl" />
			</div>

			<div className="relative mx-auto grid min-h-dvh w-full max-w-6xl items-center gap-10 px-4 py-8 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:py-12">
				<section className="flex flex-col gap-6 lg:h-full lg:justify-between lg:py-4">
					<a href={LANDING_URL} className="w-36 sm:w-44">
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img src={withBasePath("/images/logo-white.svg")} alt="PayOrbit" className="h-auto w-full" />
					</a>
					<div className="hidden space-y-4 lg:block">
						<h2 className="text-4xl leading-tight font-semibold tracking-tight xl:text-5xl">
							Global Payroll.
							<br />
							<span className="text-brand-cyan">Powered by Stellar.</span>
						</h2>
						<p className="max-w-md text-lg text-white/70">Pay your team across borders with speed, security and simplicity.</p>
					</div>
					<div className="hidden lg:-ml-16 lg:block">
						<OrbitGlobe />
					</div>
					<ul className="hidden gap-6 text-xs text-white/60 lg:flex">
						<li className="flex items-center gap-2">
							<Zap className="size-4 text-brand-cyan" /> Settles in under 5s
						</li>
						<li className="flex items-center gap-2">
							<Globe2 className="size-4 text-brand-cyan" /> 150+ countries
						</li>
						<li className="flex items-center gap-2">
							<ShieldCheck className="size-4 text-brand-cyan" /> On-chain audit trail
						</li>
					</ul>
				</section>

				<main className="animate-rise w-full max-w-md justify-self-center lg:justify-self-end">
					<p className="mb-5 text-sm text-white/70 lg:hidden">Global Payroll. Powered by Stellar.</p>
					<div className="rounded-2xl bg-card p-6 text-card-foreground shadow-2xl shadow-black/40 sm:p-9">
						<div className="mb-7">
							<h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
							<p className="mt-1 text-sm text-muted-foreground">{description}</p>
						</div>
						{children}
					</div>
					{footer && (
						<p className="mt-6 text-center text-xs text-white/55 [&_a]:text-white/80 [&_a:hover]:text-white">{footer}</p>
					)}
				</main>
			</div>
		</div>
	);
}

export function AuthLegalFooter() {
	return (
		<>
			By continuing, you agree to our{" "}
			<Link href="#" className="underline underline-offset-2 transition-colors hover:text-foreground">
				Terms
			</Link>{" "}
			and{" "}
			<Link href="#" className="underline underline-offset-2 transition-colors hover:text-foreground">
				Privacy Policy
			</Link>
		</>
	);
}
