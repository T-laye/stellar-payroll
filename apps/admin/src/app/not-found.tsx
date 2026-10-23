import Link from "next/link";
import { Button } from "@repo/ui/button";

export default function NotFound() {
	return (
		<div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background px-4 text-center">
			<p className="text-sm font-semibold text-primary">404</p>
			<h1 className="text-2xl font-semibold">Page not found</h1>
			<p className="text-muted-foreground">That page isn&apos;t part of the admin console.</p>
			<Button asChild className="mt-2">
				<Link href="/">Back to the overview</Link>
			</Button>
		</div>
	);
}
