import { LandingHeader } from '@/components/landing/header';
import { HeroSection } from '@/components/landing/hero';
import { FeaturesSection } from '@/components/landing/features';
import { CTASection } from '@/components/landing/cta';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />
      <HeroSection />
      <FeaturesSection />
      <CTASection />
    </div>
  );
}
