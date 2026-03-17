"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

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
        <div className="space-y-12 sm:space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground text-balance">
              Frequently Asked Questions
            </h2>
            <p className="text-base sm:text-lg text-foreground/70">
              Everything you need to know about Stellar.
            </p>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index} className="overflow-hidden">
                <button
                  onClick={() =>
                    setOpenIndex(openIndex === index ? null : index)
                  }
                  className="w-full px-6 sm:px-8 py-4 sm:py-6 flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
                  <h3 className="text-base sm:text-lg font-semibold text-foreground text-left">
                    {faq.question}
                  </h3>
                  <ChevronDown
                    className={cn(
                      "h-5 w-5 text-primary shrink-0 transition-transform",
                      openIndex === index && "rotate-180",
                    )}
                  />
                </button>

                {openIndex === index && (
                  <div className="px-6 sm:px-8 py-4 sm:py-6 border-t bg-muted/30">
                    <p className="text-sm sm:text-base text-foreground/70 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </Card>
            ))}
          </div>

          <div className="text-center pt-8">
            <p className="text-sm sm:text-base text-foreground/70 mb-4">
              Can't find what you're looking for?
            </p>
            <a
              href="mailto:support@stellar.com"
              className="text-primary hover:text-primary/80 font-semibold transition-colors"
            >
              Contact our support team
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
