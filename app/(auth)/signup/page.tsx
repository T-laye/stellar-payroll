"use client";

// ============================================================
// ENHANCED AUTH PAGES — SignIn & SignUp
// Drop-in replacements for your existing auth pages
// ============================================================

// ─── signin/page.tsx ──────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/stores/auth-store";
import { SigninSchema, SigninFormData } from "@/lib/schemas";
import { SignupSchema, SignupFormData } from "@/lib/schemas";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Loader2,
	Mail,
	Lock,
	Eye,
	EyeOff,
	Zap,
	User,
	ShieldCheck,
	ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Logo from "../../../components/ui/logo";

// ─── Shared: Animated background blobs ───────────────────────────────────────
function AuthBackground() {
	return (
		<div className="pointer-events-none fixed inset-0 overflow-hidden">
			<div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl animate-[pulse_8s_ease-in-out_infinite]" />
			<div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-accent/10 blur-3xl animate-[pulse_10s_ease-in-out_infinite_1s]" />
			<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
		</div>
	);
}

// ─── Shared: Logo mark ───────────────────────────────────────────────────────
function AuthLogo() {
	return (
		<Link href="/" className="inline-flex items-center gap-2.5 mb-8">
			<div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/30">
				<Zap className="h-5 w-5 text-primary-foreground" />
			</div>
			<span className="font-bold text-xl text-foreground tracking-tight">
				Stellar
			</span>
		</Link>
	);
}

