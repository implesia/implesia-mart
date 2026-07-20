import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";
import type { BlogPost } from "../../_data/blogs/blogs";

export function BlogCard({
  post,
  featured = false,
  className,
  style,
}: {
  post: BlogPost;
  featured?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  if (featured) {
    return <FeaturedBlogCard post={post} className={className} style={style} />;
  }

  return (
    <Link
      href={`/blogs/${post.slug}`}
      style={style}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl",
        "bg-surface-container-lowest dark:bg-surface-container",
        "ring-1 ring-black/[0.06] dark:ring-white/10",
        "shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
        "transition-[transform,box-shadow,ring-color] duration-300 ease-out",
        "hover:-translate-y-1 hover:shadow-[0_20px_40px_-16px_rgba(6,47,44,0.28)]",
        "hover:ring-primary/25 dark:hover:shadow-[0_20px_40px_-16px_rgba(0,0,0,0.55)]",
        className,
      )}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-surface-container-low sm:aspect-[4/5]">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_20%,rgba(43,192,181,0.12),transparent_60%)]"
        />
        <Image
          src={post.coverImage}
          alt={post.coverAlt}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-contain p-3 transition-transform duration-500 ease-out group-hover:scale-[1.02] sm:p-4"
        />
        <span className="absolute top-3 left-3 z-[1] rounded-md bg-white/95 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-[#062f2c] shadow-sm backdrop-blur-sm dark:bg-[#062f2c]/92 dark:text-white">
          {post.category}
        </span>
      </div>

      <div className="flex flex-1 flex-col px-4 pt-4 pb-4 sm:px-5 sm:pt-5 sm:pb-5">
        <h3 className="mb-2 line-clamp-2 text-[15px] leading-snug font-semibold tracking-tight text-on-surface transition-colors duration-200 group-hover:text-primary sm:text-base">
          {post.title}
        </h3>
        <p className="line-clamp-2 text-sm leading-relaxed text-on-surface-variant">
          {post.excerpt}
        </p>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-outline-variant/25 pt-3.5 dark:border-white/8">
          <div className="flex min-w-0 items-center gap-2 text-[11px] text-on-surface-variant sm:text-xs">
            <span className="truncate">{post.publishedAt}</span>
            <span className="size-0.5 shrink-0 rounded-full bg-outline/50" aria-hidden />
            <span className="shrink-0">{post.readTime}</span>
          </div>
          <span className="inline-flex shrink-0 items-center gap-0.5 text-xs font-semibold text-primary">
            পড়ুন
            <MaterialIcon
              name="arrow_forward"
              className="text-[16px] transition-transform duration-300 group-hover:translate-x-1"
            />
          </span>
        </div>
      </div>
    </Link>
  );
}

function FeaturedBlogCard({
  post,
  className,
  style,
}: {
  post: BlogPost;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <Link
      href={`/blogs/${post.slug}`}
      style={style}
      className={cn(
        "group relative grid overflow-hidden rounded-2xl sm:rounded-[1.5rem] lg:grid-cols-12",
        "bg-surface-container-lowest dark:bg-surface-container",
        "ring-1 ring-black/[0.06] dark:ring-white/10",
        "shadow-[0_4px_24px_-8px_rgba(6,47,44,0.18)]",
        "transition-[box-shadow,ring-color] duration-300",
        "hover:shadow-[0_28px_56px_-20px_rgba(6,47,44,0.32)] hover:ring-primary/25",
        className,
      )}
    >
      <div className="relative aspect-square overflow-hidden bg-surface-container-low sm:aspect-[4/5] lg:col-span-7 lg:aspect-auto lg:min-h-[340px]">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_25%,rgba(43,192,181,0.14),transparent_60%)]"
        />
        <Image
          src={post.coverImage}
          alt={post.coverAlt}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 58vw"
          className="object-contain p-4 transition-transform duration-500 ease-out group-hover:scale-[1.02] sm:p-6 lg:p-8"
        />
        <span className="absolute top-4 left-4 z-[1] inline-flex items-center gap-1.5 rounded-md bg-[#062f2c]/85 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur-sm lg:hidden">
          <span className="size-1.5 rounded-full bg-warm-gold" />
          ফিচার্ড
        </span>
      </div>

      <div className="relative flex flex-col justify-center px-5 py-6 sm:px-7 sm:py-8 lg:col-span-5 lg:px-8 lg:py-10 xl:px-10">
        <div className="mb-3 flex flex-wrap items-center gap-2.5">
          <span className="hidden items-center gap-1.5 text-[11px] font-semibold tracking-[0.12em] text-primary uppercase lg:inline-flex">
            <span className="size-1.5 rounded-full bg-warm-gold" />
            ফিচার্ড
          </span>
          <span className="rounded-md bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary dark:bg-primary/15">
            {post.category}
          </span>
          <span className="text-xs text-on-surface-variant">{post.readTime}</span>
        </div>

        <h2 className="mb-3 text-xl leading-snug font-semibold tracking-tight text-on-surface transition-colors duration-200 group-hover:text-primary sm:text-2xl lg:text-[1.7rem] lg:leading-snug">
          {post.title}
        </h2>
        <p className="mb-6 line-clamp-3 text-sm leading-relaxed text-on-surface-variant sm:text-[15px]">
          {post.excerpt}
        </p>

        <div className="mt-auto flex items-center justify-between gap-4 border-t border-outline-variant/25 pt-5 dark:border-white/10">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/12 text-xs font-semibold text-primary">
              {post.author.charAt(0)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-on-surface">{post.author}</p>
              <p className="text-xs text-outline">{post.publishedAt}</p>
            </div>
          </div>
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 py-2.5",
              "text-xs font-semibold text-primary-foreground",
              "transition-transform duration-300 group-hover:translate-x-0.5",
            )}
          >
            পড়ুন
            <MaterialIcon name="arrow_forward" className="text-[16px]" />
          </span>
        </div>
      </div>
    </Link>
  );
}
