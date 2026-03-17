'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Globe, Zap, Shield } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-20 pb-32 md:pt-32 md:pb-48">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          <div className="space-y-8">
            <div className="space-y-6">
              <h1 className="text-4xl font-bold leading-tight text-foreground md:text-5xl lg:text-6xl">
                <span className="text-balance">Global Payroll Made Simple</span>
              </h1>
              <p className="text-lg text-foreground/70 md:text-xl">
                Pay your global team in minutes with Stellar. Fast, secure, and transparent cross-border payments powered by blockchain.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:gap-3">
              <Button size="lg" asChild className="gap-2">
                <Link href="/signup">
                  Get Started Now
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#features">Learn More</Link>
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-6 border-t pt-8">
              <div>
                <p className="text-2xl font-bold text-primary md:text-3xl">130+</p>
                <p className="text-sm text-foreground/60">Countries Supported</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary md:text-3xl">$1B+</p>
                <p className="text-sm text-foreground/60">Payroll Processed</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary md:text-3xl">2M+</p>
                <p className="text-sm text-foreground/60">Employees Paid</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -top-10 -right-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl"></div>
            <div className="absolute top-40 -left-10 h-72 w-72 rounded-full bg-accent/10 blur-3xl"></div>
            
            <div className="relative space-y-4 rounded-2xl border bg-card p-8 shadow-lg">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                <span className="font-semibold text-foreground">Instant Global Transfers</span>
              </div>
              <p className="text-sm text-foreground/70">
                Send payments to 130+ countries in multiple currencies with real-time settlement.
              </p>
              
              <div className="space-y-3 pt-4">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-accent" />
                  <span className="text-sm text-foreground">Lightning-fast settlements</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-accent" />
                  <span className="text-sm text-foreground">Bank-grade security</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
