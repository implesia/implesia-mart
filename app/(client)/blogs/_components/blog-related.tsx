import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";
import type { BlogPost } from "../../_data/blogs/blogs";
import { products } from "../../_data/products/products";
import { BlogCard } from "./blog-card";

function formatPrice(value: number) {
  return `৳${value.toLocaleString("en-US")}`;
}

export function BlogRelatedProducts({ slugs }: { slugs: string[] }) {
  const items = products.filter((p) => slugs.includes(p.slug));
  if (!items.length) return null;

  return (
    <div className="mt-8 overflow-hidden rounded-2xl border border-neutral-200/90 bg-white">
      <div className="border-b border-neutral-200 px-4 py-3.5 sm:px-5">
        <h3 className="text-base font-semibold text-neutral-950 sm:text-lg">
          এই আর্টিকেলে উল্লেখিত প্রোডাক্ট
        </h3>
        <p className="mt-1 text-xs text-neutral-600 sm:text-sm">
          স্টকে থাকলে অর্ডার করুন; শীঘ্রই আসছে আইটেম এখনো কেনা যাবে না।
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
        {items.map((p) => {
          const comingSoon = p.status === "coming-soon";
          return (
            <Link
              key={p.slug}
              href={`/products/${p.slug}`}
              className={cn(
                "group flex items-center gap-3 rounded-xl border border-neutral-200/90 p-2.5 sm:p-3",
                "transition-colors hover:border-primary/40",
              )}
            >
              <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-[#f5f6f8] sm:size-[72px]">
                <Image src={p.imageSrc} alt={p.imageAlt} fill className="object-cover" sizes="72px" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-medium text-neutral-950 group-hover:text-primary">
                  {p.title}
                </p>
                {comingSoon ? (
                  <p className="mt-1 text-xs font-semibold text-neutral-500">শীঘ্রই আসছে</p>
                ) : (
                  <p className="mt-1 text-sm font-semibold text-neutral-950">
                    {p.unitLabel ? `${p.unitLabel} ` : null}
                    {formatPrice(p.price)}
                  </p>
                )}
              </div>
              <span className="hidden h-9 shrink-0 items-center rounded-full bg-primary px-3 text-xs font-semibold text-on-primary sm:inline-flex">
                {comingSoon ? "বিস্তারিত" : "দেখুন"}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function BlogRelatedPosts({ posts }: { posts: BlogPost[] }) {
  if (!posts.length) return null;

  return (
    <section className="mt-10 sm:mt-12">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-neutral-950 sm:text-2xl">
            আরও পড়ুন
          </h2>
          <p className="mt-1 text-sm text-neutral-600">সম্পর্কিত গাইড</p>
        </div>
        <Link
          href="/blogs"
          className="hidden text-sm font-semibold text-primary hover:underline sm:inline-flex sm:items-center sm:gap-1"
        >
          সব ব্লগ
          <MaterialIcon name="arrow_forward" className="text-[16px]" />
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {posts.map((post) => (
          <BlogCard key={post.slug} post={post} />
        ))}
      </div>
    </section>
  );
}
