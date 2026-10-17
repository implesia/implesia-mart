"use client";

import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import type { FaqCallout } from "@/lib/mart-api/faq-callout";
import type { FaqCategories } from "@/lib/mart-api/faq-categories";
import type { FaqHelp } from "@/lib/mart-api/faq-help";
import type { FaqHero } from "@/lib/mart-api/faq-hero";
import type { FaqItem } from "@/lib/mart-api/faq-items";
import type { FaqListing } from "@/lib/mart-api/faq-listing";
import { cn } from "@/lib/utils";

import { Container } from "../../_components/common/container";
import { JsonLd } from "../../_components/common/json-ld";
import { MaterialIcon } from "../../_components/common/material-icon";
import { FaqsCategories } from "./faqs-categories";
import { FaqsHelpCta } from "./faqs-help-cta";
import { FaqsEmpty, FaqsList } from "./faqs-list";

export function FaqsView({
  hero,
  categories,
  listing,
  callout,
  items,
  help,
}: {
  hero: FaqHero | null;
  categories: FaqCategories | null;
  listing: FaqListing | null;
  callout: FaqCallout | null;
  items: FaqItem[];
  help: FaqHelp | null;
}) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const normalizedQuery = query.trim().toLowerCase();
  const showCategories = Boolean(categories?.isActive);
  const categoryItems = categories?.isActive
    ? categories.items.filter((item) => item.label.trim() && item.isActive !== false)
    : [];
  const allLabel = categories?.isActive ? categories.allLabel.trim() : "";
  const selected =
    showCategories &&
    (activeCategory === "all" || categoryItems.some((item) => item.id === activeCategory))
      ? activeCategory
      : "all";
  const questions = items.filter((item) => item.isActive !== false && item.question.trim());

  const filtered = useMemo(() => {
    return questions.filter((item) => {
      const inCategory = selected === "all" || item.categoryId === selected;
      if (!inCategory) return false;
      if (!normalizedQuery) return true;
      return (
        item.question.toLowerCase().includes(normalizedQuery) ||
        item.answer.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [questions, selected, normalizedQuery]);

  // "All" without a search: show the questions under their category headings.
  const groups =
    showCategories && selected === "all" && !normalizedQuery
      ? categoryItems
          .map((category) => ({
            category,
            items: filtered.filter((item) => item.categoryId === category.id),
          }))
          .filter((group) => group.items.length > 0)
      : [];
  const grouped = groups.length > 0;
  const ungrouped = grouped
    ? filtered.filter((item) => !categoryItems.some((category) => category.id === item.categoryId))
    : [];

  const categoryTitle =
    selected === "all"
      ? allLabel
      : (categoryItems.find((item) => item.id === selected)?.label ?? allLabel);
  const trending = hero?.isActive
    ? hero.trending.filter((item) => item.label.trim() && item.isActive !== false)
    : [];

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <>
      <JsonLd data={faqJsonLd} />
      {hero?.isActive ? (
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
                {hero.eyebrow.trim() ? (
                  <p className="mb-1.5 text-[11px] font-medium tracking-wide text-primary sm:text-xs">
                    {hero.eyebrow}
                  </p>
                ) : null}
                {hero.title.trim() ? (
                  <h1 className="mb-3 text-[1.35rem] leading-[1.2] font-bold tracking-tight text-white sm:mb-4 sm:text-3xl lg:text-[2.15rem]">
                    {hero.title}
                  </h1>
                ) : null}
                {hero.subtitle.trim() ? (
                  <p className="mb-5 text-sm leading-relaxed text-white/70 sm:mb-6 sm:text-base">
                    {hero.subtitle}
                  </p>
                ) : null}
                <div role="search" className="relative mx-auto max-w-xl">
                  <MaterialIcon
                    name="search"
                    className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-[20px] text-neutral-400"
                  />
                  <Input
                    type="search"
                    enterKeyHint="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={hero.placeholder}
                    className="h-12 rounded-full border-0 bg-white pr-12 pl-11 text-base [&::-webkit-search-cancel-button]:hidden text-neutral-950 shadow-none placeholder:text-neutral-400 focus-visible:ring-2 focus-visible:ring-primary/40"
                    aria-label={hero.searchLabel.trim() || "Search"}
                  />
                  {query.trim() ? (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      className="absolute top-1/2 right-2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-neutral-500 hover:bg-[#f5f6f8] focus-visible:outline-2 focus-visible:outline-primary"
                      aria-label={hero.clearLabel.trim() || "Clear search"}
                    >
                      <MaterialIcon name="close" className="text-[18px]" />
                    </button>
                  ) : null}
                </div>
                {trending.length > 0 ? (
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                    {hero.trendingLabel.trim() ? (
                      <span className="text-[11px] text-white/50">{hero.trendingLabel}:</span>
                    ) : null}
                    {trending.map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => {
                          setActiveCategory("all");
                          setQuery(tag.label);
                        }}
                        aria-pressed={query.trim() === tag.label}
                        className={cn(
                          "min-h-9 rounded-full border px-3 py-1.5 text-xs text-white/90 transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                          query.trim() === tag.label ? "border-primary bg-primary/20" : "border-white/25",
                        )}
                      >
                        {tag.label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </Container>
        </section>
      ) : null}

      <section className="w-full bg-[#f5f6f8] py-6 sm:py-8">
        <Container className="w-full px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
            <FaqsCategories
              categories={categories}
              activeCategory={selected}
              onChange={(id) => {
                setActiveCategory(id);
                setQuery("");
              }}
              className="lg:col-span-3"
            />
            <div className={cn("min-w-0", showCategories ? "lg:col-span-9" : "lg:col-span-12")}>
              {listing?.isActive ? (
                <div className="mb-4 sm:mb-5">
                  {categoryTitle ? (
                    <h2 className="text-lg font-semibold tracking-tight text-neutral-950 sm:text-xl">
                      {categoryTitle}
                    </h2>
                  ) : null}
                  <p className="mt-1 text-sm text-neutral-600" aria-live="polite">
                    {`${filtered.length}${listing.countSuffix}`}
                    {normalizedQuery ? ` · “${query.trim()}”` : null}
                  </p>
                </div>
              ) : null}

              {callout?.isActive ? (
                <div className="mb-5 flex gap-3 rounded-2xl border-l-4 border-primary bg-white p-4 sm:mb-6">
                  <MaterialIcon
                    name="info"
                    filled
                    className="mt-0.5 shrink-0 text-[20px] text-primary"
                  />
                  <div className="min-w-0">
                    {callout.eyebrow.trim() ? (
                      <p className="mb-1 text-xs font-semibold text-primary">{callout.eyebrow}</p>
                    ) : null}
                    {callout.body.trim() ? (
                      <p className="text-sm leading-relaxed text-neutral-600">{callout.body}</p>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {grouped ? (
                <div className="flex flex-col gap-8">
                  {groups.map((group, index) => (
                    <section key={group.category.id} aria-labelledby={`faq-group-${group.category.id}`}>
                      <h2
                        id={`faq-group-${group.category.id}`}
                        className="mb-3 flex items-center gap-2 text-base font-semibold text-neutral-950 sm:text-lg"
                      >
                        <span
                          aria-hidden
                          className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary-ink"
                        >
                          <MaterialIcon name={group.category.icon || "help_outline"} className="text-[18px]" />
                        </span>
                        {group.category.label}
                        <span className="text-sm font-normal text-neutral-500">
                          ({group.items.length.toLocaleString("bn-BD")})
                        </span>
                      </h2>
                      <FaqsList items={group.items} listing={listing} openFirst={index === 0} />
                    </section>
                  ))}
                  {ungrouped.length ? <FaqsList items={ungrouped} listing={listing} openFirst={false} /> : null}
                </div>
              ) : filtered.length ? (
                <FaqsList items={filtered} listing={listing} />
              ) : (
                <FaqsEmpty listing={listing} />
              )}
              <FaqsHelpCta help={help} />
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
