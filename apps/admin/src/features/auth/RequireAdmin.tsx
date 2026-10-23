"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { isExpired, useAdminSession } from "@/features/auth/session";

/** The persisted session is only readable in the browser; render nothing until it has loaded. */
const subscribe = (onChange: () => void) => useAdminSession.persist.onFinishHydration(onChange);
const hydrated = () => useAdminSession.persist.hasHydrated();

export function RequireAdmin({ children }: { children: React.ReactNode }) {
	const router = useRouter();
	const ready = useSyncExternalStore(subscribe, hydrated, () => false);
	const token = useAdminSession((s) => s.accessToken);
	const expiresAt = useAdminSession((s) => s.expiresAt);
	const signedIn = !!token && !isExpired(expiresAt);

	useEffect(() => {
		if (ready && !signedIn) router.replace("/sign-in");
	}, [ready, signedIn, router]);

	if (!ready || !signedIn) {
		return (
			<div className="flex min-h-dvh items-center justify-center bg-background" role="status" aria-label="Loading">
				<Loader2 className="size-6 animate-spin text-primary" />
			</div>
		);
	}
	return <>{children}</>;
}
