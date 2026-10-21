import { ArrowRight } from "lucide-react";
import { Button } from "@repo/ui/button";
import FadeUp from "@repo/ui/fade-up";
import { APP_LINKS } from "@/lib/site";

export function CTASection() {
	return (
		<section className="px-4 pb-20 sm:px-6 sm:pb-28">
			<FadeUp className="relative mx-auto grid max-w-7xl overflow-hidden rounded-4xl bg-brand-night text-white lg:grid-cols-2">
				<div
					className="pointer-events-none absolute -top-32 -left-32 size-96 rounded-full bg-brand-purple/40 blur-3xl"
					aria-hidden
				/>
				<div className="relative space-y-6 p-8 sm:p-12 lg:p-16">
					<h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
						The fastest payroll decision you&apos;ll ever make.
					</h2>
					<p className="max-w-md text-white/70">
						Set up global payroll in under 15 minutes. Pay employees and contractors worldwide — settling on Stellar in under 5
						seconds.
					</p>
					<div className="flex flex-col gap-3 sm:flex-row">
						<Button asChild size="lg" className="h-12 bg-white px-6 text-base text-brand-night hover:bg-white/90">
							<a href={APP_LINKS.signUp}>
								Get started free <ArrowRight />
							</a>
						</Button>
						<Button
							asChild
							size="lg"
							variant="outline"
							className="h-12 border-white/25 bg-transparent px-6 text-base text-white hover:bg-white/10 hover:text-white"
						>
							<a href="mailto:support@payorbit.io">Contact support</a>
						</Button>
					</div>
					<p className="text-xs text-white/50">No credit card required · Free forever for small teams</p>
				</div>
				<div className="relative hidden min-h-80 lg:block">
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img
						src="/images/team.jpg"
						alt="A team working together at a laptop"
						className="absolute inset-0 size-full object-cover"
					/>
					<div className="absolute inset-0 bg-linear-to-r from-brand-night via-brand-night/30 to-transparent" />
				</div>
			</FadeUp>
		</section>
	);
}
