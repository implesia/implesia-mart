"use client";

import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";

import type { BlogCategory, BlogPost } from "../../_data/blogs/blogs";
import { products } from "../../_data/products/products";
import { BlogCard } from "./blog-card";

const ALL_LABEL = "সব";

function hasAvailableRelated(post: BlogPost) {
  return post.relatedProductSlugs.some((slug) =>
    products.some((p) => p.slug === slug && p.status === "available"),
  );
}

export function BlogsGrid({
  posts,
  categories,
}: {
  posts: BlogPost[];
  categories: BlogCategory[];
}) {
  const [active, setActive] = useState<BlogCategory | typeof ALL_LABEL>(ALL_LABEL);

  const filtered = useMemo(() => {
    if (active === ALL_LABEL) return posts;
    return posts.filter((post) => post.category === active);
  }, [posts, active]);

  const featured = useMemo(
    () => filtered.find(hasAvailableRelated) ?? filtered[0],
    [filtered],
  );
  const rest = filtered.filter((post) => post.slug !== featured?.slug);
  const tabs: (BlogCategory | typeof ALL_LABEL)[] = [ALL_LABEL, ...categories];

  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>();
    map.set(ALL_LABEL, posts.length);
    for (const cat of categories) {
      map.set(
        cat,
        posts.filter((p) => p.category === cat).length,
      );
    }
    return map;
  }, [posts, categories]);

  return (
    <div className="w-full">
      <div className="mb-5 flex flex-col gap-4 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-tight text-neutral-950 sm:text-xl">
            {active === ALL_LABEL ? "সর্বশেষ আর্টিকেল" : active}
          </h2>
          <p className="mt-1 text-sm text-neutral-600">{filtered.length}টি আর্টিকেল</p>
        </div>

        <div
          className={cn(
            "-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-0.5 sm:mx-0 sm:max-w-[min(100%,42rem)] sm:flex-wrap sm:justify-end sm:overflow-visible sm:px-0",
            "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          )}
          role="tablist"
          aria-label="ব্লগ ক্যাটাগরি"
        >
          {tabs.map((cat) => {
            const isActive = active === cat;
            const count = categoryCounts.get(cat) ?? 0;
            return (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActive(cat)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition-colors sm:text-[13px]",
                  isActive
                    ? "bg-primary text-on-primary"
                    : "border border-neutral-200/90 bg-white text-neutral-600 hover:border-primary/40 hover:text-neutral-950",
                )}
              >
                {cat}
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
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200/90 bg-white py-16 text-center">
          <p className="text-sm text-neutral-600">এই ক্যাটাগরিতে এখনো কোনো আর্টিকেল নেই।</p>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-5">
          {featured ? <BlogCard post={featured} featured /> : null}

          {rest.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
              {rest.map((post) => (
                <BlogCard key={post.slug} post={post} />
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
