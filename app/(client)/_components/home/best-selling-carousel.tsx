"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { MaterialIcon } from "../common/material-icon";
import { bestSellingProducts } from "../../_data/home/home";
import { useCart } from "../../_providers/cart-provider";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";

export function BestSellingCarousel() {
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const { addItem } = useCart();

  return (
    <>
      <div className="mb-5 flex items-start justify-between gap-3 sm:mb-8 sm:items-end lg:mb-10">
        <div className="min-w-0 flex-1">
          <h2 className="mb-1.5 text-xl font-semibold leading-snug text-primary sm:mb-2 sm:text-2xl md:text-3xl lg:text-4xl">
            আমাদের জনপ্রিয় গ্যাজেট
          </h2>
          <p className="max-w-lg text-xs leading-relaxed text-on-surface-variant sm:text-sm md:text-base">
            যেসব প্রোডাক্ট কাস্টমাররা সবচেয়ে বেশি পছন্দ করছেন।
          </p>
        </div>

        <div className="flex shrink-0 gap-1.5 sm:gap-2.5">
          <Button
            ref={prevRef}
            type="button"
            variant="outline"
            size="icon"
            className="size-9 rounded-full border-outline-variant/40 sm:size-10 lg:size-11 dark:border-white/15"
            aria-label="Previous products"
          >
            <MaterialIcon name="arrow_back" className="text-[18px] sm:text-[20px]" />
          </Button>
          <Button
            ref={nextRef}
            type="button"
            variant="outline"
            size="icon"
            className="size-9 rounded-full border-outline-variant/40 sm:size-10 lg:size-11 dark:border-white/15"
            aria-label="Next products"
          >
            <MaterialIcon name="arrow_forward" className="text-[18px] sm:text-[20px]" />
          </Button>
        </div>
      </div>

      <Swiper
        modules={[Navigation, Autoplay]}
        spaceBetween={12}
        slidesPerView={1.35}
        loop
        autoplay={{
          delay: 2800,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        navigation={{
          prevEl: prevRef.current,
          nextEl: nextRef.current,
        }}
        onBeforeInit={(swiper) => {
          // @ts-expect-error Swiper navigation refs assigned before init
          swiper.params.navigation.prevEl = prevRef.current;
          // @ts-expect-error Swiper navigation refs assigned before init
          swiper.params.navigation.nextEl = nextRef.current;
        }}
        breakpoints={{
          480: {
            slidesPerView: 1.6,
            spaceBetween: 14,
          },
          640: {
            slidesPerView: 2.15,
            spaceBetween: 16,
          },
          768: {
            slidesPerView: 2.5,
            spaceBetween: 18,
          },
          1024: {
            slidesPerView: 4,
            spaceBetween: 20,
          },
        }}
        className="!overflow-hidden"
      >
        {bestSellingProducts.map((product) => {
          const isComingSoon = product.status === "coming-soon";

          return (
            <SwiperSlide key={product.id} className="!h-auto">
              <Link
                href={`/products/${product.slug}`}
                className={cn(
                  "group flex h-full flex-col overflow-hidden rounded-xl sm:rounded-2xl",
                  "border border-outline-variant/30 bg-surface-container-lowest",
                  "shadow-sm transition-shadow duration-300 hover:shadow-md",
                  "dark:border-white/10 dark:bg-surface-container",
                )}
              >
                <div className="relative aspect-4/5 overflow-hidden bg-surface-container-low dark:bg-background">
                  <Image
                    src={product.imageSrc}
                    alt={product.imageAlt}
                    fill
                    className={cn(
                      "object-cover transition-transform duration-500 group-hover:scale-105",
                      isComingSoon && "opacity-60 grayscale-[30%]",
                    )}
                    sizes="(max-width: 640px) 70vw, (max-width: 1024px) 40vw, 280px"
                  />

                  {isComingSoon ? (
                    <span className="absolute top-2 left-2 rounded-md bg-on-surface/85 px-2 py-0.5 text-[9px] font-semibold tracking-wide text-white uppercase sm:top-3 sm:left-3 sm:rounded-full sm:px-2.5 sm:py-1 sm:text-[10px]">
                      Out of Stock
                    </span>
                  ) : product.favorite ? (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="absolute top-2 right-2 size-8 rounded-full bg-white/85 text-primary shadow-sm backdrop-blur sm:top-3 sm:right-3 sm:size-9 dark:bg-surface-container/90"
                      aria-label="পছন্দের তালিকায় যুক্ত করুন"
                      onClick={(e) => e.preventDefault()}
                    >
                      <MaterialIcon name="favorite" className="text-lg" />
                    </Button>
                  ) : null}
                </div>

                <div className="flex flex-1 flex-col p-3 sm:p-4">
                  <p className="mb-0.5 text-[10px] font-medium tracking-wide text-outline uppercase sm:mb-1 sm:text-[11px]">
                    {product.category}
                  </p>

                  <h3 className="mb-2 line-clamp-2 text-sm font-semibold leading-snug text-primary sm:mb-3 sm:text-base">
                    {product.name}
                  </h3>

                  <div className="mt-auto flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold tabular-nums text-on-surface sm:text-base">
                      {product.price}
                    </span>

                    {!isComingSoon ? (
                      <Button
                        type="button"
                        size="icon"
                        className="size-8 shrink-0 rounded-lg bg-primary-container text-on-primary-container hover:opacity-90 sm:size-9"
                        aria-label={`${product.name} কার্টে যুক্ত করুন`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          addItem(product.slug, 1, { openDrawer: true });
                        }}
                      >
                        <MaterialIcon name="add_shopping_cart" className="text-[18px]" />
                      </Button>
                    ) : null}
                  </div>
                </div>
              </Link>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </>
  );
}
