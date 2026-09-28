"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Swiper as SwiperInstance } from "swiper/types";
import { Autoplay, Keyboard } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { cn } from "@/lib/utils";

import { heroSlides, type HeroSlide } from "../../_data/home/home";
import { productFilters } from "../../_data/products/products";
import { useCategoryRail } from "../../_providers/category-rail-provider";
import { Container } from "../common/container";

const AUTOPLAY_DELAY = 5500;

const bannerTone: Record<HeroSlide["accent"], string> = {
  gold: "bg-[linear-gradient(100deg,#1c1408_0%,#0c0d12_42%,#05060a_100%)]",
  teal: "bg-[linear-gradient(100deg,#071820_0%,#070c14_46%,#05060a_100%)]",
  rose: "bg-[linear-gradient(100deg,#1a0c14_0%,#0c0a10_46%,#05060a_100%)]",
  ink: "bg-[linear-gradient(100deg,#071018_0%,#07090f_46%,#05060a_100%)]",
};

export function HeroSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const swiperRef = useRef<SwiperInstance | null>(null);
  const { open: categoriesOpen } = useCategoryRail();

  useEffect(() => {
    const swiper = swiperRef.current;
    if (!swiper) return;
    const fit = () => {
      swiper.update();
      swiper.slideToLoop(swiper.realIndex, 0, false);
    };
    fit();
    const frame = window.setTimeout(fit, 320);
    return () => window.clearTimeout(frame);
  }, [categoriesOpen]);

  return (
    <section
      className="bg-[#f5f6f8] pt-3 pb-4 sm:pt-4 dark:bg-background"
      aria-label="ফিচার্ড প্রোডাক্ট"
    >
      <Container className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-stretch">
          <nav
            id="shop-categories"
            aria-label="Shop categories"
            aria-hidden={!categoriesOpen}
            className={cn(
              "hidden min-w-0 flex-col overflow-hidden bg-white shadow-sm transition-[width,margin,opacity] duration-300 lg:flex dark:bg-[#121816]",
              categoriesOpen
                ? "mr-3 w-[220px] min-w-[220px] border border-neutral-200 opacity-100 xl:mr-4 xl:w-[248px] xl:min-w-[248px] dark:border-white/10"
                : "pointer-events-none mr-0 w-0 min-w-0 border-0 opacity-0 shadow-none",
            )}
          >
            <ul className="flex flex-col">
              {productFilters.categories.map((category) => (
                <li
                  key={category.id}
                  className="border-b border-neutral-100 dark:border-white/10"
                >
                  <Link
                    href={`/products?category=${category.id}`}
                    className="flex w-full items-center px-4 py-3 text-[13px] text-neutral-700 transition-colors hover:bg-neutral-50 hover:text-neutral-950 dark:text-white/80 dark:hover:bg-white/5 dark:hover:text-white"
                  >
                    {category.label}
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href="/products"
              className="flex h-11 shrink-0 items-center justify-center border-t border-neutral-100 text-[13px] font-medium text-neutral-900 transition-colors hover:bg-neutral-50 dark:border-white/10 dark:text-white dark:hover:bg-white/5"
            >
              View All
            </Link>
          </nav>

          <div className="relative min-w-0 flex-1">
            <Swiper
              modules={[Autoplay, Keyboard]}
              speed={700}
              loop
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
                  swiper.slideToLoop(swiper.realIndex, 0, false);
                };
                requestAnimationFrame(fit);
              }}
              onSlideChange={(swiper) => {
                setActiveIndex(swiper.realIndex);
              }}
              className="banner-swiper h-[228px] sm:h-[280px] lg:h-[360px] xl:h-[400px]"
            >
              {heroSlides.map((slide, index) => (
                <SwiperSlide key={slide.id}>
                  <article
                    className={cn(
                      "relative h-full overflow-hidden",
                      bannerTone[slide.accent],
                    )}
                  >
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-y-0 right-0 w-[58%] bg-[radial-gradient(circle_at_60%_50%,rgba(56,168,255,0.22),transparent_62%)]"
                    />
                    <div className="relative grid h-full grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] items-center">
                      <div className="min-w-0 px-4 pt-4 pb-8 sm:px-7 sm:pt-6 sm:pb-9 lg:px-8">
                        <p className="mb-1.5 text-[11px] font-medium tracking-wide text-sky-300 sm:text-xs">
                          {slide.eyebrow}
                        </p>
                        {index === activeIndex ? (
                          <h1 className="max-w-[14ch] text-[1.35rem] leading-[1.15] font-bold tracking-tight text-white sm:text-3xl lg:text-[2rem] xl:text-[2.15rem]">
                            {slide.title}
                          </h1>
                        ) : (
                          <p className="max-w-[14ch] text-[1.35rem] leading-[1.15] font-bold tracking-tight text-white sm:text-3xl lg:text-[2rem] xl:text-[2.15rem]">
                            {slide.title}
                          </p>
                        )}
                        <p className="mt-2 hidden max-w-[34ch] text-sm leading-relaxed text-white/70 sm:line-clamp-2 sm:block">
                          {slide.description}
                        </p>
                        <div className="mt-3 flex items-center gap-3 sm:mt-4">
                          <Link
                            href={slide.primaryCta.href}
                            className="inline-flex h-9 items-center rounded-full bg-[#2f8cff] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-[#1d7aee] sm:h-10 sm:px-5 sm:text-sm"
                          >
                            {slide.primaryCta.label}
                          </Link>
                          {slide.priceLabel ? (
                            <span className="text-sm font-semibold text-white/90 sm:text-base">
                              {slide.priceLabel}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div className="relative h-full">
                        <Image
                          src={slide.imageSrc}
                          alt={slide.imageAlt}
                          fill
                          priority={index === 0}
                          sizes="(max-width: 1024px) 46vw, 32vw"
                          className="object-contain object-right p-3 sm:p-5 lg:p-6"
                        />
                      </div>
                    </div>
                  </article>
                </SwiperSlide>
              ))}
            </Swiper>

            <div className="pointer-events-auto absolute bottom-3 left-4 z-10 flex items-center gap-1.5 sm:left-7 lg:left-8">
              {heroSlides.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  aria-label={`স্লাইড ${index + 1}`}
                  aria-current={activeIndex === index ? "true" : undefined}
                  onClick={() => swiperRef.current?.slideToLoop(index)}
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
        </div>
      </Container>
    </section>
  );
}
