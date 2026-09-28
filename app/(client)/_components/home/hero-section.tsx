"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Swiper as SwiperInstance } from "swiper/types";
import { Autoplay, EffectFade, Keyboard } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { cn } from "@/lib/utils";

import { SITE_NAME, heroSlides, type HeroSlide } from "../../_data/home/home";
import { Container } from "../common/container";
import { MaterialIcon } from "../common/material-icon";

const AUTOPLAY_DELAY = 6500;
const TRANSITION_SPEED = 750;
const ease = [0.22, 1, 0.36, 1] as const;

const accentGlow: Record<HeroSlide["accent"], string> = {
  gold: "bg-[radial-gradient(circle_at_50%_40%,rgba(245,179,1,0.32),rgba(43,192,181,0.1)_45%,transparent_70%)] dark:bg-[radial-gradient(circle_at_50%_40%,rgba(240,193,77,0.22),rgba(61,212,200,0.12)_45%,transparent_70%)]",
  teal: "bg-[radial-gradient(circle_at_50%_40%,rgba(43,192,181,0.34),rgba(6,47,44,0.08)_50%,transparent_72%)] dark:bg-[radial-gradient(circle_at_50%_40%,rgba(61,212,200,0.28),transparent_70%)]",
  rose: "bg-[radial-gradient(circle_at_50%_40%,rgba(232,140,150,0.28),rgba(43,192,181,0.08)_50%,transparent_72%)] dark:bg-[radial-gradient(circle_at_50%_40%,rgba(232,140,150,0.18),rgba(61,212,200,0.1)_50%,transparent_70%)]",
  ink: "bg-[radial-gradient(circle_at_50%_40%,rgba(43,192,181,0.22),rgba(15,40,38,0.12)_50%,transparent_72%)] dark:bg-[radial-gradient(circle_at_50%_40%,rgba(61,212,200,0.2),transparent_70%)]",
};

