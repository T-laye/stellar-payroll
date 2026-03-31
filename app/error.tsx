"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/ui/logo";

export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
			<div className="pointer-events-none absolute inset-0">
				<div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-destructive/10 blur-3xl" />
				<div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
			</div>

			<div className="relative z-10 mx-auto w-full max-w-2xl text-center">
				<div className="mb-8 flex justify-center">
					<Logo w="w-40" />
				</div>

				<div className="rounded-4xl border border-border bg-card/95 p-8 shadow-xl shadow-black/5 backdrop-blur-sm sm:p-12">
					<div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
						<AlertTriangle className="h-8 w-8 text-destructive" />
					</div>

					<h1 className="mb-3 text-3xl font-bold text-foreground sm:text-4xl">
						Something went wrong
					</h1>
					<p className="mx-auto mb-8 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
						An unexpected error interrupted this page. You can try again now, or
						head back to a safe starting point.
					</p>

					<div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
						<Button onClick={reset} className="gap-2">
							<RefreshCw className="h-4 w-4" />
							Try Again
						</Button>
						<Button asChild variant="outline" className="gap-2">
							<Link href="/">
								<Home className="h-4 w-4" />
								Go Home
							</Link>
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
