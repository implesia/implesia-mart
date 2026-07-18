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

const fadeUp = {
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -14 },
};

export function HeroSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const swiperRef = useRef<SwiperInstance | null>(null);
  const active = heroSlides[activeIndex] ?? heroSlides[0];

  return (
    <section
      className="relative overflow-hidden border-b border-outline-variant/20"
      aria-roledescription="carousel"
      aria-label="ফিচার্ড গ্যাজেট"
    >
      {/* Layered atmosphere */}
      <div className="pointer-events-none absolute inset-0 bg-surface-container-lowest dark:bg-background" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_0%_0%,rgba(43,192,181,0.14),transparent_55%),radial-gradient(ellipse_90%_70%_at_100%_20%,rgba(245,179,1,0.1),transparent_50%)]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035] dark:opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }}
      />

      {/* Giant slide index watermark */}
      <AnimatePresence mode="wait">
        <motion.span
          key={active.id}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.6, ease }}
          aria-hidden
          className="pointer-events-none absolute top-4 right-2 z-0 hidden select-none text-[8rem] leading-none font-bold text-on-surface/[0.035] tabular-nums sm:block sm:text-[9rem] lg:right-8 lg:text-[11rem]"
        >
          {String(activeIndex + 1).padStart(2, "0")}
        </motion.span>
      </AnimatePresence>

      <Container className="relative z-10 px-5 sm:px-8">
        <div className="grid items-center gap-10 py-10 sm:py-12 lg:grid-cols-12 lg:gap-12 lg:py-14">
          {/* Copy */}
          <div className="relative z-20 flex flex-col justify-center lg:col-span-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={active.id}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.45, ease }}
              >
                <motion.div
                  variants={fadeUp}
                  transition={{ duration: 0.45, ease, delay: 0.02 }}
                  className="mb-5 flex items-center gap-3"
                >
                  <span className="h-px w-8 bg-primary" />
                  <p className="font-label-md tracking-[0.28em] text-primary uppercase">
                    {SITE_NAME}
                  </p>
                </motion.div>

                <motion.p
                  variants={fadeUp}
                  transition={{ duration: 0.45, ease, delay: 0.06 }}
                  className="mb-3 text-sm font-medium tracking-wide text-on-surface-variant"
                >
                  {active.eyebrow}
                </motion.p>

                <motion.h1
                  variants={fadeUp}
                  transition={{ duration: 0.5, ease, delay: 0.1 }}
                  className="mb-5 max-w-lg text-[2rem] leading-[1.12] font-bold tracking-tight text-on-background sm:text-[2.6rem] lg:text-[2.85rem]"
                >
                  {active.title}
                </motion.h1>

                <motion.p
                  variants={fadeUp}
                  transition={{ duration: 0.45, ease, delay: 0.16 }}
                  className="mb-6 max-w-md font-body-md leading-relaxed text-on-surface-variant"
                >
                  {active.description}
                </motion.p>

                <motion.ul
                  variants={fadeUp}
                  transition={{ duration: 0.45, ease, delay: 0.2 }}
                  className="mb-7 flex flex-wrap gap-2"
                >
                  {active.highlights.map((item) => (
                    <li
                      key={item}
                      className="rounded-full border border-outline-variant/40 bg-surface-container-lowest/80 px-3.5 py-1.5 text-xs font-medium tracking-wide text-on-surface-variant backdrop-blur-sm"
                    >
                      {item}
                    </li>
                  ))}
                </motion.ul>

                <motion.div
                  variants={fadeUp}
                  transition={{ duration: 0.45, ease, delay: 0.24 }}
                  className="mb-8 inline-flex items-center gap-4 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest/70 px-5 py-3.5 shadow-[0_10px_40px_rgba(0,0,0,0.04)] backdrop-blur-md"
                >
                  <div>
                    <p className="mb-0.5 text-[10px] font-semibold tracking-[0.18em] text-outline uppercase">
                      মূল্য
                    </p>
                    <div className="flex items-baseline gap-2.5">
                      <span className="text-2xl font-bold text-primary sm:text-[1.75rem]">
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
                    <>
                      <span className="h-10 w-px bg-outline-variant/40" />
                      <span className="rounded-full bg-warm-gold/15 px-3 py-1 text-xs font-bold tracking-wide text-[#b07a00]">
                        {active.discountLabel}
                      </span>
                    </>
                  ) : null}
                </motion.div>

                <motion.div
                  variants={fadeUp}
                  transition={{ duration: 0.45, ease, delay: 0.28 }}
                  className="flex flex-wrap items-center gap-3"
                >
                  <Link
                    href={active.primaryCta.href}
                    className={cn(
                      "group inline-flex items-center justify-center rounded-full bg-primary px-8 py-3.5 font-label-md tracking-wider text-on-primary uppercase transition-all duration-300",
                      "hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-[0_14px_34px_rgba(43,192,181,0.35)] active:scale-[0.98]",
                    )}
                  >
                    {active.primaryCta.label}
                    <MaterialIcon
                      name="arrow_forward"
                      className="ml-2 text-[18px] transition-transform duration-300 group-hover:translate-x-0.5"
                    />
                  </Link>

                  <Link
                    href={active.secondaryCta.href}
                    className={cn(
                      "inline-flex items-center justify-center rounded-full border border-outline-variant/50 bg-transparent px-7 py-3.5 font-label-md tracking-wider text-on-surface uppercase transition-all duration-300",
                      "hover:border-primary/50 hover:bg-primary/5 hover:text-primary active:scale-[0.98]",
                    )}
                  >
                    {active.secondaryCta.label}
                  </Link>
                </motion.div>
              </motion.div>
            </AnimatePresence>

            {/* Controls */}
            <div className="mt-11 flex items-center gap-6">
              <p className="font-label-md tabular-nums text-outline">
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
                        className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-primary [animation-name:hero-progress] [animation-timing-function:linear] [animation-fill-mode:forwards]"
                      />
                    ) : null}
                  </button>
                ))}
              </div>

              <div className="ml-auto flex gap-2 sm:ml-0">
                <button
                  type="button"
                  onClick={() => swiperRef.current?.slidePrev()}
                  aria-label="আগের স্লাইড"
                  className="flex size-10 items-center justify-center rounded-full border border-outline-variant/40 bg-surface-container-lowest/80 text-on-surface backdrop-blur transition-all hover:border-primary hover:text-primary active:scale-95"
                >
                  <MaterialIcon name="arrow_back" className="text-[18px]" />
                </button>
                <button
                  type="button"
                  onClick={() => swiperRef.current?.slideNext()}
                  aria-label="পরের স্লাইড"
                  className="flex size-10 items-center justify-center rounded-full border border-outline-variant/40 bg-surface-container-lowest/80 text-on-surface backdrop-blur transition-all hover:border-primary hover:text-primary active:scale-95"
                >
                  <MaterialIcon name="arrow_forward" className="text-[18px]" />
                </button>
              </div>
            </div>
          </div>

          {/* Visual stage */}
          <div className="relative lg:col-span-7">
            <Swiper
              modules={[EffectFade, Autoplay, Keyboard]}
              effect="fade"
              fadeEffect={{ crossFade: true }}
              speed={TRANSITION_SPEED}
              loop
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
              className="w-full"
            >
              {heroSlides.map((slide, index) => (
                <SwiperSlide key={slide.id}>
                  <div className="relative mx-auto aspect-4/3 w-full max-w-3xl lg:aspect-5/4 lg:max-w-none">
                    {/* Offset architectural frame */}
                    <div
                      className={cn(
                        "absolute inset-[6%] translate-x-3 translate-y-3 rounded-[2rem] border border-outline-variant/25",
                        slide.accent === "sunset" ? "bg-primary/5" : "bg-primary/8",
                      )}
                    />

                    {/* Ambient glow */}
                    <div
                      className={cn(
                        "pointer-events-none absolute inset-[12%] rounded-full blur-3xl",
                        slide.accent === "sunset"
                          ? "bg-[radial-gradient(circle,rgba(245,179,1,0.32),rgba(43,192,181,0.1)_55%,transparent_72%)]"
                          : "bg-[radial-gradient(circle,rgba(43,192,181,0.3),rgba(13,92,86,0.12)_55%,transparent_72%)]",
                      )}
                    />

                    {slide.layout === "dual" ? (
                      /* Two selfie stands side-by-side */
                      <div className="absolute inset-[4%] z-2 grid grid-cols-2 gap-3 sm:gap-4">
                        <motion.div
                          initial={{ opacity: 0, x: -18, y: 16 }}
                          animate={{ opacity: 1, x: 0, y: 0 }}
                          transition={{ duration: 0.7, ease }}
                          className="hero-float relative overflow-hidden rounded-[1.25rem] bg-surface-container-lowest shadow-[0_24px_60px_rgba(0,0,0,0.12)] ring-1 ring-black/5 sm:rounded-[1.5rem] dark:bg-surface-container dark:ring-white/10"
                        >
                          <Image
                            src={slide.imageSrc}
                            alt={slide.imageAlt}
                            fill
                            priority={index === 0}
                            sizes="(max-width: 1024px) 45vw, 28vw"
                            className="object-cover object-center"
                          />
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, x: 18, y: 16 }}
                          animate={{ opacity: 1, x: 0, y: 0 }}
                          transition={{ duration: 0.7, ease, delay: 0.1 }}
                          className="relative mt-6 overflow-hidden rounded-[1.25rem] bg-surface-container-lowest shadow-[0_24px_60px_rgba(0,0,0,0.12)] ring-1 ring-black/5 sm:mt-10 sm:rounded-[1.5rem] dark:bg-surface-container dark:ring-white/10"
                        >
                          <Image
                            src={slide.secondaryImageSrc ?? slide.imageSrc}
                            alt={slide.secondaryImageAlt ?? slide.imageAlt}
                            fill
                            sizes="(max-width: 1024px) 45vw, 28vw"
                            className="object-cover object-center"
                          />
                        </motion.div>
                      </div>
                    ) : (
                      <>
                        {/* Main image panel */}
                        <motion.div
                          initial={{ opacity: 0, scale: 0.96, y: 18 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          transition={{ duration: 0.75, ease }}
                          className={cn(
                            "absolute inset-[4%] z-2 overflow-hidden rounded-[1.75rem] bg-surface-container-lowest shadow-[0_30px_80px_rgba(0,0,0,0.12)] ring-1 ring-black/5 dark:bg-surface-container dark:ring-white/10",
                            slide.accent === "sunset" && "hero-float",
                          )}
                        >
                          <Image
                            src={slide.imageSrc}
                            alt={slide.imageAlt}
                            fill
                            priority={index === 0}
                            sizes="(max-width: 1024px) 100vw, 55vw"
                            className="object-contain object-center p-6 sm:p-8"
                          />
                        </motion.div>

                        {/* Secondary inset */}
                        {slide.secondaryImageSrc ? (
                          <motion.div
                            initial={{ opacity: 0, y: 24, scale: 0.92 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.7, ease, delay: 0.18 }}
                            className="absolute bottom-[2%] left-[2%] z-3 hidden h-[34%] w-[34%] overflow-hidden rounded-2xl shadow-[0_18px_40px_rgba(0,0,0,0.18)] ring-2 ring-surface-container-lowest sm:block"
                          >
                            <Image
                              src={slide.secondaryImageSrc}
                              alt={slide.secondaryImageAlt ?? slide.imageAlt}
                              fill
                              sizes="180px"
                              className="object-cover"
                            />
                          </motion.div>
                        ) : null}
                      </>
                    )}
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      </Container>
    </section>
  );
}
