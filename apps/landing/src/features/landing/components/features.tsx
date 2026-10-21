import FadeUp from "@repo/ui/fade-up";
import { FEATURES, STATS } from "@/features/landing/content";

/** Headline numbers, the partners, and the twelve platform features. */
export function FeaturesSection() {
	return (
		<>
			<section className="border-y border-border bg-card">
				<div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1fr_auto] md:items-center">
					<dl className="grid grid-cols-3 gap-4">
						{STATS.map((s) => (
							<div key={s.label}>
								<dt className="text-xs text-muted-foreground sm:text-sm">{s.label}</dt>
								<dd className="text-brand-gradient text-3xl font-semibold tracking-tight sm:text-4xl">{s.value}</dd>
							</div>
						))}
					</dl>
					<div className="flex items-center gap-6 text-sm text-muted-foreground">
						<span className="text-xs tracking-wider uppercase">Powered by</span>
						{["Stellar", "USDC", "Circle"].map((name) => (
							<span key={name} className="text-lg font-semibold text-foreground/70">
								{name}
							</span>
						))}
					</div>
				</div>
			</section>

			<section id="features" className="scroll-mt-20 py-20 sm:py-28">
				<div className="mx-auto max-w-7xl px-4 sm:px-6">
					<FadeUp className="mx-auto mb-14 max-w-2xl text-center">
						<p className="text-sm font-semibold text-primary">Platform Features</p>
						<h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
							The infrastructure behind the PayOrbit stack.
						</h2>
						<p className="mt-4 text-muted-foreground">
							Everything a finance team needs to pay people across borders — and everything employees need to trust it.
						</p>
					</FadeUp>
					<div className="grid gap-px overflow-hidden rounded-3xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
						{FEATURES.map((f, i) => (
							<FadeUp key={f.title} delay={(i % 3) * 60} className="group bg-card p-7 transition-colors hover:bg-accent/40">
								<span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
									<f.icon className="size-5" />
								</span>
								<h3 className="mt-5 font-semibold text-foreground">{f.title}</h3>
								<p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.description}</p>
							</FadeUp>
						))}
					</div>
				</div>
			</section>
		</>
	);
}
