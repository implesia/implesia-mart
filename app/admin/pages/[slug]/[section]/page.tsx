import { Suspense } from "react";

import { CmsNotFound } from "../../../_components/cms-hub";
import { CmsSectionPage } from "../../../_components/cms-section";
import { findCmsPage, findCmsSection, PAGE_CMS } from "../../../_config/cms";
import {
  AboutSectionFallback,
  AboutSectionManager,
} from "../../about/_components/section-manager";
import {
  SustainabilitySectionFallback,
  SustainabilitySectionManager,
} from "../../sustainability/_components/section-manager";

export default async function AdminCmsPageSection({
  params,
}: {
  params: Promise<{ slug: string; section: string }>;
}) {
  const { slug, section: sectionId } = await params;
  const page = findCmsPage(slug);

  if (!page || !PAGE_CMS.some((item) => item.id === slug)) {
    return (
      <CmsNotFound
        title="This page is not in the CMS"
        href="/admin"
        back="Back to overview"
      />
    );
  }

  const section = findCmsSection(page, sectionId);
  if (!section) {
    return (
      <CmsNotFound
        title="This section does not exist"
        href={page.href}
        back={`Back to ${page.label}`}
      />
    );
  }

  if (slug === "about") {
    return (
      <Suspense fallback={<AboutSectionFallback />}>
        <AboutSectionManager sectionId={section.id} />
      </Suspense>
    );
  }

  if (slug === "sustainability") {
    return (
      <Suspense fallback={<SustainabilitySectionFallback />}>
        <SustainabilitySectionManager sectionId={section.id} />
      </Suspense>
    );
  }

  return <CmsSectionPage page={page} section={section} />;
}
