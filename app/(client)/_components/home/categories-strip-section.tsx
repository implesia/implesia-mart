"use client";

import Image from "next/image";
import Link from "next/link";

import { useHomeSections } from "@/lib/mart-mock/hooks";
import { isContentActive } from "@/lib/mart-mock/visibility";

import { Container } from "../common/container";

export function CategoriesStripSection() {
  const { categories } = useHomeSections();
  const tiles = categories.tiles.filter(isContentActive);
  if (tiles.length === 0) return null;

  return (
    <section
      className="bg-[#f5f6f8] pb-6 sm:pb-8 dark:bg-background"
      aria-labelledby="home-categories-heading"
    >
      <Container className="px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-neutral-200/90 bg-white px-4 py-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] sm:px-6 sm:py-5 dark:border-white/10 dark:bg-[#121816]">
          <h2
            id="home-categories-heading"
            className="mb-4 text-lg font-semibold tracking-tight text-neutral-950 sm:mb-5 sm:text-xl dark:text-white"
          >
            {categories.heading}
          </h2>
          <ul className="grid grid-cols-2 gap-2.5 sm:gap-3">
            {tiles.map((tile) => (
              <li key={tile.id}>
                <Link
                  href={tile.href || "/products"}
                  className="group relative flex min-h-32 overflow-hidden rounded-2xl sm:min-h-56"
                >
                  {tile.imageSrc ? (
                    <Image
                      src={tile.imageSrc}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 50vw, 50vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  ) : null}
                  <span
                    aria-hidden
                    className="absolute inset-0 bg-linear-to-t from-black/75 via-black/25 to-black/10"
                  />
                  <span className="relative z-10 mt-auto px-3 py-3 text-sm font-semibold text-white sm:px-5 sm:py-5 sm:text-2xl">
                    {tile.label}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
