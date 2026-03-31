"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle2, Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AuthLegalFooter, AuthShell } from "@/components/auth/auth-ui";
import { useVerifyEmail } from "@/hooks/auth.hook";
import { routes } from "@/lib/utils/routes";

function VerifyEmailContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const token = searchParams.get("token") ?? "";
	const email = searchParams.get("email") ?? "";
	const { mutateAsync: submitVerification, isPending, isSuccess } =
		useVerifyEmail();

	const handleVerify = async () => {
		if (!token) {
			toast.error("This verification link is invalid or incomplete.");
			return;
		}

		try {
			await submitVerification({ token, email: email || undefined });
			toast.success("Email verified successfully.");
			router.push(routes.authRoutes.SIGN_IN);
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to verify email",
			);
		}
	};

	return (
		<AuthShell
			title="Verify Email"
			description="Complete verification to activate your account and continue."
			footer={<AuthLegalFooter />}
		>
			<div className="space-y-5">
				<div className="rounded-2xl border border-border bg-muted/40 p-5 text-sm text-muted-foreground">
					<div className="mb-2 flex items-center gap-2 text-foreground">
						<MailCheck className="h-4 w-4 text-primary" />
						Ready to verify
					</div>
					{email ? (
						<>
							You're verifying <span className="font-medium text-foreground">{email}</span>.
						</>
					) : (
						"Use the button below to verify your email."
					)}
				</div>

				{!token ? (
					<div className="space-y-3">
						<div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-sm text-muted-foreground">
							This verification link is missing its token. Request another
							verification email to continue.
						</div>
						<Button asChild className="w-full">
							<Link href={routes.authRoutes.SIGN_UP}>Back to Sign Up</Link>
						</Button>
					</div>
				) : isSuccess ? (
					<div className="space-y-4">
						<div className="rounded-2xl border border-border bg-muted/40 p-5 text-sm text-muted-foreground">
							<div className="mb-2 flex items-center gap-2 text-foreground">
								<CheckCircle2 className="h-4 w-4 text-primary" />
								Email verified
							</div>
							Your account is ready. Continue to sign in.
						</div>
						<Button asChild className="w-full">
							<Link href={routes.authRoutes.SIGN_IN}>Continue to Sign In</Link>
						</Button>
					</div>
				) : (
					<Button
						type="button"
						onClick={handleVerify}
						disabled={isPending}
						className="w-full gap-2"
					>
						{isPending ? (
							<>
								<Loader2 className="h-4 w-4 animate-spin" />
								Verifying...
							</>
						) : (
							<>
								Verify Email
								<ArrowRight className="h-4 w-4" />
							</>
						)}
					</Button>
				)}
			</div>
		</AuthShell>
	);
}

export default function VerifyEmailPage() {
	return (
		<Suspense fallback={null}>
			<VerifyEmailContent />
		</Suspense>
	);
}
