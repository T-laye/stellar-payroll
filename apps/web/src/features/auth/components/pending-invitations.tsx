"use client";

import Link from "next/link";
import { Building2, Loader2 } from "lucide-react";
import { Button } from "@repo/ui/button";
import { toast } from "@repo/ui/sonner";
import { useAcceptInvitation, useInvitations } from "@/features/auth/hooks";
import { useAuthStore } from "@/features/auth/store";
import { ApiError } from "@/lib/api/client";
import { routes } from "@/lib/routes";

/** Invites to other companies, shown on every page until accepted. Joining doesn't need a new password. */
export function PendingInvitations() {
	const invitations = useInvitations();
	const accept = useAcceptInvitation();
	const email = useAuthStore((state) => state.user?.email);

	if (invitations.error instanceof ApiError && invitations.error.status === 403) {
		return (
			<div role="status" className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-primary/25 bg-primary/5 p-4 text-sm">
				<Building2 className="size-5 shrink-0 text-primary" aria-hidden />
				<p className="min-w-0 flex-1 text-foreground">A company has invited you. Verify your email to see and accept the invite.</p>
				<Button size="sm" variant="outline" asChild>
					<Link href={`${routes.authRoutes.VERIFICATION_SENT}?email=${encodeURIComponent(email ?? "")}`}>Verify email</Link>
				</Button>
			</div>
		);
	}

	if (!invitations.data?.length) return null;

	return (
		<div className="mb-6 space-y-3">
			{invitations.data.map((invitation) => (
				<div key={invitation.company_id} role="status" className="flex flex-wrap items-center gap-3 rounded-xl border border-primary/25 bg-primary/5 p-4 text-sm">
					<Building2 className="size-5 shrink-0 text-primary" aria-hidden />
					<p className="min-w-0 flex-1 text-foreground">
						<span className="font-medium">{invitation.company_name}</span> invited you to join as {invitation.role}.
					</p>
					<Button
						size="sm"
						disabled={accept.isPending}
						onClick={() =>
							accept.mutate(invitation.company_id, {
								onSuccess: () =>
									toast.success(`You've joined ${invitation.company_name}`, {
										description: "Use the company switcher in the sidebar to move between your companies.",
									}),
								onError: (error) => toast.error(error instanceof Error ? error.message : "Couldn't accept this invite"),
							})
						}
					>
						{accept.isPending && <Loader2 className="animate-spin" />} Join
					</Button>
				</div>
			))}
		</div>
	);
}