export function HeroSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const swiperRef = useRef<SwiperInstance | null>(null);
  const active = heroSlides[activeIndex] ?? heroSlides[0];

  return (
    <section
      className="relative overflow-x-hidden"
      aria-roledescription="carousel"
      aria-label="ফিচার্ড প্রোডাক্ট"
    >
      {/* Atmosphere — full-bleed plane */}
      <div className="pointer-events-none absolute inset-0 bg-[#f4f8f7] dark:bg-background" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_0%_0%,rgba(43,192,181,0.16),transparent_55%),radial-gradient(ellipse_70%_60%_at_100%_10%,rgba(245,179,1,0.1),transparent_50%),linear-gradient(180deg,transparent_60%,rgba(247,250,247,0.9)_100%)] dark:bg-[radial-gradient(ellipse_90%_70%_at_0%_-5%,rgba(61,212,200,0.16),transparent_52%),radial-gradient(ellipse_60%_50%_at_100%_0%,rgba(240,193,77,0.07),transparent_48%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 right-0 hidden h-full w-[48%] lg:block"
      >
        <div className="absolute inset-y-8 right-0 w-full rounded-l-[2.5rem] bg-gradient-to-l from-primary/[0.07] to-transparent dark:from-primary/10" />
      </div>

      <Container className="relative z-10 px-4 sm:px-6 lg:px-8">
        <div className="grid min-h-[min(calc(100dvh-6.5rem),760px)] grid-cols-1 items-center gap-8 py-10 sm:gap-10 sm:py-12 sm:min-h-[min(calc(100dvh-8rem),760px)] lg:min-h-[min(calc(100dvh-9.25rem),820px)] lg:grid-cols-12 lg:gap-8 lg:py-14 xl:gap-10 xl:py-16">
          {/* Copy */}
          <div className="relative z-20 order-1 min-w-0 lg:col-span-5 xl:col-span-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={active.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease }}
                className="w-full min-w-0"
              >
                <p className="mb-4 flex items-center gap-2.5 text-[11px] font-semibold tracking-[0.2em] text-primary uppercase sm:mb-5 sm:text-xs">
                  <span className="h-px w-7 bg-warm-gold/90 sm:w-9" aria-hidden />
                  {SITE_NAME}
                </p>

                <p className="mb-2 text-xs font-medium tracking-wide text-on-surface-variant sm:text-sm">
                  {active.eyebrow}
                </p>

                <h1 className="mb-3 max-w-[16ch] text-[1.85rem] leading-[1.15] font-semibold tracking-tight text-on-background sm:mb-4 sm:max-w-[18ch] sm:text-4xl sm:leading-[1.12] lg:text-[2.55rem] xl:text-[2.85rem]">
                  {active.title}
                </h1>

                <p className="mb-5 max-w-md text-sm leading-relaxed text-on-surface-variant sm:mb-6 sm:text-base">
                  {active.description}
                </p>

                {/* Price — typographic, not a card */}
                <div className="mb-6 flex flex-wrap items-end gap-x-3 gap-y-1 sm:mb-7">
                  <span className="text-2xl font-semibold tracking-tight text-primary sm:text-3xl">
                    {active.priceLabel}
                  </span>
                  {active.compareAtLabel ? (
                    <span className="pb-1 text-sm text-outline line-through sm:text-base">
                      {active.compareAtLabel}
                    </span>
                  ) : null}
                  {active.discountLabel ? (
                    <span className="pb-1 text-xs font-semibold text-[#9a6a00] dark:text-warm-gold">
                      {active.discountLabel}
                    </span>
                  ) : null}
                </div>

                <div className="flex w-full flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3">
                  <Link
                    href={active.primaryCta.href}
                    className={cn(
                      "inline-flex h-12 w-full items-center justify-center rounded-full bg-primary px-7 text-sm font-semibold text-on-primary transition-all sm:w-auto",
                      "hover:bg-primary/90 active:scale-[0.98]",
                      "dark:shadow-[0_12px_32px_rgba(61,212,200,0.22)]",
                    )}
                  >
                    {active.primaryCta.label}
                    <MaterialIcon name="arrow_forward" className="ml-2 text-[18px]" />
                  </Link>
                  <Link
                    href={active.secondaryCta.href}
                    className="inline-flex h-12 w-full items-center justify-center rounded-full px-5 text-sm font-semibold text-on-surface transition-colors hover:text-primary sm:w-auto"
                  >
                    {active.secondaryCta.label}
                  </Link>
                </div>

                <p className="mt-5 text-xs text-outline sm:mt-6 sm:text-[13px]">
                  সারাদেশে ক্যাশ অন ডেলিভারি · ৩ দিনের ইজি রিটার্ন
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Desktop controls */}
            <HeroControls
              className="mt-8 hidden lg:flex"
              activeIndex={activeIndex}
              onPrev={() => swiperRef.current?.slidePrev()}
              onNext={() => swiperRef.current?.slideNext()}
              onSelect={(i) => swiperRef.current?.slideToLoop(i)}
            />
          </div>

          {/* Product spotlight */}
          <div className="relative order-2 min-w-0 lg:col-span-7 xl:col-span-7">
            <div className="hero-swiper-stage relative mx-auto aspect-[4/5] w-full max-w-md sm:aspect-[5/4] sm:max-w-xl md:max-w-2xl lg:ml-auto lg:aspect-auto lg:h-[min(560px,70vh)] lg:max-w-none xl:h-[min(620px,72vh)]">
              {/* Soft stage glow */}
              <div
                aria-hidden
                className={cn(
                  "pointer-events-none absolute inset-[12%] rounded-full blur-3xl transition-colors duration-700",
                  accentGlow[active.accent],
                )}
              />

              <Swiper
                modules={[EffectFade, Autoplay, Keyboard]}
                effect="fade"
                fadeEffect={{ crossFade: true }}
                speed={TRANSITION_SPEED}
                loop
                watchOverflow
                keyboard={{ enabled: true }}
                autoplay={{
                  delay: AUTOPLAY_DELAY,
                  disableOnInteraction: false,
                  pauseOnMouseEnter: true,
                }}
                onSwiper={(swiper) => {
                  swiperRef.current = swiper;
                }}
                onSlideChange={(swiper) => {
                  setActiveIndex(swiper.realIndex);
                }}
                className="hero-swiper absolute inset-0 h-full w-full"
              >
                {heroSlides.map((slide, index) => (
                  <SwiperSlide key={slide.id} className="h-full">
                    <div className="relative flex h-full w-full items-center justify-center p-2 sm:p-3 lg:p-4">
                      <div
                        className={cn(
                          "hero-float relative h-full w-full overflow-hidden rounded-[1.35rem] sm:rounded-[1.75rem]",
                          "bg-surface-container-lowest/90 dark:bg-surface-container/90",
                          "ring-1 ring-black/[0.05] dark:ring-primary/15",
                          "shadow-[0_24px_60px_-20px_rgba(6,47,44,0.28)] dark:shadow-[0_28px_64px_-18px_rgba(0,0,0,0.55)]",
                        )}
                      >
                        <div
                          aria-hidden
                          className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_20%,rgba(43,192,181,0.1),transparent_60%)]"
                        />
                        <Image
                          src={slide.imageSrc}
                          alt={slide.imageAlt}
                          fill
                          priority={index === 0}
                          sizes="(max-width: 640px) 90vw, (max-width: 1024px) 60vw, 48vw"
                          className="object-contain object-center p-5 sm:p-8 lg:p-10 xl:p-12"
                        />
                      </div>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>

            {/* Mobile controls */}
            <HeroControls
              className="mt-5 flex lg:hidden"
              activeIndex={activeIndex}
              onPrev={() => swiperRef.current?.slidePrev()}
              onNext={() => swiperRef.current?.slideNext()}
              onSelect={(i) => swiperRef.current?.slideToLoop(i)}
              compact
            />
          </div>
        </div>
      </Container>
    </section>
  );
}

