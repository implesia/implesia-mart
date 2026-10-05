"use client";

import "swiper/css";
import "../carousels/swiper-storefront.css";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import type { Swiper as SwiperInstance } from "swiper/types";
import { Autoplay, Keyboard } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import type { CategorySection } from "@/lib/mart-api/categories";
import { isContentActive } from "@/lib/mart-mock/visibility";
import { cn } from "@/lib/utils";

import type { HeroSlide } from "../../_data/home/home";
import { Container } from "../common/container";
import { CategoryRail } from "./categories-strip-section";

const AUTOPLAY_DELAY = 5500;

const bannerTone: Record<HeroSlide["accent"], string> = {
  gold: "bg-[linear-gradient(100deg,#1c1408_0%,#0c0d12_42%,#05060a_100%)]",
  teal: "bg-[linear-gradient(100deg,#071820_0%,#070c14_46%,#05060a_100%)]",
  rose: "bg-[linear-gradient(100deg,#1a0c14_0%,#0c0a10_46%,#05060a_100%)]",
  ink: "bg-[linear-gradient(100deg,#071018_0%,#07090f_46%,#05060a_100%)]",
};

export function HeroSection({
  slides,
  categories,
}: {
  slides: HeroSlide[];
  categories: CategorySection;
}) {
  const openCategories = {
    ...categories,
    tiles: categories.tiles.filter(isContentActive),
  };
  if (slides.length === 0 && openCategories.tiles.length === 0) return null;

  return (
    <section
      className="bg-[#f5f6f8] pt-3 pb-4 sm:pt-4 dark:bg-background"
      aria-label="ফিচার্ড প্রোডাক্ট"
    >
      <Container className="px-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            "grid items-stretch gap-3 lg:gap-4",
            openCategories.tiles.length > 0 && "lg:grid-cols-[18rem_minmax(0,1fr)]",
          )}
        >
          <CategoryRail section={openCategories} />
          <div className="min-w-0">
            {slides.length > 0 ? (
              <HeroCarousel slides={slides} />
            ) : (
              <FallbackHero />
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}

function FallbackHero() {
  return (
    <div className="flex h-full min-h-56 flex-col justify-center rounded-3xl bg-[#071820] px-5 py-8 text-white sm:px-8 sm:py-10 lg:min-h-[23rem]">
      <p className="text-xs font-semibold tracking-[0.16em] text-[#8ed4c1] uppercase">
        Implesia Mart
      </p>
      <h1 className="mt-2 max-w-xl text-2xl font-semibold tracking-tight sm:text-3xl">
        ট্রেন্ডিং গ্যাজেট ও হাতে তৈরি ড্রেস
      </h1>
      <p className="mt-2 max-w-lg text-sm leading-relaxed text-white/75">
        ক্যাশ অন ডেলিভারি। দাম ও স্টক চেকআউটে নিশ্চিত হয়।
      </p>
      <Link
        href="/products"
        className="mt-5 inline-flex h-11 w-fit items-center justify-center rounded-full bg-[#2bc0b5] px-5 text-sm font-semibold text-[#042422]"
      >
        সব প্রোডাক্ট
      </Link>
    </div>
  );
}

function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const swiperRef = useRef<SwiperInstance | null>(null);
  const loop = slides.length > 1;

  return (
        <div className="relative min-w-0 h-full">
          <Swiper
            key={slides.map((slide) => slide.id).join("|")}
            modules={[Autoplay, Keyboard]}
            speed={700}
            loop={loop}
            watchOverflow
            observer
            observeParents
            keyboard={{ enabled: true }}
            spaceBetween={0}
            slidesPerView={1}
            slidesPerGroup={1}
            autoplay={{
              delay: AUTOPLAY_DELAY,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
              const fit = () => {
                swiper.update();
                if (loop) swiper.slideToLoop(swiper.realIndex, 0, false);
              };
              requestAnimationFrame(fit);
            }}
            onSlideChange={(swiper) => {
              setActiveIndex(swiper.realIndex);
            }}
            className="banner-swiper h-[268px] overflow-hidden rounded-3xl shadow-[0_12px_40px_rgba(7,24,32,0.12)] ring-1 ring-black/5 sm:h-[320px] lg:h-[23rem]"
          >
            {slides.map((slide, index) => (
              <SwiperSlide key={slide.id}>
                <article
                  className={cn(
                    "relative h-full overflow-hidden",
                    bannerTone[slide.accent],
                  )}
                >
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 right-0 w-[58%] bg-[radial-gradient(circle_at_60%_50%,rgba(43,192,181,0.22),transparent_62%)]"
                  />
                  <div className="relative grid h-full grid-cols-[minmax(0,1.45fr)_minmax(0,0.7fr)] items-center sm:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                    <div className="min-w-0 px-4 pt-5 pb-10 sm:px-8 sm:pt-7 sm:pb-10 lg:px-10">
                      <p className="mb-3 inline-flex max-w-full items-center rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium tracking-wide text-[#b7efe8] ring-1 ring-white/15 sm:text-xs">
                        {slide.eyebrow}
                      </p>
                      {index === activeIndex ? (
                        <h1 className="text-[1.2rem] leading-[1.2] font-bold tracking-tight text-white min-[380px]:text-[1.35rem] sm:max-w-[16ch] sm:text-3xl lg:text-[2rem] xl:text-[2.15rem]">
                          {slide.title}
                        </h1>
                      ) : (
                        <p className="text-[1.2rem] leading-[1.2] font-bold tracking-tight text-white min-[380px]:text-[1.35rem] sm:max-w-[16ch] sm:text-3xl lg:text-[2rem] xl:text-[2.15rem]">
                          {slide.title}
                        </p>
                      )}
                      <p className="mt-2 hidden max-w-[34ch] text-sm leading-relaxed text-white/70 sm:line-clamp-2 sm:block">
                        {slide.description}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 sm:mt-4">
                        <Link
                          href={slide.primaryCta.href}
                          className="inline-flex h-9 shrink-0 items-center whitespace-nowrap rounded-full bg-primary px-3.5 text-[13px] font-semibold text-on-primary transition-colors hover:bg-primary/80 sm:h-10 sm:px-5 sm:text-sm"
                        >
                          {slide.primaryCta.label}
                        </Link>
                        {slide.priceLabel ? (
                          <span className="whitespace-nowrap text-sm font-semibold text-white/90 sm:text-base">
                            {slide.priceLabel}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex h-full min-w-0 items-center justify-center px-2 sm:px-5 lg:pr-8">
                      <div className="relative aspect-[4/5] h-[72%] max-h-72 w-full max-w-[13.5rem] overflow-hidden rounded-[1.6rem] bg-[#f6f7f8] shadow-[0_18px_44px_rgba(0,0,0,0.32)] ring-1 ring-white/25 sm:h-[78%] sm:max-w-[15rem]">
                        <Image
                          src={slide.imageSrc}
                          alt={slide.imageAlt}
                          fill
                          priority={index === 0}
                          sizes="(max-width: 640px) 42vw, 240px"
                          className="object-contain p-2"
                        />
                      </div>
                    </div>
                  </div>
                </article>
              </SwiperSlide>
            ))}
          </Swiper>

          <div className="pointer-events-auto absolute bottom-3 left-3.5 z-10 flex items-center gap-1.5 sm:left-7 lg:left-8">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                aria-label={`স্লাইড ${index + 1}`}
                aria-current={activeIndex === index ? "true" : undefined}
                onClick={() =>
                  loop
                    ? swiperRef.current?.slideToLoop(index)
                    : swiperRef.current?.slideTo(index)
                }
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  activeIndex === index
                    ? "w-5 bg-white"
                    : "w-1.5 bg-white/45 hover:bg-white/70",
                )}
              />
            ))}
          </div>
        </div>
  );
}
