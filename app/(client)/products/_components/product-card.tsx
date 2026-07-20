"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  const isComingSoon = product.status === "coming-soon";
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
        "group relative flex h-full flex-col overflow-hidden rounded-2xl",
        "bg-surface-container-lowest dark:bg-surface-container",
        "ring-1 ring-outline-variant/30 dark:ring-white/10",
        "transition-[transform,box-shadow,ring-color] duration-300 ease-out",
        "hover:-translate-y-1.5 hover:ring-primary/35",
        "hover:shadow-[0_18px_44px_rgba(6,47,44,0.12)] dark:hover:shadow-[0_18px_44px_rgba(0,0,0,0.35)]",
      )}
    >
      {/* Media */}
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
            "relative z-[1] object-contain p-3 transition-transform duration-500 ease-out group-hover:scale-[1.04] sm:p-4",
            isComingSoon && "opacity-55 grayscale-[40%]",
          )}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
        />

        {/* Top badges */}
        <div className="absolute top-2.5 left-2.5 z-10 flex max-w-[calc(100%-1.25rem)] flex-wrap gap-1.5">
          {isComingSoon ? (
            <span className="rounded-full bg-on-surface/85 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-white uppercase backdrop-blur-sm">
              কামিং সুন
            </span>
          ) : product.badge ? (
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide uppercase shadow-sm",
                product.badge === "Best Seller"
                  ? "bg-warm-gold text-on-surface"
                  : "bg-primary text-on-primary",
              )}
            >
              {BADGE_LABEL[product.badge]}
            </span>
          ) : null}
        </div>

        {discountPct ? (
          <span className="absolute top-2.5 right-2.5 z-10 rounded-full bg-red-500 px-2 py-1 text-[10px] font-bold text-white shadow-sm">
            -{discountPct}%
          </span>
        ) : null}

        {/* Bottom media cue */}
        <div className="absolute inset-x-0 bottom-0 z-10 bg-linear-to-t from-black/45 via-black/10 to-transparent px-2.5 pb-2.5 pt-8 opacity-0 transition-opacity duration-300 group-hover:opacity-100 sm:px-3 sm:pb-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold text-on-surface shadow-sm dark:bg-surface-container/95 dark:text-on-surface">
            <MaterialIcon name="visibility" className="text-[14px] text-primary" />
            বিস্তারিত দেখুন
          </span>
        </div>
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2.5 p-3.5 sm:gap-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary sm:text-[11px]">
            {categoryLabels[product.categoryId]}
          </span>
          {isFashion ? (
            <span className="rounded-full bg-warm-gold/15 px-2 py-0.5 text-[10px] font-semibold text-on-surface sm:text-[11px]">
              হাতে তৈরি
            </span>
          ) : (
            <span className="rounded-full bg-surface-container px-2 py-0.5 text-[10px] font-medium text-on-surface-variant sm:text-[11px] dark:bg-background/40">
              COD
            </span>
          )}
        </div>

        <div className="min-w-0">
          <Link href={`/products/${product.slug}`} className="block">
            <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-on-surface transition-colors group-hover:text-primary sm:text-[15px]">
              {product.title}
            </h3>
          </Link>
          <p className="mt-1 line-clamp-1 text-xs leading-relaxed text-on-surface-variant">
            {product.subtitle}
          </p>
        </div>

        <div className="mt-auto space-y-3 pt-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            {product.unitLabel ? (
              <span className="text-[11px] font-medium text-on-surface-variant">
                {product.unitLabel}
              </span>
            ) : null}
            <span className="text-lg font-bold tabular-nums text-primary sm:text-xl">
              {formatPrice(product.price)}
            </span>
            {product.compareAtPrice ? (
              <span className="text-xs tabular-nums text-on-surface-variant line-through">
                {formatPrice(product.compareAtPrice)}
              </span>
            ) : null}
          </div>

          {isComingSoon ? (
            <Link
              href={`/products/${product.slug}`}
              className={cn(
                "inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl text-sm font-semibold",
                "border border-outline-variant/40 text-primary",
                "transition-colors hover:border-primary/40 hover:bg-primary/5",
                "dark:border-white/12",
              )}
            >
              বিস্তারিত দেখুন
              <MaterialIcon name="arrow_forward" className="text-[16px]" />
            </Link>
          ) : (
            <Button
              type="button"
              onClick={handleAddToCart}
              className={cn(
                "h-10 w-full rounded-xl text-sm font-semibold shadow-sm",
                "transition-transform active:scale-[0.98]",
                justAdded && "bg-primary/90",
              )}
            >
              <MaterialIcon
                name={justAdded ? "check_circle" : "add_shopping_cart"}
                className="mr-1.5 text-[18px]"
              />
              {justAdded ? "যোগ হয়েছে" : "কার্টে যোগ করুন"}
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