// ─── Shared: Password input with toggle ──────────────────────────────────────
function PasswordInput({
	placeholder = "••••••••",
	className,
	...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
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
				onClick={() => setShow((v) => !v)}
				className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
				tabIndex={-1}
				aria-label={show ? "Hide password" : "Show password"}
			>
				{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
			</button>
		</div>
	);
}

// ─── Shared: Field wrapper ────────────────────────────────────────────────────
function Field({
	label,
	error,
	children,
}: {
	label: string;
	error?: string;
	children: React.ReactNode;
}) {
	return (
		<div className="space-y-1.5">
			<label className="text-sm font-medium text-foreground">{label}</label>
			{children}
			{error && (
				<p className="text-xs text-destructive flex items-center gap-1 mt-1">
					<span className="inline-block h-1 w-1 rounded-full bg-destructive shrink-0" />
					{error}
				</p>
			)}
		</div>
	);
}

// ─── Shared: mount animation wrapper ─────────────────────────────────────────
function MountFade({ children }: { children: React.ReactNode }) {
	const [mounted, setMounted] = useState(false);
	useEffect(() => {
		const t = setTimeout(() => setMounted(true), 40);
		return () => clearTimeout(t);
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

function StepDot({ active, done }: { active: boolean; done: boolean }) {
	return (
		<div
			className={cn(
				"h-2 w-2 rounded-full transition-all duration-300",
				done ? "bg-primary w-4" : active ? "bg-primary" : "bg-border",
			)}
		/>
	);
}

export default function Page() {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);
	const { signup } = useAuthStore();

	const {
		register,
		handleSubmit,
		watch,
		setValue,
		formState: { errors },
	} = useForm<SignupFormData>({
		resolver: zodResolver(SignupSchema),
		defaultValues: { role: "admin" },
	});

	const role = watch("role");

	const onSubmit = async (data: SignupFormData) => {
		setIsLoading(true);
		try {
			await signup(data.email, data.password, data.name, data.role);
			toast.success("Account created successfully!");
			router.push("/dashboard");
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Failed to sign up");
		} finally {
			setIsLoading(false);
		}
	};

	const roleDescriptions: Record<string, string> = {
		admin: "Full access to all features and settings",
		"payroll-manager": "Manage payroll runs and employee data",
		viewer: "Read-only access to reports and data",
	};

	return (
		<div className="min-h-screen flex items-center justify-center px-4 py-10 bg-background relative">
			<AuthBackground />

			<MountFade>
				<div className="w-full max-w-xl mx-auto relative z-10">
					<div className="flex justify-center text-center mb-6">
						<Logo w="w-40" />
					</div>

					<Card className="w-full border border-border shadow-xl shadow-black/5 backdrop-blur-sm bg-card/95 overflow-hidden">
						{/* Top accent bar */}
						<div className="h-1 w-full bg-linear-to-r from-primary via-accent to-primary bg-size-[200%_100%] animate-[shimmer_3s_ease-in-out_infinite]" />

						<div className="p-8">
							<div className="mb-8">
								<h1 className="text-2xl font-bold text-foreground mb-1.5">
									Get Started
								</h1>
								<p className="text-sm text-muted-foreground">
									Create your Stellar Payroll account — free forever
								</p>
							</div>

							<form
								onSubmit={handleSubmit(onSubmit)}
								className="space-y-5"
								noValidate
							>
								{/* Full Name */}
								<Field label="Full Name" error={errors.name?.message}>
									<div className="relative">
										<User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
										<Input
											{...register("name")}
											type="text"
											placeholder="John Doe"
											className={cn(
												"pl-9 bg-input border border-border transition-all focus:border-primary/50",
												errors.name && "border-destructive",
											)}
										/>
									</div>
								</Field>

								{/* Email */}
								<Field label="Email" error={errors.email?.message}>
									<div className="relative">
										<Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
										<Input
											{...register("email")}
											type="email"
											placeholder="you@example.com"
											className={cn(
												"pl-9 bg-input border border-border transition-all focus:border-primary/50",
												errors.email && "border-destructive",
											)}
										/>
									</div>
								</Field>

								{/* Role */}
								<Field label="Role" error={errors.role?.message}>
									<Select
										value={role}
										onValueChange={(value) => setValue("role", value as any)}
									>
										<SelectTrigger
											className={cn(
												"bg-input border border-border transition-all focus:border-primary/50",
												errors.role && "border-destructive",
											)}
										>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="admin">Admin</SelectItem>
											<SelectItem value="payroll-manager">
												Payroll Manager
											</SelectItem>
											<SelectItem value="viewer">Viewer</SelectItem>
										</SelectContent>
									</Select>
									{/* Dynamic role description */}
									{role && (
										<p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
											<ShieldCheck className="h-3 w-3 text-primary shrink-0" />
											{roleDescriptions[role]}
										</p>
									)}
								</Field>

								{/* Password */}
								<Field label="Password" error={errors.password?.message}>
									<div className="relative">
										<Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
										<PasswordInput
											{...register("password")}
											placeholder="••••••••"
											className={cn(
												"pl-9 bg-input border border-border transition-all focus:border-primary/50",
												errors.password && "border-destructive",
											)}
										/>
									</div>
								</Field>

								{/* Confirm Password */}
								<Field
									label="Confirm Password"
									error={errors.confirmPassword?.message}
								>
									<div className="relative">
										<Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
										<PasswordInput
											{...register("confirmPassword")}
											placeholder="••••••••"
											className={cn(
												"pl-9 bg-input border border-border transition-all focus:border-primary/50",
												errors.confirmPassword && "border-destructive",
											)}
										/>
									</div>
								</Field>

								<Button
									type="submit"
									disabled={isLoading}
									className="w-full mt-2 gap-2 group shadow-sm shadow-primary/20 transition-all active:scale-[0.98]"
								>
									{isLoading ? (
										<>
											<Loader2 className="w-4 h-4 animate-spin" />
											Creating account...
										</>
									) : (
										<>
											Create Account
											<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
										</>
									)}
								</Button>
							</form>

							{/* Divider */}
							<div className="relative my-6">
								<div className="absolute inset-0 flex items-center">
									<div className="w-full border-t border-border" />
								</div>
								<div className="relative flex justify-center">
									<span className="bg-card px-3 text-xs text-muted-foreground">
										No credit card required
									</span>
								</div>
							</div>

							{/* Feature bullets */}
							<div className="grid grid-cols-2 gap-2 mb-6">
								{[
									"Free forever plan",
									"130+ countries",
									"Instant setup",
									"Cancel anytime",
								].map((item) => (
									<div
										key={item}
										className="flex items-center gap-1.5 text-xs text-muted-foreground"
									>
										<div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
										{item}
									</div>
								))}
							</div>

							<p className="text-center text-sm text-muted-foreground">
								Already have an account?{" "}
								<Link
									href="/signin"
									className="text-primary hover:text-primary/80 font-semibold transition-colors hover:underline underline-offset-2"
								>
									Sign in
								</Link>
							</p>
						</div>
					</Card>

					<p className="text-center text-xs text-muted-foreground mt-6">
						By creating an account, you agree to our{" "}
						<Link
							href="#"
							className="hover:text-foreground transition-colors underline underline-offset-2"
						>
							Terms
						</Link>{" "}
						and{" "}
						<Link
							href="#"
							className="hover:text-foreground transition-colors underline underline-offset-2"
						>
							Privacy Policy
						</Link>
					</p>
				</div>
			</MountFade>

			<style>{`
        @keyframes shimmer {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
		</div>
	);
}
