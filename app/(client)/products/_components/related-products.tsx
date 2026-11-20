"use client";

import "swiper/css";
import "../../_components/carousels/swiper-storefront.css";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperInstance } from "swiper/types";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";
import { catalogProductId } from "@/lib/mart-api/catalog";
import { useCart } from "../../_providers/cart-provider";
import { productPath } from "@/lib/mart-api/product-url";

type RelatedProduct = {
  id: string;
  slug: string;
  title: string;
  priceLabel: string;
  imageSrc: string;
  imageAlt: string;
  status?: "available" | "sold-out" | "coming-soon";
  hasVariants?: boolean;
};

export function RelatedProducts({ items }: { items: RelatedProduct[] }) {
  const [swiper, setSwiper] = useState<SwiperInstance | null>(null);
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);
  const { addItem } = useCart();

  if (!items.length) return null;

  const canLoop = items.length > 2;

  const handlePrev = () => {
    if (!swiper) return;
    swiper.slidePrev();
  };

  const handleNext = () => {
    if (!swiper) return;
    swiper.slideNext();
  };

  return (
    <section className="mt-10 sm:mt-12 lg:mt-16">
      <div className="mb-5 flex items-center justify-between gap-3 sm:mb-8 lg:mb-10">
        <h2 className="text-xl font-semibold tracking-tight text-on-background sm:text-2xl lg:text-3xl">
          আরও দেখুন
        </h2>
        <div className="flex gap-1.5 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handlePrev}
            disabled={!canLoop && isBeginning}
            className="size-9 rounded-full border-outline-variant/30 hover:bg-surface-container sm:size-10 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="আগের প্রোডাক্ট"
          >
            <MaterialIcon name="west" className="text-[18px]" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleNext}
            disabled={!canLoop && isEnd}
            className="size-9 rounded-full border-outline-variant/30 hover:bg-surface-container sm:size-10 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="পরের প্রোডাক্ট"
          >
            <MaterialIcon name="east" className="text-[18px]" />
          </Button>
        </div>
      </div>

      <div className="group/carousel relative">
        {/* Left Arrow Button (Middle of Carousel) */}
        <button
          type="button"
          onClick={handlePrev}
          disabled={!canLoop && isBeginning}
          className={cn(
            "absolute -left-2 sm:-left-3.5 top-[38%] -translate-y-1/2 z-20 flex size-9 sm:size-10 items-center justify-center rounded-full",
            "bg-surface-container-lowest/95 text-primary shadow-md backdrop-blur-xs border border-outline-variant/30",
            "transition-all duration-200 hover:scale-110 hover:bg-surface-container-lowest hover:border-primary active:scale-95",
            "disabled:opacity-25 disabled:pointer-events-none cursor-pointer",
            "dark:bg-surface-container/95 dark:border-white/10 dark:text-primary",
          )}
          aria-label="আগের প্রোডাক্ট"
        >
          <MaterialIcon name="chevron_left" className="text-[26px]" />
        </button>

        {/* Right Arrow Button (Middle of Carousel) */}
        <button
          type="button"
          onClick={handleNext}
          disabled={!canLoop && isEnd}
          className={cn(
            "absolute -right-2 sm:-right-3.5 top-[38%] -translate-y-1/2 z-20 flex size-9 sm:size-10 items-center justify-center rounded-full",
            "bg-surface-container-lowest/95 text-primary shadow-md backdrop-blur-xs border border-outline-variant/30",
            "transition-all duration-200 hover:scale-110 hover:bg-surface-container-lowest hover:border-primary active:scale-95",
            "disabled:opacity-25 disabled:pointer-events-none cursor-pointer",
            "dark:bg-surface-container/95 dark:border-white/10 dark:text-primary",
          )}
          aria-label="পরের প্রোডাক্ট"
        >
          <MaterialIcon name="chevron_right" className="text-[26px]" />
        </button>

        <Swiper
          spaceBetween={16}
          slidesPerView={1.2}
          loop={canLoop}
          onSwiper={(s) => {
            setSwiper(s);
            setIsBeginning(s.isBeginning);
            setIsEnd(s.isEnd);
          }}
          onSlideChange={(s) => {
            setIsBeginning(s.isBeginning);
            setIsEnd(s.isEnd);
          }}
          breakpoints={{
            480: {
              slidesPerView: 1.5,
              spaceBetween: 16,
            },
            640: {
              slidesPerView: 2.2,
              spaceBetween: 20,
            },
            768: {
              slidesPerView: 2.5,
              spaceBetween: 24,
            },
            1024: {
              slidesPerView: 4,
              spaceBetween: 28,
            },
          }}
          className="!overflow-hidden"
        >
          {items.map((p) => {
            const isComingSoon = p.status === "coming-soon";
            const isSoldOut = p.status === "sold-out";

            return (
              <SwiperSlide key={p.id} className="!h-auto">
                <Link href={productPath(p)} className="group block h-full">
                  <div className="relative mb-3 aspect-3/4 overflow-hidden rounded-xl bg-surface-container-low shadow-sm transition-all duration-500 group-hover:shadow-xl sm:mb-4 sm:rounded-2xl">
                    <Image
                      src={p.imageSrc}
                      alt={p.imageAlt}
                      fill
                      className={cn(
                        "object-contain p-3 transition-transform duration-700 group-hover:scale-105 sm:p-4",
                        (isComingSoon || isSoldOut) && "opacity-60 grayscale-35",
                      )}
                      sizes="(max-width: 640px) 70vw, (max-width: 1024px) 40vw, 25vw"
                    />
                    {isComingSoon || isSoldOut ? (
                      <span className="absolute top-3 left-3 rounded-full bg-on-surface/80 px-2.5 py-1 text-[9px] tracking-widest text-white uppercase sm:top-4 sm:left-4 sm:px-3 sm:text-[10px]">
                        {isSoldOut ? "শেষ" : "কামিং সুন"}
                      </span>
                    ) : p.hasVariants ? null : (
                      <Button
                        type="button"
                        size="icon"
                        className={cn(
                          "absolute right-3 bottom-3 size-10 translate-y-10 rounded-full bg-white shadow-lg opacity-0 transition-all duration-300 sm:right-4 sm:bottom-4 sm:size-12 sm:translate-y-12",
                          "group-hover:translate-y-0 group-hover:opacity-100",
                        )}
                        aria-label="কার্টে যুক্ত করুন"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          void addItem(p.slug, 1, {
                            openDrawer: true,
                            productId: catalogProductId(p.id),
                          });
                        }}
                      >
                        <MaterialIcon name="add_shopping_cart" className="text-primary" />
                      </Button>
                    )}
                  </div>
                  <h3 className="mb-0.5 line-clamp-2 text-sm font-semibold text-on-surface sm:mb-1 sm:text-base">
                    {p.title}
                  </h3>
                  <p className="text-sm text-on-surface-variant">{p.priceLabel}</p>
                </Link>
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>
    </section>
  );
}
