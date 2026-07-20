"use client";

import { useRef } from "react";
import { Autoplay, Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { testimonials } from "../../_data/home/home";
import { Container } from "../common/container";
import { MaterialIcon } from "../common/material-icon";

function Stars({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${value} স্টার`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <MaterialIcon
          key={i}
          name="star"
          filled={i < value}
          className={cn(
            "text-[16px] sm:text-[17px]",
            i < value ? "text-warm-gold" : "text-outline-variant/35",
          )}
        />
      ))}
    </div>
  );
}

function ReviewCard({ t }: { t: (typeof testimonials)[number] }) {
  return (
    <article
      className={cn(
        "flex h-full flex-col rounded-2xl p-5 sm:rounded-[1.35rem] sm:p-6",
        "bg-surface-container-lowest dark:bg-surface-container",
        "ring-1 ring-black/[0.06] dark:ring-white/10",
        "shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
        "transition-[transform,box-shadow,ring-color] duration-300",
        "hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-18px_rgba(6,47,44,0.22)]",
        "hover:ring-primary/20",
      )}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <Stars value={t.rating} />
        <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-primary sm:text-[11px]">
          {t.product}
        </span>
      </div>

      <MaterialIcon
        name="format_quote"
        className="mb-2 text-[28px] text-primary/25"
      />

      <p className="mb-6 flex-1 text-sm leading-relaxed text-on-surface-variant sm:text-[15px] sm:leading-relaxed">
        {t.quote}
      </p>

      <div className="mt-auto flex items-center gap-3 border-t border-outline-variant/25 pt-4 dark:border-white/8">
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white sm:size-11 sm:text-sm"
          style={{ backgroundColor: t.accent }}
          aria-hidden
        >
          {t.initials}
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-on-surface">{t.name}</h3>
          <p className="truncate text-xs text-outline">
            ভেরিফাইড · {t.location}
          </p>
        </div>
      </div>
    </article>
  );
}

export function TestimonialsSection() {
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  return (
    <section className="overflow-hidden bg-surface-container-low py-12 sm:py-14 lg:py-20 dark:bg-background">
      <Container className="px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between lg:mb-10">
          <div className="min-w-0 max-w-xl">
            <p className="mb-2 flex items-center gap-2 text-[11px] font-semibold tracking-[0.16em] text-primary uppercase">
              <span className="h-px w-5 bg-primary/50" aria-hidden />
              রিভিউ
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-on-background sm:text-3xl lg:text-4xl">
              কাস্টমাররা যা বলছেন
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-on-surface-variant sm:text-base">
              গ্যাজেট থেকে কাস্টম ড্রেস — সন্তুষ্ট কাস্টমারদের আসল অভিজ্ঞতা।
            </p>
          </div>

          <div className="flex shrink-0 gap-2 sm:gap-3">
            <Button
              ref={prevRef}
              type="button"
              variant="outline"
              size="icon"
              className="size-10 rounded-full border-outline-variant/40 sm:size-11 dark:border-white/15"
              aria-label="আগের রিভিউ"
            >
              <MaterialIcon name="arrow_back" className="text-[18px] sm:text-[20px]" />
            </Button>
            <Button
              ref={nextRef}
              type="button"
              variant="outline"
              size="icon"
              className="size-10 rounded-full border-outline-variant/40 sm:size-11 dark:border-white/15"
              aria-label="পরের রিভিউ"
            >
              <MaterialIcon name="arrow_forward" className="text-[18px] sm:text-[20px]" />
            </Button>
          </div>
        </div>

        <Swiper
          modules={[Navigation, Autoplay]}
          spaceBetween={14}
          slidesPerView={1.15}
          loop
          autoplay={{
            delay: 3800,
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
            480: { slidesPerView: 1.35, spaceBetween: 14 },
            640: { slidesPerView: 1.8, spaceBetween: 16 },
            768: { slidesPerView: 2.25, spaceBetween: 18 },
            1024: { slidesPerView: 3, spaceBetween: 20 },
            1280: { slidesPerView: 3.2, spaceBetween: 22 },
          }}
          className="!overflow-hidden"
        >
          {testimonials.map((t) => (
            <SwiperSlide key={t.id} className="!h-auto">
              <ReviewCard t={t} />
            </SwiperSlide>
          ))}
        </Swiper>
      </Container>
    </section>
  );
}
