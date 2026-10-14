"use client";

import { useMemo, useState } from "react";

import { blogCategoryLabel, type BlogCategories } from "@/lib/mart-api/blog-categories";
import type { BlogListing } from "@/lib/mart-api/blog-listing";
import { isContentActive } from "@/lib/mart-mock/visibility";
import type { BlogPostRecord } from "@/lib/mart-mock/blog-sections";
import { cn } from "@/lib/utils";

import { products } from "../../_data/products/products";
import { BlogCard } from "./blog-card";

function hasAvailableRelated(slugs: string[]) {
  return slugs.some((slug) =>
    products.some((product) => product.slug === slug && product.status === "available"),
  );
}

export function BlogsGrid({
  categories,
  listing,
  posts,
}: {
  categories: BlogCategories | null;
  listing: BlogListing | null;
  posts: BlogPostRecord[];
}) {
  const visiblePosts = posts.filter(isContentActive);
  const categoryItems = useMemo(
    () => (categories?.isActive ? categories.items.filter((item) => item.isActive) : []),
    [categories],
  );
  const allLabel = listing?.allLabel.trim() ?? "";
  const [active, setActive] = useState("all");
  const showHeading = Boolean(listing?.isActive);
  const showTabs = categoryItems.length > 0;
  const selected = active === "all" || categoryItems.some((item) => item.id === active)
    ? active
    : "all";
  const selectedLabel =
    selected === "all"
      ? allLabel
      : blogCategoryLabel(categories, selected) || allLabel;
  const visible = useMemo(() => {
    if (!showTabs || selected === "all") return visiblePosts;
    return visiblePosts.filter((post) => post.categoryId === selected);
  }, [visiblePosts, selected, showTabs]);
  const featured = useMemo(
    () => visible.find((post) => hasAvailableRelated(post.relatedProductSlugs)) ?? visible[0],
    [visible],
  );
  const rest = visible.filter((post) => post.id !== featured?.id);

  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>();
    map.set("all", visiblePosts.length);
    for (const category of categoryItems) {
      map.set(
        category.id,
        visiblePosts.filter((post) => post.categoryId === category.id).length,
      );
    }
    return map;
  }, [visiblePosts, categoryItems]);

  return (
    <div className="w-full">
      {showHeading || showTabs ? (
        <div className="mb-5 flex flex-col gap-4 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
          {showHeading ? (
            <div className="min-w-0">
              {listing?.heading.trim() ? (
                <h2 className="text-lg font-semibold tracking-tight text-neutral-950 sm:text-xl">
                  {selected === "all" ? listing.heading : selectedLabel}
                </h2>
              ) : null}
              <p className="mt-1 text-sm text-neutral-600">
                {`${visible.length}${listing?.countSuffix ?? ""}`}
              </p>
            </div>
          ) : null}

          {showTabs ? (
            <div
              className={cn(
                "-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-0.5 sm:mx-0 sm:max-w-[min(100%,42rem)] sm:flex-wrap sm:justify-end sm:overflow-visible sm:px-0",
                "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
              )}
              role="tablist"
              aria-label={listing?.tabsLabel.trim() || "Categories"}
            >
              {[
                { id: "all", label: allLabel },
                ...categoryItems.map((item) => ({ id: item.id, label: item.label })),
              ].map((tab) => {
                const isActive = selected === tab.id;
                const count = categoryCounts.get(tab.id) ?? 0;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActive(tab.id)}
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition-colors sm:text-[13px]",
                      isActive
                        ? "bg-primary text-on-primary"
                        : "border border-neutral-200/90 bg-white text-neutral-600 hover:border-primary/40 hover:text-neutral-950",
                    )}
                  >
                    {tab.label}
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-px text-[10px] font-bold tabular-nums",
                        isActive ? "bg-black/10 text-on-primary" : "bg-[#f5f6f8] text-neutral-600",
                      )}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : null}

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200/90 bg-white py-16 text-center">
          {listing?.emptyMessage.trim() ? (
            <p className="text-sm text-neutral-600">{listing.emptyMessage}</p>
          ) : null}
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-5">
          {featured ? (
            <BlogCard post={featured} categories={categoryItems} listing={listing} featured />
          ) : null}
          {rest.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
              {rest.map((post) => (
                <BlogCard key={post.id} post={post} categories={categoryItems} listing={listing} />
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
