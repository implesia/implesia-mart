"use client";

import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { Product } from "../../_data/products/products";
import { MaterialIcon } from "../../_components/common/material-icon";

type ProductCardProps = {
  product: Product;
};

function formatPrice(value: number) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export function ProductCard({ product }: ProductCardProps) {
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
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
        />

        <Button
          type="button"
          variant="ghost"
          className={cn(
            "absolute top-4 right-4 size-10 rounded-full bg-white/90 text-muted-foreground shadow-sm backdrop-blur",
            "hover:bg-white hover:text-red-500 dark:bg-black/30 dark:text-white/70 dark:hover:bg-black/40"
          )}
          aria-label="Add to favorites"
        >
          <MaterialIcon name="favorite" className="text-[22px]" />
        </Button>

        {product.badge ? (
          <Badge
            className={cn(
              "absolute top-4 left-4 rounded-full px-3 py-1 text-[10px] tracking-widest uppercase",
              product.badge === "Best Seller" && "bg-warm-gold text-on-surface",
              product.badge !== "Best Seller" && "bg-primary text-primary-foreground"
            )}
          >
            {product.badge}
          </Badge>
        ) : null}

        <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full transition-transform duration-300 group-hover:translate-y-0">
          <Button className="h-11 w-full rounded-lg font-label-md tracking-wider uppercase shadow-lg">
            Quick Add to Cart
          </Button>
        </div>
      </div>

      <div className="p-6">
        <h3 className="font-headline-sm text-[18px] text-primary">{product.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{product.subtitle}</p>

        <div className="mt-4 flex items-center gap-3">
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
        </div>
      </div>
    </article>
  );
}

