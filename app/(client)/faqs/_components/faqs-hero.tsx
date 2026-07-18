"use client";

import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";
import { faqsCopy } from "../../_data/faqs/faqs";

export function FaqsHero({ className }: { className?: string }) {
  const [query, setQuery] = useState("");
  const canClear = query.trim().length > 0;

  const trending = useMemo(() => faqsCopy.hero.trending, []);

  return (
    <section
      className={cn(
        "mt-20 border-b border-outline-variant/30 bg-surface-container-low pt-xl pb-lg",
        className,
      )}
    >
      <div className="mx-auto max-w-7xl px-6 text-center md:px-12 lg:px-12">
        <h1 className="mb-md font-display-lg text-primary">
          {faqsCopy.hero.title}
        </h1>

        <div className="relative mx-auto max-w-2xl">
          <MaterialIcon
            name="search"
            className="absolute left-6 top-1/2 -translate-y-1/2 text-outline"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={faqsCopy.hero.placeholder}
            className={cn(
              "h-14 rounded-full bg-surface-container-lowest pl-14 pr-14 text-on-surface shadow-sm",
              "border-outline-variant focus-visible:border-primary focus-visible:ring-0",
            )}
          />
          {canClear ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-5 top-1/2 -translate-y-1/2 rounded-full p-2 text-outline hover:bg-surface-container-high"
              aria-label="Clear search"
            >
              <MaterialIcon name="close" className="text-[18px]" />
            </button>
          ) : null}
        </div>

        <div className="mt-base flex flex-wrap justify-center gap-base">
          <span className="mr-2 font-label-sm tracking-widest text-outline uppercase">
            Trending:
          </span>
          {trending.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setQuery(t)}
              className="font-label-sm text-secondary transition-colors hover:text-primary"
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
