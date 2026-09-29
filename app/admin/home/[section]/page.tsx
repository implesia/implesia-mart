import { redirect } from "next/navigation";
import { Suspense } from "react";

import { CmsNotFound } from "../../_components/cms-hub";
import { HOME_CMS, findCmsSection } from "../../_config/cms";
import {
  HomeSectionManager,
  SectionManagerFallback,
} from "../_components/section-manager";

export default async function AdminHomeSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section: sectionId } = await params;

  if (sectionId === "hero") redirect("/admin/home/hero");

  const section = findCmsSection(HOME_CMS, sectionId);
  if (!section) {
    return (
      <CmsNotFound
        title="This home section does not exist"
        href="/admin/home"
        back="Back to Home sections"
      />
    );
  }

  return (
    <Suspense fallback={<SectionManagerFallback />}>
      <HomeSectionManager sectionId={sectionId} />
    </Suspense>
  );
}
