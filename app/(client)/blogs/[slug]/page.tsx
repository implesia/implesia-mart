import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Container } from "../../_components/common/container";
import { MaterialIcon } from "../../_components/common/material-icon";
import { blogPosts, getBlogPostBySlug, getRelatedBlogPosts } from "../../_data/blogs/blogs";
import { BlogContent } from "../_components/blog-content";
import { BlogRelatedPosts, BlogRelatedProducts } from "../_components/blog-related";

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // Next.js 16: dynamic route params are async.
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  if (!post) return notFound();

  const relatedPosts = getRelatedBlogPosts(slug);

  return (
    <main className="pt-16 sm:pt-20">
      <Container className="w-full px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-14">
        <nav className="mb-6 flex flex-wrap items-center gap-2 text-xs text-outline sm:text-sm">
          <Link href="/blogs" className="transition-colors hover:text-primary">
            ব্লগ
          </Link>
          <MaterialIcon name="chevron_right" className="text-[14px] text-outline" />
          <span className="font-semibold text-on-surface">{post.category}</span>
        </nav>

        <div className="mx-auto max-w-3xl">
          <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary dark:bg-primary/15">
            {post.category}
          </span>

          <h1 className="mb-4 text-2xl leading-tight font-bold text-on-surface sm:text-3xl lg:text-4xl">
            {post.title}
          </h1>

          <div className="mb-6 flex flex-wrap items-center gap-4 text-xs text-on-surface-variant sm:text-sm">
            <span className="inline-flex items-center gap-1.5">
              <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary dark:bg-primary/15">
                {post.author.charAt(0)}
              </span>
              {post.author}
            </span>
            <span className="inline-flex items-center gap-1">
              <MaterialIcon name="calendar_today" className="text-[14px]" />
              {post.publishedAt}
            </span>
            <span className="inline-flex items-center gap-1">
              <MaterialIcon name="schedule" className="text-[14px]" />
              {post.readTime}
            </span>
          </div>

          <div className="relative mb-8 aspect-16/9 w-full overflow-hidden rounded-2xl bg-surface-container-low sm:rounded-3xl">
            <Image
              src={post.coverImage}
              alt={post.coverAlt}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 768px"
              className="object-cover"
            />
          </div>

          <BlogContent blocks={post.content} />

          <div className="mt-6 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-outline-variant/35 px-3 py-1 text-xs text-on-surface-variant dark:border-white/10"
              >
                #{tag}
              </span>
            ))}
          </div>

          <BlogRelatedProducts slugs={post.relatedProductSlugs} />
        </div>

        <div className="mx-auto max-w-5xl">
          <BlogRelatedPosts posts={relatedPosts} />
        </div>
      </Container>
    </main>
  );
}
