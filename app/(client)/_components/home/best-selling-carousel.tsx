"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { MaterialIcon } from "../common/material-icon";
import { bestSellingProducts } from "../../_data/home/home";
import { useCart } from "../../_providers/cart-provider";

// Import Swiper
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";

// Swiper styles
import "swiper/css";
import "swiper/css/navigation";

export function BestSellingCarousel() {
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const { addItem } = useCart();

  return (
    <>
      <div className="mb-12 flex items-end justify-between">
        <div>
          <h2 className="mb-4 font-display-lg text-primary">
            আমাদের জনপ্রিয় গ্যাজেট
          </h2>

          <p className="max-w-lg font-body-lg text-on-surface-variant">
            যেসব প্রোডাক্ট কাস্টমাররা সবচেয়ে বেশি পছন্দ করছেন।
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            ref={prevRef}
            type="button"
            variant="outline"
            size="icon-lg"
            className="rounded-full border-outline/30 hover:bg-primary hover:text-white"
            aria-label="Previous products"
          >
            <MaterialIcon name="arrow_back" />
          </Button>

          <Button
            ref={nextRef}
            type="button"
            variant="outline"
            size="icon-lg"
            className="rounded-full border-outline/30 hover:bg-primary hover:text-white"
            aria-label="Next products"
          >
            <MaterialIcon name="arrow_forward" />
          </Button>
        </div>
      </div>

      <Swiper
        modules={[Navigation, Autoplay]}
        spaceBetween={32}
        slidesPerView={1.1}
        loop
        autoplay={{
          delay: 2500,
          disableOnInteraction: false,
        }}
        navigation={{
          prevEl: prevRef.current,
          nextEl: nextRef.current,
        }}
        onBeforeInit={(swiper) => {
          // @ts-ignore
          swiper.params.navigation.prevEl = prevRef.current;
          // @ts-ignore
          swiper.params.navigation.nextEl = nextRef.current;
        }}
        breakpoints={{
          640: {
            slidesPerView: 1.5,
          },
          768: {
            slidesPerView: 2,
          },
          1024: {
            slidesPerView: 4,
            spaceBetween: 24,
          },
        }}
        className="pb-4"
      >
        {bestSellingProducts.map((product) => {
          const isComingSoon = product.status === "coming-soon";

          return (
            <SwiperSlide key={product.id}>
              <Link
                href={`/products/${product.slug}`}
                className="group block rounded-2xl border border-surface-container bg-white p-4 shadow-sm transition-all duration-500 hover:shadow-xl dark:bg-card"
              >
                <div className="relative mb-6 aspect-4/5 overflow-hidden rounded-xl bg-surface-bright">
                  <Image
                    src={product.imageSrc}
                    alt={product.imageAlt}
                    fill
                    className={cn(
                      "object-cover transition-transform duration-700 group-hover:scale-110",
                      isComingSoon && "opacity-60 grayscale-[35%]",
                    )}
                    sizes="320px"
                  />

                  {isComingSoon ? (
                    <span className="absolute top-4 left-4 rounded-full bg-on-surface/80 px-3 py-1 text-[10px] tracking-widest text-white uppercase">
                      কামিং সুন
                    </span>
                  ) : product.favorite ? (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="absolute top-4 right-4 size-10 rounded-full bg-white/80 text-primary shadow-sm backdrop-blur hover:bg-primary hover:text-white"
                      aria-label="পছন্দের তালিকায় যুক্ত করুন"
                      onClick={(e) => e.preventDefault()}
                    >
                      <MaterialIcon name="favorite" className="text-xl" />
                    </Button>
                  ) : null}
                </div>

                <p className="mb-1 font-label-sm text-outline uppercase tracking-widest">
                  {product.category}
                </p>

                <h4 className="mb-2 font-headline-sm text-primary">
                  {product.name}
                </h4>

                <div className="flex items-center justify-between">
                  <span className="font-headline-sm text-on-surface">
                    {product.price}
                  </span>

                  {!isComingSoon ? (
                    <Button
                      type="button"
                      size="icon"
                      className="rounded-lg bg-primary-container text-on-primary-container hover:opacity-90"
                      aria-label={`${product.name} কার্টে যুক্ত করুন`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        addItem(product.slug, 1, { openDrawer: true });
                      }}
                    >
                      <MaterialIcon name="add_shopping_cart" />
                    </Button>
                  ) : null}
                </div>
              </Link>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </>
  );
}