"use client";

import Link from "next/link";

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
    <Link
      href={`/blogs/${post.slug}`}
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-2xl",
        "border border-neutral-200/90 bg-white",
        "transition-colors hover:border-primary/40",
        "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none",
        className,
      )}
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#f5f6f8]">
        <BlogImage
          src={post.coverImage}
          alt={post.coverAlt}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none"
        />
        {category ? (
          <span className="absolute top-3 left-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold text-neutral-800">
            {category}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col px-4 py-4 sm:px-5">
        <h3 className="mb-2 line-clamp-2 text-[15px] leading-snug font-semibold tracking-tight text-neutral-950 group-hover:text-primary sm:text-base">
          {post.title}
        </h3>
        <p className="line-clamp-2 text-sm leading-relaxed text-neutral-600">{post.excerpt}</p>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-neutral-200 pt-3.5">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-neutral-500 sm:text-xs">
            {post.author.trim() ? (
              <span className="max-w-[9rem] truncate font-medium text-neutral-700">{post.author}</span>
            ) : null}
            {post.publishedAt.trim() ? <span className="truncate">{post.publishedAt}</span> : null}
            {post.readTime.trim() ? <span className="shrink-0">{post.readTime}</span> : null}
          </div>
          {readLabel ? (
            <span className="inline-flex shrink-0 items-center gap-0.5 text-xs font-semibold text-primary">
              {readLabel}
              <MaterialIcon name="arrow_forward" className="text-[16px]" />
            </span>
          ) : null}
        </div>
      </div>
    </Link>
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
    <Link
      href={`/blogs/${post.slug}`}
      className={cn(
        "group grid overflow-hidden rounded-2xl border border-neutral-200/90 bg-white lg:grid-cols-12",
        "transition-colors hover:border-primary/40",
        "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none",
        className,
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-[#f5f6f8] lg:col-span-7 lg:aspect-auto lg:min-h-[260px]">
        <BlogImage
          src={post.coverImage}
          alt={post.coverAlt}
          priority
          sizes="(max-width: 1024px) 100vw, 58vw"
        />
      </div>

      <div className="flex flex-col justify-center px-4 py-5 sm:px-6 sm:py-6 lg:col-span-5 lg:px-7">
        <div className="mb-2.5 flex flex-wrap items-center gap-2">
          {featuredLabel ? (
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary-ink">
              {featuredLabel}
            </span>
          ) : null}
          {category ? <span className="text-xs text-neutral-500">{category}</span> : null}
          {post.readTime ? <span className="text-xs text-neutral-500">{post.readTime}</span> : null}
        </div>

        <h2 className="mb-2 text-xl leading-snug font-semibold tracking-tight text-neutral-950 group-hover:text-primary sm:text-2xl">
          {post.title}
        </h2>
        <p className="mb-5 line-clamp-3 text-sm leading-relaxed text-neutral-600 sm:text-[15px]">
          {post.excerpt}
        </p>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-neutral-200 pt-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-neutral-950">{post.author}</p>
            <p className="text-xs text-neutral-500">{post.publishedAt}</p>
          </div>
          {readLabel ? (
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-on-primary">
              {readLabel}
              <MaterialIcon name="arrow_forward" className="text-[16px]" />
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
