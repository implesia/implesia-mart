"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import type { BlogCategory } from "@/lib/mart-api/blog-categories";
import type { BlogListing } from "@/lib/mart-api/blog-listing";
import type { BlogPostRecord } from "@/lib/mart-mock/blog-sections";
import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";
import { BlogImage } from "./blog-image";

export function BlogCard({
  post,
  categories = [],
  listing = null,
  featured = false,
  className,
}: {
  post: BlogPostRecord;
  categories?: Pick<BlogCategory, "id" | "label">[];
  listing?: BlogListing | null;
  featured?: boolean;
  className?: string;
}) {
  const category = categories.find((item) => item.id === post.categoryId)?.label ?? "";
  const featuredLabel = listing?.isActive ? listing.featuredLabel.trim() : "";
  const readLabel = listing?.isActive ? listing.readLabel.trim() : "";

  if (featured) {
    return (
      <FeaturedBlogCard
        post={post}
        category={category}
        featuredLabel={featuredLabel}
        readLabel={readLabel}
        className={className}
      />
    );
  }

  return (
    <article className={cn("group relative flex h-full flex-col", className)}>
      <CoverBox sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" post={post} />

      <div className="flex flex-1 flex-col pt-4">
        {category ? (
          <p className="mb-1.5 text-xs font-semibold text-primary-ink">{category}</p>
        ) : null}
        <h3 className="line-clamp-2 text-base leading-snug font-semibold tracking-tight text-neutral-950 transition-colors group-hover:text-primary-ink">
          <PostLink slug={post.slug}>{post.title}</PostLink>
        </h3>
        {post.excerpt.trim() ? (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-neutral-600">
            {post.excerpt}
          </p>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
          <p className="min-w-0 text-xs leading-relaxed text-neutral-500">{metaLine(post)}</p>
          {readLabel ? (
            <span className="inline-flex shrink-0 items-center gap-0.5 text-xs font-semibold text-primary-ink">
              {readLabel}
              <MaterialIcon name="arrow_forward" className="text-[16px]" />
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function FeaturedBlogCard({
  post,
  category,
  featuredLabel,
  readLabel,
  className,
}: {
  post: BlogPostRecord;
  category: string;
  featuredLabel: string;
  readLabel: string;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "group relative grid gap-5 lg:grid-cols-12 lg:items-center lg:gap-8",
        className,
      )}
    >
      <div className="lg:col-span-7">
        <CoverBox sizes="(max-width: 1024px) 100vw, 58vw" post={post} priority />
      </div>

      <div className="lg:col-span-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {featuredLabel ? (
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary-ink">
              {featuredLabel}
            </span>
          ) : null}
          {category ? <span className="text-xs font-semibold text-primary-ink">{category}</span> : null}
        </div>

        <h2 className="line-clamp-4 text-xl leading-snug font-semibold tracking-tight text-neutral-950 transition-colors group-hover:text-primary-ink sm:text-2xl">
          <PostLink slug={post.slug}>{post.title}</PostLink>
        </h2>
        {post.excerpt.trim() ? (
          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-neutral-600 sm:text-[15px]">
            {post.excerpt}
          </p>
        ) : null}

        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="min-w-0 text-xs leading-relaxed text-neutral-500 sm:text-sm">
            {metaLine(post)}
          </p>
          {readLabel ? (
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-on-primary">
              {readLabel}
              <MaterialIcon name="arrow_forward" className="text-[16px]" />
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}

/** Same 16:10 box for every card so the grid never shifts while images load. */
function CoverBox({
  post,
  sizes,
  priority = false,
}: {
  post: BlogPostRecord;
  sizes: string;
  priority?: boolean;
}) {
  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-[#eceef2]">
      <BlogImage
        src={post.coverImage}
        alt={post.coverAlt}
        priority={priority}
        sizes={sizes}
        className="transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none"
      />
    </div>
  );
}

/** The title is the one link; its ::after stretches over the whole card. */
function PostLink({ slug, children }: { slug: string; children: ReactNode }) {
  return (
    <Link
      href={`/blogs/${slug}`}
      className={cn(
        "after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none",
        "focus-visible:after:ring-2 focus-visible:after:ring-primary focus-visible:after:ring-offset-2",
      )}
    >
      {children}
    </Link>
  );
}

function metaLine(post: BlogPostRecord) {
  return [post.author, post.publishedAt, post.readTime]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" · ");
}
