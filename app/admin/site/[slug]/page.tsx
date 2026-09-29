import { CmsHub, CmsNotFound } from "../../_components/cms-hub";
import { findCmsPage, SITE_CMS } from "../../_config/cms";

export default async function AdminSiteHub({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = findCmsPage(slug);

  if (!page || !SITE_CMS.some((item) => item.id === slug)) {
    return (
      <CmsNotFound
        title="This site block is not in the CMS"
        href="/admin"
        back="Back to overview"
      />
    );
  }

  return <CmsHub page={page} />;
}
