import { findCmsPage, findCmsSection } from "../../../_config/cms";
import { FaqCalloutEditor } from "./callout-editor";
import { FaqCategoriesEditor } from "./categories-editor";
import { FaqHelpEditor } from "./help-editor";
import { FaqHeroEditor } from "./hero-editor";
import { FaqItemsEditor } from "./items-editor";
import { FaqListingEditor } from "./listing-editor";

export function FaqSectionManager({ sectionId }: { sectionId: string }) {
  const page = findCmsPage("faqs");
  const section = page ? findCmsSection(page, sectionId) : undefined;
  if (!section) return null;

  if (sectionId === "hero") return <FaqHeroEditor />;
  if (sectionId === "categories") return <FaqCategoriesEditor />;
  if (sectionId === "listing") return <FaqListingEditor />;
  if (sectionId === "callout") return <FaqCalloutEditor />;
  if (sectionId === "items") return <FaqItemsEditor />;
  if (sectionId === "help") return <FaqHelpEditor />;

  return null;
}

export function FaqSectionFallback() {
  return <div className="h-40 animate-pulse rounded-2xl bg-white ring-1 ring-neutral-200/90" />;
}
