"use client";

import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { Product, ProductBadge } from "../../_data/products/products";
import { MaterialIcon } from "../../_components/common/material-icon";

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
  const isComingSoon = product.status === "coming-soon";

  const discountPct =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
      : null;

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-xl bg-card text-card-foreground product-card-shadow transition-all duration-300",
        "product-card-hover"
      )}
    >
      <div className="relative aspect-4/5 overflow-hidden bg-surface-container-low">
        <Image
          src={product.imageSrc}
          alt={product.imageAlt}
          fill
          className={cn(
            "object-cover transition-transform duration-500 group-hover:scale-105",
            isComingSoon && "opacity-60 grayscale-[35%]"
          )}
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
        />

        {!isComingSoon ? (
          <Button
            type="button"
            variant="ghost"
            className={cn(
              "absolute top-4 right-4 size-10 rounded-full bg-white/90 text-muted-foreground shadow-sm backdrop-blur",
              "hover:bg-white hover:text-red-500 dark:bg-black/30 dark:text-white/70 dark:hover:bg-black/40"
            )}
            aria-label="পছন্দের তালিকায় যুক্ত করুন"
          >
            <MaterialIcon name="favorite" className="text-[22px]" />
          </Button>
        ) : null}

        {isComingSoon ? (
          <Badge className="absolute top-4 left-4 rounded-full bg-on-surface/80 px-3 py-1 text-[10px] tracking-widest text-white uppercase">
            কামিং সুন
          </Badge>
        ) : product.badge ? (
          <Badge
            className={cn(
              "absolute top-4 left-4 rounded-full px-3 py-1 text-[10px] tracking-widest uppercase",
              product.badge === "Best Seller" && "bg-warm-gold text-on-surface",
              product.badge !== "Best Seller" && "bg-primary text-primary-foreground"
            )}
          >
            {BADGE_LABEL[product.badge]}
          </Badge>
        ) : null}

        {!isComingSoon ? (
          <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full transition-transform duration-300 group-hover:translate-y-0">
            <Button className="h-11 w-full rounded-lg font-label-md tracking-wider uppercase shadow-lg">
              কার্টে যুক্ত করুন
            </Button>
          </div>
        ) : null}
      </div>

      <div className="p-6">
        <h3 className="font-headline-sm text-[18px] text-primary">{product.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{product.subtitle}</p>

        <div className="mt-4 flex items-center gap-3">
          {isComingSoon ? (
            <span className="text-sm font-semibold text-muted-foreground">
              মূল্য শীঘ্রই জানানো হবে
            </span>
          ) : (
            <>
              <span className="text-xl font-bold text-primary">{formatPrice(product.price)}</span>
              {product.compareAtPrice ? (
                <>
                  <span className="text-sm text-muted-foreground line-through">
                    {formatPrice(product.compareAtPrice)}
                  </span>
                  {discountPct ? (
                    <span className="text-xs font-bold text-red-500">-{discountPct}%</span>
                  ) : null}
                </>
              ) : null}
              {product.unitLabel ? (
                <span className="text-xs font-medium text-muted-foreground">{product.unitLabel}</span>
              ) : null}
            </>
          )}
        </div>

        <div className="mt-5 flex items-center gap-3">
          <Link
            href={`/products/${product.slug}`}
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "h-10 flex-1 rounded-lg bg-transparent text-primary hover:bg-surface-container-low"
            )}
          >
            {isComingSoon ? "বিস্তারিত দেখুন" : "বিস্তারিত"}
          </Link>
          {!isComingSoon ? (
            <Button
              type="button"
              variant="secondary"
              className="h-10 rounded-lg px-4"
              aria-label="কার্টে যুক্ত করুন"
            >
              <MaterialIcon name="add_shopping_cart" className="text-[20px]" />
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
