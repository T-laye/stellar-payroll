"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Loader2, Lock, Mail } from "lucide-react";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { toast } from "@repo/ui/sonner";
import { AuthShell, Field, PasswordInput } from "@/features/auth/components/auth-ui";
import { DemoAccountNote } from "@/features/auth/components/demo-mode";
import { useLogin } from "@/features/auth/hooks";
import { SigninSchema, type SigninFormData } from "@/features/auth/schema";
import { routes } from "@/lib/routes";

export default function SignInPage() {
	const router = useRouter();
	const { mutateAsync: login, isPending } = useLogin();
	const {
		register,
		handleSubmit,
		setValue,
		formState: { errors },
	} = useForm<SigninFormData>({ resolver: zodResolver(SigninSchema) });

	const onSubmit = async (data: SigninFormData) => {
		try {
			await login(data);
			toast.success("Welcome back");
			router.push(routes.dashboardRoutes.OVERVIEW);
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Couldn't sign you in");
		}
	};

	return (
		<AuthShell title="Welcome back" description="Sign in to your organization account.">
			<form method="post" onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
				<Field label="Email address" error={errors.email?.message}>
					<div className="relative">
						<Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							{...register("email")}
							type="email"
							autoComplete="email"
							placeholder="admin@company.com"
							className="h-10 pl-9"
							aria-invalid={!!errors.email}
						/>
					</div>
				</Field>
				<Field label="Password" error={errors.password?.message}>
					<div className="relative">
						<Lock className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
						<PasswordInput
							{...register("password")}
							autoComplete="current-password"
							className="h-10 pl-9"
							aria-invalid={!!errors.password}
						/>
					</div>
					<div className="flex justify-end">
						<Link href={routes.authRoutes.FORGOT_PASSWORD} className="text-xs font-medium text-primary hover:underline">
							Forgot password?
						</Link>
					</div>
				</Field>
				<Button type="submit" disabled={isPending} className="group h-10 w-full shadow-md shadow-primary/25">
					{isPending ? (
						<>
							<Loader2 className="animate-spin" /> Signing in…
						</>
					) : (
						<>
							Sign in <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
						</>
					)}
				</Button>
			</form>

			<DemoAccountNote
				onPick={(email, password) => {
					setValue("email", email, { shouldValidate: true });
					setValue("password", password, { shouldValidate: true });
				}}
			/>

			<p className="mt-6 text-center text-sm text-muted-foreground">
				Don&apos;t have an account? <span className="font-medium text-foreground">Contact your administrator</span>
				<span className="mt-1 block text-xs">
					Setting up payroll for your company?{" "}
					<Link href={routes.authRoutes.SIGN_UP} className="font-semibold text-primary hover:underline">
						Create a workspace
					</Link>
				</span>
			</p>
		</AuthShell>
	);
}
