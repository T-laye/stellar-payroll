"use client";

import { useAuthStore } from "@/lib/stores/auth-store";
import { routes } from "@/lib/utils/routes";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LoadingPage from "../shared/LoadingPage";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
	const user = useAuthStore((state) => state.user);
	const isHydrated = useAuthStore((state) => state._hydrated);
	const router = useRouter();

	useEffect(() => {
		// Only check authentication after hydration is complete
		if (isHydrated && !user) {
			router.push(routes.authRoutes.SIGN_IN);
		}
	}, [user, isHydrated, router]);

	// Show loading while hydrating
	if (!isHydrated) {
		return (
			<LoadingPage />
		);
	}

	if (!user) {
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
