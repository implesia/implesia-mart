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

  return (
    <div className="w-full">
      <div className="mb-8 flex flex-wrap gap-2 sm:mb-10">
        {tabs.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActive(cat)}
            className={cn(
              "rounded-full px-4 py-2 text-xs font-semibold transition-colors sm:text-sm",
              active === cat
                ? "bg-primary text-on-primary"
                : "bg-surface-container-lowest text-on-surface-variant ring-1 ring-outline-variant/35 hover:bg-surface-container dark:bg-surface-container dark:ring-white/10",
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-sm text-on-surface-variant">
          এই ক্যাটাগরিতে এখনো কোনো ব্লগ পোস্ট নেই।
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured ? (
            <div className="sm:col-span-2">
              <BlogCard post={featured} featured />
            </div>
          ) : null}
          {rest.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
