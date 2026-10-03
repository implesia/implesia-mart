"use client";

import Image from "next/image";
import Link from "next/link";

import type { BlogCategory } from "@/lib/mart-api/blog-categories";
import type { BlogListing } from "@/lib/mart-api/blog-listing";
import type { BlogRelated } from "@/lib/mart-api/blog-related";
import type { BlogPostRecord } from "@/lib/mart-mock/blog-sections";
import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";
import { products } from "../../_data/products/products";
import { BlogCard } from "./blog-card";

function formatPrice(value: number) {
  return `৳${value.toLocaleString("en-US")}`;
}

export function BlogRelatedProducts({
  slugs,
  related,
}: {
  slugs: string[];
  related: BlogRelated | null;
}) {
  const items = products.filter((product) => slugs.includes(product.slug));
  if (!related?.isActive || !items.length) return null;

  return (
    <div className="mt-8 overflow-hidden rounded-2xl border border-neutral-200/90 bg-white">
      <div className="border-b border-neutral-200 px-4 py-3.5 sm:px-5">
        {related.productsTitle.trim() ? (
          <h3 className="text-base font-semibold text-neutral-950 sm:text-lg">
            {related.productsTitle}
          </h3>
        ) : null}
        {related.productsSubtitle.trim() ? (
          <p className="mt-1 text-xs text-neutral-600 sm:text-sm">{related.productsSubtitle}</p>
        ) : null}
      </div>
      <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
        {items.map((product) => {
          const comingSoon = product.status === "coming-soon";
          const action = comingSoon ? related.detailsLabel.trim() : related.viewLabel.trim();
          return (
            <Link
              key={product.slug}
              href={`/products/${product.slug}`}
              className={cn(
                "group flex items-center gap-3 rounded-xl border border-neutral-200/90 p-2.5 sm:p-3",
                "transition-colors hover:border-primary/40",
              )}
            >
              <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-[#f5f6f8] sm:size-[72px]">
                <Image
                  src={product.imageSrc}
                  alt={product.imageAlt}
                  fill
                  className="object-cover"
                  sizes="72px"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-medium text-neutral-950 group-hover:text-primary">
                  {product.title}
                </p>
                {comingSoon ? (
                  <p className="mt-1 text-xs font-semibold text-neutral-500">
                    {related.comingSoonLabel}
                  </p>
                ) : (
                  <p className="mt-1 text-sm font-semibold text-neutral-950">
                    {product.unitLabel ? `${product.unitLabel} ` : null}
                    {formatPrice(product.price)}
                  </p>
                )}
              </div>
              {action ? (
                <span className="hidden h-9 shrink-0 items-center rounded-full bg-primary px-3 text-xs font-semibold text-on-primary sm:inline-flex">
                  {action}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function BlogRelatedPosts({
  posts,
  related,
  categories = [],
  listing = null,
}: {
  posts: BlogPostRecord[];
  related: BlogRelated | null;
  categories?: Pick<BlogCategory, "id" | "label">[];
  listing?: BlogListing | null;
}) {
  if (!related?.isActive || !posts.length) return null;

  return (
    <section className="mt-10 sm:mt-12">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          {related.postsTitle.trim() ? (
            <h2 className="text-xl font-semibold tracking-tight text-neutral-950 sm:text-2xl">
              {related.postsTitle}
            </h2>
          ) : null}
          {related.postsSubtitle.trim() ? (
            <p className="mt-1 text-sm text-neutral-600">{related.postsSubtitle}</p>
          ) : null}
        </div>
        {related.postsLinkLabel.trim() ? (
          <Link
            href="/blogs"
            className="hidden text-sm font-semibold text-primary hover:underline sm:inline-flex sm:items-center sm:gap-1"
          >
            {related.postsLinkLabel}
            <MaterialIcon name="arrow_forward" className="text-[16px]" />
          </Link>
        ) : null}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {posts.map((post) => (
          <BlogCard key={post.id} post={post} categories={categories} listing={listing} />
        ))}
      </div>
    </section>
  );
}
