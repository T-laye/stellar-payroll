"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "Free",
    period: "Forever",
    description: "Perfect for small teams getting started",
    features: [
      "Up to 10 employees",
      "Basic payroll management",
      "Email support",
      "Monthly payroll runs",
      "Standard security",
    ],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Professional",
    price: "$299",
    period: "/month",
    description: "For growing companies",
    features: [
      "Up to 500 employees",
      "Advanced payroll features",
      "Priority email & chat support",
      "Weekly & bi-weekly payrolls",
      "Advanced analytics",
      "Custom integrations",
      "Compliance reporting",
    ],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "pricing",
    description: "For large organizations",
    features: [
      "Unlimited employees",
      "White-label solutions",
      "Dedicated support team",
      "Custom workflows",
      "Advanced security & compliance",
      "SLA guarantees",
      "Custom integrations",
      "Training included",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-16 sm:py-20 md:py-32">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        <div className="space-y-12 sm:space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground text-balance">
              Transparent Pricing
            </h2>
            <p className="text-base sm:text-lg text-foreground/70 max-w-2xl mx-auto">
              Choose the perfect plan for your business. Always transparent, no
              hidden fees.
            </p>
          </div>

          <div className="grid gap-6 sm:gap-8 md:grid-cols-3">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={`relative p-6 sm:p-8 flex flex-col transition-all ${
                  plan.highlighted ? "ring-2 ring-primary md:scale-105" : ""
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs sm:text-sm font-semibold">
                      Most Popular
                    </div>
                  </div>
                )}

                <div className="space-y-2 mb-6">
                  <h3 className="text-xl sm:text-2xl font-bold text-foreground">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-foreground/60">
                    {plan.description}
                  </p>
                </div>

                <div className="space-y-1 mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-bold text-foreground">
                      {plan.price}
                    </span>
                    <span className="text-sm text-foreground/60">
                      {plan.period}
                    </span>
                  </div>
                </div>

                <Button
                  className="w-full mb-8"
                  variant={plan.highlighted ? "default" : "outline"}
                  asChild
                >
                  <Link href="/signup">{plan.cta}</Link>
                </Button>

                <div className="space-y-3 flex-1">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground/70">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