function HeroControls({
  activeIndex,
  onPrev,
  onNext,
  onSelect,
  className,
  compact = false,
}: {
  activeIndex: number;
  onPrev: () => void;
  onNext: () => void;
  onSelect: (index: number) => void;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("min-w-0 items-center justify-between gap-3", className)}>
      <p className="shrink-0 text-sm tabular-nums text-outline">
        <span className="font-semibold text-on-surface">
          {String(activeIndex + 1).padStart(2, "0")}
        </span>
        <span className="mx-1.5 opacity-40">/</span>
        {String(heroSlides.length).padStart(2, "0")}
      </p>

      <div className="flex items-center gap-1.5 sm:gap-2">
        {heroSlides.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => onSelect(index)}
            aria-label={`স্লাইড ${index + 1}`}
            aria-current={activeIndex === index}
            className={cn(
              "relative overflow-hidden rounded-full transition-all duration-300",
              compact ? "h-1" : "h-1.5",
              activeIndex === index
                ? compact
                  ? "w-8 bg-primary/25"
                  : "w-11 bg-primary/20"
                : compact
                  ? "w-2.5 bg-outline-variant/50"
                  : "w-3.5 bg-outline-variant/45 hover:bg-outline-variant",
            )}
          >
            {activeIndex === index ? (
              <span
                key={`${slide.id}-${activeIndex}`}
                style={{
                  animationDuration: `${AUTOPLAY_DELAY + TRANSITION_SPEED}ms`,
                }}
                className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-primary [animation-name:hero-progress] [animation-timing-function:linear] fill-mode-[forwards]"
              />
            ) : null}
          </button>
        ))}
      </div>

      <div className="flex shrink-0 gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={onPrev}
          aria-label="আগের স্লাইড"
          className="flex size-10 touch-manipulation items-center justify-center rounded-full border border-outline-variant/40 bg-surface-container-lowest/90 text-on-surface transition-colors hover:border-primary hover:text-primary active:scale-95 dark:border-white/10 dark:bg-surface-container"
        >
          <MaterialIcon name="arrow_back" className="text-[16px]" />
        </button>
        <button
          type="button"
          onClick={onNext}
          aria-label="পরের স্লাইড"
          className="flex size-10 touch-manipulation items-center justify-center rounded-full border border-outline-variant/40 bg-surface-container-lowest/90 text-on-surface transition-colors hover:border-primary hover:text-primary active:scale-95 dark:border-white/10 dark:bg-surface-container"
        >
          <MaterialIcon name="arrow_forward" className="text-[16px]" />
        </button>
      </div>
    </div>
  );
}
