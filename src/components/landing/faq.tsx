"use client";
import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import FadeUp from "../shared/FadeUp";


// ─── FAQ ──────────────────────────────────────────────────────────────────────
const faqs = [
	{
		question: "How does Stellar ensure payment security?",
		answer:
			"Stellar uses blockchain technology with multi-signature authentication, encryption, and bank-grade security protocols. All transactions are immutable and transparent on the Stellar blockchain.",
	},
	{
		question: "What are the fees?",
		answer:
			"Transparent, competitive fees starting at $299/month for the Professional plan. Enterprise plans have custom pricing. No hidden fees—you always know what you're paying.",
	},
	{
		question: "How long does payment settlement take?",
		answer:
			"Most payments settle instantly using the Stellar blockchain. International transfers typically complete within 5 minutes, making it the fastest in the industry.",
	},
	{
		question: "Which countries and currencies are supported?",
		answer:
			"We support 130+ countries and 150+ currencies with real-time exchange rates. Coverage continues to expand based on customer demand.",
	},
	{
		question: "Can I integrate Stellar with my existing HR system?",
		answer:
			"Yes! Stellar offers API access and integrations with popular HR platforms like BambooHR, Gusto, and others. Contact our sales team for custom integrations.",
	},
	{
		question: "Is there a free trial?",
		answer:
			"Yes! Try Stellar free with our Starter plan. Upgrade anytime to Professional or Enterprise for advanced features. No credit card required.",
	},
];

export function FAQSection() {
	const [openIndex, setOpenIndex] = useState<number | null>(null);

	return (
		<section className="py-16 sm:py-20 md:py-32">
			<div className="container mx-auto max-w-4xl px-4 sm:px-6">
				<FadeUp className="text-center space-y-4 mb-12 sm:mb-16">
					<h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
						Frequently Asked <span className="text-primary">Questions</span>
					</h2>
					<p className="text-base sm:text-lg text-foreground/70">
						Everything you need to know about Stellar.
					</p>
				</FadeUp>

				<div className="space-y-3 sm:space-y-4">
					{faqs.map((faq, index) => {
						const isOpen = openIndex === index;
						return (
							<FadeUp key={index} delay={index * 60}>
								<Card className="overflow-hidden transition-all duration-200 hover:shadow-sm">
									<button
										onClick={() => setOpenIndex(isOpen ? null : index)}
										className="w-full px-5 sm:px-7 py-4 sm:py-5 flex items-center justify-between hover:bg-muted/50 transition-colors gap-4"
										aria-expanded={isOpen}
									>
										<h3 className="text-sm sm:text-base font-semibold text-foreground text-left">
											{faq.question}
										</h3>
										<ChevronDown
											className={cn(
												"h-4 w-4 text-primary shrink-0 transition-transform duration-300",
												isOpen && "rotate-180",
											)}
										/>
									</button>

									{/* Animated accordion */}
									<div
										style={{
											display: "grid",
											gridTemplateRows: isOpen ? "1fr" : "0fr",
											transition: "grid-template-rows 0.3s ease",
										}}
									>
										<div className="overflow-hidden">
											<div className="px-5 sm:px-7 py-4 sm:py-5 border-t bg-muted/20">
												<p className="text-sm sm:text-base text-foreground/70 leading-relaxed">
													{faq.answer}
												</p>
											</div>
										</div>
									</div>
								</Card>
							</FadeUp>
						);
					})}
				</div>

				<FadeUp delay={200} className="text-center pt-10">
					<p className="text-sm sm:text-base text-foreground/70 mb-3">
						Can't find what you're looking for?
					</p>
					<a
						href="mailto:support@stellar.com"
						className="text-primary hover:text-primary/80 font-semibold transition-colors underline underline-offset-4 decoration-primary/30 hover:decoration-primary"
					>
						Contact our support team
					</a>
				</FadeUp>
			</div>
		</section>
	);
}
