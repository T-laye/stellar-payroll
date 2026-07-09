"use client";

import { useAuthStore } from "@/lib/stores/auth-store";
import { routes } from "@/lib/utils/routes";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LoadingPage from "@/components/shared/LoadingPage";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
	const user = useAuthStore((state) => state.user);
	const session = useAuthStore((state) => state.session);
	const isHydrated = useAuthStore((state) => state._hydrated);
	const router = useRouter();
	const hasSession = Boolean(
		user || session?.access_token || session?.pay_token,
	);

	useEffect(() => {
		if (!isHydrated) {
			return;
		}

		if (!hasSession) {
			router.push(routes.authRoutes.SIGN_IN);
		}
	}, [hasSession, isHydrated, router]);

	if (!isHydrated && !hasSession) {
		return <LoadingPage />;
	}

	if (!hasSession) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-center">
					<p className="text-foreground/60">Redirecting...</p>
				</div>
			</div>
		);
	}

	return <>{children}</>;
}
