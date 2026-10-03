import type { Metadata } from "next";

import { FALLBACK_ABOUT_HERO, listPublicAboutHero } from "@/lib/mart-api/about-hero";
import { FALLBACK_ABOUT_STATS, listPublicAboutStats } from "@/lib/mart-api/about-stats";
import { FALLBACK_ABOUT_STORIES, listPublicAboutStories } from "@/lib/mart-api/about-stories";
import { FALLBACK_ABOUT_DRESSES, listPublicAboutDresses } from "@/lib/mart-api/about-dresses";
import { FALLBACK_ABOUT_MISSION, listPublicAboutMission } from "@/lib/mart-api/about-mission";
import { FALLBACK_ABOUT_VALUES, listPublicAboutValues } from "@/lib/mart-api/about-values";
import { FALLBACK_ABOUT_STEPS, listPublicAboutSteps } from "@/lib/mart-api/about-steps";
import { FALLBACK_ABOUT_CTA, listPublicAboutCta } from "@/lib/mart-api/about-cta";

import { Container } from "../_components/common/container";
import { ProductBreadcrumbs } from "../products/_components/product-breadcrumbs";
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
    "ইমপ্লেসিয়া মার্ট — ট্রেন্ডিং গ্যাজেট ও হাতে তৈরি গর্জিয়াস ড্রেস, ক্যাশ অন ডেলিভারিতে সারাদেশে।",
  alternates: { canonical: "/about-us" },
};

export default async function AboutUsPage() {
  const [hero, stats, stories, dresses, mission, values, steps, cta] = await Promise.all([
    listPublicAboutHero(),
    listPublicAboutStats(),
    listPublicAboutStories(),
    listPublicAboutDresses(),
    listPublicAboutMission(),
    listPublicAboutValues(),
    listPublicAboutSteps(),
    listPublicAboutCta(),
  ]);
  return (
    <main className="force-light w-full overflow-x-hidden bg-[#f5f6f8] text-neutral-950">
      <Container className="w-full px-4 sm:px-6 lg:px-8">
        <div className="w-full pt-3 sm:pt-4 lg:pt-5">
          <ProductBreadcrumbs
            items={[
              { label: "হোম", href: "/" },
              { label: "আমাদের সম্পর্কে" },
            ]}
          />
        </div>
      </Container>
      <AboutHero hero={hero ?? FALLBACK_ABOUT_HERO} />
      <StatsBar stats={stats ?? FALLBACK_ABOUT_STATS} />
      <BrandStory stories={stories ?? FALLBACK_ABOUT_STORIES} />
      <CustomDresses dresses={dresses ?? FALLBACK_ABOUT_DRESSES} />
      <MissionVision cards={mission ?? FALLBACK_ABOUT_MISSION} />
      <TrustBadges values={values ?? FALLBACK_ABOUT_VALUES} />
      <HowItWorks steps={steps ?? FALLBACK_ABOUT_STEPS} />
      <ShopCta cta={cta ?? FALLBACK_ABOUT_CTA} />
    </main>
  );
}
