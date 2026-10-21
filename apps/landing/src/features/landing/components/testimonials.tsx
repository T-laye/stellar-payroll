import FadeUp from "@repo/ui/fade-up";
import { TESTIMONIALS } from "@/features/landing/content";

const initials = (name: string) =>
	name
		.split(" ")
		.map((p) => p[0])
		.join("");

export function TestimonialsSection() {
	return (
		<section className="py-20 sm:py-28">
			<div className="mx-auto max-w-7xl px-4 sm:px-6">
				<FadeUp className="mx-auto mb-14 max-w-2xl text-center">
					<p className="text-sm font-semibold text-primary">What teams are saying</p>
					<h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Trusted by global finance &amp; HR teams.</h2>
				</FadeUp>
				<div className="columns-1 gap-6 md:columns-2 lg:columns-3">
					{TESTIMONIALS.map((t, i) => (
						<FadeUp key={t.name} delay={(i % 3) * 60} className="mb-6 break-inside-avoid">
							<figure className="rounded-2xl border border-border bg-card p-6 shadow-xs">
								<blockquote className="text-[15px] leading-relaxed text-foreground">&ldquo;{t.quote}&rdquo;</blockquote>
								<figcaption className="mt-5 flex items-center gap-3">
									<span className="flex size-10 items-center justify-center rounded-full bg-brand-gradient text-sm font-semibold text-white">
										{initials(t.name)}
									</span>
									<span>
										<span className="block text-sm font-semibold">{t.name}</span>
										<span className="block text-xs text-muted-foreground">{t.role}</span>
									</span>
								</figcaption>
							</figure>
						</FadeUp>
					))}
				</div>
			</div>
		</section>
	);
}
