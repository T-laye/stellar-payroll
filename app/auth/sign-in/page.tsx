"use client";

import {
	useState,
	useEffect,
	type InputHTMLAttributes,
	type ReactNode,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { SigninSchema, SigninFormData } from "@/lib/schemas";
import { useLogin } from "@/hooks/auth.hook";
import { routes } from "@/lib/utils/routes";

import {
	Loader2,
	Mail,
	Lock,
	Eye,
	EyeOff,
	Zap,
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

// ─── Shared: Password input with toggle ──────────────────────────────────────
function PasswordInput({
	placeholder = "••••••••",
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
	children: ReactNode;
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
function MountFade({ children }: { children: ReactNode }) {
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

export default function Page() {
	const router = useRouter();
	const { mutateAsync: login, isPending } = useLogin();

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<SigninFormData>({
		resolver: zodResolver(SigninSchema),
	});

	const onSubmit = async (data: SigninFormData) => {
		try {
			await login(data);
			toast.success("Signed in successfully!");
			router.push("/dashboard");
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Failed to sign in");
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center px-4 bg-background relative">
			<AuthBackground />

			<MountFade>
				<div className="w-full max-w-xl mx-auto relative z-10">
					<div className="text-center mb-6 flex justify-center">
						<Logo w="w-40" />
					</div>

					<Card className="w-full border border-border shadow-xl shadow-black/5 backdrop-blur-sm bg-card/95 overflow-hidden">
						{/* Top accent bar */}
						<div className="h-1 w-full bg-linear-to-r from-primary via-accent to-primary bg-size-length:200%_100% animate-[shimmer_3s_ease-in-out_infinite]" />

						<div className="p-8">
							<div className="mb-8">
								<h1 className="text-2xl font-bold text-foreground mb-1.5">
									Welcome back
								</h1>
								<p className="text-sm text-muted-foreground">
									Sign in to your Stellar Payroll account
								</p>
							</div>

							<form
								onSubmit={handleSubmit(onSubmit)}
								className="space-y-5"
								noValidate
							>
								<Field label="Email" error={errors.email?.message}>
									<div className="relative">
										<Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
										<Input
											{...register("email")}
											type="email"
											placeholder="you@example.com"
											className={cn(
												"pl-9 bg-input border border-border transition-all focus:border-primary/50",
												errors.email &&
													"border-destructive focus:border-destructive",
											)}
										/>
									</div>
								</Field>

								<Field label="Password" error={errors.password?.message}>
									<div className="relative">
										<Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
										<PasswordInput
											{...register("password")}
											placeholder="••••••••"
											className={cn(
												"pl-9 bg-input border border-border transition-all focus:border-primary/50",
												errors.password &&
													"border-destructive focus:border-destructive",
											)}
										/>
									</div>
									{/* Forgot password */}
									<div className="flex justify-end mt-1">
										<Link
											href={routes.authRoutes.FORGOT_PASSWORD}
											className="text-xs text-primary hover:text-primary/80 transition-colors hover:underline"
										>
											Forgot password?
										</Link>
									</div>
								</Field>

								<Button
									type="submit"
									disabled={isPending}
									className="w-full mt-2 gap-2 group shadow-sm shadow-primary/20 transition-all active:scale-[0.98]"
								>
									{isPending ? (
										<>
											<Loader2 className="w-4 h-4 animate-spin" />
											Signing in...
										</>
									) : (
										<>
											Sign In
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
										Secured by Stellar Blockchain
									</span>
								</div>
							</div>

							{/* Trust badges */}
							<div className="flex items-center justify-center gap-4 mb-6">
								{["Bank-grade SSL", "SOC 2", "GDPR"].map((badge) => (
									<div
										key={badge}
										className="flex items-center gap-1 text-xs text-muted-foreground"
									>
										<ShieldCheck className="h-3 w-3 text-primary" />
										{badge}
									</div>
								))}
							</div>

							<p className="text-center text-sm text-muted-foreground">
								Don't have an account?{" "}
								<Link
									href={routes.authRoutes.SIGN_UP}
									className="text-primary hover:text-primary/80 font-semibold transition-colors hover:underline underline-offset-2"
								>
									Sign up free
								</Link>
							</p>
						</div>
					</Card>

					<p className="text-center text-xs text-muted-foreground mt-6">
						By signing in, you agree to our{" "}
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
