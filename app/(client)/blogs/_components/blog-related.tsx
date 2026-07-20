import Image from "next/image";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";
import { products } from "../../_data/products/products";
import type { BlogPost } from "../../_data/blogs/blogs";
import { BlogCard } from "./blog-card";

function formatPrice(value: number) {
  return `৳${value.toLocaleString("en-US")}`;
}

export function BlogRelatedProducts({ slugs }: { slugs: string[] }) {
  const items = products.filter((p) => slugs.includes(p.slug));
  if (!items.length) return null;

  return (
    <div className="mt-12 overflow-hidden rounded-2xl border border-outline-variant/35 bg-surface-container-lowest sm:rounded-3xl dark:border-white/10 dark:bg-surface-container">
      <div className="border-b border-outline-variant/30 bg-surface-container-low/80 px-5 py-4 sm:px-6 dark:border-white/10">
        <h3 className="text-base font-semibold text-on-surface sm:text-lg">
          এই আর্টিকেলে উল্লেখিত প্রোডাক্ট
        </h3>
        <p className="mt-1 text-xs text-on-surface-variant sm:text-sm">
          বিস্তারিত দেখে সরাসরি অর্ডার করুন
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:gap-4 sm:p-5">
        {items.map((p) => (
          <Link
            key={p.slug}
            href={`/products/${p.slug}`}
            className={cn(
              "group flex items-center gap-3 rounded-xl p-2.5 sm:p-3",
              "bg-surface-container-low/80 dark:bg-background/30",
              "ring-1 ring-outline-variant/30 dark:ring-white/10",
              "transition-colors hover:ring-primary/35",
            )}
          >
            <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-surface-container-low sm:size-[72px]">
              <Image src={p.imageSrc} alt={p.imageAlt} fill className="object-cover" sizes="72px" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm font-medium text-on-surface group-hover:text-primary">
                {p.title}
              </p>
              <p className="mt-1 text-sm font-bold text-primary">
                {p.unitLabel ? `${p.unitLabel} ` : null}
                {formatPrice(p.price)}
              </p>
            </div>
            <span
              className={cn(
                buttonVariants({ size: "sm" }),
                "hidden h-9 shrink-0 rounded-full px-3 text-xs sm:inline-flex",
              )}
            >
              দেখুন
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function BlogRelatedPosts({ posts }: { posts: BlogPost[] }) {
  if (!posts.length) return null;

  return (
    <section className="mt-14 sm:mt-16">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-on-surface sm:text-2xl">আরও পড়ুন</h2>
          <p className="mt-1 text-sm text-on-surface-variant">সম্পর্কিত গাইড ও রিভিউ</p>
        </div>
        <Link
          href="/blogs"
          className="hidden text-sm font-semibold text-primary hover:underline sm:inline-flex sm:items-center sm:gap-1"
        >
          সব ব্লগ
          <MaterialIcon name="arrow_forward" className="text-[16px]" />
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <BlogCard key={post.slug} post={post} />
        ))}
      </div>
    </section>
  );
}
