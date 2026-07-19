"use client";

import { cn } from "@/lib/utils";

import { Container } from "../common/container";
import { MaterialIcon } from "../common/material-icon";
import { testimonials } from "../../_data/home/home";

function Stars({ value, size = "md" }: { value: number; size?: "sm" | "md" }) {
  return (
    <div
      className="flex shrink-0 items-center gap-0.5"
      aria-label={`${value} স্টার`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <MaterialIcon
          key={i}
          name="star"
          filled={i < value}
          className={cn(
            size === "sm" ? "text-[16px]" : "text-[18px]",
            i < value ? "text-warm-gold" : "text-outline-variant/45",
          )}
        />
      ))}
    </div>
  );
}

function ReviewCard({
  t,
}: {
  t: (typeof testimonials)[number];
}) {
  return (
    <article
      className={cn(
        "flex h-full w-[300px] shrink-0 flex-col sm:w-[340px]",
        "rounded-2xl sm:rounded-[1.25rem]",
        "bg-surface-container-lowest dark:bg-surface-container",
        "border border-outline-variant/35 dark:border-white/10",
        "shadow-[0_8px_28px_rgba(15,40,38,0.06)] dark:shadow-[0_12px_32px_rgba(0,0,0,0.3)]",
        "p-5 sm:p-6",
      )}
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <span className="inline-flex max-w-[55%] truncate rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary dark:bg-primary/15 sm:text-xs">
          {t.product}
        </span>
        <Stars value={t.rating} size="sm" />
      </div>

      <p className="mb-5 min-h-[7.5rem] flex-1 text-sm leading-relaxed text-on-surface sm:min-h-[8.25rem] sm:text-[0.95rem]">
        &ldquo;{t.quote}&rdquo;
      </p>

      <div className="mt-auto flex items-center gap-3 border-t border-outline-variant/30 pt-4 dark:border-white/10">
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white sm:size-11 sm:text-sm"
          style={{ backgroundColor: t.accent }}
          aria-hidden
        >
          {t.initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <h3 className="truncate text-sm font-semibold text-on-surface">
              {t.name}
            </h3>
            <MaterialIcon
              name="verified"
              filled
              className="shrink-0 text-[15px] text-primary"
            />
          </div>
          <p className="truncate text-xs text-on-surface-variant">
            {t.location} · {t.timeAgo}
          </p>
        </div>
      </div>
    </article>
  );
}

export function TestimonialsSection() {
  const avgRating = (
    testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length
  ).toFixed(1);

  return (
    <section className="relative overflow-hidden bg-surface-container-low py-12 sm:py-16 lg:py-xl dark:bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_50%_-10%,rgba(43,192,181,0.1),transparent_55%)] dark:bg-[radial-gradient(ellipse_70%_45%_at_50%_-10%,rgba(61,212,200,0.08),transparent_55%)]"
      />

      <Container className="relative mb-10 px-4 sm:mb-12 sm:px-6 lg:mb-14 lg:px-8">
        <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
          <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3.5 py-1.5 text-xs font-semibold text-primary dark:border-primary/25 dark:bg-primary/12">
            <MaterialIcon name="reviews" className="text-[16px]" />
            কাস্টমার রিভিউ
          </span>
          <h2 className="mb-3 font-display-lg text-[1.65rem] leading-tight text-primary sm:text-[2.1rem] lg:text-[2.35rem]">
            আমাদের কাস্টমাররা যা বলছেন
          </h2>
          <p className="mb-5 text-sm leading-relaxed text-on-surface-variant sm:text-base">
            আসল অর্ডার করা কাস্টমারদের অভিজ্ঞতা — ক্যাশ অন ডেলিভারি থেকে
            প্রোডাক্ট কোয়ালিটি পর্যন্ত।
          </p>
          <div className="inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-outline-variant/40 bg-surface-container-lowest px-3.5 py-2 dark:border-white/10 dark:bg-surface-container sm:gap-3">
            <Stars value={5} />
            <span className="text-sm font-semibold tabular-nums text-on-surface">
              {avgRating}
            </span>
            <span className="hidden h-4 w-px bg-outline-variant/50 sm:block dark:bg-white/15" />
            <span className="text-xs text-on-surface-variant sm:text-sm">
              ভেরিফাইড ক্রয়
            </span>
          </div>
        </div>
      </Container>

      <div className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-linear-to-r from-surface-container-low to-transparent sm:w-14 lg:w-20 dark:from-background"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-linear-to-l from-surface-container-low to-transparent sm:w-14 lg:w-20 dark:from-background"
        />

        {/* Two equal groups → seamless -50% loop */}
        <div className="testimonials-marquee flex w-max">
          {[0, 1].map((group) => (
            <div
              key={group}
              className="flex gap-4 pr-4 sm:gap-5 sm:pr-5 lg:gap-6 lg:pr-6"
              aria-hidden={group === 1 ? true : undefined}
            >
              {testimonials.map((t) => (
                <ReviewCard key={`${group}-${t.id}`} t={t} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
