"use client";

import Image from "next/image";
import { useRef, useState, type KeyboardEvent } from "react";

import { badgeToneClass, type StoreBadge } from "@/lib/mart-api/badge-rules";
import { galleryControlName } from "@/lib/mart-api/product-page";
import { youtubeEmbed } from "@/lib/mart-api/youtube";
import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";
import type { ProductGalleryItem } from "../../_data/products/product-media";

function FailedImage({ label }: { label: string }) {
  return (
    <div
      role="img"
      aria-label={label}
      className="absolute inset-0 flex items-center justify-center bg-surface-container px-3 text-center text-sm text-on-surface-variant"
    >
      ছবি লোড হয়নি
    </div>
  );
}

function GalleryFrame({
  item,
  priority,
  sizes,
  fit,
}: {
  item: ProductGalleryItem;
  priority?: boolean;
  sizes: string;
  fit: "contain" | "cover";
}) {
  const [failed, setFailed] = useState(false);
  if (!item.src || failed) {
    if (fit === "cover") {
      return (
        <div aria-hidden className="absolute inset-0 bg-surface-container" />
      );
    }
    return <FailedImage label={item.alt} />;
  }
  return (
    <Image
      src={item.src}
      alt={fit === "cover" ? "" : item.alt}
      fill
      className={cn(
        "object-center",
        fit === "contain" ? "object-contain p-2 sm:p-3" : "object-cover",
      )}
      style={
        fit === "contain"
          ? { objectFit: "contain", objectPosition: "center" }
          : { objectFit: "cover", objectPosition: "center" }
      }
      priority={priority}
      sizes={sizes}
      onError={() => setFailed(true)}
    />
  );
}

export function ProductGallery({
  title,
  badge,
  badges = [],
  images,
}: {
  title: string;
  /** Status pill (coming soon / sold out), shown first. */
  badge?: string;
  /** Admin badges, in display order. */
  badges?: StoreBadge[];
  images: ProductGalleryItem[];
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  // The item whose custom thumbnail was pressed; the player replaces the thumbnail.
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const thumbs = useRef<Array<HTMLButtonElement | null>>([]);
  const active = images[activeIndex] ?? images[0];
  const playable = active?.type === "video" || active?.type === "youtube";
  const showPoster = playable && Boolean(active?.poster) && playingIndex !== activeIndex;
  const autoplay = playable && playingIndex === activeIndex;

  function select(index: number) {
    const next = (index + images.length) % images.length;
    setActiveIndex(next);
    setPlayingIndex(null);
    thumbs.current[next]?.focus();
  }

  function onThumbKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      select(index + 1);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      select(index - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      select(0);
    } else if (event.key === "End") {
      event.preventDefault();
      select(images.length - 1);
    }
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-3 sm:gap-4 lg:flex-row-reverse lg:items-start lg:gap-4">
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            "relative w-full overflow-hidden rounded-xl border border-outline-variant/30",
            "bg-surface-container-low sm:rounded-2xl",
            "aspect-square sm:aspect-4/5 lg:aspect-auto lg:h-[min(640px,70vh)]",
          )}
        >
          {showPoster && active ? (
            <button
              type="button"
              onClick={() => setPlayingIndex(activeIndex)}
              aria-label={`${active.alt} — ভিডিও চালান`}
              className="group absolute inset-0 h-full w-full bg-black focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-[#0b5e56]"
            >
              <GalleryFrame
                key={active.poster}
                item={{ ...active, src: active.poster ?? "" }}
                priority={activeIndex === 0}
                sizes="(max-width: 1024px) 100vw, 55vw"
                fit="cover"
              />
              <span className="absolute inset-0 flex items-center justify-center bg-black/25 transition-colors group-hover:bg-black/35">
                <span className="flex size-16 items-center justify-center rounded-full bg-white/95 text-[#042422] shadow-lg sm:size-20">
                  <MaterialIcon name="play_arrow" className="text-[40px] sm:text-[48px]" />
                </span>
              </span>
            </button>
          ) : active?.type === "youtube" && active.youtubeId ? (
            <iframe
              key={active.youtubeId}
              src={`${youtubeEmbed(active.youtubeId)}${autoplay ? "&autoplay=1" : ""}`}
              title={active.alt}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              className="absolute inset-0 h-full w-full border-0 bg-black"
            />
          ) : active?.type === "video" ? (
            <video
              key={active.src}
              src={active.src}
              poster={active.poster}
              controls
              autoPlay={autoplay}
              playsInline
              muted
              loop
              preload="metadata"
              className="absolute inset-0 h-full w-full bg-black object-contain"
              aria-label={active.alt}
            />
          ) : active ? (
            <GalleryFrame
              key={active.src}
              item={active}
              priority={activeIndex === 0}
              sizes="(max-width: 1024px) 100vw, 55vw"
              fit="contain"
            />
          ) : (
            <FailedImage label={`${title} — ছবি নেই`} />
          )}

          {badge || badges.length > 0 ? (
            <div className="pointer-events-none absolute top-3 left-3 z-10 flex max-w-[calc(100%-1.5rem)] flex-wrap gap-1.5 sm:top-4 sm:left-4 sm:max-w-[calc(100%-2rem)]">
              {badge ? (
                <span className="rounded-full bg-warm-gold px-2.5 py-1 text-[10px] font-semibold tracking-wide text-[#042422] shadow-md sm:px-3 sm:text-xs">
                  {badge}
                </span>
              ) : null}
              {badges.map((item) => (
                <span
                  key={item.slug}
                  className={cn(
                    "max-w-full truncate rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide shadow-md sm:px-3 sm:text-xs",
                    badgeToneClass(item.tone),
                  )}
                >
                  {item.name}
                </span>
              ))}
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
          aria-label={`${title} এর ছবি`}
          aria-orientation="horizontal"
        >
          {images.map((item, index) => {
            const selected = index === activeIndex;
            const name = galleryControlName(title, index, item.type);
            const thumb: ProductGalleryItem =
              item.type === "video"
                ? { ...item, src: item.poster ?? "", alt: name }
                : { ...item, alt: name };
            // An uploaded video has no poster: its first frame is the thumbnail.
            const frameThumb = item.type === "video" && !item.poster;
            return (
              <button
                key={`${item.type}-${item.src}-${index}`}
                ref={(node) => {
                  thumbs.current[index] = node;
                }}
                type="button"
                role="option"
                aria-selected={selected}
                aria-current={selected ? "true" : undefined}
                aria-label={name}
                tabIndex={selected ? 0 : -1}
                className={cn(
                  "relative aspect-square w-16 shrink-0 overflow-hidden rounded-lg border bg-surface-container",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b5e56]",
                  "sm:w-20 lg:w-full",
                  selected
                    ? "border-2 border-primary ring-1 ring-primary/30"
                    : "border-outline-variant/30 hover:border-primary/60",
                )}
                onClick={() => {
                  setActiveIndex(index);
                  setPlayingIndex(null);
                }}
                onKeyDown={(event) => onThumbKeyDown(event, index)}
              >
                {frameThumb ? (
                  <video
                    src={`${item.src}#t=0.1`}
                    muted
                    playsInline
                    preload="metadata"
                    aria-hidden
                    tabIndex={-1}
                    className="pointer-events-none absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <GalleryFrame item={thumb} sizes="80px" fit="cover" />
                )}
                {item.type !== "image" ? (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/35">
                    <span className="flex size-7 items-center justify-center rounded-full bg-white/95 text-[#042422] shadow-sm">
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
