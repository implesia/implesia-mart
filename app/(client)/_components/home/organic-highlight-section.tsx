"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";

import { organicHighlight } from "../../_data/home/home";
import { Container } from "../common/container";
import { MaterialIcon } from "../common/material-icon";

export function OrganicHighlightSection() {
  return (
    <section id="why-us" className="relative overflow-hidden py-6 sm:py-8">
      {/* Atmosphere */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[#f3f7f6] dark:bg-background"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_10%_0%,rgba(43,192,181,0.14),transparent_55%),radial-gradient(ellipse_60%_45%_at_100%_20%,rgba(245,179,1,0.08),transparent_50%)] dark:bg-[radial-gradient(ellipse_70%_50%_at_0%_0%,rgba(61,212,200,0.12),transparent_50%)]"
      />

      <Container className="relative z-10 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-5 sm:mb-10 lg:mb-12 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <p className="mb-3 flex items-center gap-2.5 text-[11px] font-semibold tracking-[0.16em] text-primary uppercase sm:text-xs">
              <span className="h-px w-6 bg-warm-gold/90" aria-hidden />
              {organicHighlight.kicker}
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-on-background sm:text-3xl">
              {organicHighlight.title}
            </h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-on-surface-variant sm:text-base">
              {organicHighlight.description}
            </p>
          </div>

          <Link
            href={organicHighlight.ctaHref}
            className={cn(
              "inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold sm:h-12 sm:w-auto",
              "bg-[#062f2c] text-white dark:bg-primary dark:text-on-primary",
              "transition-all hover:bg-[#0a3d39] hover:shadow-[0_12px_28px_-12px_rgba(6,47,44,0.45)]",
              "active:scale-[0.98] dark:hover:bg-primary/90",
            )}
          >
            {organicHighlight.cta}
            <MaterialIcon name="arrow_forward" className="text-[18px]" />
          </Link>
        </div>

        {/* Benefit bento */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          {organicHighlight.bullets.map((item, index) => (
            <article
              key={item.title}
              className={cn(
                "group relative flex flex-col overflow-hidden rounded-[1.25rem] p-5 sm:rounded-[1.4rem] sm:p-6",
                "bg-surface-container-lowest/90 backdrop-blur-sm dark:bg-surface-container",
                "ring-1 ring-black/[0.05] dark:ring-white/10",
                "shadow-[0_1px_2px_rgba(0,0,0,0.03)]",
                "transition-[transform,box-shadow,ring-color] duration-300",
                "hover:-translate-y-1 hover:shadow-[0_20px_40px_-24px_rgba(6,47,44,0.28)]",
                "hover:ring-primary/25",
              )}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -top-8 -right-8 size-28 rounded-full bg-primary/[0.06] transition-transform duration-500 group-hover:scale-125 dark:bg-primary/10"
              />

              <div className="relative mb-5 flex items-start justify-between gap-3">
                <span
                  className={cn(
                    "flex size-11 items-center justify-center rounded-2xl sm:size-12",
                    "bg-primary/10 text-primary",
                    "transition-colors duration-300 group-hover:bg-primary group-hover:text-on-primary",
                  )}
                >
                  <MaterialIcon
                    name={item.icon}
                    className="text-[22px] sm:text-[24px]"
                  />
                </span>
                <span className="font-mono text-xs tabular-nums text-outline/70">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>

              <h3 className="relative mb-1.5 text-[15px] font-semibold tracking-tight text-on-surface sm:text-base">
                {item.title}
              </h3>
              <p className="relative text-xs leading-relaxed text-on-surface-variant sm:text-[13px]">
                {item.detail}
              </p>
            </article>
          ))}
        </div>

        {/* Trust strip */}
        <div
          className={cn(
            "mt-4 flex flex-col items-center gap-4 rounded-[1.25rem] px-5 py-4 sm:mt-5 sm:flex-row sm:justify-between sm:rounded-[1.4rem] sm:px-6 sm:py-5",
            "bg-[#062f2c] text-white",
            "shadow-[0_16px_40px_-20px_rgba(6,47,44,0.45)]",
          )}
        >
          <p className="flex items-center gap-2.5 text-sm font-medium">
            <span className="flex size-8 items-center justify-center rounded-full bg-white/10">
              <MaterialIcon
                name="verified"
                filled
                className="text-[18px] text-primary-fixed"
              />
            </span>
            {organicHighlight.storeBadge}
          </p>

          <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end sm:gap-8">
            {organicHighlight.stats.map((stat, i) => (
              <div
                key={stat.label}
                className={cn(
                  "flex flex-1 flex-col items-center sm:flex-none sm:items-end",
                  i > 0 && "border-l border-white/10 pl-2 sm:pl-8",
                )}
              >
                <span className="text-base font-semibold tracking-tight text-primary-fixed sm:text-lg">
                  {stat.value}
                </span>
                <span className="text-[10px] text-white/55 sm:text-[11px]">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
