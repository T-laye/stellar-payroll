"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/client";

/** One query client per tab. Writes never retry (a suspension or grant must not go out twice). */
export function Providers({ children }: { children: ReactNode }) {
	const [client] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: 30_000,
						refetchOnWindowFocus: false,
						retry: (count, error) => !(error instanceof ApiError && error.status >= 400 && error.status < 500) && count < 1,
					},
					mutations: { retry: false },
				},
			}),
	);
	return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
