import type { Metadata } from "next";

import { SustainabilityCommitment } from "./_components/sustainability-commitment";
import { SustainabilityCta } from "./_components/sustainability-cta";
import { SustainabilityDurability } from "./_components/sustainability-durability";
import { SustainabilityHero } from "./_components/sustainability-hero";
import { SustainabilityImpact } from "./_components/sustainability-impact";
import { SustainabilityOrigin } from "./_components/sustainability-origin";
import { SustainabilityQuality } from "./_components/sustainability-quality";
import { SustainabilityTrust } from "./_components/sustainability-trust";

export const metadata: Metadata = {
  title: "সাসটেইনেবিলিটি",
  description:
    "ইমপ্লেসিয়া মার্ট — দায়িত্বশীল শপিং, দীর্ঘস্থায়ী প্রোডাক্ট বাছাই, পরিবেশ-বান্ধব প্যাকেজিং ও কোয়ালিটি নিশ্চয়তা প্রক্রিয়া সম্পর্কে জানুন।",
  alternates: { canonical: "/sustainability" },
};

export default function SustainabilityPage() {
  return (
    <main>
      <SustainabilityHero />
      <SustainabilityOrigin />
      <SustainabilityCommitment />
      <SustainabilityQuality />
      <SustainabilityDurability />
      <SustainabilityImpact />
      <SustainabilityTrust />
      <SustainabilityCta />
    </main>
  );
}
