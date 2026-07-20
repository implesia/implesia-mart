import { AboutHero } from "./_components/about-hero";
import { BrandStory } from "./_components/brand-story";
import { CustomDresses } from "./_components/custom-dresses";
import { HowItWorks } from "./_components/how-it-works";
import { MissionVision } from "./_components/mission-vision";
import { ShopCta } from "./_components/shop-cta";
import { StatsBar } from "./_components/stats-bar";
import { TrustBadges } from "./_components/trust-badges";

export default function AboutUsPage() {
  return (
    <main className="pt-16 sm:pt-20">
      <AboutHero />
      <StatsBar />
      <BrandStory />
      <CustomDresses />
      <MissionVision />
      <TrustBadges />
      <HowItWorks />
      <ShopCta />
    </main>
  );
}
