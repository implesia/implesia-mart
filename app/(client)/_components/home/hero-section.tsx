"use client";

import "swiper/css";
import "swiper/css/effect-fade";
import "../carousels/swiper-storefront.css";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import type { Swiper as SwiperInstance } from "swiper/types";
import { Autoplay, EffectFade, Keyboard } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import type { CategorySection } from "@/lib/mart-api/categories";
import { DEFAULT_HERO_SETTINGS, type HeroCarouselSettings } from "@/lib/mart-api/hero";
import { isContentActive } from "@/lib/mart-mock/visibility";
import { cn } from "@/lib/utils";

import type { HeroSlide } from "../../_data/home/home";
import { Container } from "../common/container";
import { CategoryRail } from "./categories-strip-section";


const bannerTone: Record<HeroSlide["accent"], string> = {
  gold: "bg-[linear-gradient(100deg,#1c1408_0%,#0c0d12_42%,#05060a_100%)]",
  teal: "bg-[linear-gradient(100deg,#071820_0%,#070c14_46%,#05060a_100%)]",
  rose: "bg-[linear-gradient(100deg,#1a0c14_0%,#0c0a10_46%,#05060a_100%)]",
  ink: "bg-[linear-gradient(100deg,#071018_0%,#07090f_46%,#05060a_100%)]",
};

export function HeroSection({
  slides,
  categories,
  settings = DEFAULT_HERO_SETTINGS,
}: {
  slides: HeroSlide[];
  categories: CategorySection;
  settings?: HeroCarouselSettings;
}) {
  const openCategories = {
    ...categories,
    tiles: categories.tiles.filter(isContentActive),
  };
  if (slides.length === 0 && openCategories.tiles.length === 0) return null;

  return (
    <section
      className="bg-[#f5f6f8] pt-3 pb-4 sm:pt-4 dark:bg-background"
      aria-label={settings.ariaLabel}
    >
      <Container className="px-4 sm:px-6 lg:px-8">
        {/* The page's one h1 comes first so the category rail (h2) and slide titles (h2) follow it. */}
        <h1 className="sr-only">
          {settings.brandName} — ট্রেন্ডিং গ্যাজেট ও হাতে তৈরি ড্রেস
        </h1>
        <div
          className={cn(
            // minmax(0,1fr): an implicit track would grow to the category rail's min-content width
            // and push the page 2px wider than a 360px screen (IM-QA-010).
            "grid grid-cols-[minmax(0,1fr)] items-stretch gap-3 lg:gap-4",
            openCategories.tiles.length > 0 && "lg:grid-cols-[18rem_minmax(0,1fr)]",
          )}
        >
          <CategoryRail section={openCategories} />
          <div className="flex min-w-0 flex-col">
            {slides.length > 0 ? (
              <HeroCarousel slides={slides} settings={settings} />
            ) : (
              <FallbackHero brandName={settings.brandName} trustLine={settings.trustLine} />
            )}
            {slides.length > 0 && settings.trustLine ? (
              <p className="mt-2 flex min-w-0 flex-wrap items-center gap-x-2 px-1 text-xs text-neutral-700 sm:text-sm dark:text-neutral-300">
                <span className="font-semibold text-neutral-950 dark:text-white">{settings.brandName}</span>
                <span aria-hidden>·</span>
                <span className="min-w-0">{settings.trustLine}</span>
              </p>
            ) : null}
          </div>
        </div>
      </Container>
    </section>
  );
}

