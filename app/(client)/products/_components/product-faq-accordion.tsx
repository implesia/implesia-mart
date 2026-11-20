"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { MaterialIcon } from "../../_components/common/material-icon";
import type { ProductFaq } from "../../_data/products/product-details";

export function ProductFaqAccordion({
  faqs,
  isFashion = false,
}: {
  faqs: ProductFaq[];
  isFashion?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [openIndices, setOpenIndices] = useState<Set<number>>(() => new Set([0]));

  const filteredFaqs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return faqs.map((faq, index) => ({ faq, originalIndex: index }));
    return faqs
      .map((faq, index) => ({ faq, originalIndex: index }))
      .filter(
        ({ faq }) =>
          faq.question.toLowerCase().includes(q) ||
          faq.answer.toLowerCase().includes(q),
      );
  }, [faqs, search]);

  const toggleIndex = (index: number) => {
    setOpenIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const expandAll = () => {
    setOpenIndices(new Set(faqs.map((_, i) => i)));
  };

  const collapseAll = () => {
    setOpenIndices(new Set());
  };

  if (!faqs.length) return null;

  return (
    <div className="mx-auto max-w-4xl space-y-6 sm:space-y-8">
      {/* Header and Controls */}
      <div className="rounded-2xl border border-outline-variant/20 bg-linear-to-r from-surface-container-low via-surface-container-low/60 to-surface-container-lowest p-5 sm:p-6 dark:border-white/10 dark:from-surface-container/60 dark:to-surface-container">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold tracking-wide text-primary uppercase">
              <MaterialIcon name="help_outline" className="text-[14px]" />
              <span>Questions & Answers</span>
            </div>
            <h2 className="text-xl font-bold text-on-background sm:text-2xl font-headline-sm">
              সাধারণ জিজ্ঞাসা ও সাহায্য
            </h2>
            <p className="mt-1 text-sm text-on-surface-variant sm:text-base">
              অর্ডার, মেজারমেন্ট, ডেলিভারি, ফেব্রিক ও কেয়ার সংক্রান্ত সর্বাধিক জিজ্ঞাসিত প্রশ্নোত্তর।
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={expandAll}
              className="cursor-pointer rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-1.5 text-xs font-semibold text-on-surface shadow-xs transition-colors hover:bg-surface-container-high dark:border-white/10 dark:bg-surface-container-high"
            >
              সব খুলুন
            </button>
            <button
              type="button"
              onClick={collapseAll}
              className="cursor-pointer rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-1.5 text-xs font-semibold text-on-surface-variant shadow-xs transition-colors hover:bg-surface-container-high dark:border-white/10 dark:bg-surface-container-high"
            >
              সব বন্ধ করুন
            </button>
          </div>
        </div>

        {/* Live Search Input */}
        <div className="mt-4 sm:mt-5 relative">
          <MaterialIcon
            name="search"
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-outline"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="যেকোনো প্রশ্ন বা বিষয় খুঁজুন (যেমন: মাপ, ডেলিভারি, অলটারেশন, টাকা)..."
            className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest py-2.5 pr-10 pl-10 text-sm text-on-surface placeholder:text-outline-variant focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-surface-container-highest"
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-outline-variant hover:text-on-surface"
              aria-label="Clear search"
            >
              <MaterialIcon name="close" className="text-[18px]" />
            </button>
          ) : null}
        </div>
      </div>

      {/* FAQs List */}
      {filteredFaqs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-outline-variant/40 bg-surface-container-low px-6 py-10 text-center">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MaterialIcon name="search_off" className="text-[24px]" />
          </div>
          <h4 className="text-base font-semibold text-on-surface">কোনো প্রশ্নোত্তর মেলেনি</h4>
          <p className="mt-1 text-sm text-on-surface-variant">
            &quot;{search}&quot; সম্পর্কিত কোনো প্রশ্ন খুঁজে পাওয়া যায়নি। অন্য শব্দ দিয়ে চেষ্টা করুন।
          </p>
          <button
            type="button"
            onClick={() => setSearch("")}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-primary/90"
          >
            <MaterialIcon name="refresh" className="text-[16px]" />
            <span>সকল প্রশ্নোত্তর দেখুন</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-3.5">
          {filteredFaqs.map(({ faq, originalIndex }) => {
            const isOpen = openIndices.has(originalIndex);

            return (
              <div
                key={faq.question}
                className={cn(
                  "overflow-hidden rounded-2xl border transition-all duration-200",
                  isOpen
                    ? "border-primary/40 bg-surface-container-lowest shadow-sm ring-1 ring-primary/20 dark:border-primary/30 dark:bg-surface-container"
                    : "border-outline-variant/30 bg-surface-container-lowest/80 hover:border-outline-variant/60 hover:bg-surface-container-lowest dark:border-white/10 dark:bg-surface-container/70",
                )}
              >
                <button
                  type="button"
                  onClick={() => toggleIndex(originalIndex)}
                  className="flex w-full cursor-pointer items-start justify-between gap-3 p-4 text-left sm:items-center sm:gap-4 sm:p-5"
                  aria-expanded={isOpen}
                >
                  <div className="flex min-w-0 items-start gap-3 sm:items-center sm:gap-3.5">
                    <span
                      className={cn(
                        "flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors sm:size-8",
                        isOpen
                          ? "bg-primary text-white shadow-xs"
                          : "bg-primary/10 text-primary",
                      )}
                    >
                      Q{originalIndex + 1}
                    </span>
                    <span className="text-sm font-bold text-on-surface sm:text-[15px] leading-snug">
                      {faq.question}
                    </span>
                  </div>

                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full transition-transform duration-300 sm:size-8",
                      isOpen
                        ? "rotate-180 bg-primary/10 text-primary"
                        : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high",
                    )}
                  >
                    <MaterialIcon name="expand_more" className="text-[20px]" />
                  </span>
                </button>

                {isOpen ? (
                  <div className="border-t border-outline-variant/15 px-4 pb-4 pt-3.5 sm:px-5 sm:pb-5 dark:border-white/10">
                    <p className="text-sm leading-relaxed text-on-surface-variant sm:text-base pl-10 sm:pl-11.5">
                      {faq.answer}
                    </p>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {/* Support & Consultation Banner */}
      <aside
        className={cn(
          "rounded-2xl border border-outline-variant/30 bg-linear-to-br from-surface-container-low via-surface-container to-surface-container-high p-5 sm:p-6",
          "dark:border-white/10 dark:from-surface-container dark:to-surface-container-highest",
        )}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3.5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <MaterialIcon name="support_agent" className="text-[24px]" />
            </span>
            <div>
              <h4 className="text-base font-bold text-on-surface">
                {isFashion
                  ? "আরও কোনো তথ্য বা বিশেষ পরামর্শ প্রয়োজন?"
                  : "আপনার প্রশ্নের উত্তর পাননি?"}
              </h4>
              <p className="mt-1 text-xs sm:text-sm text-on-surface-variant">
                {isFashion
                  ? "আমাদের ফ্যাশন কনসালটেন্ট সরাসরি হোয়াটসঅ্যাপে গাউনের কালার, বডি মেজারমেন্ট ও ডেলিভারি নিয়ে সহায়তা করবেন।"
                  : "আমাদের সার্বক্ষণিক সাপোর্ট টিম আপনার যেকোনো প্রশ্নের উত্তর দিতে সর্বদা প্রস্তুত।"}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <a
              href="https://wa.me/8801700000000?text=Hello%2C%20I%20have%20a%20question%20about%20a%20product"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-emerald-700 hover:shadow-md sm:text-sm"
            >
              <MaterialIcon name="chat" className="text-[18px]" />
              <span>WhatsApp চ্যাট</span>
            </a>
            <a
              href="tel:+8801700000000"
              className="inline-flex items-center gap-2 rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-2.5 text-xs font-bold text-on-surface shadow-xs transition-all hover:bg-surface-container-high dark:border-white/10 dark:bg-surface-container sm:text-sm"
            >
              <MaterialIcon name="call" className="text-[18px] text-primary" />
              <span>কল করুন</span>
            </a>
          </div>
        </div>
      </aside>
    </div>
  );
}
