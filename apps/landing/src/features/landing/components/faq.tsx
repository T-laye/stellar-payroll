import { Plus } from "lucide-react";
import FadeUp from "@repo/ui/fade-up";
import { FAQS } from "@/features/landing/content";

/** Native disclosure: works without JavaScript and is keyboard-accessible as is. */
export function FAQSection() {
	return (
		<section id="faq" className="scroll-mt-20 py-20 sm:py-28">
			<div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1.6fr]">
				<FadeUp>
					<h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Frequently asked questions</h2>
					<p className="mt-4 text-muted-foreground">
						Still have questions?{" "}
						<a href="mailto:support@payorbit.io" className="font-medium text-primary hover:underline">
							Contact our support team
						</a>
					</p>
				</FadeUp>
				<FadeUp delay={80} className="divide-y divide-border rounded-2xl border border-border bg-card">
					{FAQS.map((item) => (
						<details key={item.q} className="group px-6 py-1 [&_summary::-webkit-details-marker]:hidden">
							<summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-medium text-foreground">
								{item.q}
								<Plus className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-45" />
							</summary>
							<p className="pb-5 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
						</details>
					))}
				</FadeUp>
			</div>
		</section>
	);
}
