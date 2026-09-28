"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperInstance } from "swiper/types";

import { cn } from "@/lib/utils";

import { testimonials } from "../../_data/home/home";
import { WhatsAppIcon } from "../common/brand-icons";
import { MaterialIcon } from "../common/material-icon";

export type ReviewShot = (typeof testimonials)[number] & { ready: boolean };

function ChannelMark({ channel }: { channel: ReviewShot["channel"] }) {
  if (channel === "WhatsApp") {
    return <WhatsAppIcon className="size-3.5 text-[#25D366]" />;
  }
  return <MaterialIcon name="chat" className="text-[15px] text-[#0084ff]" />;
}

export function ReviewGallery({ reviews }: { reviews: ReviewShot[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const swiperRef = useRef<SwiperInstance | null>(null);
  const active =
    reviews.find((review) => review.id === activeId && review.ready) ?? null;

  useEffect(() => {
    if (!active) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  useEffect(() => {
    const swiper = swiperRef.current;
    if (!swiper?.autoplay) return;
    if (active) swiper.autoplay.stop();
    else swiper.autoplay.start();
  }, [active]);

  return (
    <>
      <Swiper
        modules={[Autoplay]}
        loop={reviews.length > 4}
        speed={1200}
        autoplay={{
          delay: 4800,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        spaceBetween={12}
        slidesPerView={1}
        breakpoints={{
          640: { slidesPerView: 2, spaceBetween: 14 },
          1024: { slidesPerView: 4, spaceBetween: 16 },
        }}
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
        }}
        className="!overflow-hidden"
      >
        {reviews.map((review) => (
          <SwiperSlide key={review.id} className="!h-auto">
            <figure className="overflow-hidden rounded-2xl bg-white ring-1 ring-black/[0.06] dark:bg-[#121816] dark:ring-white/10">
              {review.ready ? (
                <button
                  type="button"
                  onClick={() => setActiveId(review.id)}
                  className="group relative block aspect-[4/5] w-full bg-neutral-100 dark:bg-white/5"
                >
                  <Image
                    src={review.imageSrc}
                    alt={review.imageAlt}
                    fill
                    sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 22vw"
                    className="object-cover object-top transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                  <span className="absolute right-3 bottom-3 inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white">
                    <MaterialIcon name="open_in_full" className="text-[13px]" />
                    বড় করে দেখুন
                  </span>
                </button>
              ) : (
                <div className="grid aspect-[4/5] place-items-center bg-neutral-100 px-4 text-center dark:bg-white/5">
                  <div>
                    <MaterialIcon
                      name="photo_camera"
                      className="mx-auto text-[28px] text-neutral-400"
                    />
                    <p className="mt-2 text-sm font-medium text-neutral-600 dark:text-white/70">
                      রিভিউ স্ক্রিনশট
                    </p>
                    <p className="mt-1 text-xs text-neutral-400">
                      {review.product}
                    </p>
                  </div>
                </div>
              )}
              <figcaption className="flex items-center justify-between gap-2 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-neutral-950 dark:text-white">
                    {review.product}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-neutral-500 dark:text-white/55">
                    <ChannelMark channel={review.channel} />
                    {review.channel}
                  </p>
                </div>
                {review.ready ? (
                  <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                    <MaterialIcon
                      name="verified"
                      filled
                      className="text-[14px]"
                    />
                    ভেরিফাইড
                  </span>
                ) : null}
              </figcaption>
            </figure>
          </SwiperSlide>
        ))}
      </Swiper>

      {active ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={active.imageAlt}
          onClick={() => setActiveId(null)}
        >
          <div
            className={cn(
              "relative max-h-[92vh] w-full max-w-md overflow-hidden rounded-2xl bg-white",
            )}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActiveId(null)}
              className="absolute top-3 right-3 z-10 grid size-9 place-items-center rounded-full bg-black/60 text-white"
              aria-label="বন্ধ করুন"
            >
              <MaterialIcon name="close" className="text-[20px]" />
            </button>
            <div className="relative max-h-[78vh] bg-neutral-100">
              <Image
                src={active.imageSrc}
                alt={active.imageAlt}
                width={900}
                height={1400}
                className="mx-auto max-h-[78vh] w-auto object-contain"
              />
            </div>
            <p className="px-4 py-3 text-sm font-medium text-neutral-900">
              {active.product}
              <span className="ml-2 font-normal text-neutral-500">
                {active.channel}
              </span>
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
