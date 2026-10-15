import type { Metadata } from "next";

import {
  FALLBACK_SUSTAINABILITY_HERO,
  listPublicSustainabilityHero,
} from "@/lib/mart-api/sustainability-hero";
import {
  FALLBACK_SUSTAINABILITY_IMPACT,
  listPublicSustainabilityImpact,
} from "@/lib/mart-api/sustainability-impact";
import {
  FALLBACK_SUSTAINABILITY_COMMITMENT,
  listPublicSustainabilityCommitment,
} from "@/lib/mart-api/sustainability-commitment";
import {
  FALLBACK_SUSTAINABILITY_ORIGIN,
  listPublicSustainabilityOrigin,
} from "@/lib/mart-api/sustainability-origin";
import {
  FALLBACK_SUSTAINABILITY_QUALITY,
  listPublicSustainabilityQuality,
} from "@/lib/mart-api/sustainability-quality";
import {
  FALLBACK_SUSTAINABILITY_DURABILITY,
  listPublicSustainabilityDurability,
} from "@/lib/mart-api/sustainability-durability";
import {
  FALLBACK_SUSTAINABILITY_CTA,
  listPublicSustainabilityCta,
} from "@/lib/mart-api/sustainability-cta";

import { ProductBreadcrumbs } from "../products/_components/product-breadcrumbs";
import { SustainabilityCommitment } from "./_components/sustainability-commitment";
import { SustainabilityCta } from "./_components/sustainability-cta";
import { SustainabilityDurability } from "./_components/sustainability-durability";
import { SustainabilityHero } from "./_components/sustainability-hero";
import { SustainabilityImpact } from "./_components/sustainability-impact";
import { SustainabilityOrigin } from "./_components/sustainability-origin";
import { SustainabilityQuality } from "./_components/sustainability-quality";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "সাসটেইনেবিলিটি",
  description:
    "ইমপ্লেসিয়া মার্ট — কোয়ালিটি চেক করা গ্যাজেট ও হাতে তৈরি গর্জিয়াস ড্রেস, দায়িত্বশীল প্যাকেজিং ও ৩ দিন রিটার্ন।",
  alternates: { canonical: "/sustainability" },
};

export default async function SustainabilityPage() {
  const [hero, impact, origin, commitment, quality, durability, cta] =
    await Promise.all([
      listPublicSustainabilityHero(),
      listPublicSustainabilityImpact(),
      listPublicSustainabilityOrigin(),
      listPublicSustainabilityCommitment(),
      listPublicSustainabilityQuality(),
      listPublicSustainabilityDurability(),
      listPublicSustainabilityCta(),
    ]);
  return (
    <main className="force-light w-full overflow-x-hidden bg-[#f5f6f8] text-neutral-950">
      <SustainabilityHero
        hero={hero ?? FALLBACK_SUSTAINABILITY_HERO}
        breadcrumb={
          <ProductBreadcrumbs
            items={[{ label: "হোম", href: "/" }, { label: "সাসটেইনেবিলিটি" }]}
          />
        }
      />
      <SustainabilityImpact impact={impact ?? FALLBACK_SUSTAINABILITY_IMPACT} />
      <SustainabilityOrigin origin={origin ?? FALLBACK_SUSTAINABILITY_ORIGIN} />
      <SustainabilityCommitment
        commitment={commitment ?? FALLBACK_SUSTAINABILITY_COMMITMENT}
      />
      <SustainabilityQuality quality={quality ?? FALLBACK_SUSTAINABILITY_QUALITY} />
      <SustainabilityDurability
        durability={durability ?? FALLBACK_SUSTAINABILITY_DURABILITY}
      />
      <SustainabilityCta cta={cta ?? FALLBACK_SUSTAINABILITY_CTA} />
    </main>
  );
}
