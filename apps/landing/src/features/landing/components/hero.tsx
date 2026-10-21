import { ArrowRight, Check, Clock, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@repo/ui/button";
import { APP_LINKS } from "@/lib/site";

const TRANSFERS = [
	{ flag: "us", country: "United States", when: "Just now", amount: "$4,200.00" },
	{ flag: "gb", country: "United Kingdom", when: "2s ago", amount: "£3,100.00" },
	{ flag: "de", country: "Germany", when: "5s ago", amount: "€2,890.00" },
];

const PAYOUTS = [
	{ flag: "ng", name: "Chidi Okonkwo", role: "Senior Engineer", amount: "$3,200.00", time: "3.8s", done: true },
	{ flag: "br", name: "Maria Rodrigues", role: "Product Designer", amount: "$2,400.00", time: "4.1s", done: true },
	{ flag: "ph", name: "James Mercado", role: "Ops Manager", amount: "$1,900.00", time: "", done: false },
];

/** "Pay your global team in seconds, not days." with a live-looking payroll run beside it. */
export function HeroSection() {
	return (
		<section className="relative overflow-hidden">
			<div className="pointer-events-none absolute inset-0" aria-hidden>
				<div className="absolute -top-40 left-1/2 h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-brand-purple/12 blur-3xl" />
				<div className="absolute top-40 -right-32 size-96 rounded-full bg-brand-magenta/10 blur-3xl" />
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img
					src="/images/map.webp"
					alt=""
					className="absolute top-24 left-1/2 w-[1400px] max-w-none -translate-x-1/2 opacity-[0.07] grayscale"
				/>
			</div>

			<div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 pt-14 pb-20 sm:px-6 md:pt-20 lg:grid-cols-[1.05fr_1fr] lg:pb-28">
				<div className="animate-rise space-y-8">
					<span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1.5 text-xs font-semibold text-primary">
						<span className="animate-signal size-1.5 rounded-full bg-primary text-primary" aria-hidden />
						Blockchain-Powered Payroll
					</span>
					<h1 className="text-4xl leading-[1.05] font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
						Pay your global team <span className="text-brand-gradient">in seconds,</span> not days.
					</h1>
					<p className="max-w-xl text-lg text-muted-foreground">
						PayOrbit settles payroll instantly using USDC on the Stellar network — no wire transfers, no bank delays, no hidden
						fees. Built for teams that work across borders.
					</p>
					<div className="flex flex-col gap-3 sm:flex-row">
						<Button asChild size="lg" className="h-12 px-6 text-base shadow-lg shadow-primary/30">
							<a href={APP_LINKS.signUp}>
								Get started free <ArrowRight />
							</a>
						</Button>
						<Button asChild size="lg" variant="outline" className="h-12 px-6 text-base">
							<a href="#how-it-works">See how it works</a>
						</Button>
					</div>
					<div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
						<span className="flex items-center gap-1.5">
							<Zap className="size-4 text-primary" /> Lightning-fast
						</span>
						<span className="flex items-center gap-1.5">
							<ShieldCheck className="size-4 text-primary" /> Bank-grade security
						</span>
						<span className="flex items-center gap-1.5">
							<Check className="size-4 text-primary" /> No credit card required
						</span>
					</div>
				</div>

				<div className="relative animate-rise" style={{ "--i": 2 } as React.CSSProperties}>
					<div className="relative rounded-3xl border border-border bg-card/90 p-5 shadow-2xl shadow-brand-purple/15 backdrop-blur sm:p-6">
						<div className="flex items-start justify-between gap-3">
							<div>
								<p className="text-sm font-semibold text-foreground">April Payroll Run</p>
								<p className="text-xs text-muted-foreground">24 employees · 11 countries</p>
							</div>
							<span className="inline-flex items-center gap-1.5 rounded-full border border-success/20 bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
								<span className="size-1.5 rounded-full bg-success" /> Settled
							</span>
						</div>
						<div className="mt-5 rounded-2xl bg-brand-night p-5 text-white">
							<p className="text-xs text-white/60">Total disbursed</p>
							<p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">$47,200.00</p>
							<p className="text-xs text-white/60">USDC · Stellar Network</p>
							<div className="mt-4">
								<div className="mb-1.5 flex justify-between text-xs text-white/70">
									<span>Settlement progress</span>
									<span className="tabular-nums">22 / 24</span>
								</div>
								<div className="h-2 overflow-hidden rounded-full bg-white/10">
									<div className="h-full w-[92%] rounded-full bg-brand-gradient-wide" />
								</div>
							</div>
						</div>
						<div className="mt-5">
							<div className="mb-2 flex items-center justify-between">
								<p className="text-sm font-semibold">Recent Payouts</p>
								<span className="flex items-center gap-1.5 text-xs font-medium text-success">
									<span className="animate-signal size-1.5 rounded-full bg-success text-success" /> Live
								</span>
							</div>
							<ul className="divide-y divide-border">
								{PAYOUTS.map((p) => (
									<li key={p.name} className="flex items-center gap-3 py-2.5">
										{/* Flag images, not emoji: Windows has no flag emoji. */}
										{/* eslint-disable-next-line @next/next/no-img-element */}
										<img src={`https://flagcdn.com/w40/${p.flag}.png`} alt="" width={24} height={16} className="rounded-sm" />
										<span className="min-w-0 flex-1">
											<span className="block truncate text-sm font-medium">{p.name}</span>
											<span className="block text-xs text-muted-foreground">{p.role}</span>
										</span>
										<span className="text-right">
											<span className="block text-sm font-semibold tabular-nums">{p.amount}</span>
											{p.done ? (
												<span className="flex items-center justify-end gap-1 text-xs text-success">
													<Check className="size-3" /> {p.time}
												</span>
											) : (
												<span className="flex items-center justify-end gap-1 text-xs text-warning">
													<Clock className="size-3" /> Pending…
												</span>
											)}
										</span>
									</li>
								))}
							</ul>
						</div>
					</div>

					<div className="absolute -bottom-8 -left-6 hidden w-64 rounded-2xl border border-border bg-card p-4 shadow-xl sm:block">
						<p className="mb-2 flex items-center justify-between text-xs font-semibold">
							Instant Global Transfers <span className="text-success">Live</span>
						</p>
						<ul className="space-y-2">
							{TRANSFERS.map((t) => (
								<li key={t.country} className="flex items-center gap-2 text-xs">
									{/* eslint-disable-next-line @next/next/no-img-element */}
									<img src={`https://flagcdn.com/w40/${t.flag}.png`} alt="" width={20} height={14} className="rounded-sm" />
									<span className="flex-1 text-muted-foreground">{t.country}</span>
									<span className="font-semibold tabular-nums">{t.amount}</span>
								</li>
							))}
						</ul>
					</div>
				</div>
			</div>
		</section>
	);
}
