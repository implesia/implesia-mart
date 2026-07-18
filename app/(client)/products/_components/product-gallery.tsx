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
    <div className="flex flex-col gap-4 md:flex-row-reverse md:gap-6">
      <div className="min-w-0 flex-1">
        <div className="product-zoom group relative overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-low">
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
              className="h-[320px] w-full bg-black object-contain sm:h-[420px] md:h-[520px] lg:h-[640px]"
              aria-label={active.alt}
            />
          ) : (
            <Image
              src={active.src}
              alt={active.alt}
              width={1400}
              height={1400}
              className="h-[320px] w-full object-contain object-center p-4 transition-transform duration-700 ease-in-out sm:h-[420px] md:h-[520px] md:object-cover md:p-0 lg:h-[640px]"
              priority={activeIndex === 0}
            />
          )}

          {badge ? (
            <div className="pointer-events-none absolute top-4 left-4 z-10 sm:top-6 sm:left-6">
              <span className="rounded-full bg-warm-gold px-3 py-1.5 text-label-sm tracking-widest text-white shadow-lg sm:px-4">
                {badge}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {images.length > 1 ? (
        <div className="custom-scrollbar flex gap-3 overflow-x-auto pb-1 md:max-h-[640px] md:flex-col md:gap-4 md:overflow-y-auto md:pb-0">
          {images.map((item, index) => {
            const selected = index === activeIndex;
            const thumbSrc =
              item.type === "video" ? (item.poster ?? item.src) : item.src;

            return (
              <button
                key={`${item.type}-${item.src}-${index}`}
                type="button"
                className={cn(
                  "relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border bg-surface-container transition-colors sm:h-24 sm:w-24",
                  selected
                    ? "border-2 border-primary"
                    : "border-outline-variant/30 hover:border-primary",
                )}
                onClick={() => setActiveIndex(index)}
                aria-label={
                  item.type === "video" ? `ভিডিও — ${item.alt}` : `ছবি ${index + 1}`
                }
                aria-current={selected}
              >
                <Image
                  src={thumbSrc}
                  alt={item.alt}
                  width={96}
                  height={96}
                  className="h-full w-full object-cover"
                />

                {item.type === "video" ? (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/35">
                    <span className="flex size-8 items-center justify-center rounded-full bg-white/95 text-primary shadow-sm">
                      <MaterialIcon name="play_arrow" className="text-[22px]" />
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
