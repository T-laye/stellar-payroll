import { LandingHeader } from "@/features/landing/components/header";
import { HeroSection } from "@/features/landing/components/hero";
import { FeaturesSection } from "@/features/landing/components/features";
import { HowItWorksSection } from "@/features/landing/components/how-it-works";
import { TestimonialsSection } from "@/features/landing/components/testimonials";
import { PricingSection } from "@/features/landing/components/pricing";
import { FAQSection } from "@/features/landing/components/faq";
import { CTASection } from "@/features/landing/components/cta";
import { LandingFooter } from "@/features/landing/components/footer";

export default function Home() {
	return (
		<div className="min-h-screen bg-background">
			<LandingHeader />
			<main>
				<HeroSection />
				<FeaturesSection />
				<HowItWorksSection />
				<TestimonialsSection />
				<PricingSection />
				<FAQSection />
				<CTASection />
			</main>
			<LandingFooter />
		</div>
	);
}
