import { findCmsPage, findCmsSection } from "../../../_config/cms";
import { AboutCtaEditor } from "./cta-editor";
import { AboutDressesEditor } from "./dresses-editor";
import { AboutHeroEditor } from "./hero-editor";
import { AboutMissionEditor } from "./mission-editor";
import { AboutStatsEditor } from "./stats-editor";
import { AboutStepsEditor } from "./steps-editor";
import { AboutStoryEditor } from "./story-editor";
import { AboutValuesEditor } from "./values-editor";

export function AboutSectionManager({ sectionId }: { sectionId: string }) {
  const page = findCmsPage("about");
  const section = page ? findCmsSection(page, sectionId) : undefined;
  if (!section) return null;

  if (sectionId === "hero") return <AboutHeroEditor />;
  if (sectionId === "stats") return <AboutStatsEditor />;
  if (sectionId === "story") return <AboutStoryEditor />;
  if (sectionId === "custom-dresses") return <AboutDressesEditor />;
  if (sectionId === "mission") return <AboutMissionEditor />;
  if (sectionId === "values") return <AboutValuesEditor />;
  if (sectionId === "how-it-works") return <AboutStepsEditor />;
  if (sectionId === "cta") return <AboutCtaEditor />;

  return null;
}

export function AboutSectionFallback() {
  return <div className="h-40 animate-pulse rounded-2xl bg-white ring-1 ring-neutral-200/90" />;
}
