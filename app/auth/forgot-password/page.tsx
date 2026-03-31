"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	AuthLegalFooter,
	AuthShell,
	Field,
} from "@/components/auth/auth-ui";
import {
	ForgotPasswordSchema,
	type ForgotPasswordFormData,
} from "@/lib/schemas";
import { useForgotPassword } from "@/hooks/auth.hook";
import { routes } from "@/lib/utils/routes";
import { cn } from "@/lib/utils";

export default function ForgotPasswordPage() {
	const { mutateAsync: requestReset, isPending, isSuccess } = useForgotPassword();
	const {
		register,
		handleSubmit,
		watch,
		formState: { errors },
	} = useForm<ForgotPasswordFormData>({
		resolver: zodResolver(ForgotPasswordSchema),
		defaultValues: { email: "" },
	});

	const email = watch("email");

	const onSubmit = async (data: ForgotPasswordFormData) => {
		try {
			await requestReset(data);
			toast.success("Reset link sent. Check your email.");
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to send reset link",
			);
		}
	};

	return (
		<AuthShell
			title="Forgot Password"
			description="Enter your email and we'll send you a link to reset your password."
			footer={<AuthLegalFooter />}
		>
			{isSuccess ? (
				<div className="space-y-6">
					<div className="rounded-2xl border border-border bg-muted/40 p-5 text-sm text-muted-foreground">
						A password reset link has been sent to{" "}
						<span className="font-medium text-foreground">{email}</span>.
					</div>

					<div className="space-y-3">
						<Button asChild className="w-full gap-2">
							<Link href={routes.authRoutes.SIGN_IN}>
								Back to Sign In
								<ArrowRight className="h-4 w-4" />
							</Link>
						</Button>
						<Button asChild variant="ghost" className="w-full">
							<Link href={routes.authRoutes.FORGOT_PASSWORD}>Send to another email</Link>
						</Button>
					</div>
				</div>
			) : (
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
					<Field label="Email" error={errors.email?.message}>
						<div className="relative">
							<Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								{...register("email")}
								type="email"
								placeholder="you@example.com"
								className={cn(
									"border border-border bg-input pl-9 transition-all focus:border-primary/50",
									errors.email && "border-destructive",
								)}
							/>
						</div>
					</Field>

					<Button type="submit" disabled={isPending} className="w-full gap-2">
						{isPending ? (
							<>
								<Loader2 className="h-4 w-4 animate-spin" />
								Sending link...
							</>
						) : (
							<>
								Send Reset Link
								<ArrowRight className="h-4 w-4" />
							</>
						)}
					</Button>

					<Button asChild variant="ghost" className="w-full">
						<Link href={routes.authRoutes.SIGN_IN}>
							<ArrowLeft className="mr-2 h-4 w-4" />
							Back to Sign In
						</Link>
					</Button>
				</form>
			)}
		</AuthShell>
	);
}
