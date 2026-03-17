"use client";

import { Card } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

const steps = [
  {
    number: 1,
    title: "Add Your Employees",
    description:
      "Upload employee data with their wallet addresses and payment preferences. Support for 130+ countries.",
  },
  {
    number: 2,
    title: "Create Payroll Groups",
    description:
      "Organize employees by department or payment frequency. Set up recurring payroll schedules.",
  },
  {
    number: 3,
    title: "Review & Approve",
    description:
      "Review all payment details and exchange rates before processing. Full transparency and control.",
  },
  {
    number: 4,
    title: "Instant Settlement",
    description:
      "Payments settle in real-time using Stellar blockchain. Employees receive funds instantly.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-16 sm:py-20 md:py-32 bg-card/30">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        <div className="space-y-12 sm:space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground text-balance">
              Simple 4-Step Process
            </h2>
            <p className="text-base sm:text-lg text-foreground/70 max-w-2xl mx-auto">
              Get your global payroll running in just a few minutes.
            </p>
          </div>

          <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => (
              <Card
                key={step.number}
                className="relative overflow-hidden p-6 sm:p-8 flex flex-col"
              >
                <div className="absolute top-0 right-0 h-20 w-20 bg-primary/5 rounded-full -mr-10 -mt-10" />

                <div className="relative space-y-4">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white font-bold text-lg">
                    {step.number}
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-base sm:text-lg font-semibold text-foreground">
                      {step.title}
                    </h3>
                    <p className="text-sm text-foreground/70 leading-relaxed">
                      {step.description}
                    </p>
                  </div>

                  {step.number < steps.length && (
                    <div className="absolute -right-8 top-1/2 hidden lg:block">
                      <div className="w-16 h-0.5 bg-linear-to-r from-primary to-accent" />
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
