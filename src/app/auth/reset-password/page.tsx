"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, CheckCircle2, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	AuthLegalFooter,
	AuthShell,
	Field,
	PasswordInput,
} from "@/features/auth/components/auth-ui";
import { ResetPasswordSchema, type ResetPasswordFormData } from "@/lib/schemas";
import { useResetPassword } from "@/hooks/auth.hook";
import { routes } from "@/lib/utils/routes";
import { cn } from "@/lib/utils";

function ResetPasswordContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const token = searchParams.get("token") ?? "";
	const email = searchParams.get("email") ?? "";
	const { mutateAsync: submitReset, isPending, isSuccess } = useResetPassword();

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<ResetPasswordFormData>({
		resolver: zodResolver(ResetPasswordSchema),
		defaultValues: {
			password: "",
			confirmPassword: "",
		},
	});

	const onSubmit = async (data: ResetPasswordFormData) => {
		if (!token) {
			toast.error("This reset link is invalid or has expired.");
			return;
		}

		try {
			await submitReset({ ...data, token, email: email || undefined });
			toast.success("Password reset successfully.");
			router.push(routes.authRoutes.SIGN_IN);
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to reset password",
			);
		}
	};

	return (
		<AuthShell
			title="Reset Password"
			description="Set a new password for your account."
			footer={<AuthLegalFooter />}
		>
			{!token ? (
				<div className="space-y-5">
					<div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-sm text-muted-foreground">
						This reset link is missing its token. Request a new password reset
						email to continue.
					</div>
					<Button asChild className="w-full">
						<Link href={routes.authRoutes.FORGOT_PASSWORD}>
							Request New Link
						</Link>
					</Button>
				</div>
			) : isSuccess ? (
				<div className="space-y-5">
					<div className="rounded-2xl border border-border bg-muted/40 p-5 text-sm text-muted-foreground">
						<div className="mb-2 flex items-center gap-2 text-foreground">
							<CheckCircle2 className="h-4 w-4 text-primary" />
							Password updated
						</div>
						You can now sign in with your new password.
					</div>
					<Button asChild className="w-full">
						<Link href={routes.authRoutes.SIGN_IN}>Continue to Sign In</Link>
					</Button>
				</div>
			) : (
				<form
					onSubmit={handleSubmit(onSubmit)}
					className="space-y-5"
					noValidate
				>
					<Field label="New Password" error={errors.password?.message}>
						<div className="relative">
							<Lock className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
							<PasswordInput
								{...register("password")}
								className={cn(
									"border border-border bg-input pl-9 transition-all focus:border-primary/50",
									errors.password && "border-destructive",
								)}
							/>
						</div>
					</Field>

					<Field
						label="Confirm New Password"
						error={errors.confirmPassword?.message}
					>
						<div className="relative">
							<Lock className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
							<PasswordInput
								{...register("confirmPassword")}
								className={cn(
									"border border-border bg-input pl-9 transition-all focus:border-primary/50",
									errors.confirmPassword && "border-destructive",
								)}
							/>
						</div>
					</Field>

					<Button type="submit" disabled={isPending} className="w-full gap-2">
						{isPending ? (
							<>
								<Loader2 className="h-4 w-4 animate-spin" />
								Updating password...
							</>
						) : (
							<>
								Reset Password
								<ArrowRight className="h-4 w-4" />
							</>
						)}
					</Button>
				</form>
			)}
		</AuthShell>
	);
}

export default function ResetPasswordPage() {
	return (
		<Suspense fallback={null}>
			<ResetPasswordContent />
		</Suspense>
	);
}
