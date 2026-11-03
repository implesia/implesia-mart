"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { productPath } from "@/lib/mart-api/product-url";
import { cn } from "@/lib/utils";

import type { Product } from "../../_data/products/products";
import { Container } from "../common/container";
import { MaterialIcon } from "../common/material-icon";

/**
 * Home page Trending strip (right under the hero): light-blue rounded box, one row of
 * product tiles that scrolls sideways (swipe on touch, arrow buttons on wider screens).
 */
export function TrendingSection({ heading, items }: { heading: string; items: Product[] }) {
  const railRef = useRef<HTMLUListElement>(null);
  const [canBack, setCanBack] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const update = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    setCanBack(rail.scrollLeft > 4);
    setCanNext(rail.scrollLeft + rail.clientWidth < rail.scrollWidth - 4);
  }, []);

  useEffect(() => {
    update();
    const rail = railRef.current;
    if (!rail) return;
    const observer = new ResizeObserver(update);
    observer.observe(rail);
    return () => observer.disconnect();
  }, [update, items.length]);

  if (items.length === 0) return null;
  const title = heading.trim() || "Trending";

  function scroll(direction: -1 | 1) {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({ left: direction * Math.max(rail.clientWidth * 0.8, 120), behavior: "smooth" });
  }

  return (
    <section className="bg-[#f5f6f8] pt-4 pb-2 sm:pt-6 dark:bg-background" aria-labelledby="home-trending-heading">
      <Container className="px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-[#eef2fb] px-3 pt-3 pb-4 ring-1 ring-[#dde4f4] sm:px-5 sm:pt-4 sm:pb-5 dark:bg-white/5 dark:ring-white/10">
          <h2
            id="home-trending-heading"
            className="mb-3 px-1 text-lg font-bold tracking-tight text-neutral-950 sm:text-xl dark:text-white"
          >
            {title}
          </h2>
          <div className="relative">
            <ul
              ref={railRef}
              onScroll={update}
              className="flex snap-x snap-mandatory scroll-px-1 gap-3 overflow-x-auto overscroll-x-contain px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-4 [&::-webkit-scrollbar]:hidden"
            >
              {items.map((product) => (
                <li key={product.id} className="w-[84px] shrink-0 snap-start sm:w-[104px]">
                  <Link
                    href={productPath(product)}
                    className="group block rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    <span className="relative block aspect-square overflow-hidden rounded-xl bg-white shadow-[0_1px_2px_rgba(16,24,40,0.06)]">
                      {product.imageSrc ? (
                        <Image
                          src={product.imageSrc}
                          alt={product.imageAlt || product.title}
                          fill
                          sizes="(max-width: 639px) 84px, 104px"
                          className="object-contain p-2 transition-transform duration-300 group-hover:scale-[1.04] motion-reduce:transition-none"
                        />
                      ) : (
                        <span className="grid size-full place-items-center text-neutral-400">
                          <MaterialIcon name="image" className="text-[22px]" />
                        </span>
                      )}
                    </span>
                    <span className="mt-2 line-clamp-2 text-center text-xs leading-snug text-neutral-800 sm:text-[13px] dark:text-white/80">
                      {product.title}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <ArrowButton direction={-1} visible={canBack} onClick={() => scroll(-1)} />
            <ArrowButton direction={1} visible={canNext} onClick={() => scroll(1)} />
          </div>
        </div>
      </Container>
    </section>
  );
}

function ArrowButton({
  direction,
  visible,
  onClick,
}: {
  direction: -1 | 1;
  visible: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
      aria-label={direction === 1 ? "পরের প্রোডাক্ট" : "আগের প্রোডাক্ট"}
      className={cn(
        "absolute top-[42px] z-10 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white text-neutral-800 shadow-md ring-1 ring-neutral-200 transition-opacity hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-primary sm:top-[52px]",
        direction === 1 ? "-right-1 sm:-right-2" : "-left-1 sm:-left-2",
        visible ? "opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      <MaterialIcon name={direction === 1 ? "chevron_right" : "chevron_left"} className="text-[22px]" />
    </button>
  );
}
