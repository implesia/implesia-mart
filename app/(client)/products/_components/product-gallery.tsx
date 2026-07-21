"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";
import type { ProductGalleryItem } from "../../_data/products/product-media";

export function ProductGallery({
  badge,
  images,
}: {
  badge?: string;
  images: ProductGalleryItem[];
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const active = images[activeIndex] ?? images[0];

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (active?.type === "video") {
      void video.play().catch(() => {
        // Autoplay may be blocked; controls remain available.
      });
      return;
    }

    video.pause();
  }, [active]);

  if (!active) return null;

  const isVideo = active.type === "video";

  return (
    <div className="flex w-full min-w-0 flex-col gap-3 sm:gap-4 lg:flex-row-reverse lg:items-start lg:gap-4">
      {/* Main stage — fixed aspect so tall/collage images cannot blow the layout */}
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            "relative w-full overflow-hidden rounded-xl border border-outline-variant/30",
            "bg-surface-container-low sm:rounded-2xl",
            "aspect-square sm:aspect-4/5 lg:aspect-auto lg:h-[min(640px,70vh)]",
          )}
        >
          {isVideo ? (
            <video
              key={active.src}
              ref={videoRef}
              src={active.src}
              poster={active.poster}
              controls
              playsInline
              muted
              loop
              preload="metadata"
              className="absolute inset-0 h-full w-full bg-black object-contain"
              aria-label={active.alt}
            />
          ) : (
            <Image
              src={active.src}
              alt={active.alt}
              fill
              className="object-contain object-center p-2 sm:p-3"
              /* Inline style required: vinext's next/image shim injects
               * objectFit: "cover" inline on fill images, which beats the
               * Tailwind class. Explicit style wins over the shim default. */
              style={{ objectFit: "contain", objectPosition: "center" }}
              priority={activeIndex === 0}
              sizes="(max-width: 1024px) 100vw, 55vw"
            />
          )}

          {badge ? (
            <div className="pointer-events-none absolute top-3 left-3 z-10 sm:top-4 sm:left-4">
              <span className="rounded-full bg-warm-gold px-2.5 py-1 text-[10px] font-semibold tracking-wide text-white shadow-md sm:px-3 sm:text-xs">
                {badge}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {images.length > 1 ? (
        <div
          className={cn(
            "flex w-full gap-2 overflow-x-auto overscroll-x-contain pb-1",
            "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            "lg:w-20 lg:shrink-0 lg:flex-col lg:gap-2.5 lg:overflow-y-auto lg:overflow-x-hidden lg:pb-0",
            "lg:max-h-[min(640px,70vh)]",
          )}
          role="listbox"
          aria-label="প্রোডাক্ট ছবি"
        >
          {images.map((item, index) => {
            const selected = index === activeIndex;
            const thumbSrc =
              item.type === "video" ? (item.poster ?? item.src) : item.src;

            return (
              <button
                key={`${item.type}-${item.src}-${index}`}
                type="button"
                role="option"
                aria-selected={selected}
                className={cn(
                  "relative aspect-square w-18 shrink-0 overflow-hidden rounded-lg border bg-surface-container transition-colors",
                  "sm:w-20 lg:w-full",
                  selected
                    ? "border-2 border-primary ring-1 ring-primary/20"
                    : "border-outline-variant/30 hover:border-primary/60",
                )}
                onClick={() => setActiveIndex(index)}
                aria-label={
                  item.type === "video" ? `ভিডিও — ${item.alt}` : `ছবি ${index + 1}`
                }
              >
                <Image
                  src={thumbSrc}
                  alt=""
                  fill
                  className="object-cover object-center"
                  sizes="80px"
                />

                {item.type === "video" ? (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/35">
                    <span className="flex size-7 items-center justify-center rounded-full bg-white/95 text-primary shadow-sm">
                      <MaterialIcon name="play_arrow" className="text-[20px]" />
                    </span>
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
