"use client";

import Image from "next/image";
import { useRef } from "react";

import { Button } from "@/components/ui/button";

import { MaterialIcon } from "../common/material-icon";
import { bestSellingProducts } from "../../_data/home/home";

// Import Swiper
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";

// Swiper styles
import "swiper/css";
import "swiper/css/navigation";

export function BestSellingCarousel() {
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <div className="mb-12 flex items-end justify-between">
        <div>
          <h2 className="mb-4 font-display-lg text-primary">
            Curated Favorites
          </h2>

          <p className="max-w-lg font-body-lg text-on-surface-variant">
            Exemplary pieces chosen for their timeless appeal and superior
            quality.
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
            slidesPerView: 3,
          },
        }}
        className="pb-4"
      >
        {bestSellingProducts.map((product) => (
          <SwiperSlide key={product.id}>
            <article className="group rounded-2xl border border-surface-container bg-white p-4 shadow-sm transition-all duration-500 hover:shadow-xl dark:bg-card">
              <div className="relative mb-6 aspect-4/5 overflow-hidden rounded-xl bg-surface-bright">
                <Image
                  src={product.imageSrc}
                  alt={product.imageAlt}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  sizes="320px"
                />

                {"favorite" in product && product.favorite ? (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="absolute top-4 right-4 size-10 rounded-full bg-white/80 text-primary shadow-sm backdrop-blur hover:bg-primary hover:text-white"
                    aria-label="Add to favorites"
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

                <Button
                  type="button"
                  size="icon"
                  className="rounded-lg bg-primary-container text-on-primary-container hover:opacity-90"
                  aria-label={`Add ${product.name} to cart`}
                >
                  <MaterialIcon name="add_shopping_cart" />
                </Button>
              </div>
            </article>
          </SwiperSlide>
        ))}
      </Swiper>
    </>
  );
}