import Link from "next/link";

import type { CategorySection } from "@/lib/mart-api/categories";
import { isContentActive } from "@/lib/mart-mock/visibility";

import { MaterialIcon } from "../common/material-icon";
import { CategoryNav } from "./category-nav";

export function CategoryRail({ section }: { section: CategorySection }) {
  const tiles = section.tiles.filter(isContentActive);
  if (tiles.length === 0) return null;

  return (
    // On large screens the rail is pinned to the hero's height (absolute inset-0 inside the grid
    // cell) so a long category list scrolls inside it instead of stretching the hero.
    <div className="relative min-w-0">
      <aside
        className="flex h-full flex-col rounded-2xl border border-neutral-200/90 bg-white px-3 pt-2 pb-3 shadow-[0_1px_2px_rgba(16,24,40,0.04)] sm:rounded-3xl sm:p-4 lg:absolute lg:inset-0 dark:border-white/10 dark:bg-[#121816]"
        aria-labelledby="home-categories-heading"
      >
        <div className="mb-1 flex shrink-0 items-center justify-between gap-3 px-1 sm:mb-2">
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

        <CategoryNav tiles={tiles} />

        <Link
          href="/products"
          className="mt-3 hidden h-10 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 lg:inline-flex dark:bg-white dark:text-neutral-950"
        >
          সব প্রোডাক্ট
        </Link>
      </aside>
    </div>
  );
}
