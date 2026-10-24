"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, FlaskConical, Loader2, Lock, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { signIn } from "@/features/auth/session";
import { DEMO_ADMIN, USE_MOCK_API, resetDemoData } from "@/lib/api/source";
import { withBasePath } from "@/lib/site";

/** Staff sign-in: the shared PayOrbit login, kept only for platform admins. */
export default function SignInPage() {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	const submit = async (event: React.FormEvent) => {
		event.preventDefault();
		if (!email.trim() || !password) return setError("Enter your email and password.");
		setBusy(true);
		setError(null);
		try {
			await signIn(email.trim(), password);
			router.replace("/");
		} catch (e) {
			setError(e instanceof Error ? e.message : "Couldn't sign you in");
			setBusy(false);
		}
	};

	return (
		<div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-brand-night px-4 py-10">
			<div
				className="pointer-events-none absolute -top-40 -right-40 size-130 rounded-full bg-brand-magenta/20 blur-3xl"
				aria-hidden
			/>
			<div
				className="pointer-events-none absolute -bottom-40 -left-40 size-140 rounded-full bg-brand-purple/35 blur-3xl"
				aria-hidden
			/>
			<div className="animate-rise relative w-full max-w-md">
				<div className="mb-8 flex items-center justify-center gap-2.5">
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img src={withBasePath("/images/logo-white.svg")} alt="PayOrbit" width={150} height={33} className="h-auto w-36" />
					<span className="rounded-md bg-white/10 px-1.5 py-0.5 text-xs font-semibold tracking-wide text-white/80 uppercase">
						Admin
					</span>
				</div>
				<div className="rounded-2xl border border-border bg-card p-7 shadow-2xl shadow-black/30 sm:p-9">
					<div className="mb-7">
						<h1 className="text-2xl font-semibold tracking-tight text-foreground">Platform console</h1>
						<p className="mt-1 text-sm text-muted-foreground">Sign in with your PayOrbit staff account.</p>
					</div>
					<form onSubmit={submit} className="space-y-5" noValidate>
						<div className="space-y-1.5">
							<Label htmlFor="email">Email address</Label>
							<div className="relative">
								<Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
								<Input
									id="email"
									type="email"
									autoComplete="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									className="h-10 pl-9"
									placeholder="you@payorbit.com"
								/>
							</div>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="password">Password</Label>
							<div className="relative">
								<Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
								<Input
									id="password"
									type="password"
									autoComplete="current-password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									className="h-10 pl-9"
									placeholder="••••••••"
								/>
							</div>
						</div>
						{error && (
							<p
								role="alert"
								className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive"
							>
								{error}
							</p>
						)}
						<Button type="submit" disabled={busy} className="group h-10 w-full shadow-md shadow-primary/25">
							{busy ? <Loader2 className="animate-spin" /> : <ShieldCheck />} Sign in
							{!busy && <ArrowRight className="transition-transform group-hover:translate-x-0.5" />}
						</Button>
					</form>
					{USE_MOCK_API && (
						<div className="mt-6 rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4 text-sm">
							<p className="flex items-center gap-2 font-semibold text-foreground">
								<FlaskConical className="size-4 text-primary" /> Demo mode
							</p>
							<p className="mt-1 text-muted-foreground">Sample companies and people, stored in this browser only.</p>
							<button
								type="button"
								onClick={() => {
									setEmail(DEMO_ADMIN.email);
									setPassword(DEMO_ADMIN.password);
								}}
								className="mt-3 w-full cursor-pointer rounded-lg border border-border bg-card px-3 py-2 text-left transition-colors hover:border-primary/50"
							>
								<span className="block font-medium text-foreground">Platform admin · {DEMO_ADMIN.email}</span>
								<span className="block text-xs text-muted-foreground">Password {DEMO_ADMIN.password}</span>
							</button>
							<button
								type="button"
								onClick={async () => {
									await resetDemoData();
									window.location.reload();
								}}
								className="mt-3 cursor-pointer text-xs font-medium text-muted-foreground underline underline-offset-4 hover:text-foreground"
							>
								Reset demo data
							</button>
						</div>
					)}
				</div>
				<p className="mt-6 text-center text-xs text-white/50">Access is logged. Staff accounts only.</p>
			</div>
		</div>
	);
}
