"use client";

import Image from "next/image";
import Link from "next/link";

import { blogCategoryLabel, type BlogCategories } from "@/lib/mart-api/blog-categories";
import type { BlogCta } from "@/lib/mart-api/blog-cta";
import type { BlogListing } from "@/lib/mart-api/blog-listing";
import type { BlogRelated } from "@/lib/mart-api/blog-related";
import { isExternalHref } from "@/lib/mart-mock/about-sections";
import type { BlogPostRecord } from "@/lib/mart-mock/blog-sections";
import { isContentActive } from "@/lib/mart-mock/visibility";
import { absoluteUrl, bengaliDateToIso, SITE_NAME } from "@/lib/seo";
import { cn } from "@/lib/utils";

import { WhatsAppIcon } from "../../_components/common/brand-icons";
import { Container } from "../../_components/common/container";
import { JsonLd } from "../../_components/common/json-ld";
import { MaterialIcon } from "../../_components/common/material-icon";
import { ProductBreadcrumbs } from "../../products/_components/product-breadcrumbs";
import { BlogContent } from "./blog-content";
import { BlogRelatedPosts, BlogRelatedProducts } from "./blog-related";

export function BlogArticle({
  post,
  posts,
  categories,
  listing,
  related,
  cta,
}: {
  post: BlogPostRecord | null;
  posts: BlogPostRecord[];
  categories: BlogCategories | null;
  listing: BlogListing | null;
  related: BlogRelated | null;
  cta: BlogCta | null;
}) {
  if (!post || !isContentActive(post)) {
    return (
      <main className="force-light w-full bg-[#f5f6f8] text-neutral-950">
        <Container className="px-4 py-16 text-center sm:px-6">
          <h1 className="text-xl font-semibold">এই আর্টিকেলটি পাওয়া যায়নি</h1>
          <Link href="/blogs" className="mt-4 inline-flex text-sm font-semibold text-primary">
            সব ব্লগ
          </Link>
        </Container>
      </main>
    );
  }

  const category = blogCategoryLabel(categories, post.categoryId);
  const blocks = post.content.filter(isContentActive);
  const headings = blocks.flatMap((block) =>
    block.type === "heading" ? [{ id: `section-${block.id}`, text: block.text }] : [],
  );
  const showRelated = Boolean(related?.isActive);
  const relatedPosts = relatedArticles(posts, post);
  const publishedIso = bengaliDateToIso(post.publishedAt);
  const postUrl = absoluteUrl(`/blogs/${post.slug}`);
  const readSuffix = listing?.isActive ? listing.readSuffix.trim() : "";

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    image: post.coverImage ? [absoluteUrl(post.coverImage)] : [],
    author: { "@type": "Organization", name: post.author },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: absoluteUrl("/images/common/logo.png") },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": postUrl },
    ...(publishedIso ? { datePublished: publishedIso, dateModified: publishedIso } : {}),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "হোম", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: "ব্লগ", item: absoluteUrl("/blogs") },
      { "@type": "ListItem", position: 3, name: post.title, item: postUrl },
    ],
  };

  return (
    <main className="force-light w-full overflow-x-hidden bg-[#f5f6f8] text-neutral-950">
      <JsonLd data={articleJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />

      <section className="w-full bg-[#f5f6f8]">
        <Container className="w-full px-4 pt-3 pb-5 sm:px-6 sm:pt-4 sm:pb-6 lg:px-8">
          <ProductBreadcrumbs
            items={[
              { label: "হোম", href: "/" },
              { label: "ব্লগ", href: "/blogs" },
              { label: post.title },
            ]}
          />

          <div className="mt-3 max-w-3xl">
            {category ? (
              <span className="mb-3 inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {category}
              </span>
            ) : null}
            <h1 className="mb-3 text-[1.35rem] leading-[1.2] font-bold tracking-tight text-neutral-950 sm:mb-4 sm:text-3xl lg:text-[2.15rem]">
              {post.title}
            </h1>
            {post.excerpt.trim() ? (
              <p className="mb-5 max-w-2xl text-sm leading-relaxed text-neutral-600 sm:text-base">
                {post.excerpt}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-500 sm:gap-5 sm:text-sm">
              {post.author.trim() ? (
                <span className="inline-flex items-center gap-2">
                  <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {post.author.charAt(0)}
                  </span>
                  <span className="text-left">
                    <span className="block font-medium text-neutral-950">{post.author}</span>
                    {post.authorRole.trim() ? (
                      <span className="text-[11px] text-neutral-500">{post.authorRole}</span>
                    ) : null}
                  </span>
                </span>
              ) : null}
              {post.publishedAt.trim() ? (
                <span className="inline-flex items-center gap-1.5">
                  <MaterialIcon name="calendar_today" className="text-[15px]" />
                  {post.publishedAt}
                </span>
              ) : null}
              {post.readTime.trim() ? (
                <span className="inline-flex items-center gap-1.5">
                  <MaterialIcon name="schedule" className="text-[15px]" />
                  {post.readTime}
                  {readSuffix ? ` ${readSuffix}` : ""}
                </span>
              ) : null}
            </div>
          </div>
        </Container>
      </section>

      <Container className="w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          {showRelated && headings.length > 1 ? (
            <aside className="hidden lg:col-span-3 lg:block">
              <div className="sticky top-28 overflow-hidden rounded-2xl border border-neutral-200/90 bg-white">
                <div className="border-b border-neutral-200 px-4 py-3.5">
                  <p className="text-sm font-semibold text-neutral-950">
                    {related?.tocTitle}
                  </p>
                </div>
                <nav className="flex flex-col gap-0.5 p-2.5" aria-label="আর্টিকেল বিষয়বস্তু">
                  {headings.map((item, index) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className="rounded-xl px-3 py-2.5 text-left text-sm leading-snug text-neutral-600 transition-colors hover:bg-[#f5f6f8] hover:text-neutral-950"
                    >
                      <span className="mr-2 text-xs font-semibold text-primary">
                        {String(index + 1).padStart(2, "0")}
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
              showRelated && headings.length > 1 ? "lg:col-span-9" : "mx-auto max-w-3xl lg:col-span-12",
            )}
          >
            {post.coverImage ? (
              <div className="relative mb-6 aspect-16/9 w-full overflow-hidden rounded-2xl bg-white sm:mb-8">
                <Image
                  src={post.coverImage}
                  alt={post.coverAlt}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 800px"
                  className="object-cover"
                />
              </div>
            ) : null}

            {showRelated && headings.length > 1 ? (
              <div className="mb-6 lg:hidden">
                <p className="mb-2.5 text-sm font-semibold text-neutral-950">
                  {related?.tocTitle}
                </p>
                <div
                  className={cn(
                    "-mx-4 flex gap-2 overflow-x-auto px-4 pb-1",
                    "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
                  )}
                >
                  {headings.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className="inline-flex shrink-0 rounded-full border border-neutral-200/90 bg-white px-3 py-2 text-xs font-semibold text-neutral-600"
                    >
                      {item.text}
                    </a>
                  ))}
                </div>
              </div>
            ) : null}

            <BlogContent blocks={blocks} />

            {post.tags.length > 0 ? (
              <div className="mt-6 flex flex-wrap gap-2 border-t border-neutral-200 pt-5">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-neutral-200/90 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            ) : null}

            <BlogRelatedProducts slugs={post.relatedProductSlugs} related={related} />
            <ArticleCta cta={cta} />
          </article>
        </div>

        <BlogRelatedPosts
          posts={relatedPosts}
          related={related}
          categories={categories?.isActive ? categories.items : []}
          listing={listing}
        />
      </Container>
    </main>
  );
}

