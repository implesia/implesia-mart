"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";

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
      className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-neutral-100 px-3 text-center text-xs text-neutral-500 dark:bg-white/5 dark:text-neutral-400"
    >
      <MaterialIcon name="broken_image" className="text-3xl text-neutral-400" />
      <span>Image could not be loaded</span>
    </div>
  );
}

export function ProductGallery({
  title,
  badge,
  badges = [],
  images: items,
}: {
  title: string;
  /** Status pill (coming soon / sold out), shown first. */
  badge?: string;
  /** Admin badges, in display order. */
  badges?: StoreBadge[];
  images: ProductGalleryItem[];
}) {
  const images = items.map((item) => (item.alt?.trim() ? item : { ...item, alt: title }));
  const [activeIndex, setActiveIndex] = useState(0);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const thumbs = useRef<Array<HTMLButtonElement | null>>([]);
  const active = images[activeIndex] ?? images[0];
  const playable = active?.type === "video" || active?.type === "youtube";
  const showPoster = playable && Boolean(active?.poster) && playingIndex !== activeIndex;
  const autoplay = playable && playingIndex === activeIndex;

  function select(index: number) {
    const next = (index + images.length) % images.length;
    setActiveIndex(next);
    setPlayingIndex(null);
    setIsZoomed(false);
    thumbs.current[next]?.focus();
  }

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!containerRef.current || playable) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setZoomPos({ x, y });
  }

  function handleMouseEnter() {
    if (!playable) {
      setIsZoomed(true);
    }
  }

  function handleMouseLeave() {
    setIsZoomed(false);
    setZoomPos({ x: 50, y: 50 });
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

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightboxOpen) return;
    function onKeyDown(e: globalThis.KeyboardEvent) {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowRight") select(activeIndex + 1);
      if (e.key === "ArrowLeft") select(activeIndex - 1);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lightboxOpen, activeIndex]);

  return (
    <>
      <div className="flex w-full min-w-0 flex-col gap-3 sm:gap-4 lg:flex-row-reverse lg:items-start lg:gap-4">
        {/* Main Display Area */}
        <div className="min-w-0 flex-1">
          <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={cn(
              "group relative w-full overflow-hidden rounded-2xl border border-neutral-200/90",
              "bg-gradient-to-b from-neutral-50/90 to-neutral-100/50 dark:border-white/10 dark:from-white/[0.04] dark:to-white/[0.01]",
              "aspect-square sm:aspect-4/5 lg:aspect-auto lg:h-[min(620px,68vh)]",
              !playable && "cursor-crosshair",
              "shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none transition-shadow hover:shadow-lg",
            )}
          >
            {/* Playable or Main Image */}
            {showPoster && active ? (
              <button
                type="button"
                onClick={() => setPlayingIndex(activeIndex)}
                aria-label={`${active.alt} — Play video`}
                className="group/poster absolute inset-0 h-full w-full bg-black focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-primary"
              >
                <Image
                  src={active.poster ?? ""}
                  alt={active.alt}
                  fill
                  priority={activeIndex === 0}
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 55vw"
                />
                <span className="absolute inset-0 flex items-center justify-center bg-black/25 transition-colors group-hover/poster:bg-black/35">
                  <span className="flex size-16 items-center justify-center rounded-full bg-white/95 text-neutral-900 shadow-xl transition-transform group-hover/poster:scale-110 sm:size-20">
                    <MaterialIcon name="play_arrow" className="text-[36px] sm:text-[44px] text-primary" />
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
            ) : active?.src ? (
              <div className="relative size-full overflow-hidden">
                <Image
                  key={active.src}
                  src={active.src}
                  alt={active.alt}
                  fill
                  priority={activeIndex === 0}
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  className={cn(
                    "object-contain p-3 sm:p-5 md:p-6 pointer-events-none will-change-transform",
                  )}
                  style={{
                    transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                    transform: isZoomed ? "scale(2.25)" : "scale(1)",
                    transition: isZoomed
                      ? "transform 0.08s ease-out"
                      : "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                />
              </div>
            ) : (
              <FailedImage label={`${title} — No image`} />
            )}

            {/* Badges */}
            {badge || badges.length > 0 ? (
              <div className="pointer-events-none absolute top-3 left-3 z-10 flex max-w-[calc(100%-4rem)] flex-wrap gap-1.5 sm:top-4 sm:left-4">
                {badge ? (
                  <span className="rounded-full bg-neutral-900/90 px-3 py-1 text-[10px] font-bold tracking-wide text-white shadow-sm backdrop-blur-md">
                    {badge}
                  </span>
                ) : null}
                {badges.map((item) => (
                  <span
                    key={item.slug}
                    className={cn(
                      "max-w-full truncate rounded-full px-3 py-1 text-[10px] font-bold tracking-wide uppercase shadow-sm backdrop-blur-md",
                      badgeToneClass(item.tone),
                    )}
                  >
                    {item.name}
                  </span>
                ))}
              </div>
            ) : null}

            {/* Top-Right Action Controls */}
            {!playable && active?.src ? (
              <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setLightboxOpen(true)}
                  aria-label="View full image"
                  className="flex size-9 items-center justify-center rounded-full bg-white/90 text-neutral-700 shadow-sm backdrop-blur-md transition-all hover:bg-white hover:text-neutral-950 hover:scale-105 active:scale-95 dark:bg-neutral-900/80 dark:text-neutral-300 dark:hover:bg-neutral-900 dark:hover:text-white"
                >
                  <MaterialIcon name="fullscreen" className="text-[18px]" />
                </button>
              </div>
            ) : null}

            {/* Prev & Next Chevrons on Main Frame */}
            {images.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    select(activeIndex - 1);
                  }}
                  aria-label="Previous image"
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 z-10 flex size-9.5 items-center justify-center rounded-full bg-white/90 text-neutral-800 shadow-md backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:scale-105 active:scale-95 dark:bg-neutral-900/80 dark:text-white"
                >
                  <MaterialIcon name="chevron_left" className="text-[20px]" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    select(activeIndex + 1);
                  }}
                  aria-label="Next image"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 z-10 flex size-9.5 items-center justify-center rounded-full bg-white/90 text-neutral-800 shadow-md backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:scale-105 active:scale-95 dark:bg-neutral-900/80 dark:text-white"
                >
                  <MaterialIcon name="chevron_right" className="text-[20px]" />
                </button>
              </>
            ) : null}

            {/* Bottom Floating Info: Zoom Prompt and Image Counter */}
            <div className="pointer-events-none absolute bottom-3 inset-x-3 z-10 flex items-center justify-between">
              {images.length > 1 ? (
                <span className="rounded-full bg-black/55 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-xs backdrop-blur-md">
                  {activeIndex + 1} / {images.length}
                </span>
              ) : <div />}

              {!playable && (
                <div
                  className={cn(
                    "flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white shadow-md backdrop-blur-md transition-opacity duration-200",
                    isZoomed ? "opacity-0" : "opacity-100",
                  )}
                >
                  <MaterialIcon name="zoom_in" className="text-[14px] text-primary" />
                  <span>Hover to zoom</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Thumbnails Sidebar / Strip */}
        {images.length > 1 ? (
          <div
            className={cn(
              "flex w-full gap-2 overflow-x-auto overscroll-x-contain pb-1",
              "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
              "lg:w-22 lg:shrink-0 lg:flex-col lg:gap-2.5 lg:overflow-y-auto lg:overflow-x-hidden lg:pb-0",
              "lg:max-h-[min(620px,68vh)]",
            )}
            role="listbox"
            aria-label={`${title} image gallery`}
            aria-orientation="horizontal"
          >
            {images.map((item, index) => {
              const selected = index === activeIndex;
              const name = galleryControlName(title, index, item.type);
              const thumbSrc = item.type === "video" ? item.poster ?? "" : item.src;

              return (
                <button
                  key={`${item.type}-${item.src}-${index}`}
                  ref={(node) => {
                    thumbs.current[index] = node;
                  }}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  aria-label={name}
                  tabIndex={selected ? 0 : -1}
                  className={cn(
                    "group relative aspect-square w-16 shrink-0 overflow-hidden rounded-xl border bg-white p-1",
                    "transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                    "sm:w-18 lg:w-full",
                    selected
                      ? "border-2 border-primary ring-2 ring-primary/25 shadow-xs"
                      : "border-neutral-200/90 opacity-75 hover:opacity-100 hover:border-neutral-400 dark:border-white/10 dark:bg-white/5",
                  )}
                  onClick={() => select(index)}
                  onKeyDown={(event) => onThumbKeyDown(event, index)}
                >
                  {thumbSrc ? (
                    <Image
                      src={thumbSrc}
                      alt={name}
                      fill
                      className="object-contain p-1"
                      sizes="80px"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center bg-neutral-100 text-neutral-400">
                      <MaterialIcon name="image" className="text-xl" />
                    </div>
                  )}

                  {item.type !== "image" ? (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/35 backdrop-blur-2xs">
                      <span className="flex size-6 items-center justify-center rounded-full bg-white/95 text-neutral-900 shadow-sm">
                        <MaterialIcon name="play_arrow" className="text-[16px] text-primary" />
                      </span>
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      {/* Fullscreen Lightbox Modal */}
      {lightboxOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Image lightbox"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            aria-label="Close lightbox"
            className="absolute top-4 right-4 z-50 flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <MaterialIcon name="close" className="text-2xl" />
          </button>

          {images.length > 1 ? (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  select(activeIndex - 1);
                }}
                aria-label="Previous image"
                className="absolute left-4 top-1/2 -translate-y-1/2 z-50 flex size-12 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25"
              >
                <MaterialIcon name="chevron_left" className="text-3xl" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  select(activeIndex + 1);
                }}
                aria-label="Next image"
                className="absolute right-4 top-1/2 -translate-y-1/2 z-50 flex size-12 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25"
              >
                <MaterialIcon name="chevron_right" className="text-3xl" />
              </button>
            </>
          ) : null}

          <div
            className="relative h-[85vh] w-[90vw] max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            {active?.src ? (
              <Image
                src={active.src}
                alt={active.alt}
                fill
                priority
                className="object-contain"
                sizes="90vw"
              />
            ) : null}
          </div>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-1 text-sm font-semibold text-white backdrop-blur-md">
            {activeIndex + 1} / {images.length}
          </div>
        </div>
      ) : null}
    </>
  );
}