function FallbackHero({ brandName, trustLine }: { brandName: string; trustLine: string }) {
  return (
    <div className="flex h-full min-h-56 flex-col justify-center rounded-3xl bg-[#071820] px-5 py-8 text-white sm:px-8 sm:py-10 lg:min-h-[23rem]">
      <p className="text-xs font-semibold tracking-[0.16em] text-[#8ed4c1] uppercase">
        {brandName}
      </p>
      <h2 className="mt-2 max-w-xl text-2xl font-semibold tracking-tight sm:text-3xl">
        ট্রেন্ডিং গ্যাজেট ও হাতে তৈরি ড্রেস
      </h2>
      <p className="mt-2 max-w-lg text-sm leading-relaxed text-white/75">
        {trustLine}
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

function HeroCarousel({
  slides,
  settings,
}: {
  slides: HeroSlide[];
  settings: HeroCarouselSettings;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const swiperRef = useRef<SwiperInstance | null>(null);
  const loop = settings.loop && slides.length > 1;

  return (
        <div className="relative min-w-0">
          <Swiper
            key={slides.map((slide) => slide.id).join("|")}
            modules={[Autoplay, EffectFade, Keyboard]}
            effect={settings.crossFade ? "fade" : "slide"}
            fadeEffect={{ crossFade: true }}
            speed={settings.transitionSpeedMs}
            loop={loop}
            watchOverflow
            observer
            observeParents
            keyboard={{ enabled: settings.keyboardEnabled }}
            spaceBetween={0}
            slidesPerView={1}
            slidesPerGroup={1}
            autoplay={{
              delay: settings.autoplayDelayMs,
              disableOnInteraction: settings.disableOnInteraction,
              pauseOnMouseEnter: settings.pauseOnHover,
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
            className="banner-swiper h-[28.5rem] overflow-hidden rounded-2xl shadow-[0_12px_40px_rgba(7,24,32,0.12)] ring-1 ring-black/5 min-[400px]:h-[30rem] sm:h-[340px] sm:rounded-3xl lg:h-[24rem]"
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
                  {/* Phones: image on top (full image, larger), copy below. sm+: copy left, image right. */}
                  <div className="relative flex h-full flex-col sm:grid sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:items-center xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
                    {/* hero-copy: outgoing slide's copy is hidden instantly during the cross-fade (see
                        swiper-storefront.css) so two titles never ghost over each other. */}
                    <div className="hero-copy order-2 flex min-w-0 flex-1 flex-col px-4 pt-3 pb-16 sm:order-none sm:block sm:flex-none sm:px-8 sm:pt-7 sm:pb-10 lg:px-10">
                      <p className="mb-2 inline-flex w-fit max-w-full items-center truncate rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium sm:mb-3 tracking-wide text-[#b7efe8] ring-1 ring-white/15 sm:text-xs">
                        {slide.eyebrow}
                      </p>
                      {index === activeIndex ? (
                        <h2 className="line-clamp-2 text-[1.3rem] leading-[1.3] font-bold tracking-tight text-white min-[400px]:text-[1.45rem] sm:line-clamp-3 sm:max-w-[16ch] sm:leading-[1.2] sm:text-3xl lg:text-[2rem] xl:text-[2.15rem]">
                          {slide.title}
                        </h2>
                      ) : (
                        <p className="line-clamp-2 text-[1.3rem] leading-[1.3] font-bold tracking-tight text-white min-[400px]:text-[1.45rem] sm:line-clamp-3 sm:max-w-[16ch] sm:leading-[1.2] sm:text-3xl lg:text-[2rem] xl:text-[2.15rem]">
                          {slide.title}
                        </p>
                      )}
                      <p className="mt-2 hidden max-w-[34ch] text-sm leading-relaxed text-white/70 sm:line-clamp-2 sm:block">
                        {slide.description}
                      </p>
                      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-3 sm:mt-4 sm:pt-0">
                        <Link
                          href={slide.primaryCta.href}
                          className="inline-flex h-11 shrink-0 items-center whitespace-nowrap rounded-full bg-primary px-5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                        >
                          {slide.primaryCta.label}
                        </Link>
                        {slide.priceLabel ? (
                          <span className="whitespace-nowrap text-base font-semibold text-white/90">
                            {slide.priceLabel}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    {/* Image column: wide frame that fills the column; object-contain keeps the whole
                        CMS image visible for any aspect ratio, a blurred copy fills the letterbox. Bottom
                        padding reserves room for the arrows so they never sit on the image. */}
                    <div className="order-1 flex h-[52%] min-w-0 shrink-0 items-stretch px-3 pt-3 sm:order-none sm:h-full sm:py-5 sm:pr-5 sm:pb-14 sm:pl-2 lg:pr-6">
                      <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white/95 shadow-[0_18px_44px_rgba(0,0,0,0.32)] ring-1 ring-white/20 sm:rounded-[1.4rem]">
                        <Image
                          src={slide.imageSrc}
                          alt=""
                          aria-hidden
                          fill
                          sizes="(max-width: 640px) 92vw, (max-width: 1024px) 45vw, 480px"
                          className="scale-110 object-cover opacity-40 blur-2xl"
                        />
                        <Image
                          src={slide.imageSrc}
                          alt={slide.imageAlt}
                          fill
                          priority={index === 0}
                          sizes="(max-width: 640px) 92vw, (max-width: 1024px) 45vw, 480px"
                          className="object-contain p-2 sm:p-3"
                        />
                      </div>
                    </div>
                  </div>
                </article>
              </SwiperSlide>
            ))}
          </Swiper>

          {slides.length > 1 ? (
            <div className="absolute right-3 bottom-3 z-10 flex items-center gap-2 sm:right-5 sm:bottom-2.5 sm:gap-1.5">
              <button
                type="button"
                aria-label={settings.previousLabel}
                title={settings.previousLabel}
                onClick={() => swiperRef.current?.slidePrev()}
                className="grid size-11 place-items-center rounded-full bg-black/45 text-white ring-1 ring-white/25 transition-colors hover:bg-black/65 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <span aria-hidden className="text-lg leading-none">‹</span>
              </button>
              <button
                type="button"
                aria-label={settings.nextLabel}
                title={settings.nextLabel}
                onClick={() => swiperRef.current?.slideNext()}
                className="grid size-11 place-items-center rounded-full bg-black/45 text-white ring-1 ring-white/25 transition-colors hover:bg-black/65 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <span aria-hidden className="text-lg leading-none">›</span>
              </button>
            </div>
          ) : null}

          <div className="pointer-events-auto absolute bottom-[0.875rem] left-2 z-10 flex items-center sm:bottom-2 sm:left-5 lg:left-6">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                aria-label={`${settings.slideLabel} ${index + 1}`}
                aria-current={activeIndex === index ? "true" : undefined}
                onClick={() =>
                  loop
                    ? swiperRef.current?.slideToLoop(index)
                    : swiperRef.current?.slideTo(index)
                }
                className="group grid h-10 min-w-6 place-items-center rounded-full px-1 focus-visible:outline-2 focus-visible:outline-white"
              >
                <span
                  aria-hidden
                  className={cn(
                    "block h-1.5 rounded-full transition-all",
                    activeIndex === index
                      ? "w-5 bg-white"
                      : "w-1.5 bg-white/45 group-hover:bg-white/70",
                  )}
                />
              </button>
            ))}
          </div>
        </div>
  );
}
