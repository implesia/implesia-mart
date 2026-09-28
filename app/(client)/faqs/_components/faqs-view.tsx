"use client";

import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { Container } from "../../_components/common/container";
import { MaterialIcon } from "../../_components/common/material-icon";
import { faqsCopy } from "../../_data/faqs/faqs";
import { FaqsCategories } from "./faqs-categories";
import { FaqsHelpCta } from "./faqs-help-cta";
import { FaqsList } from "./faqs-list";

export function FaqsView() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const normalizedQuery = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    return faqsCopy.items.filter((item) => {
      const inCategory = activeCategory === "all" || item.categoryId === activeCategory;
      if (!inCategory) return false;
      if (!normalizedQuery) return true;
      return (
        item.question.toLowerCase().includes(normalizedQuery) ||
        item.answer.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [activeCategory, normalizedQuery]);

  const categoryTitle =
    activeCategory === "all"
      ? faqsCopy.sidebar.allLabel
      : (faqsCopy.categories.find((c) => c.id === activeCategory)?.label ??
        faqsCopy.sidebar.allLabel);

  return (
    <>
      <section className="w-full bg-[#f5f6f8] pb-5 sm:pb-6">
        <Container className="w-full px-4 sm:px-6 lg:px-8">
          <div
            className={cn(
              "relative w-full overflow-hidden rounded-2xl px-4 py-8 text-center sm:px-8 sm:py-10",
              "bg-[linear-gradient(100deg,#071820_0%,#070c14_46%,#05060a_100%)]",
            )}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(43,192,181,0.22),transparent_55%)]"
            />

            <div className="relative z-10 mx-auto max-w-lg">
              <p className="mb-1.5 text-[11px] font-medium tracking-wide text-primary sm:text-xs">
                {faqsCopy.hero.eyebrow}
              </p>
              <h1 className="mb-3 text-[1.35rem] leading-[1.2] font-bold tracking-tight text-white sm:mb-4 sm:text-3xl lg:text-[2.15rem]">
                {faqsCopy.hero.title}
              </h1>
              <p className="mb-5 text-sm leading-relaxed text-white/70 sm:mb-6 sm:text-base">
                {faqsCopy.hero.subtitle}
              </p>

              <div className="relative mx-auto max-w-xl">
                <MaterialIcon
                  name="search"
                  className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-[20px] text-neutral-400"
                />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={faqsCopy.hero.placeholder}
                  className="h-11 rounded-full border-0 bg-white pl-11 text-sm text-neutral-950 shadow-none placeholder:text-neutral-400 focus-visible:ring-2 focus-visible:ring-primary/40"
                  aria-label="প্রশ্ন খুঁজুন"
                />
                {query.trim() ? (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="absolute top-1/2 right-3 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-neutral-400 hover:bg-[#f5f6f8]"
                    aria-label="সার্চ মুছুন"
                  >
                    <MaterialIcon name="close" className="text-[18px]" />
                  </button>
                ) : null}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <span className="text-[11px] text-white/50">{faqsCopy.hero.trendingLabel}:</span>
                {faqsCopy.hero.trending.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      setActiveCategory("all");
                      setQuery(tag);
                    }}
                    className="rounded-full border border-white/20 px-2.5 py-1 text-[11px] text-white/85 transition-colors hover:bg-white/10 sm:px-3 sm:text-xs"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="w-full bg-[#f5f6f8] py-6 sm:py-8">
        <Container className="w-full px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
            <FaqsCategories
              activeCategory={activeCategory}
              onChange={(id) => {
                setActiveCategory(id);
                setQuery("");
              }}
              className="lg:col-span-3"
            />

            <div className="min-w-0 lg:col-span-9">
              <div className="mb-4 sm:mb-5">
                <h2 className="text-lg font-semibold tracking-tight text-neutral-950 sm:text-xl">
                  {categoryTitle}
                </h2>
                <p className="mt-1 text-sm text-neutral-600">
                  {filtered.length}টি প্রশ্ন
                  {normalizedQuery ? ` · “${query.trim()}”` : null}
                </p>
              </div>

              <div className="mb-5 flex gap-3 rounded-2xl border-l-4 border-primary bg-white p-4 sm:mb-6">
                <MaterialIcon
                  name="info"
                  filled
                  className="mt-0.5 shrink-0 text-[20px] text-primary"
                />
                <div className="min-w-0">
                  <p className="mb-1 text-xs font-semibold text-primary">
                    {faqsCopy.callout.eyebrow}
                  </p>
                  <p className="text-sm leading-relaxed text-neutral-600">
                    {faqsCopy.callout.body}
                  </p>
                </div>
              </div>

              <FaqsList items={filtered} />
              <FaqsHelpCta />
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
