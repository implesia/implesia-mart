import Image from "next/image";
import Link from "next/link";

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
    <div className="mt-10 rounded-2xl border border-outline-variant/35 bg-surface-container-lowest p-5 sm:p-6 dark:border-white/10 dark:bg-surface-container">
      <h3 className="mb-4 text-sm font-semibold text-on-surface sm:text-base">
        এই আর্টিকেলে উল্লেখিত প্রোডাক্ট
      </h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {items.map((p) => (
          <Link
            key={p.slug}
            href={`/products/${p.slug}`}
            className={cn(
              "group flex items-center gap-3 rounded-xl bg-surface-container-lowest p-2.5",
              "border border-outline-variant/30 dark:border-white/10 dark:bg-surface-container-high",
              "transition-colors hover:border-primary/30 dark:hover:border-primary/25",
            )}
          >
            <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-surface-container-low">
              <Image src={p.imageSrc} alt={p.imageAlt} fill className="object-cover" sizes="64px" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 text-sm font-medium text-on-surface group-hover:text-primary">
                {p.title}
              </p>
              <p className="text-sm font-bold text-primary">{formatPrice(p.price)}</p>
            </div>
            <MaterialIcon
              name="arrow_forward"
              className="text-[18px] text-on-surface-variant transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
            />
          </Link>
        ))}
      </div>
    </div>
  );
}

export function BlogRelatedPosts({ posts }: { posts: BlogPost[] }) {
  if (!posts.length) return null;

  return (
    <section className="mt-14">
      <h2 className="mb-6 text-xl font-semibold text-on-surface sm:text-2xl">আরও পড়ুন</h2>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <BlogCard key={post.slug} post={post} />
        ))}
      </div>
    </section>
  );
}
