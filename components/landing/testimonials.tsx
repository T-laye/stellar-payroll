"use client";

import { Card } from "@/components/ui/card";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "CFO at TechVenture",
    content:
      "Stellar has transformed how we manage payroll. We went from spending 20 hours a week on manual processes to just 2 hours. The transparency is incredible.",
    rating: 5,
  },
  {
    name: "Marcus Johnson",
    role: "Operations Manager at GlobalCorp",
    content:
      "Our international team is spread across 15 countries. Stellar makes it simple to pay everyone on time, every time. Customer support is outstanding.",
    rating: 5,
  },
  {
    name: "Emma Rodriguez",
    role: "HR Director at CreativeStudio",
    content:
      "The interface is intuitive, the fees are transparent, and the payments are instant. We have saved thousands of dollars compared to our previous solution.",
    rating: 5,
  },
  {
    name: "David Kim",
    role: "Founder at StartupXYZ",
    content:
      "As a startup founder, I needed a payroll solution that scales. Stellar grows with us, and the pricing is fair. Highly recommended for growing teams.",
    rating: 5,
  },
];

const stats = [
  {
    value: "10,000+",
    label: "Companies",
  },
  {
    value: "500K+",
    label: "Employees Paid",
  },
  {
    value: "$5B+",
    label: "Payroll Processed",
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-16 sm:py-20 md:py-32 bg-card/30">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        <div className="space-y-12 sm:space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground text-balance">
              Trusted by Global Teams
            </h2>
            <p className="text-base sm:text-lg text-foreground/70 max-w-2xl mx-auto">
              Join thousands of companies that rely on Stellar for their
              international payroll.
            </p>
          </div>

          <div className="grid gap-6 sm:gap-8 md:grid-cols-2">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.name} className="p-6 sm:p-8 flex flex-col">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 fill-primary text-primary"
                    />
                  ))}
                </div>

                <p className="text-sm sm:text-base text-foreground/80 leading-relaxed flex-1 mb-6">
                  "{testimonial.content}"
                </p>

                <div>
                  <p className="font-semibold text-foreground text-sm sm:text-base">
                    {testimonial.name}
                  </p>
                  <p className="text-xs sm:text-sm text-foreground/60">
                    {testimonial.role}
                  </p>
                </div>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 sm:gap-8 md:grid-cols-3 pt-8 border-t">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary mb-2">
                  {stat.value}
                </p>
                <p className="text-sm sm:text-base text-foreground/70">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
