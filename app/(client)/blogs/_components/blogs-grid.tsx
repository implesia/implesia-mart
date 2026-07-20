"use client";

import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";

import type { BlogCategory, BlogPost } from "../../_data/blogs/blogs";
import { BlogCard } from "./blog-card";

const ALL_LABEL = "সব";

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

  const [featured, ...rest] = filtered;
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
      <div className="mb-8 flex flex-col gap-5 sm:mb-10 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.16em] text-primary uppercase">
            <span className="h-px w-5 bg-primary/50" aria-hidden />
            কালেকশন
          </p>
          <h2 className="mt-1.5 text-lg font-semibold tracking-tight text-on-surface sm:text-xl">
            {active === ALL_LABEL ? "সর্বশেষ আর্টিকেল" : active}
          </h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            {filtered.length}টি আর্টিকেল দেখানো হচ্ছে
          </p>
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
                  "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition-all duration-200 sm:text-[13px]",
                  isActive
                    ? "bg-[#062f2c] text-white shadow-[0_6px_16px_-6px_rgba(6,47,44,0.55)] dark:bg-primary dark:text-primary-foreground"
                    : "bg-surface-container-lowest text-on-surface-variant ring-1 ring-outline-variant/35 hover:ring-primary/25 hover:text-on-surface dark:bg-surface-container dark:ring-white/10",
                )}
              >
                {cat}
                <span
                  className={cn(
                    "rounded-full px-1.5 py-px text-[10px] font-bold tabular-nums",
                    isActive ? "bg-white/15 text-white/90" : "bg-surface-container text-outline dark:bg-white/8",
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
        <div className="rounded-2xl bg-surface-container-low/80 py-20 text-center dark:bg-surface-container/50">
          <p className="text-sm text-on-surface-variant">
            এই ক্যাটাগরিতে এখনো কোনো ব্লগ পোস্ট নেই।
          </p>
        </div>
      ) : (
        <div className="space-y-6 sm:space-y-8">
          {featured ? <BlogCard post={featured} featured /> : null}

          {rest.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {rest.map((post, index) => (
                <BlogCard
                  key={post.slug}
                  post={post}
                  style={{ animationDelay: `${Math.min(index, 5) * 55}ms` }}
                  className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-3 motion-safe:fill-mode-both motion-safe:duration-500"
                />
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
