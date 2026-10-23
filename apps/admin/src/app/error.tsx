"use client";

import { Button } from "@repo/ui/button";

/** Next 16 error boundaries get `retry()`. */
export default function Error({ retry }: { error: Error; retry: () => void }) {
	return (
		<div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background px-4 text-center">
			<h1 className="text-2xl font-semibold">Something went wrong</h1>
			<p className="text-muted-foreground">The console hit an unexpected error.</p>
			<Button onClick={() => retry()} className="mt-2">
				Try again
			</Button>
		</div>
	);
}
