'use client';

import { useAuthStore } from '@/lib/stores/auth-store';
import { routes } from '@/lib/utils/routes';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push(routes.authRoutes.SIGN_IN);
    }
  }, [user, router]);

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
