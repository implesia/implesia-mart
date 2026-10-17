import Image from "next/image";
import Link from "next/link";

import type { CategorySection, CategoryTile } from "@/lib/mart-api/categories";
import { isContentActive } from "@/lib/mart-mock/visibility";
import { cn } from "@/lib/utils";

import { MaterialIcon } from "../common/material-icon";

export function CategoryRail({ section }: { section: CategorySection }) {
  const tiles = section.tiles.filter(isContentActive);
  if (tiles.length === 0) return null;

  return (
    <aside
      className="flex h-full flex-col rounded-2xl border border-neutral-200/90 bg-white px-3 pt-2 pb-3 shadow-[0_1px_2px_rgba(16,24,40,0.04)] sm:rounded-3xl sm:p-4 dark:border-white/10 dark:bg-[#121816]"
      aria-labelledby="home-categories-heading"
    >
      <div className="mb-1 flex items-center justify-between gap-3 px-1 sm:mb-3">
        <h2
          id="home-categories-heading"
          className="text-base font-semibold tracking-tight text-neutral-950 dark:text-white"
        >
          {section.heading}
        </h2>
        <Link
          href="/products"
          className="-mr-1 inline-flex min-h-11 shrink-0 items-center gap-0.5 rounded-md px-1 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-950 focus-visible:outline-2 focus-visible:outline-primary dark:text-white/60 dark:hover:text-white"
        >
          View All
          <MaterialIcon name="chevron_right" className="text-[18px]" />
        </Link>
      </div>

      {/* Phones/tablets: compact snap rail; ~4.5 tiles visible at 360px so further items read as scrollable. */}
      <ul className="-mx-3 flex snap-x snap-mandatory scroll-px-3 gap-2 overflow-x-auto overscroll-x-contain px-3 pt-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:-mx-4 sm:scroll-px-4 sm:gap-3 sm:px-4 lg:hidden [&::-webkit-scrollbar]:hidden">
        {tiles.map((tile) => (
          <li key={tile.id} className="w-[4.5rem] shrink-0 snap-start sm:w-20">
            <CategoryCircle tile={tile} />
          </li>
        ))}
      </ul>

      <ul className="hidden min-h-0 flex-1 flex-col gap-1 lg:flex">
        {tiles.map((tile) => (
          <li key={tile.id}>
            <Link
              href={tile.href || "/products"}
              className="group flex items-center gap-3 rounded-2xl px-2 py-2 transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:hover:bg-white/5"
            >
              <CategoryThumb src={tile.imageSrc} size="size-14" />
              <span className="min-w-0 flex-1 text-sm font-semibold tracking-tight text-neutral-950 transition-colors group-hover:text-primary dark:text-white">
                {tile.label}
              </span>
              <MaterialIcon
                name="chevron_right"
                className="text-[18px] text-neutral-400 transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
              />
            </Link>
          </li>
        ))}
      </ul>
      <Link
        href="/products"
        className="mt-auto hidden h-10 items-center justify-center rounded-full bg-neutral-950 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 lg:inline-flex dark:bg-white dark:text-neutral-950"
      >
        সব প্রোডাক্ট
      </Link>
    </aside>
  );
}

function CategoryCircle({ tile }: { tile: CategoryTile }) {
  return (
    <Link
      href={tile.href || "/products"}
      className="group flex min-h-11 flex-col items-center gap-1.5 rounded-xl py-1 focus-visible:outline-2 focus-visible:outline-primary"
    >
      <CategoryThumb src={tile.imageSrc} size="size-16 sm:size-[4.5rem]" />
      <span className="line-clamp-2 text-center text-xs leading-snug font-semibold tracking-tight text-neutral-950 transition-colors group-hover:text-primary dark:text-white">
        {tile.label}
      </span>
    </Link>
  );
}

function CategoryThumb({ src, size = "size-12" }: { src: string; size?: string }) {
  return (
    <span
      className={cn(
        "relative block shrink-0 overflow-hidden rounded-full bg-neutral-100 shadow-[0_8px_20px_rgba(16,24,40,0.08)] ring-4 ring-white transition duration-300 group-hover:ring-primary/30 dark:bg-white/5 dark:ring-white/10",
        size,
      )}
    >
      {src ? (
        <Image
          src={src}
          alt=""
          fill
          sizes="80px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : null}
    </span>
  );
}
