import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";
import type { BlogPost } from "../../_data/blogs/blogs";

export function BlogCard({ post, featured = false }: { post: BlogPost; featured?: boolean }) {
  return (
    <Link
      href={`/blogs/${post.slug}`}
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-2xl",
        "bg-surface-container-lowest dark:bg-surface-container",
        "border border-outline-variant/35 dark:border-white/10",
        "transition-colors hover:border-primary/30 dark:hover:border-primary/25",
      )}
    >
      <div
        className={cn(
          "relative w-full overflow-hidden bg-surface-container-low",
          featured ? "aspect-[16/10]" : "aspect-[16/11]",
        )}
      >
        <Image
          src={post.coverImage}
          alt={post.coverAlt}
          fill
          sizes={featured ? "(max-width: 1024px) 100vw, 60vw" : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"}
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span className="absolute top-3 left-3 rounded-full bg-black/55 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
          {post.category}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3
          className={cn(
            "mb-2 font-semibold text-on-surface transition-colors group-hover:text-primary",
            featured ? "line-clamp-2 text-lg sm:text-xl" : "line-clamp-2 text-base",
          )}
        >
          {post.title}
        </h3>
        <p
          className={cn(
            "text-sm leading-relaxed text-on-surface-variant",
            featured ? "line-clamp-3" : "line-clamp-2",
          )}
        >
          {post.excerpt}
        </p>

        <div className="mt-auto flex items-center gap-3 pt-4 text-xs text-on-surface-variant">
          <span className="inline-flex items-center gap-1">
            <MaterialIcon name="calendar_today" className="text-[14px]" />
            {post.publishedAt}
          </span>
          <span className="inline-flex items-center gap-1">
            <MaterialIcon name="schedule" className="text-[14px]" />
            {post.readTime}
          </span>
        </div>
      </div>
    </Link>
  );
}