function ArticleCta({ cta }: { cta: BlogCta | null }) {
  if (!cta?.isActive) return null;
  const primary = cta.primaryLabel.trim();
  const secondary = cta.secondaryLabel.trim();

  return (
    <div
      className={cn(
        "relative mt-8 overflow-hidden rounded-2xl px-4 py-7 sm:px-7 sm:py-8",
        "bg-[linear-gradient(100deg,#071820_0%,#070c14_46%,#05060a_100%)]",
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(43,192,181,0.22),transparent_55%)]"
      />
      <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-md">
          {cta.title.trim() ? (
            <h3 className="mb-1.5 text-lg font-semibold text-white sm:text-xl">{cta.title}</h3>
          ) : null}
          {cta.subtitle.trim() ? (
            <p className="text-sm leading-relaxed text-white/70">{cta.subtitle}</p>
          ) : null}
        </div>
        {primary || secondary ? (
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[200px]">
            {primary ? <CtaButton label={primary} href={cta.primaryHref} filled /> : null}
            {secondary ? (
              <CtaButton
                label={secondary}
                href={cta.secondaryHref}
                icon={/wa\.me|whatsapp/i.test(cta.secondaryHref)}
              />
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function CtaButton({
  label,
  href,
  filled,
  icon,
}: {
  label: string;
  href: string;
  filled?: boolean;
  icon?: boolean;
}) {
  const className = filled
    ? "inline-flex h-10 w-full items-center justify-center rounded-full bg-primary text-sm font-semibold text-on-primary transition-colors hover:bg-primary/80"
    : "inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-full border border-white/20 text-sm font-semibold text-white transition-colors hover:bg-white/10";
  const content = (
    <>
      {icon ? <WhatsAppIcon className="size-4" /> : null}
      {label}
    </>
  );
  if (!href.trim()) {
    return <span className={className}>{content}</span>;
  }
  if (isExternalHref(href) || href.startsWith("tel:") || href.startsWith("mailto:")) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {content}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}

function relatedArticles(posts: BlogPostRecord[], current: BlogPostRecord) {
  const visible = posts.filter((post) => post.id !== current.id && isContentActive(post));
  const same = visible.filter((post) => post.categoryId === current.categoryId);
  const others = visible.filter((post) => post.categoryId !== current.categoryId);
  return [...same, ...others].slice(0, 3);
}
