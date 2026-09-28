import type { Metadata } from "next";

import { Container } from "../_components/common/container";
import { JsonLd } from "../_components/common/json-ld";
import { blogCategories, blogPosts } from "../_data/blogs/blogs";
import { BlogsGrid } from "./_components/blogs-grid";
import { BlogsHero } from "./_components/blogs-hero";
import { absoluteUrl } from "@/lib/seo";

const TITLE = "ব্লগ";
const DESCRIPTION =
  "ইমপ্লেসিয়া মার্ট ব্লগ — গ্যাজেট বায়িং গাইড, প্রোডাক্ট রিভিউ, হোম ডেকোর ও কাস্টম ফ্যাশন টিপস।";

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
    { "@type": "ListItem", position: 1, name: "হোম", item: absoluteUrl("/") },
    {
      "@type": "ListItem",
      position: 2,
      name: "ব্লগ",
      item: absoluteUrl("/blogs"),
    },
  ],
};

export default function BlogsPage() {
  return (
    <main className="w-full overflow-x-hidden bg-background text-on-surface">
      <JsonLd data={breadcrumbJsonLd} />
      <BlogsHero postCount={blogPosts.length} />

      <section className="w-full py-8 sm:py-10 lg:py-12">
        <Container className="w-full px-4 sm:px-6 lg:px-8">
          <BlogsGrid posts={blogPosts} categories={blogCategories} />
        </Container>
      </section>
    </main>
  );
}
