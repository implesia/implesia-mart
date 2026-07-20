"use client";

import Image from "next/image";
import Link from "next/link";
import { useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

import { flashSale } from "../../_data/home/home";
import { Container } from "../common/container";
import { MaterialIcon } from "../common/material-icon";

const SALE_DURATION_SEC = 8 * 60 * 60;
const STORAGE_KEY = "implesia.flashSale.endsAt";

function getSecondsLeft() {
  if (typeof window === "undefined") return SALE_DURATION_SEC;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    let endsAt = stored ? Number(stored) : NaN;
    if (!Number.isFinite(endsAt) || endsAt <= Date.now()) {
      endsAt = Date.now() + SALE_DURATION_SEC * 1000;
      window.localStorage.setItem(STORAGE_KEY, String(endsAt));
    }
    return Math.max(0, Math.floor((endsAt - Date.now()) / 1000));
  } catch {
    return SALE_DURATION_SEC;
  }
}

function subscribeToCountdown(onStoreChange: () => void) {
  const id = window.setInterval(onStoreChange, 1000);
  return () => window.clearInterval(id);
}

function TimeUnit({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center rounded-2xl border border-white/12 bg-white/10 px-2.5 py-2.5 backdrop-blur-md sm:min-w-[4.75rem] sm:flex-none sm:px-3.5 sm:py-3">
      <span className="font-mono text-xl font-semibold tabular-nums tracking-tight text-white sm:text-2xl lg:text-[1.75rem]">
        {value}
      </span>
      <span className="mt-0.5 text-[10px] font-medium tracking-[0.14em] text-white/55 uppercase sm:text-[11px]">
        {label}
      </span>
    </div>
  );
}

export function FlashSaleSection() {
  const timeLeft = useSyncExternalStore(
    subscribeToCountdown,
    getSecondsLeft,
    () => SALE_DURATION_SEC,
  );

  const hours = String(Math.floor(timeLeft / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((timeLeft % 3600) / 60)).padStart(2, "0");
  const seconds = String(timeLeft % 60).padStart(2, "0");

  return (
    <section className="py-12 sm:py-14 lg:py-20">
      <Container className="px-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            "relative grid overflow-hidden rounded-[1.35rem] sm:rounded-[1.75rem]",
            "grid-cols-1 lg:grid-cols-12",
            "bg-[#062f2c] dark:bg-[#041f1d]",
            "ring-1 ring-black/10 dark:ring-primary/15",
            "shadow-[0_24px_60px_-20px_rgba(6,47,44,0.35)]",
          )}
        >
          {/* Atmosphere */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_75%_65%_at_0%_0%,rgba(43,192,181,0.32),transparent_55%),radial-gradient(ellipse_55%_50%_at_100%_100%,rgba(245,179,1,0.14),transparent_50%)]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
          />

          {/* Product stage — first on mobile */}
          <div className="relative order-1 flex min-h-[220px] items-center justify-center sm:min-h-[280px] lg:order-2 lg:col-span-6 lg:min-h-[420px]">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-[18%] rounded-full bg-[radial-gradient(circle,rgba(245,179,1,0.28),rgba(43,192,181,0.12)_45%,transparent_70%)] blur-2xl"
            />
            <div className="relative aspect-square w-[78%] max-w-[340px] sm:w-[70%] sm:max-w-[380px] lg:absolute lg:inset-8 lg:aspect-auto lg:w-auto lg:max-w-none xl:inset-10">
              <div className="relative h-full w-full overflow-hidden rounded-[1.25rem] bg-white/5 ring-1 ring-white/10 backdrop-blur-[2px] sm:rounded-[1.5rem]">
                <Image
                  src={flashSale.imageSrc}
                  alt={flashSale.imageAlt}
                  fill
                  sizes="(max-width: 1024px) 80vw, 42vw"
                  className="object-contain object-center p-5 sm:p-7 lg:p-8"
                />
              </div>
            </div>
          </div>

          {/* Copy */}
          <div className="relative order-2 z-10 flex flex-col justify-center px-5 py-8 sm:px-8 sm:py-10 lg:order-1 lg:col-span-6 lg:px-10 lg:py-12 xl:px-12 xl:py-14">
            <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-white/12 bg-white/10 px-3 py-1.5 backdrop-blur-md sm:mb-5">
              <span className="size-1.5 animate-pulse rounded-full bg-warm-gold" />
              <span className="text-[11px] font-semibold tracking-[0.16em] text-white/90 uppercase sm:text-xs">
                {flashSale.badge}
              </span>
            </div>

            <p className="mb-2 text-xs font-medium tracking-wide text-primary-fixed/90 sm:text-sm">
              {flashSale.eyebrow}
            </p>

            <h2 className="mb-2 max-w-[18ch] text-[1.75rem] leading-[1.15] font-semibold tracking-tight text-white sm:mb-3 sm:max-w-none sm:text-4xl sm:leading-[1.12] lg:text-[2.45rem]">
              {flashSale.title}
            </h2>
            <p className="mb-4 text-sm font-semibold text-warm-gold sm:text-base">
              {flashSale.highlight}
            </p>

            <p className="mb-5 max-w-md text-sm leading-relaxed text-white/65 sm:mb-6 sm:text-[0.95rem]">
              {flashSale.description}
            </p>

            {/* Price — typographic */}
            <div className="mb-6 flex flex-wrap items-end gap-x-3 gap-y-1 sm:mb-7">
              <span className="text-2xl font-semibold tabular-nums text-white sm:text-3xl">
                {flashSale.priceLabel}
              </span>
              {flashSale.compareAtLabel ? (
                <span className="pb-1 text-sm text-white/40 line-through tabular-nums sm:text-base">
                  {flashSale.compareAtLabel}
                </span>
              ) : null}
            </div>

            <div
              className="mb-6 flex w-full max-w-sm items-stretch gap-2 sm:mb-8 sm:gap-2.5"
              aria-live="polite"
              aria-label="অফার শেষ হতে বাকি সময়"
            >
              <TimeUnit value={hours} label="ঘণ্টা" />
              <span
                className="hidden self-center text-lg font-semibold text-white/30 sm:inline"
                aria-hidden
              >
                :
              </span>
              <TimeUnit value={minutes} label="মিনিট" />
              <span
                className="hidden self-center text-lg font-semibold text-white/30 sm:inline"
                aria-hidden
              >
                :
              </span>
              <TimeUnit value={seconds} label="সেকেন্ড" />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <Link
                href={flashSale.ctaHref}
                className={cn(
                  "inline-flex h-12 w-full items-center justify-center rounded-full bg-white px-7 text-sm font-semibold text-[#062f2c] transition-all sm:w-auto",
                  "hover:bg-warm-gold hover:shadow-[0_12px_28px_rgba(245,179,1,0.3)]",
                  "active:scale-[0.98]",
                )}
              >
                {flashSale.cta}
                <MaterialIcon name="arrow_forward" className="ml-2 text-[18px]" />
              </Link>
              <Link
                href={flashSale.secondaryCta.href}
                className="inline-flex h-12 w-full items-center justify-center rounded-full px-4 text-sm font-semibold text-white/80 transition-colors hover:text-white sm:w-auto"
              >
                {flashSale.secondaryCta.label}
              </Link>
            </div>

            <p className="mt-4 text-xs text-white/45 sm:mt-5">{flashSale.trustNote}</p>
          </div>
        </div>
      </Container>
    </section>
  );
}
