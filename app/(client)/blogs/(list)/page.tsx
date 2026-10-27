import type { Metadata } from "next";

import { listPublicBlogCategories } from "@/lib/mart-api/blog-categories";
import { listPublicBlogHero } from "@/lib/mart-api/blog-hero";
import { listPublicBlogListing } from "@/lib/mart-api/blog-listing";
import { fetchPublicBlogPosts } from "@/lib/mart-api/blog-posts";
import { absoluteUrl } from "@/lib/seo";

import { Container } from "../../_components/common/container";
import { JsonLd } from "../../_components/common/json-ld";
import { ProductBreadcrumbs } from "../../products/_components/product-breadcrumbs";
import { BlogsGrid } from "../_components/blogs-grid";
import { BlogsHero } from "../_components/blogs-hero";

// Render per request: the Workers KV fetch/ISR cache hit its daily write limit and
// kept serving stale CMS data (old image URLs). CMS reads go straight to the API.
export const dynamic = "force-dynamic";

const TITLE = "Blog";
const DESCRIPTION =
  "Implesia Mart blog: gadget guides and dress tips.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/blogs" },
  openGraph: { url: "/blogs", title: TITLE, description: DESCRIPTION },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
    {
      "@type": "ListItem",
      position: 2,
      name: "Blog",
      item: absoluteUrl("/blogs"),
    },
  ],
};

export default async function BlogsPage() {
  const [hero, categories, listing, { posts, failed }] = await Promise.all([
    listPublicBlogHero(),
    listPublicBlogCategories(),
    listPublicBlogListing(),
    fetchPublicBlogPosts(),
  ]);

  return (
    <main className="force-light w-full overflow-x-hidden bg-[#f5f6f8] text-neutral-950">
      <JsonLd data={breadcrumbJsonLd} />
      <Container className="w-full px-4 sm:px-6 lg:px-8">
        <div className="w-full pt-3 sm:pt-4 lg:pt-5">
          <ProductBreadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Blog" },
            ]}
          />
        </div>
      </Container>
      <BlogsHero hero={hero} count={posts.length} />

      <section className="w-full bg-[#f5f6f8] py-6 sm:py-8">
        <Container className="w-full px-4 sm:px-6 lg:px-8">
          <BlogsGrid categories={categories} listing={listing} posts={posts} failed={failed} />
        </Container>
      </section>
    </main>
  );
}
