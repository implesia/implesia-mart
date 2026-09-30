"use client";

import { useHomeSections } from "@/lib/mart-mock/hooks";

import { HOME_CMS, findCmsSection } from "../../_config/cms";
import { CategoryTiles } from "./categories-editor";
import { HomeFaq } from "./faq-editor";
import { FeaturedProducts } from "./featured-editor";
import { HomeCmsHeader } from "./home-cms-header";
import { HomeNewsletter } from "./newsletter-editor";
import { CustomerReviews } from "./reviews-editor";
import { ShowcaseRows } from "./showcase-editor";
import { TrustBenefits } from "./trust-editor";

export function HomeSectionManager({ sectionId }: { sectionId: string }) {
  const section = findCmsSection(HOME_CMS, sectionId);
  const data = useHomeSections();
  if (!section) return null;

  if (sectionId === "trust") return <TrustBenefits items={data.trust} />;
  if (sectionId === "categories") return <CategoryTiles section={data.categories} />;
  if (sectionId === "featured") return <FeaturedProducts section={data.featured} />;
  if (sectionId === "showcase") return <ShowcaseRows rows={data.showcase} />;
  if (sectionId === "reviews") return <CustomerReviews section={data.reviews} />;
  if (sectionId === "faq") return <HomeFaq section={data.faq} />;
  if (sectionId === "newsletter") return <HomeNewsletter section={data.newsletter} />;

  return (
    <div className="min-w-0 space-y-4">
      <HomeCmsHeader title={section.label} description={section.description} sectionId={sectionId} autosave />
    </div>
  );
}

export function SectionManagerFallback() {
  return <div className="h-40 animate-pulse rounded-2xl bg-white ring-1 ring-neutral-200/90" />;
}
