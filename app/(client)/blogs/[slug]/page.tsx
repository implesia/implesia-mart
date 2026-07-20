import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { WhatsAppIcon } from "../../_components/common/brand-icons";
import { Container } from "../../_components/common/container";
import { MaterialIcon } from "../../_components/common/material-icon";
import { WHATSAPP_HREF } from "../../_data/contact/contact";
import {
  blogPosts,
  getBlogHeadings,
  getBlogPostBySlug,
  getRelatedBlogPosts,
} from "../../_data/blogs/blogs";
import { BlogContent } from "../_components/blog-content";
import { BlogRelatedPosts, BlogRelatedProducts } from "../_components/blog-related";

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  if (!post) return { title: "ব্লগ" };

  return {
    title: post.title,
    description: post.excerpt,
  };
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  if (!post) return notFound();

  const relatedPosts = getRelatedBlogPosts(slug);
  const headings = getBlogHeadings(post);
  const headingAnchors = post.content
    .map((block, idx) => (block.type === "heading" ? { id: `section-${idx}`, text: block.text } : null))
    .filter(Boolean) as { id: string; text: string }[];

  return (
    <main className="w-full overflow-x-hidden bg-background pt-16 text-on-surface sm:pt-20">
      {/* Article hero band */}
      <section className="w-full border-b border-outline-variant/25 bg-surface-container-low/40 dark:border-white/8 dark:bg-surface-container/40">
        <Container className="w-full px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
          <nav className="mb-5 flex flex-wrap items-center gap-2 text-xs text-outline sm:mb-6 sm:text-sm">
            <Link href="/blogs" className="transition-colors hover:text-primary">
              ব্লগ
            </Link>
            <MaterialIcon name="chevron_right" className="text-[14px]" />
            <span className="text-on-surface-variant">{post.category}</span>
          </nav>

          <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:max-w-4xl lg:text-left">
            <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary dark:bg-primary/15">
              {post.category}
            </span>
            <h1 className="mb-4 text-2xl leading-tight font-semibold tracking-tight text-on-surface sm:text-3xl lg:text-[2.5rem] lg:leading-[1.2]">
              {post.title}
            </h1>
            <p className="mx-auto mb-6 max-w-2xl text-sm leading-relaxed text-on-surface-variant sm:text-base lg:mx-0">
              {post.excerpt}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-on-surface-variant sm:gap-5 sm:text-sm lg:justify-start">
              <span className="inline-flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-full bg-primary/12 text-xs font-semibold text-primary">
                  {post.author.charAt(0)}
                </span>
                <span className="text-left">
                  <span className="block font-medium text-on-surface">{post.author}</span>
                  <span className="text-[11px] text-outline">{post.authorRole}</span>
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MaterialIcon name="calendar_today" className="text-[15px]" />
                {post.publishedAt}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MaterialIcon name="schedule" className="text-[15px]" />
                {post.readTime} পড়া
              </span>
            </div>
          </div>
        </Container>
      </section>

      <Container className="w-full px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-14">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Sticky TOC */}
          {headings.length > 1 ? (
            <aside className="hidden lg:col-span-3 lg:block">
              <div className="sticky top-28 overflow-hidden rounded-2xl border border-outline-variant/35 bg-surface-container-lowest dark:border-white/10 dark:bg-surface-container">
                <div className="border-b border-outline-variant/30 px-4 py-4 dark:border-white/10">
                  <p className="text-sm font-semibold text-on-surface">এই আর্টিকেলে</p>
                  <p className="mt-0.5 text-xs text-outline">বিষয়বস্তু</p>
                </div>
                <nav className="flex flex-col gap-0.5 p-2.5" aria-label="আর্টিকেল বিষয়বস্তু">
                  {headingAnchors.map((item, i) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className="rounded-xl px-3 py-2.5 text-left text-sm leading-snug text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-on-surface"
                    >
                      <span className="mr-2 text-xs font-semibold text-primary/70">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {item.text}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>
          ) : null}

          <article
            className={cn(
              "min-w-0",
              headings.length > 1 ? "lg:col-span-9" : "mx-auto max-w-3xl lg:col-span-12",
            )}
          >
            <div className="relative mb-8 aspect-16/9 w-full overflow-hidden rounded-2xl bg-surface-container-low sm:mb-10 sm:rounded-3xl">
              <Image
                src={post.coverImage}
                alt={post.coverAlt}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 800px"
                className="object-cover"
              />
            </div>

            {/* Mobile TOC chips */}
            {headingAnchors.length > 1 ? (
              <div className="mb-8 lg:hidden">
                <p className="mb-2.5 text-sm font-semibold text-on-surface">এই আর্টিকেলে</p>
                <div
                  className={cn(
                    "-mx-4 flex gap-2 overflow-x-auto px-4 pb-1",
                    "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
                  )}
                >
                  {headingAnchors.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className="inline-flex shrink-0 rounded-full border border-outline-variant/40 bg-surface-container-lowest px-3 py-2 text-xs font-semibold text-on-surface-variant dark:border-white/10 dark:bg-surface-container"
                    >
                      {item.text}
                    </a>
                  ))}
                </div>
              </div>
            ) : null}

            <BlogContent blocks={post.content} />

            <div className="mt-8 flex flex-wrap gap-2 border-t border-outline-variant/30 pt-6 dark:border-white/10">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-surface-container-low px-3 py-1.5 text-xs font-medium text-on-surface-variant dark:bg-surface-container"
                >
                  #{tag}
                </span>
              ))}
            </div>

            <BlogRelatedProducts slugs={post.relatedProductSlugs} />

            {/* Help CTA */}
            <div
              className={cn(
                "relative mt-10 overflow-hidden rounded-2xl px-5 py-8 sm:rounded-3xl sm:px-8 sm:py-9",
                "bg-[#062f2c] text-white ring-1 ring-black/10",
              )}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_100%_0%,rgba(43,192,181,0.28),transparent_55%),radial-gradient(ellipse_40%_40%_at_0%_100%,rgba(245,179,1,0.12),transparent_50%)]"
              />
              <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="max-w-md">
                  <h3 className="mb-1.5 text-lg font-semibold sm:text-xl">প্রোডাক্ট নিয়ে জানতে চান?</h3>
                  <p className="text-sm leading-relaxed text-white/70">
                    অর্ডার, মাপ বা স্টক নিয়ে যেকোনো প্রশ্নে আমাদের টিম সাহায্য করতে প্রস্তুত।
                  </p>
                </div>
                <div className="flex w-full flex-col gap-2.5 sm:w-auto sm:min-w-[200px]">
                  <Link
                    href="/products"
                    className={cn(
                      buttonVariants({ size: "lg" }),
                      "h-11 w-full rounded-full bg-white text-sm font-semibold text-[#062f2c] hover:bg-white/90",
                    )}
                  >
                    সব প্রোডাক্ট দেখুন
                  </Link>
                  <a
                    href={WHATSAPP_HREF}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      buttonVariants({ size: "lg", variant: "outline" }),
                      "h-11 w-full rounded-full border-white/25 bg-white/10 text-sm font-semibold text-white hover:bg-white/15",
                    )}
                  >
                    <WhatsAppIcon className="mr-2 size-4" />
                    হোয়াটসঅ্যাপে জিজ্ঞাসা
                  </a>
                </div>
              </div>
            </div>
          </article>
        </div>

        <BlogRelatedPosts posts={relatedPosts} />
      </Container>
    </main>
  );
}
