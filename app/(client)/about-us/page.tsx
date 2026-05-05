import { AboutHero } from "./_components/about-hero";
import { BrandStory } from "./_components/brand-story";
import { MissionVision } from "./_components/mission-vision";
import { NewsletterCta } from "./_components/newsletter-cta";
import { TeamSection } from "./_components/team-section";
import { TrustBadges } from "./_components/trust-badges";

export default function AboutUsPage() {
  return (
    <main>
      <AboutHero />
      <BrandStory />
      <MissionVision />
      <TrustBadges />
      <TeamSection />
      <NewsletterCta />
    </main>
  );
}
