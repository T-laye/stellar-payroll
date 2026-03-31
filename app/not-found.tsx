import Link from "next/link";
import { Compass, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/ui/logo";

export default function NotFound() {
	return (
		<div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
			<div className="pointer-events-none absolute inset-0">
				<div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
				<div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
			</div>

			<div className="relative z-10 mx-auto w-full max-w-2xl text-center">
				<div className="mb-8 flex justify-center">
					<Logo w="w-40" />
				</div>

				<div className="rounded-4xl border border-border bg-card/95 p-8 shadow-xl shadow-black/5 backdrop-blur-sm sm:p-12">
					<div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
						<Compass className="h-8 w-8 text-primary" />
					</div>

					<p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-primary/80">
						404
					</p>
					<h1 className="mb-3 text-3xl font-bold text-foreground sm:text-4xl">
						Page not found
					</h1>
					<p className="mx-auto mb-8 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
						The page you tried to reach doesn&apos;t exist or may have moved.
						Let&apos;s get you back to something useful.
					</p>

					<div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
						<Button asChild className="gap-2">
							<Link href="/">
								<Home className="h-4 w-4" />
								Go Home
							</Link>
						</Button>
						<Button asChild variant="outline" className="gap-2">
							<Link href="/dashboard">
								<ArrowLeft className="h-4 w-4" />
								Open Dashboard
							</Link>
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
