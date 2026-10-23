"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@repo/ui/button";
import { toast } from "@repo/ui/sonner";
import { AuthLegalFooter, AuthShell, Field, PasswordInput } from "@/features/auth/components/auth-ui";
import { useCompleteProfile } from "@/features/auth/hooks";
import { ResetPasswordSchema, type ResetPasswordFormData } from "@/features/auth/schema";
import { routes } from "@/lib/routes";

/** An employee opens their invite link, chooses a password, and lands on their payments. */
function CompleteProfile() {
	const router = useRouter();
	const token = useSearchParams().get("token") ?? "";
	const complete = useCompleteProfile();
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<ResetPasswordFormData>({ resolver: zodResolver(ResetPasswordSchema) });

	if (!token) {
		return (
			<AuthShell
				title="This invite link is incomplete"
				description="Open the link from your PayOrbit invite email again, or ask your employer to resend it."
			>
				<Button asChild className="w-full">
					<Link href={routes.authRoutes.SIGN_IN}>Go to sign in</Link>
				</Button>
			</AuthShell>
		);
	}

	const onSubmit = (data: ResetPasswordFormData) =>
		complete.mutate(
			{ token, password: data.password },
			{
				onSuccess: () => {
					toast.success("Welcome to PayOrbit", { description: "Your payments are all here." });
					router.push(routes.dashboardRoutes.OVERVIEW);
				},
				onError: (error) => toast.error(error instanceof Error ? error.message : "This invite link didn't work"),
			},
		);

	return (
		<AuthShell
			title="Accept your invite"
			description="Choose a password to see your payments and payment history."
			footer={<AuthLegalFooter />}
		>
			<form method="post" onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
				<Field label="Password" error={errors.password?.message}>
					<PasswordInput {...register("password")} autoComplete="new-password" className="h-10" />
				</Field>
				<Field label="Confirm password" error={errors.confirmPassword?.message}>
					<PasswordInput {...register("confirmPassword")} autoComplete="new-password" className="h-10" />
				</Field>
				<Button type="submit" className="h-10 w-full" disabled={complete.isPending}>
					{complete.isPending && <Loader2 className="animate-spin" />} Set password and continue
				</Button>
			</form>
		</AuthShell>
	);
}

export default function CompleteProfilePage() {
	return (
		<Suspense>
			<CompleteProfile />
		</Suspense>
	);
}
