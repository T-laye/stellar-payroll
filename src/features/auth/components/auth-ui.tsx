"use client";

import { useEffect, useState, type InputHTMLAttributes, type ReactNode } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";
import Logo from "@/components/ui/logo";

export function AuthBackground() {
	return (
		<div className="pointer-events-none fixed inset-0 overflow-hidden">
			<div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl animate-[pulse_8s_ease-in-out_infinite]" />
			<div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-accent/10 blur-3xl animate-[pulse_10s_ease-in-out_infinite_1s]" />
			<div className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />
		</div>
	);
}

export function MountFade({ children }: { children: ReactNode }) {
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => setMounted(true), 40);
		return () => clearTimeout(timer);
	}, []);

	return (
		<div
			style={{
				opacity: mounted ? 1 : 0,
				transform: mounted
					? "translateY(0) scale(1)"
					: "translateY(20px) scale(0.98)",
				transition: "opacity 0.5s ease, transform 0.5s ease",
			}}
			className="w-full"
		>
			{children}
		</div>
	);
}

export function Field({
	label,
	error,
	children,
}: {
	label: string;
	error?: string;
	children: ReactNode;
}) {
	return (
		<div className="space-y-1.5">
			<label className="text-sm font-medium text-foreground">{label}</label>
			{children}
			{error && (
				<p className="mt-1 flex items-center gap-1 text-xs text-destructive">
					<span className="inline-block h-1 w-1 shrink-0 rounded-full bg-destructive" />
					{error}
				</p>
			)}
		</div>
	);
}

export function PasswordInput({
	placeholder = "********",
	className,
	...props
}: InputHTMLAttributes<HTMLInputElement>) {
	const [show, setShow] = useState(false);

	return (
		<div className="relative">
			<Input
				{...props}
				type={show ? "text" : "password"}
				placeholder={placeholder}
				className={cn("pr-10", className)}
			/>
			<button
				type="button"
				onClick={() => setShow((value) => !value)}
				className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
				tabIndex={-1}
				aria-label={show ? "Hide password" : "Show password"}
			>
				{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
			</button>
		</div>
	);
}

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
		<div className="min-h-screen bg-background px-4 py-10">
			<AuthBackground />
			<div className="flex min-h-[calc(100vh-5rem)] items-center justify-center">
				<MountFade>
					<div className="relative z-10 mx-auto w-full max-w-xl">
						<div className="mb-6 flex justify-center text-center">
							<Logo w="w-40" />
						</div>

						<Card className="overflow-hidden border border-border bg-card/95 shadow-xl shadow-black/5 backdrop-blur-sm">
							<div className="h-1 w-full animate-[shimmer_3s_ease-in-out_infinite] bg-linear-to-r from-primary via-accent to-primary bg-size-[200%_100%]" />

							<div className="p-8">
								<div className="mb-8">
									<h1 className="mb-1.5 text-2xl font-bold text-foreground">
										{title}
									</h1>
									<p className="text-sm text-muted-foreground">
										{description}
									</p>
								</div>

								{children}
							</div>
						</Card>

						{footer && (
							<p className="mt-6 text-center text-xs text-muted-foreground">
								{footer}
							</p>
						)}
					</div>
				</MountFade>
			</div>

			<style>{`
				@keyframes shimmer {
					0%, 100% { background-position: 0% 50%; }
					50% { background-position: 100% 50%; }
				}
			`}</style>
		</div>
	);
}

export function AuthLegalFooter() {
	return (
		<>
			By continuing, you agree to our{" "}
			<Link
				href="#"
				className="underline underline-offset-2 transition-colors hover:text-foreground"
			>
				Terms
			</Link>{" "}
			and{" "}
			<Link
				href="#"
				className="underline underline-offset-2 transition-colors hover:text-foreground"
			>
				Privacy Policy
			</Link>
		</>
	);
}
