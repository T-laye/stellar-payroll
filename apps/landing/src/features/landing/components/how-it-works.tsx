import { CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";
import FadeUp from "@repo/ui/fade-up";
import { STEPS } from "@/features/landing/content";

const STATUSES = [
	{ icon: Clock, label: "Pending", text: "Created, waiting to be sent", tone: "text-warning bg-warning/10" },
	{ icon: Loader2, label: "Processing", text: "Sent to the Stellar network", tone: "text-info bg-info/10" },
	{ icon: CheckCircle2, label: "Completed", text: "Confirmed, with a transaction hash", tone: "text-success bg-success/10" },
	{ icon: XCircle, label: "Failed", text: "With the reason, ready to retry", tone: "text-destructive bg-destructive/10" },
];

/** The four steps, then the two sides of the product: the admin dashboard and the employee portal. */
export function HowItWorksSection() {
	return (
		<section id="how-it-works" className="scroll-mt-20 bg-brand-night py-20 text-white sm:py-28">
			<div className="mx-auto max-w-7xl px-4 sm:px-6">
				<FadeUp className="mb-14 max-w-2xl">
					<p className="text-sm font-semibold text-brand-cyan">4 Simple Steps</p>
					<h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Effortless Payroll, Every Pay Cycle.</h2>
				</FadeUp>
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
					{STEPS.map((s, i) => (
						<FadeUp key={s.title} delay={i * 80}>
							<div className="h-full rounded-2xl border border-white/10 bg-white/4 p-6">
								<span className="text-brand-gradient text-4xl font-semibold">{String(i + 1).padStart(2, "0")}.</span>
								<h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
								<p className="mt-2 text-sm leading-relaxed text-white/65">{s.description}</p>
							</div>
						</FadeUp>
					))}
				</div>

				<div className="mt-20 grid items-center gap-10 lg:grid-cols-2">
					<FadeUp>
						<p className="text-sm font-semibold text-brand-cyan">For employees</p>
						<h3 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Everyone can see where their pay is.</h3>
						<p className="mt-4 max-w-lg text-white/65">
							Every employee gets their own portal: total received, the latest payment, full history, and for each completed
							payment, a Stellar transaction anyone can verify.
						</p>
					</FadeUp>
					<FadeUp delay={100}>
						<ul className="grid gap-3 sm:grid-cols-2">
							{STATUSES.map((s) => (
								<li key={s.label} className="flex items-start gap-3 rounded-2xl bg-white p-4 text-foreground">
									<span className={`flex size-9 shrink-0 items-center justify-center rounded-full ${s.tone}`}>
										<s.icon className="size-4.5" />
									</span>
									<span>
										<span className="block text-sm font-semibold">{s.label}</span>
										<span className="block text-xs text-muted-foreground">{s.text}</span>
									</span>
								</li>
							))}
						</ul>
					</FadeUp>
				</div>
			</div>
		</section>
	);
}
