'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export function CTASection() {
  return (
    <section className="py-20 md:py-32">
      <div className="container mx-auto max-w-4xl px-4">
        <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-accent/10 p-12 md:p-16">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />
          
          <div className="relative space-y-8 text-center">
            <h2 className="text-3xl font-bold md:text-4xl text-foreground">
              <span className="text-balance">Ready to Simplify Your Global Payroll?</span>
            </h2>
            
            <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
              Join thousands of companies that trust Stellar to pay their global teams. Get started in minutes, not months.
            </p>

            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center gap-3">
              <Button size="lg" asChild className="gap-2">
                <Link href="/signup">
                  Start Free Trial
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#contact">Schedule Demo</Link>
              </Button>
            </div>

            <p className="text-sm text-foreground/60">
              No credit card required. Full access for 14 days.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
