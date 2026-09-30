import { findCmsPage, findCmsSection } from "../../../_config/cms";
import { SustainabilityCommitmentEditor } from "./commitment-editor";
import { SustainabilityCtaEditor } from "./cta-editor";
import { SustainabilityDurabilityEditor } from "./durability-editor";
import { SustainabilityHeroEditor } from "./hero-editor";
import { SustainabilityImpactEditor } from "./impact-editor";
import { SustainabilityOriginEditor } from "./origin-editor";
import { SustainabilityQualityEditor } from "./quality-editor";

export function SustainabilitySectionManager({ sectionId }: { sectionId: string }) {
  const page = findCmsPage("sustainability");
  const section = page ? findCmsSection(page, sectionId) : undefined;
  if (!section) return null;

  if (sectionId === "hero") return <SustainabilityHeroEditor />;
  if (sectionId === "impact") return <SustainabilityImpactEditor />;
  if (sectionId === "origin") return <SustainabilityOriginEditor />;
  if (sectionId === "commitment") return <SustainabilityCommitmentEditor />;
  if (sectionId === "quality") return <SustainabilityQualityEditor />;
  if (sectionId === "durability") return <SustainabilityDurabilityEditor />;
  if (sectionId === "cta") return <SustainabilityCtaEditor />;

  return null;
}

export function SustainabilitySectionFallback() {
  return <div className="h-40 animate-pulse rounded-2xl bg-white ring-1 ring-neutral-200/90" />;
}
