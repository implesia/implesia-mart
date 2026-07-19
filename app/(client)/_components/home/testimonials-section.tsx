"use client";

import { cn } from "@/lib/utils";

import { Container } from "../common/container";
import { MaterialIcon } from "../common/material-icon";
import { testimonials } from "../../_data/home/home";

function Stars({ value }: { value: number }) {
  return (
    <div className="mb-5 flex gap-1" aria-label={`${value} স্টার`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <MaterialIcon
          key={i}
          name="star"
          filled={i < value}
          className={cn(
            "text-[18px]",
            i < value ? "text-warm-gold" : "text-outline-variant/40",
          )}
        />
      ))}
    </div>
  );
}

function ReviewCard({ t }: { t: (typeof testimonials)[number] }) {
  return (
    <article
      className={cn(
        "flex w-[300px] shrink-0 flex-col sm:w-[340px] lg:w-[360px]",
        "rounded-2xl sm:rounded-3xl p-6 sm:p-8",
        "border border-outline-variant/30 bg-surface-container-lowest",
        "shadow-[0_10px_30px_rgba(15,40,38,0.06)]",
        "dark:border-white/10 dark:bg-surface-container dark:shadow-[0_12px_32px_rgba(0,0,0,0.3)]",
      )}
    >
      <Stars value={t.rating} />

      <p className="mb-6 min-h-[6.5rem] flex-1 text-sm leading-relaxed text-on-surface sm:min-h-[7rem] sm:text-[0.95rem]">
        &ldquo;{t.quote}&rdquo;
      </p>

      <div className="mt-auto flex items-center gap-3 border-t border-outline-variant/25 pt-5 dark:border-white/10">
        <div
          className="flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{ backgroundColor: t.accent }}
          aria-hidden
        >
          {t.initials}
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-primary">{t.name}</h3>
          <p className="truncate text-xs text-on-surface-variant">
            ভেরিফাইড কাস্টমার · {t.location}
          </p>
        </div>
      </div>
    </article>
  );
}

export function TestimonialsSection() {
  return (
    <section className="overflow-hidden bg-surface-container-high py-10 sm:py-14 lg:py-xl dark:bg-surface-container">
      <Container className="px-4 sm:px-6 lg:px-8">
        <div className="mb-10 px-2 text-center sm:mb-12 lg:mb-14">
          <h2 className="mb-3 font-display-lg text-2xl leading-tight text-primary sm:text-3xl lg:text-4xl">
            আমাদের কাস্টমাররা যা বলছেন
          </h2>
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-on-surface-variant sm:text-base">
            হাজারো সন্তুষ্ট কাস্টমারের বিশ্বাস নিয়ে আমরা এগিয়ে যাচ্ছি।
          </p>
        </div>
      </Container>

      <div className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-linear-to-r from-surface-container-high to-transparent sm:w-16 lg:w-24 dark:from-surface-container"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-linear-to-l from-surface-container-high to-transparent sm:w-16 lg:w-24 dark:from-surface-container"
        />

        <div className="testimonials-marquee flex w-max">
          {[0, 1].map((group) => (
            <div
              key={group}
              className="flex gap-5 pr-5 sm:gap-6 sm:pr-6 lg:gap-8 lg:pr-8"
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
