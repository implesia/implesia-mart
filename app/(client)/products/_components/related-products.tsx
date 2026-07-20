"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";
import { useCart } from "../../_providers/cart-provider";

import "swiper/css";
import "swiper/css/navigation";

type RelatedProduct = {
  id: string;
  slug: string;
  title: string;
  priceLabel: string;
  imageSrc: string;
  imageAlt: string;
  status?: "available" | "coming-soon";
};

export function RelatedProducts({ items }: { items: RelatedProduct[] }) {
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const { addItem } = useCart();

  if (!items.length) return null;

  return (
    <section className="mt-xl">
      <div className="mb-8 flex items-center justify-between gap-3 sm:mb-10">
        <h2 className="font-headline-md">আরও দেখুন</h2>
        <div className="flex gap-2">
          <Button
            ref={prevRef}
            type="button"
            variant="outline"
            size="icon-lg"
            className="rounded-full border-outline-variant/30 hover:bg-surface-container"
            aria-label="আগের প্রোডাক্ট"
          >
            <MaterialIcon name="west" />
          </Button>
          <Button
            ref={nextRef}
            type="button"
            variant="outline"
            size="icon-lg"
            className="rounded-full border-outline-variant/30 hover:bg-surface-container"
            aria-label="পরের প্রোডাক্ট"
          >
            <MaterialIcon name="east" />
          </Button>
        </div>
      </div>

      <Swiper
        modules={[Navigation]}
        spaceBetween={16}
        slidesPerView={1.2}
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

          return (
            <SwiperSlide key={p.id} className="!h-auto">
              <Link href={`/products/${p.slug}`} className="group block h-full">
                <div className="relative mb-4 aspect-3/4 overflow-hidden rounded-2xl bg-surface-container-low shadow-sm transition-all duration-500 group-hover:shadow-xl">
                  <Image
                    src={p.imageSrc}
                    alt={p.imageAlt}
                    fill
                    className={cn(
                      "object-contain p-4 transition-transform duration-700 group-hover:scale-105",
                      isComingSoon && "opacity-60 grayscale-[35%]",
                    )}
                    sizes="(max-width: 768px) 70vw, 25vw"
                  />
                  {isComingSoon ? (
                    <span className="absolute top-4 left-4 rounded-full bg-on-surface/80 px-3 py-1 text-[10px] tracking-widest text-white uppercase">
                      Out of Stock
                    </span>
                  ) : (
                    <Button
                      type="button"
                      size="icon-lg"
                      className={cn(
                        "absolute bottom-4 right-4 size-12 translate-y-12 rounded-full bg-white shadow-lg opacity-0 transition-all duration-300",
                        "group-hover:translate-y-0 group-hover:opacity-100",
                      )}
                      aria-label="কার্টে যুক্ত করুন"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        addItem(p.slug, 1, { openDrawer: true });
                      }}
                    >
                      <MaterialIcon name="add_shopping_cart" className="text-primary" />
                    </Button>
                  )}
                </div>
                <h3 className="mb-1 font-label-md text-on-surface">{p.title}</h3>
                <p className="text-on-surface-variant">{p.priceLabel}</p>
              </Link>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </section>
  );
}
