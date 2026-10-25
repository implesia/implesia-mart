"use client";

import "swiper/css";
import "swiper/css/navigation";
import "../../_components/carousels/swiper-storefront.css";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

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
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const { addItem } = useCart();

  if (!items.length) return null;

  return (
    <section className="mt-10 sm:mt-12 lg:mt-16">
      <div className="mb-5 flex items-center justify-between gap-3 sm:mb-8 lg:mb-10">
        <h2 className="text-xl font-semibold tracking-tight text-on-background sm:text-2xl lg:text-3xl">
          আরও দেখুন
        </h2>
        <div className="flex gap-1.5 sm:gap-2">
          <Button
            ref={prevRef}
            type="button"
            variant="outline"
            size="icon"
            className="size-9 rounded-full border-outline-variant/30 hover:bg-surface-container sm:size-10"
            aria-label="আগের প্রোডাক্ট"
          >
            <MaterialIcon name="west" className="text-[18px]" />
          </Button>
          <Button
            ref={nextRef}
            type="button"
            variant="outline"
            size="icon"
            className="size-9 rounded-full border-outline-variant/30 hover:bg-surface-container sm:size-10"
            aria-label="পরের প্রোডাক্ট"
          >
            <MaterialIcon name="east" className="text-[18px]" />
          </Button>
        </div>
      </div>

      <Swiper
        modules={[Navigation]}
        spaceBetween={16}
        slidesPerView={1.2}
        navigation
        onBeforeInit={(swiper) => {
          // @ts-expect-error Swiper navigation refs assigned before init
          swiper.params.navigation.prevEl = prevRef.current;
          // @ts-expect-error Swiper navigation refs assigned before init
          swiper.params.navigation.nextEl = nextRef.current;
        }}
        onSwiper={(swiper) => {
          // Ensure custom header buttons work after mount
          // @ts-expect-error Swiper navigation refs assigned after mount
          swiper.params.navigation.prevEl = prevRef.current;
          // @ts-expect-error Swiper navigation refs assigned after mount
          swiper.params.navigation.nextEl = nextRef.current;
          swiper.navigation.init();
          swiper.navigation.update();
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
    </section>
  );
}
