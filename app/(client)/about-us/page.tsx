import type { Metadata } from "next";

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

export default function AboutUsPage() {
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
