import { Container } from "../_components/common/container";
import { blogCategories, blogPosts } from "../_data/blogs/blogs";
import { BlogsGrid } from "./_components/blogs-grid";
import { BlogsHero } from "./_components/blogs-hero";

export default function BlogsPage() {
  return (
    <main className="pt-16 sm:pt-20">
      <BlogsHero />

      <section className="w-full py-6 sm:py-8 lg:py-10">
        <Container className="w-full px-4 sm:px-6 lg:px-8">
          <BlogsGrid posts={blogPosts} categories={blogCategories} />
        </Container>
      </section>
    </main>
  );
}
