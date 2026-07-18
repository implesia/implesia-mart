"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import type { Swiper as SwiperInstance } from "swiper/types";
import { Autoplay, EffectFade, Keyboard } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { cn } from "@/lib/utils";

import { Container } from "../common/container";
import { MaterialIcon } from "../common/material-icon";
import { heroSlides } from "../../_data/home/home";

import "swiper/css";
import "swiper/css/effect-fade";

const AUTOPLAY_DELAY = 6000;
const TRANSITION_SPEED = 1000;

const ENTER_BASE =
  "[.swiper-slide-active_&]:animate-in [.swiper-slide-active_&]:fade-in-0 [.swiper-slide-active_&]:slide-in-from-bottom-6 [.swiper-slide-active_&]:fill-mode-forwards [.swiper-slide-active_&]:ease-out";

export function HeroSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const swiperRef = useRef<SwiperInstance | null>(null);

  const goToSlide = (index: number) => {
    swiperRef.current?.slideToLoop(index);
  };

  return (
    <section
      className="group relative h-[870px] overflow-hidden bg-primary"
      aria-roledescription="carousel"
      aria-label="Featured collections"
    >
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
        className="h-full w-full"
      >
        {heroSlides.map((slide, index) => (
          <SwiperSlide
            key={slide.id}
            className="relative"
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${heroSlides.length}`}
          >
            <div className="absolute inset-0 overflow-hidden">
              <div className="hero-slide-active-zoom relative h-full w-full">
                <Image
                  src={slide.imageSrc}
                  alt={slide.imageAlt}
                  fill
                  priority={index === 0}
                  sizes="100vw"
                  className="object-cover"
                />
              </div>
              <div className="absolute inset-0 bg-linear-to-r from-black/65 via-black/25 to-transparent" />
              <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent" />
            </div>

            <Container className="relative z-10 flex h-full items-center">
              <div className="max-w-2xl">
                <span
                  className={cn(
                    "mb-6 inline-block rounded-full bg-warm-gold px-4 py-1 font-label-md text-white uppercase tracking-widest",
                    ENTER_BASE,
                    "[.swiper-slide-active_&]:duration-700",
                  )}
                >
                  {slide.badge}
                </span>

                <h1
                  className={cn(
                    "mb-6 font-display-xl text-white",
                    ENTER_BASE,
                    "[.swiper-slide-active_&]:duration-700 [.swiper-slide-active_&]:delay-100",
                  )}
                >
                  {slide.titleLines[0]}
                  <br />
                  {slide.titleLines[1]}
                </h1>

                <p
                  className={cn(
                    "mb-10 max-w-lg font-body-lg text-white/90",
                    ENTER_BASE,
                    "[.swiper-slide-active_&]:duration-700 [.swiper-slide-active_&]:delay-200",
                  )}
                >
                  {slide.description}
                </p>

                <div
                  className={cn(
                    "flex flex-wrap gap-4",
                    ENTER_BASE,
                    "[.swiper-slide-active_&]:duration-700 [.swiper-slide-active_&]:delay-300",
                  )}
                >
                  <Link
                    href={slide.primaryCta.href}
                    className={cn(
                      "inline-flex items-center justify-center rounded-lg bg-warm-gold px-10 py-5 font-label-md text-on-surface uppercase tracking-wider shadow-lg transition-all duration-300",
                      "hover:-translate-y-1 hover:bg-warm-gold/90 hover:shadow-xl active:scale-95",
                    )}
                  >
                    {slide.primaryCta.label}
                  </Link>

                  <Link
                    href={slide.secondaryCta.href}
                    className={cn(
                      "inline-flex items-center justify-center rounded-lg border border-white/30 bg-white/10 px-10 py-5 font-label-md text-white uppercase tracking-wider backdrop-blur-md transition-all duration-300",
                      "hover:bg-white hover:text-primary active:scale-95",
                    )}
                  >
                    {slide.secondaryCta.label}
                  </Link>
                </div>
              </div>
            </Container>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Controls */}
      <div className="absolute inset-x-0 bottom-10 z-20">
        <Container className="flex items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            {heroSlides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => goToSlide(index)}
                aria-label={`Go to slide ${index + 1}: ${slide.badge}`}
                aria-current={activeIndex === index}
                className="relative h-1 w-10 overflow-hidden rounded-full bg-white/25 transition-colors duration-300 hover:bg-white/40 sm:w-14"
              >
                {activeIndex === index && (
                  <span
                    key={`${slide.id}-${activeIndex}`}
                    style={{
                      animationDuration: `${AUTOPLAY_DELAY + TRANSITION_SPEED}ms`,
                    }}
                    className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-warm-gold [animation-name:hero-progress] [animation-timing-function:linear] [animation-fill-mode:forwards] group-hover:[animation-play-state:paused]"
                  />
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden font-label-md text-white/70 tabular-nums sm:inline">
              {String(activeIndex + 1).padStart(2, "0")} /{" "}
              {String(heroSlides.length).padStart(2, "0")}
            </span>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => swiperRef.current?.slidePrev()}
                aria-label="Previous slide"
                className="flex size-12 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white backdrop-blur-md transition-all duration-300 hover:bg-white hover:text-primary active:scale-95"
              >
                <MaterialIcon name="arrow_back" />
              </button>

              <button
                type="button"
                onClick={() => swiperRef.current?.slideNext()}
                aria-label="Next slide"
                className="flex size-12 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white backdrop-blur-md transition-all duration-300 hover:bg-white hover:text-primary active:scale-95"
              >
                <MaterialIcon name="arrow_forward" />
              </button>
            </div>
          </div>
        </Container>
      </div>
    </section>
  );
}
