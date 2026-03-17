"use client";

import { Card } from "@/components/ui/card";
import {
  Users,
  Clock,
  TrendingUp,
  Lock,
  DollarSign,
  FileText,
} from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Employee Management",
    description:
      "Manage employee data, wallet addresses, and payment preferences in one place.",
  },
  {
    icon: Clock,
    title: "Automated Payroll",
    description:
      "Schedule recurring payrolls and let Stellar handle the rest automatically.",
  },
  {
    icon: TrendingUp,
    title: "Real-time Analytics",
    description:
      "Track payroll costs, payment status, and financial insights in real-time.",
  },
  {
    icon: Lock,
    title: "Bank-Grade Security",
    description:
      "Secure payments with blockchain technology and multi-signature authentication.",
  },
  {
    icon: DollarSign,
    title: "Multi-Currency Support",
    description:
      "Support 150+ currencies with real-time exchange rates and transparent fees.",
  },
  {
    icon: FileText,
    title: "Compliance & Reporting",
    description:
      "Automatic compliance reporting and audit trails for regulatory requirements.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 md:py-32">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold md:text-4xl lg:text-5xl text-foreground">
              <span className="text-balance">
                Everything You Need for Global Payroll
              </span>
            </h2>
            <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
              Powerful features designed to make cross-border payroll simple,
              fast, and reliable.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={feature.title}
                  className="group relative overflow-hidden border bg-card/50 p-6 transition-all hover:bg-card hover:shadow-md"
                >
                  <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

                  <div className="relative space-y-4">
                    <div className="inline-flex rounded-lg bg-primary/10 p-3">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>

                    <div>
                      <h3 className="font-semibold text-foreground">
                        {feature.title}
                      </h3>
                      <p className="mt-2 text-sm text-foreground/70">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
