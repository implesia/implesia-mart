"use client";

import Image from "next/image";
import { useState } from "react";

import { cn } from "@/lib/utils";

type GalleryImage = { src: string; alt: string };

export function ProductGallery({
  badge,
  images,
}: {
  badge?: string;
  images: GalleryImage[];
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = images[activeIndex] ?? images[0];

  if (!active) return null;

  return (
    <div className="flex flex-col gap-4 md:flex-row-reverse md:gap-6">
      <div className="min-w-0 flex-1">
        <div className="product-zoom group relative overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-low">
          <Image
            src={active.src}
            alt={active.alt}
            width={1400}
            height={1400}
            className="h-[320px] w-full object-contain object-center p-4 transition-transform duration-700 ease-in-out sm:h-[420px] md:h-[520px] md:object-cover md:p-0 lg:h-[640px]"
            priority
          />
          {badge ? (
            <div className="absolute top-4 left-4 sm:top-6 sm:left-6">
              <span className="rounded-full bg-warm-gold px-3 py-1.5 text-label-sm tracking-widest text-white shadow-lg sm:px-4">
                {badge}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {images.length > 1 ? (
        <div className="custom-scrollbar flex gap-3 overflow-x-auto pb-1 md:max-h-[640px] md:flex-col md:gap-4 md:overflow-y-auto md:pb-0">
          {images.map((img, index) => {
            const selected = index === activeIndex;
            return (
              <button
                key={`${img.src}-${index}`}
                type="button"
                className={cn(
                  "h-20 w-20 shrink-0 overflow-hidden rounded-lg border bg-surface-container transition-colors sm:h-24 sm:w-24",
                  selected
                    ? "border-2 border-primary"
                    : "border-outline-variant/30 hover:border-primary",
                )}
                onClick={() => setActiveIndex(index)}
                aria-label={`ছবি ${index + 1}`}
                aria-current={selected}
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  width={96}
                  height={96}
                  className="h-full w-full object-cover"
                />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
