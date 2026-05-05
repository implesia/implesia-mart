"use client";

import Image from "next/image";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";

type RelatedProduct = {
  id: string;
  title: string;
  priceLabel: string;
  imageSrc: string;
  imageAlt: string;
};

function ArrowButton({ dir }: { dir: "prev" | "next" }) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon-lg"
      className="rounded-full border-outline-variant/30 hover:bg-surface-container"
      aria-label={dir === "prev" ? "Previous" : "Next"}
    >
      <MaterialIcon name={dir === "prev" ? "west" : "east"} />
    </Button>
  );
}

export function RelatedProducts({ items }: { items: RelatedProduct[] }) {
  return (
    <section className="mt-xl">
      <div className="mb-10 flex items-center justify-between">
        <h2 className="font-headline-md">You May Also Like</h2>
        <div className="flex gap-2">
          <ArrowButton dir="prev" />
          <ArrowButton dir="next" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
        {items.map((p) => (
          <div key={p.id} className="group cursor-pointer">
            <div className="relative mb-4 aspect-3/4 overflow-hidden rounded-2xl bg-surface-container-low shadow-sm transition-all duration-500 group-hover:shadow-xl">
              <Image
                src={p.imageSrc}
                alt={p.imageAlt}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                sizes="(max-width: 768px) 100vw, 25vw"
              />
              <Button
                type="button"
                size="icon-lg"
                className={cn(
                  "absolute bottom-4 right-4 size-12 translate-y-12 rounded-full bg-white shadow-lg opacity-0 transition-all duration-300",
                  "group-hover:translate-y-0 group-hover:opacity-100"
                )}
                aria-label="Add to cart"
              >
                <MaterialIcon name="add_shopping_cart" className="text-primary" />
              </Button>
            </div>
            <h3 className="mb-1 font-label-md text-on-surface">{p.title}</h3>
            <p className="text-on-surface-variant">{p.priceLabel}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

