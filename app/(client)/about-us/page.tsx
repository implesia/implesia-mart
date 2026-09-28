import type { Metadata } from "next";

import { AboutHero } from "./_components/about-hero";
import { BrandStory } from "./_components/brand-story";
import { CustomDresses } from "./_components/custom-dresses";
import { HowItWorks } from "./_components/how-it-works";
import { MissionVision } from "./_components/mission-vision";
import { ShopCta } from "./_components/shop-cta";
import { StatsBar } from "./_components/stats-bar";
import { TrustBadges } from "./_components/trust-badges";

export const metadata: Metadata = {
  title: "আমাদের সম্পর্কে",
  description:
    "ইমপ্লেসিয়া মার্ট — আপনার নিশ্চিন্ত অনলাইন শপিং পার্টনার। আমাদের মিশন, প্রোডাক্ট কোয়ালিটি প্রক্রিয়া ও কাস্টম ড্রেস মেকিং সম্পর্কে জানুন।",
  alternates: { canonical: "/about-us" },
};

export default function AboutUsPage() {
  return (
    <main>
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
