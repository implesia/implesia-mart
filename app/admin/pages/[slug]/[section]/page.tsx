import { CmsNotFound } from "../../../_components/cms-hub";
import { CmsSectionPage } from "../../../_components/cms-section";
import { findCmsPage, findCmsSection, PAGE_CMS } from "../../../_config/cms";

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

  return <CmsSectionPage page={page} section={section} />;
}
