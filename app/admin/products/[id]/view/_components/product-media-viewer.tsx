"use client";

import Image from "next/image";
import { useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import type { ProductGalleryImage } from "@/lib/mart-mock/product-content";
import { cn } from "@/lib/utils";

type MediaSlide = {
  id: string;
  kind: "image" | "video" | "youtube";
  src: string;
  youtubeId?: string;
  thumbnail?: string;
  alt: string;
};

export function ProductMediaViewer({
  title,
  imageSrc,
  imageAlt,
  gallery,
}: {
  title: string;
  imageSrc: string;
  imageAlt?: string;
  gallery: ProductGalleryImage[];
}) {
  const slides: MediaSlide[] = [];
  if (imageSrc) {
    slides.push({
      id: "main",
      kind: "image",
      src: imageSrc,
      alt: imageAlt || title,
    });
  }
  for (const item of gallery) {
    if (item.kind === "youtube" && item.youtubeId) {
      slides.push({
        id: item.id,
        kind: "youtube",
        src: item.src,
        youtubeId: item.youtubeId,
        thumbnail: item.thumbnail,
        alt: item.alt || title,
      });
    } else if (item.src && item.src !== imageSrc) {
      slides.push({
        id: item.id,
        kind: item.kind === "video" ? "video" : "image",
        src: item.src,
        thumbnail: item.thumbnail,
        alt: item.alt || title,
      });
    }
  }

  const [activeId, setActiveId] = useState(slides[0]?.id ?? "");
  const active = slides.find((s) => s.id === activeId) ?? slides[0] ?? null;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-slate-900">Media Gallery</h2>
        <span className="text-xs font-medium text-slate-500 tabular-nums">
          {slides.length} {slides.length === 1 ? "item" : "items"}
        </span>
      </div>

      {!active ? (
        <div className="grid aspect-[4/3] place-items-center rounded-xl bg-slate-50 text-slate-400">
          <div className="text-center">
            <MaterialIcon name="image" className="text-[36px]" />
            <p className="mt-1 text-xs font-medium">No media uploaded</p>
          </div>
        </div>
      ) : (
        <>
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-slate-200/80 bg-slate-50">
            {active.kind === "youtube" && active.youtubeId ? (
              <iframe
                src={`https://www.youtube.com/embed/${encodeURIComponent(active.youtubeId)}`}
                title={active.alt}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full border-0"
              />
            ) : active.kind === "video" ? (
              <video
                src={active.src}
                poster={active.thumbnail}
                controls
                className="h-full w-full object-contain bg-black"
              />
            ) : (
              <Image
                src={active.src}
                alt={active.alt}
                fill
                sizes="(min-width: 1024px) 420px, 100vw"
                className="object-contain"
              />
            )}
          </div>

          {slides.length > 1 ? (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {slides.map((slide) => {
                const selected = slide.id === active.id;
                const thumbSrc =
                  slide.kind === "image"
                    ? slide.src
                    : slide.thumbnail ||
                      (slide.youtubeId
                        ? `https://img.youtube.com/vi/${encodeURIComponent(slide.youtubeId)}/hqdefault.jpg`
                        : "");
                return (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => setActiveId(slide.id)}
                    className={cn(
                      "relative size-16 shrink-0 overflow-hidden rounded-lg border bg-slate-100 transition",
                      selected
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-slate-200 opacity-75 hover:opacity-100",
                    )}
                    title={slide.alt}
                  >
                    {thumbSrc ? (
                      <Image
                        src={thumbSrc}
                        alt=""
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="grid h-full w-full place-items-center text-slate-400">
                        <MaterialIcon name="videocam" className="text-[20px]" />
                      </span>
                    )}
                    {slide.kind !== "image" ? (
                      <span className="absolute right-1 bottom-1 grid size-5 place-items-center rounded-full bg-black/70 text-white">
                        <MaterialIcon name="play_arrow" className="text-[14px]" />
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
