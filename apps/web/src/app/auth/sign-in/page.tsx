"use client";

import { useState } from "react";
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
import type { CompanyMembership } from "@/features/auth/types";
import { routes } from "@/lib/routes";

export default function SignInPage() {
	const router = useRouter();
	const { mutateAsync: login, isPending } = useLogin();
	const {
		register,
		handleSubmit,
		setValue,
		getValues,
		formState: { errors },
	} = useForm<SigninFormData>({ resolver: zodResolver(SigninSchema) });
	const [companies, setCompanies] = useState<CompanyMembership[] | null>(null);

	const onSubmit = async (data: SigninFormData, companyId?: string) => {
		try {
			const response = await login({ ...data, company_id: companyId });
			// In more than one company: no session yet, they choose one and log in again.
			if (response?.data?.requires_company_selection && !response.data.session) {
				setCompanies(response.data.companies ?? []);
				return;
			}
			toast.success("Welcome back");
			router.push(routes.dashboardRoutes.OVERVIEW);
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Couldn't sign you in");
		}
	};

	if (companies) {
		return (
			<AuthShell title="Choose a company" description="Your account belongs to more than one company. You can switch at any time.">
				<ul className="space-y-3">
					{companies.map((company) => (
						<li key={company.company_id}>
							<button
								type="button"
								disabled={isPending}
								onClick={() => onSubmit(getValues(), company.company_id)}
								className="flex w-full items-center justify-between gap-3 rounded-xl border border-border p-4 text-left transition-colors hover:border-primary hover:bg-primary/5 disabled:opacity-60"
							>
								<span className="min-w-0">
									<span className="block truncate text-sm font-semibold text-foreground">{company.company_name}</span>
									<span className="block text-xs text-muted-foreground">{company.role}</span>
								</span>
								{isPending ? <Loader2 className="size-4 shrink-0 animate-spin" /> : <ArrowRight className="size-4 shrink-0 text-muted-foreground" />}
							</button>
						</li>
					))}
				</ul>
				<Button variant="ghost" className="mt-4 w-full" disabled={isPending} onClick={() => setCompanies(null)}>
					Use a different account
				</Button>
			</AuthShell>
		);
	}

	return (
		<AuthShell title="Welcome back" description="Sign in to your organization account.">
			<form method="post" onSubmit={handleSubmit((data) => onSubmit(data))} className="space-y-5" noValidate>
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
