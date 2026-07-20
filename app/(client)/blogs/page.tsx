import type { Metadata } from "next";

import { Container } from "../_components/common/container";
import { blogCategories, blogPosts } from "../_data/blogs/blogs";
import { BlogsGrid } from "./_components/blogs-grid";
import { BlogsHero } from "./_components/blogs-hero";

export const metadata: Metadata = {
  title: "ব্লগ",
  description:
    "ইমপ্লেসিয়া মার্ট ব্লগ — গ্যাজেট বায়িং গাইড, প্রোডাক্ট রিভিউ, হোম ডেকোর ও কাস্টম ফ্যাশন টিপস।",
};

export default function BlogsPage() {
  return (
    <main className="w-full overflow-x-hidden bg-background pt-16 text-on-surface sm:pt-20">
      <BlogsHero postCount={blogPosts.length} />

      <section className="w-full py-8 sm:py-10 lg:py-12">
        <Container className="w-full px-4 sm:px-6 lg:px-8">
          <BlogsGrid posts={blogPosts} categories={blogCategories} />
        </Container>
      </section>
    </main>
  );
}
