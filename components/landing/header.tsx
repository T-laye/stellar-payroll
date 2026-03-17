'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-sm font-bold text-primary-foreground italic">P</span>
          </div>
          <span className="text-xl font-bold text-foreground">PayOrbit</span>
        </Link>
        
        <nav className="hidden gap-8 md:flex">
          <Link href="#features" className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors">
            Features
          </Link>
          <Link href="#how-it-works" className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors">
            How It Works
          </Link>
          <Link href="#pricing" className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors">
            Pricing
          </Link>
        </nav>

        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link href="/signin">Sign In</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Get Started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
