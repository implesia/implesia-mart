"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";
import type { ProductDetail } from "../../_data/products/product-details";

function formatPrice(value: number) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export function ProductInfo({ product }: { product: ProductDetail }) {
  return (
    <div className="flex flex-col">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-label-md tracking-[0.2em] text-primary uppercase">
          {product.tagline}
        </span>
        <div className="flex items-center gap-1 text-tertiary">
          <MaterialIcon name="star" filled className="text-sm" />
          <span className="text-label-sm text-outline">
            {product.rating.value.toFixed(1)} ({product.rating.count} Reviews)
          </span>
        </div>
      </div>

      <h1 className="mb-4 font-display-lg text-on-background">{product.title}</h1>

      <div className="mb-8 flex items-baseline gap-4">
        <span className="font-headline-md text-on-background">
          {formatPrice(product.price)}
        </span>
        <span className="rounded-full bg-surface-container px-3 py-1 font-label-md text-outline">
          {product.stockLabel}
        </span>
      </div>

      <p className="mb-10 text-body-md leading-relaxed text-on-surface-variant">
        {product.description}
      </p>

      <div className="mb-12 space-y-8">
        <div>
          <label className="mb-4 block font-label-md text-on-background">
            Select Color
          </label>
          <div className="flex gap-4">
            {product.colorOptions.map((opt, idx) => (
              <button
                key={opt.id}
                type="button"
                className={cn(
                  "h-10 w-10 rounded-full p-0.5 transition-transform active:scale-90",
                  idx === 0 ? "border-2 border-primary" : "border border-outline-variant/50 hover:border-primary"
                )}
                aria-label={opt.name}
              >
                <span
                  className="block h-full w-full rounded-full"
                  style={{ backgroundColor: opt.swatch }}
                />
              </button>
            ))}
          </div>
          <p className="mt-2 text-label-sm text-outline">
            Selected: {product.colorOptions[0]?.name}
          </p>
        </div>

        <div>
          <label className="mb-4 block font-label-md text-on-background">
            Material Details
          </label>
          <div className="grid grid-cols-2 gap-4">
            {product.materialDetails.map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-4"
              >
                <span className="mb-1 block text-label-sm text-outline">
                  {item.label}
                </span>
                <span className="font-label-md text-on-surface">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-10 flex flex-col gap-4">
        <Button className="h-auto w-full rounded-full py-5 text-label-md shadow-xl hover:-translate-y-[2px] hover:shadow-2xl active:scale-95">
          <MaterialIcon name="shopping_bag" className="mr-2 text-[22px]" />
          Add to Cart
        </Button>
        <Button
          variant="secondary"
          className="h-auto w-full rounded-full bg-warm-gold py-5 text-label-md text-white shadow-lg hover:-translate-y-[2px] hover:shadow-xl active:scale-95"
        >
          Buy Now
        </Button>
      </div>

      <Separator className="my-6 bg-outline-variant/30" />

      <div className="space-y-4">
        {product.delivery.map((d) => (
          <div key={d.title} className="flex items-start gap-4">
            <MaterialIcon name={d.icon} className="text-primary" />
            <div>
              <p className="font-label-md text-on-surface">{d.title}</p>
              <p className="text-label-sm text-outline">{d.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

