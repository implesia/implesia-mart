"use client";

import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { Product, ProductBadge } from "../../_data/products/products";
import { MaterialIcon } from "../../_components/common/material-icon";
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
  const isComingSoon = product.status === "coming-soon";

  function handleAddToCart(e?: React.MouseEvent) {
    e?.preventDefault();
    e?.stopPropagation();
    addItem(product.slug, 1, { openDrawer: true });
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
        "group relative flex h-full flex-col overflow-hidden rounded-xl bg-card text-card-foreground product-card-shadow transition-all duration-300",
        "product-card-hover",
      )}
    >
      <div className="relative aspect-square overflow-hidden bg-surface-container-low">
        <Image
          src={product.imageSrc}
          alt={product.imageAlt}
          fill
          className={cn(
            "object-cover transition-transform duration-500 group-hover:scale-105",
            isComingSoon && "opacity-60 grayscale-35",
          )}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
        />

        {!isComingSoon ? (
          <Button
            type="button"
            variant="ghost"
            className={cn(
              "absolute top-2 right-2 size-8 rounded-full bg-white/90 text-muted-foreground shadow-sm backdrop-blur sm:size-9",
              "hover:bg-white hover:text-red-500 dark:bg-black/30 dark:text-white/70 dark:hover:bg-black/40",
            )}
            aria-label="পছন্দের তালিকায় যুক্ত করুন"
          >
            <MaterialIcon name="favorite" className="text-[18px] sm:text-[20px]" />
          </Button>
        ) : null}

        {isComingSoon ? (
          <Badge className="absolute top-2 left-2 rounded-full bg-on-surface/80 px-2 py-0.5 text-[9px] tracking-wider text-white uppercase sm:px-2.5">
            Out of Stock
          </Badge>
        ) : product.badge ? (
          <Badge
            className={cn(
              "absolute top-2 left-2 rounded-full px-2 py-0.5 text-[9px] tracking-wider uppercase sm:px-2.5",
              product.badge === "Best Seller" && "bg-warm-gold text-on-surface",
              product.badge !== "Best Seller" && "bg-primary text-primary-foreground",
            )}
          >
            {BADGE_LABEL[product.badge]}
          </Badge>
        ) : null}

        {!isComingSoon ? (
          <div className="absolute inset-x-0 bottom-0 hidden p-2 translate-y-full transition-transform duration-300 group-hover:translate-y-0 lg:block">
            <Button
              type="button"
              className="h-9 w-full rounded-lg text-xs font-semibold tracking-wider uppercase shadow-lg"
              onClick={handleAddToCart}
            >
              কার্টে যুক্ত করুন
            </Button>
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-primary sm:text-[15px]">
          {product.title}
        </h3>
        <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{product.subtitle}</p>

        <div className="mt-2 flex flex-wrap items-center gap-1.5 sm:mt-3 sm:gap-2">
          <span className="text-base font-bold text-primary sm:text-lg">
            {formatPrice(product.price)}
          </span>
          {product.compareAtPrice ? (
            <>
              <span className="text-xs text-muted-foreground line-through">
                {formatPrice(product.compareAtPrice)}
              </span>
              {discountPct ? (
                <span className="text-[10px] font-bold text-red-500">-{discountPct}%</span>
              ) : null}
            </>
          ) : null}
        </div>

        <div className="mt-auto flex items-center gap-2 pt-3">
          <Link
            href={`/products/${product.slug}`}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "h-9 flex-1 rounded-lg bg-transparent text-xs text-primary hover:bg-surface-container-low sm:text-sm",
            )}
          >
            {isComingSoon ? "বিস্তারিত" : "বিস্তারিত"}
          </Link>
          {!isComingSoon ? (
            <Button
              type="button"
              variant="secondary"
              className="size-9 shrink-0 rounded-lg p-0"
              aria-label="কার্টে যুক্ত করুন"
              onClick={handleAddToCart}
            >
              <MaterialIcon name="add_shopping_cart" className="text-[18px]" />
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
