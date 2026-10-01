"use client";

import { useMemo, useState } from "react";

import { categoryLabel } from "@/lib/mart-mock/blog-sections";
import { useBlogSections } from "@/lib/mart-mock/hooks";
import { isContentActive } from "@/lib/mart-mock/visibility";
import { cn } from "@/lib/utils";

import { products } from "../../_data/products/products";
import { BlogCard } from "./blog-card";

function hasAvailableRelated(slugs: string[]) {
  return slugs.some((slug) =>
    products.some((product) => product.slug === slug && product.status === "available"),
  );
}

export function BlogsGrid() {
  const sections = useBlogSections();
  const { listing, categories } = sections;
  const posts = sections.posts.filter(isContentActive);
  const categoryItems = isContentActive(categories)
    ? categories.items.filter(isContentActive)
    : [];
  const allLabel = listing.allLabel.trim() || "সব";
  const [active, setActive] = useState(allLabel);
  const showHeading = isContentActive(listing);
  const showTabs = categoryItems.length > 0;
  const tabs = [allLabel, ...categoryItems.map((item) => item.label)];
  const selected = tabs.includes(active) ? active : allLabel;
  const visible = useMemo(() => {
    if (!showTabs || selected === allLabel) return posts;
    return posts.filter((post) => categoryLabel(sections, post.categoryId) === selected);
  }, [posts, selected, allLabel, showTabs, sections]);
  const featured = useMemo(
    () => visible.find((post) => hasAvailableRelated(post.relatedProductSlugs)) ?? visible[0],
    [visible],
  );
  const rest = visible.filter((post) => post.id !== featured?.id);

  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>();
    map.set(allLabel, posts.length);
    for (const category of categoryItems) {
      map.set(
        category.label,
        posts.filter((post) => post.categoryId === category.id).length,
      );
    }
    return map;
  }, [posts, categoryItems, allLabel]);

  return (
    <div className="w-full">
      {showHeading || showTabs ? (
        <div className="mb-5 flex flex-col gap-4 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
          {showHeading ? (
            <div className="min-w-0">
              {listing.heading.trim() ? (
                <h2 className="text-lg font-semibold tracking-tight text-neutral-950 sm:text-xl">
                  {selected === allLabel ? listing.heading : selected}
                </h2>
              ) : null}
              <p className="mt-1 text-sm text-neutral-600">
                {`${visible.length}${listing.countSuffix}`}
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
              aria-label={listing.tabsLabel.trim() || "ব্লগ ক্যাটাগরি"}
            >
              {[allLabel, ...categoryItems.map((item) => item.label)].map((label) => {
                const isActive = selected === label;
                const count = categoryCounts.get(label) ?? 0;
                return (
                  <button
                    key={label}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActive(label)}
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition-colors sm:text-[13px]",
                      isActive
                        ? "bg-primary text-on-primary"
                        : "border border-neutral-200/90 bg-white text-neutral-600 hover:border-primary/40 hover:text-neutral-950",
                    )}
                  >
                    {label}
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-px text-[10px] font-bold tabular-nums",
                        isActive ? "bg-white/20 text-white" : "bg-[#f5f6f8] text-neutral-500",
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
          <p className="text-sm text-neutral-600">
            {listing.emptyMessage.trim() || "এই ক্যাটাগরিতে এখনো কোনো আর্টিকেল নেই।"}
          </p>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-5">
          {featured ? <BlogCard post={featured} featured /> : null}
          {rest.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
              {rest.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
