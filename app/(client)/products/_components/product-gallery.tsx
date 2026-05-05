"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

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

  const thumbs = useMemo(() => images.slice(1), [images]);

  return (
    <div className="flex flex-col gap-6 md:flex-row-reverse">
      <div className="flex-1">
        <div className="product-zoom group relative overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-low">
          <Image
            src={active.src}
            alt={active.alt}
            width={1400}
            height={1400}
            className="h-[520px] w-full cursor-crosshair object-cover transition-transform duration-700 ease-in-out md:h-[700px]"
            priority
          />
          {badge ? (
            <div className="absolute top-6 left-6">
              <span className="rounded-full bg-warm-gold px-4 py-1.5 text-label-sm tracking-widest text-white shadow-lg">
                {badge}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="custom-scrollbar flex gap-4 overflow-x-auto pb-2 md:max-h-[700px] md:flex-col md:overflow-y-auto md:pb-0">
        {thumbs.map((img, idx) => {
          const realIndex = idx + 1;
          const selected = realIndex === activeIndex;
          return (
            <button
              key={img.src}
              type="button"
              className={cn(
                "h-24 w-24 shrink-0 overflow-hidden rounded-lg border bg-surface-container transition-colors",
                selected
                  ? "border-2 border-primary"
                  : "border-outline-variant/30 hover:border-primary",
              )}
              onClick={() => setActiveIndex(realIndex)}
              aria-label={`View image ${realIndex + 1}`}
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
    </div>
  );
}
