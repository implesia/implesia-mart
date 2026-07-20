"use client";

import { useDeferredValue, useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";
import { faqsCopy } from "../../_data/faqs/faqs";
import { FaqsCategories } from "./faqs-categories";
import { FaqsList } from "./faqs-list";
import { FaqsHelpCta } from "./faqs-help-cta";

export function FaqsView() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  const filtered = useMemo(() => {
    return faqsCopy.items.filter((item) => {
      const inCategory =
        activeCategory === "all" || item.categoryId === activeCategory;
      if (!inCategory) return false;
      if (!deferredQuery) return true;
      return (
        item.question.toLowerCase().includes(deferredQuery) ||
        item.answer.toLowerCase().includes(deferredQuery)
      );
    });
  }, [activeCategory, deferredQuery]);

  const categoryTitle =
    activeCategory === "all"
      ? faqsCopy.sidebar.allLabel
      : (faqsCopy.categories.find((c) => c.id === activeCategory)?.label ??
        faqsCopy.sidebar.allLabel);

  return (
    <>
      {/* Hero */}
      <section className="w-full pt-6 pb-6 sm:pt-8 sm:pb-8 lg:pt-10 lg:pb-10">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div
            className={cn(
              "relative w-full overflow-hidden rounded-2xl px-5 py-10 text-center sm:rounded-3xl sm:px-10 sm:py-12 md:px-14 md:py-14",
              "bg-[#062f2c] dark:bg-[#041f1d]",
              "ring-1 ring-black/10 dark:ring-primary/15",
              "shadow-[0_20px_50px_rgba(6,47,44,0.18)]",
            )}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_10%_0%,rgba(43,192,181,0.3),transparent_50%),radial-gradient(ellipse_50%_40%_at_100%_100%,rgba(245,179,1,0.14),transparent_45%)]"
            />

            <div className="relative z-10 mx-auto max-w-2xl">
              <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-white/90 backdrop-blur-sm">
                <span className="size-1.5 shrink-0 rounded-full bg-warm-gold" />
                {faqsCopy.hero.eyebrow}
              </span>

              <h1 className="mb-3 text-2xl leading-tight font-semibold text-white sm:text-3xl lg:text-4xl">
                {faqsCopy.hero.title}
              </h1>
              <p className="mx-auto mb-6 max-w-xl text-sm leading-relaxed text-white/70 sm:mb-8 sm:text-base">
                {faqsCopy.hero.subtitle}
              </p>

              <div className="relative mx-auto max-w-xl">
                <MaterialIcon
                  name="search"
                  className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-[22px] text-outline sm:left-5"
                />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={faqsCopy.hero.placeholder}
                  className={cn(
                    "h-12 rounded-full border-0 bg-white pl-11 text-sm text-on-surface shadow-lg sm:h-14 sm:pl-14 sm:text-base",
                    "placeholder:text-outline/80",
                    "focus-visible:ring-2 focus-visible:ring-primary/40",
                    "dark:bg-surface-container-highest",
                  )}
                  aria-label="প্রশ্ন খুঁজুন"
                />
                {query.trim() ? (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="absolute top-1/2 right-3 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-outline hover:bg-surface-container sm:right-4"
                    aria-label="সার্চ মুছুন"
                  >
                    <MaterialIcon name="close" className="text-[18px]" />
                  </button>
                ) : null}
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-2 sm:mt-6 sm:gap-2.5">
                <span className="text-[11px] font-semibold tracking-wide text-white/50 uppercase sm:text-xs">
                  {faqsCopy.hero.trendingLabel}:
                </span>
                {faqsCopy.hero.trending.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      setActiveCategory("all");
                      setQuery(tag);
                    }}
                    className={cn(
                      "rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[11px] text-white/85 backdrop-blur-sm",
                      "transition-colors hover:border-primary/50 hover:bg-primary/20 hover:text-white",
                      "sm:px-3 sm:py-1.5 sm:text-xs",
                    )}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="w-full py-8 sm:py-10 lg:py-14">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 px-4 sm:gap-8 sm:px-6 lg:grid-cols-12 lg:gap-10 lg:px-8">
          <FaqsCategories
            activeCategory={activeCategory}
            onChange={setActiveCategory}
            className="lg:col-span-3"
          />

          <div className="min-w-0 lg:col-span-9">
            <div className="mb-5 sm:mb-6">
              <h2 className="text-xl font-semibold tracking-tight text-on-background sm:text-2xl">
                {categoryTitle}
              </h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                {filtered.length} টি প্রশ্ন দেখানো হচ্ছে
                {deferredQuery ? ` · “${query.trim()}”` : null}
              </p>
            </div>

            <div
              className={cn(
                "mb-6 flex gap-3 rounded-xl border-l-4 border-primary bg-primary/5 p-3.5 sm:mb-8 sm:rounded-2xl sm:p-5",
                "dark:bg-primary/10",
              )}
            >
              <MaterialIcon
                name="info"
                filled
                className="mt-0.5 shrink-0 text-[20px] text-primary"
              />
              <div className="min-w-0">
                <p className="mb-1 text-xs font-semibold tracking-wide text-primary uppercase">
                  {faqsCopy.callout.eyebrow}
                </p>
                <p className="text-sm leading-relaxed text-on-surface sm:text-[0.95rem]">
                  {faqsCopy.callout.body}
                </p>
              </div>
            </div>

            <FaqsList items={filtered} />
            <FaqsHelpCta />
          </div>
        </div>
      </section>
    </>
  );
}
