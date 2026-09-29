"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useCatalogStockStatus } from "@/lib/mart-mock/hooks";

import { MaterialIcon } from "../../_components/common/material-icon";
import type { Product, ProductBadge } from "../../_data/products/products";
import { categoryLabels } from "../../_data/products/products";
import { useCart } from "../../_providers/cart-provider";

type ProductCardProps = {
  product: Product;
};

function formatPrice(value: number) {
  return `৳${value.toLocaleString("en-US")}`;
}

const BADGE_LABEL: Record<ProductBadge, string> = {
  New: "নতুন",
  "Best Seller": "বেস্ট সেলার",
  Limited: "লিমিটেড",
};

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const stockStatus = useCatalogStockStatus(product.slug, product.status);
  const isComingSoon = stockStatus === "coming-soon";
  const isSoldOut = stockStatus === "sold-out";
  const isFashion = product.categoryId === "fashion";

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const ok = addItem(product.slug, 1, { openDrawer: true });
    if (!ok) return;
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1400);
  }

  const discountPct =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(
          ((product.compareAtPrice - product.price) / product.compareAtPrice) * 100,
        )
      : null;

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-xl sm:rounded-2xl",
        "bg-surface-container-lowest dark:bg-surface-container",
        "ring-1 ring-outline-variant/30 dark:ring-white/10",
        "shadow-[0_4px_16px_rgba(6,47,44,0.03)] dark:shadow-none",
        "transition-[box-shadow,ring-color] duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]",
        "hover:ring-primary/30",
        "hover:shadow-[0_12px_32px_rgba(6,47,44,0.08)] dark:hover:shadow-[0_12px_32px_rgba(0,0,0,0.28)]",
      )}
    >
      <Link
        href={`/products/${product.slug}`}
        className="relative block aspect-4/5 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
        aria-label={`${product.title} দেখুন`}
      >
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_20%,rgba(43,192,181,0.14),transparent_60%)] dark:bg-[radial-gradient(ellipse_70%_60%_at_50%_20%,rgba(61,212,200,0.1),transparent_60%)]"
        />
        <div className="absolute inset-0 bg-surface-container-low dark:bg-background/50" />

        <Image
          src={product.imageSrc}
          alt={product.imageAlt}
          fill
          className={cn(
            "relative z-[1] object-contain p-2 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.02] sm:p-3 md:p-3.5",
            (isComingSoon || isSoldOut) && "opacity-55 grayscale-[40%]",
          )}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
        />

        <div className="absolute top-2 left-2 z-10 flex max-w-[calc(100%-2.75rem)] flex-wrap gap-1 sm:top-2.5 sm:left-2.5 sm:gap-1.5">
          {isComingSoon ? (
            <span className="rounded-full bg-on-surface/85 px-2 py-0.5 text-[9px] font-semibold tracking-wide text-white backdrop-blur-sm sm:px-2.5 sm:py-1 sm:text-[10px]">
              শীঘ্রই আসছে
            </span>
          ) : isSoldOut ? (
            <span className="rounded-full bg-on-surface/85 px-2 py-0.5 text-[9px] font-semibold tracking-wide text-white backdrop-blur-sm sm:px-2.5 sm:py-1 sm:text-[10px]">
              শেষ
            </span>
          ) : product.badge ? (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[9px] font-semibold tracking-wide uppercase shadow-sm sm:px-2.5 sm:py-1 sm:text-[10px]",
                product.badge === "Best Seller"
                  ? "bg-warm-gold text-on-surface"
                  : "bg-primary text-on-primary",
              )}
            >
              {BADGE_LABEL[product.badge]}
            </span>
          ) : null}
        </div>

        {discountPct && !isComingSoon && !isSoldOut ? (
          <span className="absolute top-2 right-2 z-10 rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm sm:top-2.5 sm:right-2.5 sm:px-2 sm:py-1 sm:text-[10px]">
            -{discountPct}%
          </span>
        ) : null}

        {/* Desktop hover cue only — touch devices use the card CTA */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 hidden bg-linear-to-t from-black/40 via-black/8 to-transparent px-3 pb-3 pt-8 opacity-0 transition-opacity duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:opacity-100 md:block">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold text-on-surface shadow-sm dark:bg-surface-container/95">
            <MaterialIcon name="visibility" className="text-[14px] text-primary" />
            বিস্তারিত দেখুন
          </span>
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 p-2 sm:gap-2 sm:p-3 md:p-3.5">
        <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
          <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold text-primary sm:px-2 sm:text-[10px] md:text-[11px]">
            {categoryLabels[product.categoryId]}
          </span>
          {isFashion ? (
            <span className="hidden rounded-full bg-warm-gold/15 px-1.5 py-0.5 text-[9px] font-semibold text-on-surface sm:inline-flex sm:px-2 sm:text-[10px] md:text-[11px]">
              হাতে তৈরি
            </span>
          ) : (
            <span className="hidden rounded-full bg-surface-container px-1.5 py-0.5 text-[9px] font-medium text-on-surface-variant sm:inline-flex sm:px-2 sm:text-[10px] md:text-[11px] dark:bg-background/40">
              ক্যাশ অন ডেলিভারি
            </span>
          )}
        </div>

        <div className="min-w-0">
          <Link href={`/products/${product.slug}`} className="block">
            <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug text-on-surface transition-colors group-hover:text-primary sm:text-sm md:text-[15px]">
              {product.title}
            </h3>
          </Link>
          <p className="mt-0.5 line-clamp-1 text-[11px] leading-relaxed text-on-surface-variant sm:mt-1 sm:text-xs">
            {product.subtitle}
          </p>
        </div>

        <div className="mt-auto space-y-1.5 pt-0.5 sm:space-y-2 sm:pt-1">
          <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 sm:gap-x-2">
            {product.unitLabel ? (
              <span className="text-[10px] font-medium text-on-surface-variant sm:text-[11px]">
                {product.unitLabel}
              </span>
            ) : null}
            <span className="text-base font-bold tabular-nums text-primary sm:text-lg md:text-xl">
              {formatPrice(product.price)}
            </span>
            {product.compareAtPrice && !isComingSoon ? (
              <span className="text-[11px] tabular-nums text-on-surface-variant line-through sm:text-xs">
                {formatPrice(product.compareAtPrice)}
              </span>
            ) : null}
          </div>

          {isComingSoon ? (
            <Link
              href={`/products/${product.slug}`}
              className={cn(
                "inline-flex h-9 w-full items-center justify-center gap-1 rounded-lg text-xs font-semibold sm:h-10 sm:gap-1.5 sm:rounded-xl sm:text-sm",
                "border border-outline-variant/40 text-primary",
                "transition-colors hover:border-primary/40 hover:bg-primary/5",
                "dark:border-white/12",
              )}
            >
              <span className="sm:hidden">বিস্তারিত</span>
              <span className="hidden sm:inline">বিস্তারিত দেখুন</span>
              <MaterialIcon name="arrow_forward" className="text-[14px] sm:text-[16px]" />
            </Link>
          ) : isSoldOut ? (
            <Button
              type="button"
              disabled
              className="h-9 w-full rounded-lg text-xs font-semibold sm:h-10 sm:rounded-xl sm:text-sm"
            >
              শেষ
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleAddToCart}
              className={cn(
                "h-9 w-full rounded-lg text-xs font-semibold shadow-sm sm:h-10 sm:rounded-xl sm:text-sm",
                "transition-transform duration-200 ease-out active:scale-[0.99]",
                justAdded && "bg-primary/90",
              )}
            >
              <MaterialIcon
                name={justAdded ? "check_circle" : "add_shopping_cart"}
                className="mr-1 text-[16px] sm:mr-1.5 sm:text-[18px]"
              />
              <span className="sm:hidden">{justAdded ? "যোগ" : "কার্টে"}</span>
              <span className="hidden sm:inline">
                {justAdded ? "যোগ হয়েছে" : "কার্টে যোগ করুন"}
              </span>
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
