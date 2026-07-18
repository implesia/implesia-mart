"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Swiper as SwiperInstance } from "swiper/types";
import { Autoplay, EffectFade, Keyboard } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { cn } from "@/lib/utils";

import { Container } from "../common/container";
import { MaterialIcon } from "../common/material-icon";
import { SITE_NAME, heroSlides } from "../../_data/home/home";

import "swiper/css";
import "swiper/css/effect-fade";

const AUTOPLAY_DELAY = 6000;
const TRANSITION_SPEED = 800;

const ease = [0.22, 1, 0.36, 1] as const;

export function HeroSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const swiperRef = useRef<SwiperInstance | null>(null);
  const active = heroSlides[activeIndex] ?? heroSlides[0];

  return (
    <section
      className="relative overflow-x-hidden border-b border-outline-variant/20"
      aria-roledescription="carousel"
      aria-label="ফিচার্ড গ্যাজেট"
    >
      <div className="pointer-events-none absolute inset-0 bg-surface-container-lowest dark:bg-background" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_0%_0%,rgba(43,192,181,0.14),transparent_55%),radial-gradient(ellipse_90%_70%_at_100%_20%,rgba(245,179,1,0.1),transparent_50%)]" />

      <Container className="relative z-10 px-4 sm:px-6 lg:px-8">
        <div className="grid min-w-0 grid-cols-1 items-center gap-5 py-6 sm:gap-8 sm:py-10 lg:grid-cols-12 lg:gap-8 lg:py-8 xl:gap-10 xl:py-10">
          {/* Copy — top on mobile, left on desktop */}
          <div className="relative z-20 order-1 w-full min-w-0 lg:col-span-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={active.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3, ease }}
                className="w-full min-w-0"
              >
                <div className="mb-2.5 flex min-w-0 items-center gap-2 sm:mb-3 lg:mb-2.5">
                  <span className="h-px w-5 shrink-0 bg-primary sm:w-7" />
                  <p className="truncate text-[11px] font-semibold tracking-[0.18em] text-primary uppercase sm:text-xs sm:tracking-[0.24em]">
                    {SITE_NAME}
                  </p>
                </div>

                <p className="mb-1.5 text-sm font-medium text-on-surface-variant lg:mb-1">
                  {active.eyebrow}
                </p>

                <h1 className="mb-2.5 w-full max-w-full text-[1.5rem] leading-snug font-bold break-words text-on-background hyphens-auto sm:mb-3 sm:text-[2.1rem] sm:leading-[1.15] lg:mb-2.5 lg:max-w-[22ch] lg:text-[2.15rem] xl:text-[2.35rem]">
                  {active.title}
                </h1>

                <p className="mb-3 w-full max-w-full text-sm leading-relaxed break-words text-on-surface-variant sm:mb-4 sm:text-[0.95rem] lg:mb-3.5 lg:max-w-md lg:leading-relaxed">
                  {active.description}
                </p>

                <ul className="mb-3 flex w-full max-w-full flex-wrap gap-1.5 sm:mb-4 lg:mb-3.5">
                  {active.highlights.map((item) => (
                    <li
                      key={item}
                      className="max-w-full rounded-full border border-outline-variant/40 bg-surface-container-lowest/90 px-2.5 py-1 text-[11px] font-medium break-words text-on-surface-variant sm:px-3 sm:text-xs"
                    >
                      {item}
                    </li>
                  ))}
                </ul>

                <div className="mb-4 flex w-full min-w-0 items-center justify-between gap-2 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest/80 px-3.5 py-2.5 sm:mb-5 sm:max-w-sm sm:gap-3 sm:px-4 sm:py-3 lg:mb-4">
                  <div className="min-w-0 flex-1">
                    <p className="mb-0.5 text-[10px] font-semibold tracking-[0.16em] text-outline uppercase">
                      মূল্য
                    </p>
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span className="text-lg font-bold text-primary sm:text-xl lg:text-[1.35rem]">
                        {active.priceLabel}
                      </span>
                      {active.compareAtLabel ? (
                        <span className="text-sm text-outline line-through">
                          {active.compareAtLabel}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  {active.discountLabel ? (
                    <span className="shrink-0 rounded-full bg-warm-gold/15 px-2.5 py-1 text-[11px] font-bold text-[#b07a00] sm:text-xs">
                      {active.discountLabel}
                    </span>
                  ) : null}
                </div>

                <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-2.5">
                  <Link
                    href={active.primaryCta.href}
                    className={cn(
                      "inline-flex w-full items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold tracking-wider text-on-primary uppercase transition-all sm:w-auto sm:px-6 sm:py-3 lg:px-7",
                      "active:scale-[0.98] sm:hover:bg-primary/90",
                    )}
                  >
                    {active.primaryCta.label}
                    <MaterialIcon name="arrow_forward" className="ml-2 text-[18px]" />
                  </Link>

                  <Link
                    href={active.secondaryCta.href}
                    className={cn(
                      "inline-flex w-full items-center justify-center rounded-full border border-outline-variant/50 px-5 py-3 text-sm font-semibold tracking-wider text-on-surface uppercase transition-all sm:w-auto sm:px-6 sm:py-3",
                      "active:scale-[0.98] sm:hover:border-primary/50 sm:hover:text-primary",
                    )}
                  >
                    {active.secondaryCta.label}
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Desktop controls under copy */}
            <div className="mt-5 hidden min-w-0 items-center gap-3 xl:mt-6 xl:gap-4 lg:flex">
              <p className="shrink-0 font-label-md tabular-nums text-outline">
                <span className="text-on-surface">
                  {String(activeIndex + 1).padStart(2, "0")}
                </span>
                <span className="mx-1.5 opacity-40">/</span>
                {String(heroSlides.length).padStart(2, "0")}
              </p>

              <div className="flex items-center gap-2">
                {heroSlides.map((slide, index) => (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => swiperRef.current?.slideToLoop(index)}
                    aria-label={`স্লাইড ${index + 1}`}
                    aria-current={activeIndex === index}
                    className={cn(
                      "relative h-1 overflow-hidden rounded-full transition-all duration-300",
                      activeIndex === index
                        ? "w-12 bg-primary/20"
                        : "w-4 bg-outline-variant/45 hover:bg-outline-variant",
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

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => swiperRef.current?.slidePrev()}
                  aria-label="আগের স্লাইড"
                  className="flex size-9 items-center justify-center rounded-full border border-outline-variant/40 bg-surface-container-lowest/80 text-on-surface transition-all hover:border-primary hover:text-primary active:scale-95"
                >
                  <MaterialIcon name="arrow_back" className="text-[16px]" />
                </button>
                <button
                  type="button"
                  onClick={() => swiperRef.current?.slideNext()}
                  aria-label="পরের স্লাইড"
                  className="flex size-9 items-center justify-center rounded-full border border-outline-variant/40 bg-surface-container-lowest/80 text-on-surface transition-all hover:border-primary hover:text-primary active:scale-95"
                >
                  <MaterialIcon name="arrow_forward" className="text-[16px]" />
                </button>
              </div>
            </div>
          </div>

          {/* Image — bottom on mobile, right on desktop */}
          <div className="relative order-2 w-full min-w-0 lg:col-span-7">
            <div className="hero-swiper-stage relative mx-auto aspect-4/3 w-full sm:max-w-2xl md:max-w-3xl lg:ml-auto lg:aspect-auto lg:h-[360px] lg:max-w-[540px] xl:h-[400px] xl:max-w-[600px]">
              <div className="pointer-events-none absolute inset-[4%] translate-x-1.5 translate-y-1.5 rounded-2xl border border-outline-variant/25 bg-primary/5 sm:rounded-[1.5rem] lg:inset-[3%] lg:translate-x-2 lg:translate-y-2" />
              <div
                className={cn(
                  "pointer-events-none absolute inset-[18%] rounded-full blur-2xl lg:inset-[20%] lg:blur-3xl",
                  active.accent === "sunset"
                    ? "bg-[radial-gradient(circle,rgba(245,179,1,0.28),rgba(43,192,181,0.1)_55%,transparent_72%)]"
                    : "bg-[radial-gradient(circle,rgba(43,192,181,0.26),rgba(13,92,86,0.12)_55%,transparent_72%)]",
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
                    <div className="relative h-full w-full p-1.5 sm:p-2.5 lg:p-1.5">
                      {/* Mobile / small tablet */}
                      <div className="relative h-full w-full overflow-hidden rounded-2xl bg-surface-container-lowest shadow-[0_14px_32px_rgba(0,0,0,0.1)] ring-1 ring-black/5 md:hidden dark:bg-surface-container dark:ring-white/10">
                        <Image
                          src={slide.imageSrc}
                          alt={slide.imageAlt}
                          fill
                          priority={index === 0}
                          sizes="100vw"
                          className={cn(
                            "object-center",
                            slide.accent === "sunset"
                              ? "object-contain p-4"
                              : "object-cover",
                          )}
                        />
                      </div>

                      {/* md+ layouts */}
                      {slide.layout === "dual" ? (
                        <div className="hidden h-full w-full grid-cols-2 gap-2.5 md:grid lg:gap-3">
                          <div className="hero-float relative overflow-hidden rounded-2xl bg-surface-container-lowest shadow-[0_16px_36px_rgba(0,0,0,0.1)] ring-1 ring-black/5 lg:rounded-[1.25rem] dark:bg-surface-container dark:ring-white/10">
                            <Image
                              src={slide.imageSrc}
                              alt={slide.imageAlt}
                              fill
                              sizes="22vw"
                              className="object-cover object-center"
                            />
                          </div>
                          <div className="relative mt-5 overflow-hidden rounded-2xl bg-surface-container-lowest shadow-[0_16px_36px_rgba(0,0,0,0.1)] ring-1 ring-black/5 lg:mt-6 lg:rounded-[1.25rem] dark:bg-surface-container dark:ring-white/10">
                            <Image
                              src={slide.secondaryImageSrc ?? slide.imageSrc}
                              alt={slide.secondaryImageAlt ?? slide.imageAlt}
                              fill
                              sizes="22vw"
                              className="object-cover object-center"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="relative hidden h-full w-full md:block">
                          <div
                            className={cn(
                              "relative h-full w-full overflow-hidden rounded-2xl bg-surface-container-lowest shadow-[0_18px_40px_rgba(0,0,0,0.1)] ring-1 ring-black/5 lg:rounded-[1.35rem] dark:bg-surface-container dark:ring-white/10",
                              slide.accent === "sunset" && "hero-float",
                            )}
                          >
                            <Image
                              src={slide.imageSrc}
                              alt={slide.imageAlt}
                              fill
                              sizes="40vw"
                              className="object-contain object-center p-4 lg:p-5 xl:p-6"
                            />
                          </div>
                          {slide.secondaryImageSrc ? (
                            <div className="absolute right-2 bottom-2 z-3 hidden h-[26%] w-[26%] overflow-hidden rounded-xl shadow-[0_12px_28px_rgba(0,0,0,0.16)] ring-2 ring-surface-container-lowest lg:block xl:right-3 xl:bottom-3 xl:h-[28%] xl:w-[28%] xl:rounded-2xl">
                              <Image
                                src={slide.secondaryImageSrc}
                                alt={slide.secondaryImageAlt ?? slide.imageAlt}
                                fill
                                sizes="140px"
                                className="object-cover"
                              />
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>

            {/* Mobile controls under image */}
            <div className="mt-3 flex w-full min-w-0 items-center justify-between gap-2 sm:mt-5 lg:hidden">
              <p className="shrink-0 text-sm tabular-nums text-outline">
                <span className="font-semibold text-on-surface">
                  {String(activeIndex + 1).padStart(2, "0")}
                </span>
                <span className="mx-1 opacity-40">/</span>
                {String(heroSlides.length).padStart(2, "0")}
              </p>

              <div className="flex items-center gap-1.5">
                {heroSlides.map((slide, index) => (
                  <button
                    key={`m-${slide.id}`}
                    type="button"
                    onClick={() => swiperRef.current?.slideToLoop(index)}
                    aria-label={`স্লাইড ${index + 1}`}
                    aria-current={activeIndex === index}
                    className="relative flex h-10 w-7 items-center justify-center touch-manipulation"
                  >
                    <span
                      className={cn(
                        "block h-1 rounded-full transition-all duration-300",
                        activeIndex === index
                          ? "w-7 bg-primary/25"
                          : "w-2.5 bg-outline-variant/50",
                      )}
                    />
                    {activeIndex === index ? (
                      <span
                        key={`${slide.id}-m-${activeIndex}`}
                        style={{
                          animationDuration: `${AUTOPLAY_DELAY + TRANSITION_SPEED}ms`,
                        }}
                        className="absolute top-1/2 left-1/2 h-1 w-7 -translate-x-1/2 -translate-y-1/2 origin-left rounded-full bg-primary [animation-name:hero-progress] [animation-timing-function:linear] fill-mode-[forwards]"
                      />
                    ) : null}
                  </button>
                ))}
              </div>

              <div className="flex shrink-0 gap-1.5">
                <button
                  type="button"
                  onClick={() => swiperRef.current?.slidePrev()}
                  aria-label="আগের স্লাইড"
                  className="flex size-10 touch-manipulation items-center justify-center rounded-full border border-outline-variant/40 bg-surface-container-lowest text-on-surface active:scale-95"
                >
                  <MaterialIcon name="arrow_back" className="text-[18px]" />
                </button>
                <button
                  type="button"
                  onClick={() => swiperRef.current?.slideNext()}
                  aria-label="পরের স্লাইড"
                  className="flex size-10 touch-manipulation items-center justify-center rounded-full border border-outline-variant/40 bg-surface-container-lowest text-on-surface active:scale-95"
                >
                  <MaterialIcon name="arrow_forward" className="text-[18px]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
