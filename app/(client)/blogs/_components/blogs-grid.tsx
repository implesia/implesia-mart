"use client";

import { useRouter } from "next/navigation";
import { useId, useMemo, useState } from "react";

import { BLOG_PAGE_SIZE, filterPosts, nextVisibleCount } from "@/lib/blog-view";
import { blogCategoryLabel, type BlogCategories } from "@/lib/mart-api/blog-categories";
import type { BlogListing } from "@/lib/mart-api/blog-listing";
import { isContentActive } from "@/lib/mart-mock/visibility";
import type { BlogPostRecord } from "@/lib/mart-mock/blog-sections";
import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";
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
  failed = false,
}: {
  categories: BlogCategories | null;
  listing: BlogListing | null;
  posts: BlogPostRecord[];
  /** The posts request failed, so an empty list is an outage, not "no articles". */
  failed?: boolean;
}) {
  const router = useRouter();
  const searchId = useId();
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(BLOG_PAGE_SIZE);
  const visiblePosts = useMemo(() => posts.filter(isContentActive), [posts]);
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
  const filtering = query.trim() !== "";
  const visible = useMemo(
    () =>
      filterPosts(visiblePosts, {
        query,
        categoryId: showTabs ? selected : "all",
      }),
    [visiblePosts, query, selected, showTabs],
  );
  // The highlighted card only makes sense on the unfiltered first view.
  const featured = useMemo(
    () =>
      filtering
        ? undefined
        : (visible.find((post) => hasAvailableRelated(post.relatedProductSlugs)) ?? visible[0]),
    [visible, filtering],
  );
  const rest = visible.filter((post) => post.id !== featured?.id);
  const shownRest = rest.slice(0, shown);
  const hiddenCount = rest.length - shownRest.length;

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
                    onClick={() => {
                      setActive(tab.id);
                      setShown(BLOG_PAGE_SIZE);
                    }}
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

      {visiblePosts.length > 0 ? (
        <form
          role="search"
          onSubmit={(event) => event.preventDefault()}
          className="relative mb-4 sm:mb-5 sm:max-w-md"
        >
          <label htmlFor={searchId} className="sr-only">
            ব্লগে খুঁজুন
          </label>
          <MaterialIcon
            name="search"
            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[20px] text-neutral-400"
          />
          <input
            id={searchId}
            type="search"
            value={query}
            maxLength={80}
            placeholder="ব্লগে খুঁজুন…"
            onChange={(event) => {
              setQuery(event.target.value);
              setShown(BLOG_PAGE_SIZE);
            }}
            className="h-11 w-full rounded-full border border-neutral-200/90 bg-white pr-4 pl-11 text-sm text-neutral-950 transition-colors placeholder:text-neutral-400 focus:border-primary focus:ring-2 focus:ring-primary/30 focus:outline-none"
          />
        </form>
      ) : null}

      {failed && visiblePosts.length === 0 ? (
        <div
          data-testid="blogs-error"
          role="status"
          className="rounded-2xl border border-neutral-200/90 bg-white px-4 py-14 text-center"
        >
          <p className="text-sm font-semibold text-neutral-950">
            এই মুহূর্তে আর্টিকেল লোড করা যাচ্ছে না
          </p>
          <p className="mt-1 text-sm text-neutral-600">কিছুক্ষণ পরে পেজটি রিফ্রেশ করে আবার চেষ্টা করুন।</p>
          <button
            type="button"
            onClick={() => router.refresh()}
            className="mt-4 inline-flex h-10 items-center rounded-full bg-primary px-5 text-sm font-semibold text-on-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            আবার চেষ্টা করুন
          </button>
        </div>
      ) : visible.length === 0 ? (
        <div
          data-testid="blogs-empty"
          role="status"
          className="rounded-2xl border border-neutral-200/90 bg-white px-4 py-16 text-center"
        >
          {filtering ? (
            <p className="text-sm text-neutral-600">কোনো আর্টিকেল মেলেনি। অন্য শব্দে খুঁজে দেখুন।</p>
          ) : listing?.emptyMessage.trim() ? (
            <p className="text-sm text-neutral-600">{listing.emptyMessage}</p>
          ) : (
            <p className="text-sm text-neutral-600">এখনো কোনো আর্টিকেল প্রকাশিত হয়নি।</p>
          )}
        </div>
      ) : (
        <div className="space-y-8 sm:space-y-10">
          {featured ? (
            <BlogCard post={featured} categories={categoryItems} listing={listing} featured />
          ) : null}
          {shownRest.length > 0 ? (
            <ul className="grid grid-cols-1 gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-6">
              {shownRest.map((post) => (
                <li key={post.id} className="flex min-w-0 [&>article]:w-full">
                  <BlogCard post={post} categories={categoryItems} listing={listing} />
                </li>
              ))}
            </ul>
          ) : null}
          {hiddenCount > 0 ? (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={() => setShown((count) => nextVisibleCount(count, rest.length))}
                className="inline-flex h-11 items-center rounded-full border border-neutral-300 bg-white px-6 text-sm font-semibold text-neutral-950 transition-colors hover:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              >
                আরও দেখুন ({hiddenCount.toLocaleString("bn-BD")})
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
