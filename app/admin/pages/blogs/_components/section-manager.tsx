import { findCmsPage, findCmsSection } from "../../../_config/cms";
import { BlogCategoriesEditor } from "./categories-editor";
import { BlogCtaEditor } from "./cta-editor";
import { BlogHeroEditor } from "./hero-editor";
import { BlogListingEditor } from "./listing-editor";
import { BlogPostsEditor } from "./posts-editor";
import { BlogRelatedEditor } from "./related-editor";

export function BlogSectionManager({ sectionId }: { sectionId: string }) {
  const page = findCmsPage("blogs");
  const section = page ? findCmsSection(page, sectionId) : undefined;
  if (!section) return null;

  if (sectionId === "hero") return <BlogHeroEditor />;
  if (sectionId === "categories") return <BlogCategoriesEditor />;
  if (sectionId === "listing") return <BlogListingEditor />;
  if (sectionId === "posts") return <BlogPostsEditor />;
  if (sectionId === "related") return <BlogRelatedEditor />;
  if (sectionId === "cta") return <BlogCtaEditor />;

  return null;
}

export function BlogSectionFallback() {
  return (
    <div className="h-40 animate-pulse rounded-2xl bg-white ring-1 ring-neutral-200/90" />
  );
}
