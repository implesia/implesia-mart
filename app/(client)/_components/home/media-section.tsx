"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { canOptimize } from "@/lib/blog-view";
import {
  renderableHomeMedia,
  type HomeMediaPublic,
  type RenderableHomeMedia,
} from "@/lib/home-media-view";

import { MaterialIcon } from "../common/material-icon";
import { Container } from "../common/container";

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b5e56]";

function Still({ src, alt, priority = false }: { src: string; alt: string; priority?: boolean }) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="(max-width: 1024px) 100vw, 896px"
      className="object-cover"
      unoptimized={!canOptimize(src)}
      priority={priority}
    />
  );
}

function PlayBadge() {
  return (
    <span className="absolute inset-0 flex items-center justify-center bg-black/25 transition-colors group-hover:bg-black/35">
      <span className="flex size-16 items-center justify-center rounded-full bg-white/95 text-[#042422] shadow-lg transition-transform group-hover:scale-105 sm:size-20">
        <MaterialIcon name="play_arrow" className="text-[40px] sm:text-[48px]" />
      </span>
    </span>
  );
}

function Media({ view }: { view: RenderableHomeMedia }) {
  const [playing, setPlaying] = useState(false);
  const { media, alt } = view;

  if (media.type === "image") return <Still src={media.src} alt={alt} />;

  if (media.type === "video") {
    return (
      <video
        src={media.src}
        poster={media.poster || undefined}
        controls
        playsInline
        preload="metadata"
        className="absolute inset-0 h-full w-full bg-black object-contain"
        aria-label={alt}
      />
    );
  }

  if (playing) {
    return (
      <iframe
        src={media.embed}
        title={alt}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        className="absolute inset-0 h-full w-full border-0 bg-black"
      />
    );
  }
  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={`${alt} — ভিডিও চালান`}
      className="group absolute inset-0 h-full w-full bg-black focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-[#0b5e56]"
    >
      <Still src={media.thumb} alt="" />
      <PlayBadge />
    </button>
  );
}

function Cta({ cta }: { cta: NonNullable<RenderableHomeMedia["cta"]> }) {
  const className = `inline-flex min-h-11 max-w-full items-center justify-center gap-1.5 rounded-full bg-[#042422] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#0b5e56] dark:bg-white dark:text-[#042422] dark:hover:bg-neutral-200 ${FOCUS}`;
  const body = (
    <>
      <span className="truncate">{cta.label}</span>
      <MaterialIcon name="arrow_forward" className="text-[18px]" />
    </>
  );
  if (cta.external) {
    return (
      <a href={cta.href} className={className} rel="noopener noreferrer">
        {body}
      </a>
    );
  }
  return (
    <Link href={cta.href} className={className}>
      {body}
    </Link>
  );
}

/** The section body; also the admin preview. */
export function HomeMediaView({ view }: { view: RenderableHomeMedia }) {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 text-center sm:mb-8">
        <h2
          id="home-media-heading"
          className="text-2xl font-semibold tracking-tight text-balance text-neutral-950 sm:text-3xl dark:text-white"
        >
          {view.heading}
        </h2>
        {view.subheading ? (
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-neutral-600 sm:text-base dark:text-white/65">
            {view.subheading}
          </p>
        ) : null}
      </div>
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-neutral-100 shadow-sm ring-1 ring-neutral-200/80 sm:rounded-2xl dark:bg-white/5 dark:ring-white/10">
        <Media key={view.media.type === "youtube" ? view.media.id : view.media.src} view={view} />
      </div>
      {view.description || view.cta ? (
        <div className="mt-5 flex flex-col items-center gap-4 text-center sm:mt-6">
          {view.description ? (
            <p className="max-w-2xl text-sm leading-relaxed whitespace-pre-line text-neutral-700 sm:text-base dark:text-white/75">
              {view.description}
            </p>
          ) : null}
          {view.cta ? <Cta cta={view.cta} /> : null}
        </div>
      ) : null}
    </div>
  );
}

/** Admin-managed video/image section above the testimonials; renders nothing unless published. */
export function HomeMediaSection({ section }: { section: HomeMediaPublic | null }) {
  const view = renderableHomeMedia(section);
  if (!view) return null;
  return (
    <section className="bg-white py-8 sm:py-12 dark:bg-background" aria-labelledby="home-media-heading">
      <Container className="px-4 sm:px-6 lg:px-8">
        <HomeMediaView view={view} />
      </Container>
    </section>
  );
}
