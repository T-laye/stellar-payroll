"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Loader2, Mail, RefreshCw, PencilLine } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	AuthLegalFooter,
	AuthShell,
	Field,
} from "@/components/auth/auth-ui";
import {
	ChangeVerificationEmailSchema,
	type ChangeVerificationEmailFormData,
} from "@/lib/schemas";
import {
	useChangeVerificationEmail,
	useResendVerificationEmail,
} from "@/hooks/auth.hook";
import { routes } from "@/lib/utils/routes";
import { cn } from "@/lib/utils";

function VerificationSentContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const email = searchParams.get("email") ?? "";
	const [isEditingEmail, setIsEditingEmail] = useState(false);
	const { mutateAsync: resendVerification, isPending: isResending } =
		useResendVerificationEmail();
	const { mutateAsync: updateEmail, isPending: isUpdatingEmail } =
		useChangeVerificationEmail();

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<ChangeVerificationEmailFormData>({
		resolver: zodResolver(ChangeVerificationEmailSchema),
		defaultValues: { email },
	});

	const handleResend = async () => {
		if (!email) {
			toast.error("Missing email address. Return to sign up and try again.");
			return;
		}

		try {
			await resendVerification({ email });
			toast.success("Verification email resent.");
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to resend verification email",
			);
		}
	};

	const handleChangeEmail = async (data: ChangeVerificationEmailFormData) => {
		try {
			await updateEmail(data);
			toast.success("Verification email updated and resent.");
			router.replace(
				`${routes.authRoutes.VERIFICATION_SENT}?email=${encodeURIComponent(data.email)}`,
			);
			setIsEditingEmail(false);
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to update email",
			);
		}
	};

	return (
		<AuthShell
			title="Verify Your Email"
			description="We've sent a verification link to your email address."
			footer={<AuthLegalFooter />}
		>
			<div className="space-y-5">
				<div className="rounded-2xl border border-border bg-muted/40 p-5 text-sm text-muted-foreground">
					<div className="mb-2 flex items-center gap-2 text-foreground">
						<Mail className="h-4 w-4 text-primary" />
						Check your inbox
					</div>
					{email ? (
						<>
							We sent a verification email to{" "}
							<span className="font-medium text-foreground">{email}</span>. Open it
							and use the CTA to continue to verification.
						</>
					) : (
						"Your verification email is on its way. Open it and use the CTA to continue."
					)}
				</div>

				<div className="grid gap-3 sm:grid-cols-2">
					<Button
						type="button"
						variant="outline"
						onClick={handleResend}
						disabled={isResending || !email}
						className="gap-2"
					>
						{isResending ? (
							<>
								<Loader2 className="h-4 w-4 animate-spin" />
								Resending...
							</>
						) : (
							<>
								<RefreshCw className="h-4 w-4" />
								Resend Email
							</>
						)}
					</Button>

					<Button
						type="button"
						variant="ghost"
						onClick={() => setIsEditingEmail((value) => !value)}
						className="gap-2"
					>
						<PencilLine className="h-4 w-4" />
						{isEditingEmail ? "Cancel" : "Change Email"}
					</Button>
				</div>

				{isEditingEmail && (
					<form
						onSubmit={handleSubmit(handleChangeEmail)}
						className="space-y-4 rounded-2xl border border-border p-4"
						noValidate
					>
						<Field label="New Email Address" error={errors.email?.message}>
							<Input
								{...register("email")}
								type="email"
								placeholder="you@example.com"
								className={cn(
									"border border-border bg-input transition-all focus:border-primary/50",
									errors.email && "border-destructive",
								)}
							/>
						</Field>

						<Button type="submit" disabled={isUpdatingEmail} className="w-full gap-2">
							{isUpdatingEmail ? (
								<>
									<Loader2 className="h-4 w-4 animate-spin" />
									Updating...
								</>
							) : (
								<>
									Update Email
									<ArrowRight className="h-4 w-4" />
								</>
							)}
						</Button>
					</form>
				)}

				<Button asChild variant="ghost" className="w-full">
					<Link href={routes.authRoutes.SIGN_IN}>Back to Sign In</Link>
				</Button>
			</div>
		</AuthShell>
	);
}

export default function VerificationSentPage() {
	return (
		<Suspense fallback={null}>
			<VerificationSentContent />
		</Suspense>
	);
}
