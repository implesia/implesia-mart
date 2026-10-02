"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { Autoplay, Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { bestSellingProducts } from "../../_data/home/home";
import { useCart } from "../../_providers/cart-provider";
import { MaterialIcon } from "../common/material-icon";

function formatPrice(value: number) {
  return `৳${value.toLocaleString("en-US")}`;
}

const BADGE_LABEL = {
  New: "নতুন",
  "Best Seller": "বেস্ট সেলার",
  Limited: "লিমিটেড",
} as const;

export function BestSellingCarousel() {
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const { addItem } = useCart();
  const [addedSlug, setAddedSlug] = useState<string | null>(null);

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between lg:mb-10">
        <div className="min-w-0 max-w-xl">
          <p className="mb-2 flex items-center gap-2 text-[11px] font-semibold tracking-[0.16em] text-primary uppercase">
            <span className="h-px w-5 bg-primary/50" aria-hidden />
            কালেকশন
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-on-background sm:text-3xl lg:text-4xl">
            জনপ্রিয় প্রোডাক্ট
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-on-surface-variant sm:text-base">
            গ্যাজেট থেকে হাতে তৈরি ড্রেস — কাস্টমারদের সবচেয়ে পছন্দের পিক্স।
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/products"
            className="mr-1 hidden text-sm font-semibold text-primary transition-colors hover:underline sm:inline-flex sm:items-center sm:gap-1"
          >
            সব দেখুন
            <MaterialIcon name="arrow_forward" className="text-[16px]" />
          </Link>
          <Button
            ref={prevRef}
            type="button"
            variant="outline"
            size="icon"
            className="size-10 rounded-full border-outline-variant/40 sm:size-11 dark:border-white/15"
            aria-label="আগের প্রোডাক্ট"
          >
            <MaterialIcon name="arrow_back" className="text-[18px] sm:text-[20px]" />
          </Button>
          <Button
            ref={nextRef}
            type="button"
            variant="outline"
            size="icon"
            className="size-10 rounded-full border-outline-variant/40 sm:size-11 dark:border-white/15"
            aria-label="পরের প্রোডাক্ট"
          >
            <MaterialIcon name="arrow_forward" className="text-[18px] sm:text-[20px]" />
          </Button>
        </div>
      </div>

      <Swiper
        modules={[Navigation, Autoplay]}
        spaceBetween={12}
        slidesPerView={1.25}
        loop={bestSellingProducts.length > 4}
        autoplay={{
          delay: 3200,
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
          480: { slidesPerView: 1.55, spaceBetween: 14 },
          640: { slidesPerView: 2.15, spaceBetween: 16 },
          768: { slidesPerView: 2.6, spaceBetween: 18 },
          1024: { slidesPerView: 3.25, spaceBetween: 20 },
          1280: { slidesPerView: 4, spaceBetween: 22 },
        }}
        className="!overflow-hidden"
      >
        {bestSellingProducts.map((product) => {
          const isComingSoon = product.status === "coming-soon";
          const discountPct =
            product.compareAtPrice && product.compareAtPrice > product.price
              ? Math.round(
                  ((product.compareAtPrice - product.price) / product.compareAtPrice) *
                    100,
                )
              : null;
          const justAdded = addedSlug === product.slug;

          return (
            <SwiperSlide key={product.id} className="!h-auto">
              <article
                className={cn(
                  "group flex h-full flex-col overflow-hidden rounded-2xl",
                  "bg-surface-container-lowest dark:bg-surface-container",
                  "ring-1 ring-black/[0.06] dark:ring-white/10",
                  "shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
                  "transition-[transform,box-shadow,ring-color] duration-300",
                  "hover:-translate-y-1 hover:shadow-[0_20px_40px_-16px_rgba(6,47,44,0.22)]",
                  "hover:ring-primary/25",
                )}
              >
                <Link
                  href={`/products/${product.slug}`}
                  className="relative block aspect-[4/5] overflow-hidden bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset dark:bg-background/40"
                  aria-label={`${product.name} দেখুন`}
                >
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_20%,rgba(43,192,181,0.12),transparent_60%)]"
                  />
                  <Image
                    src={product.imageSrc}
                    alt={product.imageAlt}
                    fill
                    className={cn(
                      "object-contain p-3 transition-transform duration-500 group-hover:scale-[1.03] sm:p-4",
                      isComingSoon && "opacity-55 grayscale-[35%]",
                    )}
                    sizes="(max-width: 640px) 70vw, (max-width: 1024px) 40vw, 280px"
                  />

                  <div className="absolute top-2.5 left-2.5 z-10 flex flex-wrap gap-1.5">
                    {isComingSoon ? (
                      <span className="rounded-md bg-on-surface/85 px-2 py-1 text-[10px] font-semibold tracking-wide text-white uppercase backdrop-blur-sm">
                        কামিং সুন
                      </span>
                    ) : product.badge ? (
                      <span
                        className={cn(
                          "rounded-md px-2 py-1 text-[10px] font-semibold tracking-wide uppercase shadow-sm",
                          product.badge === "Best Seller"
                            ? "bg-warm-gold text-on-surface"
                            : "bg-primary text-on-primary",
                        )}
                      >
                        {BADGE_LABEL[product.badge]}
                      </span>
                    ) : null}
                    {discountPct ? (
                      <span className="rounded-md bg-primary/12 px-2 py-1 text-[10px] font-bold text-primary backdrop-blur-sm dark:bg-primary/20">
                        -{discountPct}%
                      </span>
                    ) : null}
                  </div>
                </Link>

                <div className="flex flex-1 flex-col px-3.5 pt-3.5 pb-3.5 sm:px-4 sm:pt-4 sm:pb-4">
                  <p className="mb-1 text-[10px] font-medium tracking-wide text-outline uppercase sm:text-[11px]">
                    {product.category}
                  </p>
                  <Link href={`/products/${product.slug}`} className="min-w-0">
                    <h3 className="mb-3 line-clamp-2 text-sm font-semibold leading-snug text-on-surface transition-colors group-hover:text-primary sm:text-[15px]">
                      {product.name}
                    </h3>
                  </Link>

                  <div className="mt-auto flex items-end justify-between gap-2 border-t border-outline-variant/25 pt-3 dark:border-white/8">
                    <div className="min-w-0">
                      {isComingSoon ? (
                        <span className="text-sm font-semibold text-outline">শীঘ্রই আসছে</span>
                      ) : (
                        <>
                          <div className="flex flex-wrap items-baseline gap-x-1.5">
                            {product.unitLabel ? (
                              <span className="text-[11px] text-outline">{product.unitLabel}</span>
                            ) : null}
                            <span className="text-base font-semibold tabular-nums text-primary">
                              {formatPrice(product.price)}
                            </span>
                          </div>
                          {product.compareAtPrice ? (
                            <span className="text-xs text-outline line-through tabular-nums">
                              {formatPrice(product.compareAtPrice)}
                            </span>
                          ) : null}
                        </>
                      )}
                    </div>

                    {!isComingSoon ? (
                      <Button
                        type="button"
                        size="icon"
                        className={cn(
                          "size-9 shrink-0 rounded-full sm:size-10",
                          justAdded && "bg-primary/90",
                        )}
                        aria-label={`${product.name} কার্টে যুক্ত করুন`}
                        onClick={() => {
                          void (async () => {
                            const ok = await addItem(product.slug, 1, { openDrawer: true });
                            if (!ok) return;
                            setAddedSlug(product.slug);
                            window.setTimeout(() => setAddedSlug(null), 1200);
                          })();
                        }}
                      >
                        <MaterialIcon
                          name={justAdded ? "check" : "add_shopping_cart"}
                          className="text-[18px]"
                        />
                      </Button>
                    ) : (
                      <Link
                        href={`/products/${product.slug}`}
                        className="inline-flex size-9 items-center justify-center rounded-full bg-surface-container text-on-surface-variant ring-1 ring-outline-variant/35 transition-colors hover:text-primary sm:size-10 dark:ring-white/10"
                        aria-label="বিস্তারিত দেখুন"
                      >
                        <MaterialIcon name="arrow_forward" className="text-[18px]" />
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            </SwiperSlide>
          );
        })}
      </Swiper>

      <div className="mt-5 text-center sm:hidden">
        <Link
          href="/products"
          className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
        >
          সব প্রোডাক্ট দেখুন
          <MaterialIcon name="arrow_forward" className="text-[16px]" />
        </Link>
      </div>
    </>
  );
}
