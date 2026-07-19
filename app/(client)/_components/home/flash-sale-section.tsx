"use client";

import Image from "next/image";
import Link from "next/link";
import { useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

import { MaterialIcon } from "../common/material-icon";
import { Container } from "../common/container";
import { flashSale } from "../../_data/home/home";

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
    <div className="flex min-w-17 flex-1 flex-col items-center rounded-xl border border-white/15 bg-white/10 px-2.5 py-2.5 backdrop-blur-sm sm:min-w-20 sm:flex-none sm:rounded-2xl sm:px-4 sm:py-3">
      <span className="font-mono text-xl font-bold tabular-nums tracking-tight text-white sm:text-2xl md:text-3xl">
        {value}
      </span>
      <span className="mt-0.5 text-[10px] font-semibold tracking-[0.12em] text-white/65 uppercase sm:text-[11px]">
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
    <section className="py-10 sm:py-14 lg:py-xl">
      <Container className="px-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            "relative grid overflow-hidden rounded-2xl sm:rounded-3xl lg:rounded-[1.75rem]",
            "grid-cols-1 lg:grid-cols-12",
            "bg-[#062f2c] dark:bg-[#041f1d]",
            "ring-1 ring-black/10 dark:ring-primary/15",
            "shadow-[0_20px_50px_rgba(6,47,44,0.18)] dark:shadow-[0_24px_56px_rgba(0,0,0,0.45)]",
          )}
        >
          {/* Soft glow accents */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_70%_at_0%_0%,rgba(43,192,181,0.35),transparent_55%),radial-gradient(ellipse_60%_50%_at_40%_100%,rgba(245,179,1,0.12),transparent_50%)]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/25 to-transparent" />

          {/* Image — first on mobile for visual impact */}
          <div className="relative order-1 flex min-h-[240px] w-full items-center justify-center bg-[#0a3d39] sm:min-h-[300px] lg:order-2 lg:col-span-6 lg:min-h-full">
            <div className="relative aspect-4/3 w-full max-h-[320px] sm:max-h-[380px] lg:absolute lg:inset-0 lg:max-h-none lg:aspect-auto">
              <Image
                src={flashSale.imageSrc}
                alt={flashSale.imageAlt}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-contain object-center p-3 sm:p-5 lg:p-6"
                priority={false}
              />
            </div>
            {/* Soft edge blend only — doesn't hide the product */}
            <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-16 bg-linear-to-r from-[#062f2c]/70 to-transparent lg:block" />
          </div>

          {/* Copy */}
          <div className="relative order-2 z-10 flex flex-col justify-center px-5 py-8 sm:px-8 sm:py-10 lg:order-1 lg:col-span-6 lg:px-10 lg:py-12 xl:px-14 xl:py-14">
            <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 backdrop-blur-sm sm:mb-5">
              <span className="size-2 animate-pulse rounded-full bg-warm-gold" />
              <span className="text-[11px] font-semibold tracking-[0.18em] text-white uppercase sm:text-xs sm:tracking-[0.22em]">
                {flashSale.badge}
              </span>
            </div>

            <h2 className="mb-3 max-w-[16ch] text-[1.65rem] leading-snug font-bold text-white sm:mb-4 sm:max-w-none sm:text-[2.15rem] sm:leading-[1.15] lg:text-[2.35rem] xl:text-[2.6rem]">
              <span className="block">{flashSale.titleLines[0]}</span>
              <span className="mt-1 block text-white/95">{flashSale.titleLines[1]}</span>
            </h2>

            <p className="mb-6 max-w-md text-sm leading-relaxed text-white/70 sm:mb-8 sm:text-[0.95rem]">
              {flashSale.description}
            </p>

            <div
              className="mb-7 flex w-full max-w-sm items-stretch gap-2 sm:mb-9 sm:gap-3"
              aria-live="polite"
              aria-label="অফার শেষ হতে বাকি সময়"
            >
              <TimeUnit value={hours} label="ঘণ্টা" />
              <span className="hidden self-center text-xl font-bold text-white/35 sm:inline" aria-hidden>
                :
              </span>
              <TimeUnit value={minutes} label="মিনিট" />
              <span className="hidden self-center text-xl font-bold text-white/35 sm:inline" aria-hidden>
                :
              </span>
              <TimeUnit value={seconds} label="সেকেন্ড" />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <Link
                href={flashSale.ctaHref}
                className={cn(
                  "inline-flex w-full items-center justify-center rounded-full bg-white px-7 py-3.5 text-sm font-semibold tracking-wider text-[#062f2c] uppercase transition-all sm:w-auto sm:px-9 sm:py-4",
                  "hover:bg-warm-gold hover:text-[#062f2c] hover:shadow-[0_12px_28px_rgba(245,179,1,0.35)]",
                  "active:scale-[0.98]",
                )}
              >
                {flashSale.cta}
                <MaterialIcon name="arrow_forward" className="ml-2 text-[18px]" />
              </Link>
              <p className="text-center text-xs text-white/55 sm:text-left">
                ক্যাশ অন ডেলিভারি · সারাদেশে
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
