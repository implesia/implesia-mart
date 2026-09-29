"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import type { Swiper as SwiperInstance } from "swiper/types";
import { Autoplay, Keyboard } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { useBanners } from "@/lib/mart-mock/hooks";
import { cn } from "@/lib/utils";

import type { HeroSlide } from "../../_data/home/home";
import { Container } from "../common/container";

const AUTOPLAY_DELAY = 5500;

const bannerTone: Record<HeroSlide["accent"], string> = {
  gold: "bg-[linear-gradient(100deg,#1c1408_0%,#0c0d12_42%,#05060a_100%)]",
  teal: "bg-[linear-gradient(100deg,#071820_0%,#070c14_46%,#05060a_100%)]",
  rose: "bg-[linear-gradient(100deg,#1a0c14_0%,#0c0a10_46%,#05060a_100%)]",
  ink: "bg-[linear-gradient(100deg,#071018_0%,#07090f_46%,#05060a_100%)]",
};

export function HeroSection() {
  const banners = useBanners();
  const slides = useMemo<HeroSlide[]>(
    () =>
      banners
        .filter((banner) => banner.published && banner.imageSrc)
        .map((banner) => ({
          id: banner.id,
          eyebrow: banner.eyebrow,
          title: banner.title,
          description: banner.description,
          priceLabel: banner.priceLabel,
          compareAtLabel: undefined,
          discountLabel: undefined,
          primaryCta: { label: banner.primaryCtaLabel, href: banner.primaryCtaHref },
          secondaryCta: { label: banner.secondaryCtaLabel, href: banner.secondaryCtaHref },
          imageSrc: banner.imageSrc,
          imageAlt: banner.imageAlt,
          accent: banner.accent,
        })),
    [banners],
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const swiperRef = useRef<SwiperInstance | null>(null);
  const loop = slides.length > 1;

  if (slides.length === 0) return null;

  return (
    <section
      className="bg-[#f5f6f8] pt-3 pb-4 sm:pt-4 dark:bg-background"
      aria-label="ফিচার্ড প্রোডাক্ট"
    >
      <Container className="px-4 sm:px-6 lg:px-8">
        <div className="relative min-w-0">
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
              className="banner-swiper h-[248px] overflow-hidden rounded-2xl sm:h-[280px] lg:h-[360px] xl:h-[400px]"
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
                      <div className="min-w-0 px-3.5 pt-4 pb-9 sm:px-7 sm:pt-6 sm:pb-9 lg:px-8">
                        <p className="mb-1.5 text-[11px] font-medium tracking-wide text-primary sm:text-xs">
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
                      <div className="relative h-full min-w-0">
                        <Image
                          src={slide.imageSrc}
                          alt={slide.imageAlt}
                          fill
                          priority={index === 0}
                          sizes="(max-width: 640px) 38vw, (max-width: 1024px) 46vw, 32vw"
                          className="object-contain object-right p-2 sm:p-5 lg:p-6"
                        />
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
      </Container>
    </section>
  );
}
