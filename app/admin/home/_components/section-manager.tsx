"use client";

import { HOME_CMS, findCmsSection } from "../../_config/cms";
import { CategoryTiles } from "./categories-editor";
import { HomeFaq } from "./faq-editor";
import { FeaturedProducts } from "./featured-editor";
import { HomeCmsHeader } from "./home-cms-header";
import { HomeNewsletter } from "./newsletter-editor";
import { HomePromo } from "./promo-editor";
import { CustomerReviews } from "./reviews-editor";
import { ShowcaseRows } from "./showcase-editor";
import { TrustBenefits } from "./trust-editor";

export function HomeSectionManager({ sectionId }: { sectionId: string }) {
  const section = findCmsSection(HOME_CMS, sectionId);
  if (!section) return null;

  if (sectionId === "trust") return <TrustBenefits />;
  if (sectionId === "categories") return <CategoryTiles />;
  if (sectionId === "featured") return <FeaturedProducts />;
  if (sectionId === "showcase") return <ShowcaseRows />;
  if (sectionId === "reviews") return <CustomerReviews />;
  if (sectionId === "faq") return <HomeFaq />;
  if (sectionId === "promo") return <HomePromo />;
  if (sectionId === "newsletter") return <HomeNewsletter />;

  return (
    <div className="min-w-0 space-y-4">
      <HomeCmsHeader title={section.label} description={section.description} sectionId={sectionId} autosave />
    </div>
  );
}

export function SectionManagerFallback() {
  return <div className="h-40 animate-pulse rounded-2xl bg-white ring-1 ring-neutral-200/90" />;
}
