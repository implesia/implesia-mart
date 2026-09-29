import { CmsHub, CmsNotFound } from "../../_components/cms-hub";
import { findCmsPage, PAGE_CMS } from "../../_config/cms";

export default async function AdminCmsPageHub({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
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

  return <CmsHub page={page} />;
}
