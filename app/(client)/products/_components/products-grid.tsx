"use client";

import { ProductCard } from "./product-card";
import type { Product } from "../../_data/products/products";

type ProductsGridProps = {
  products: Product[];
};

export function ProductsGrid({ products }: ProductsGridProps) {
  return (
    <div className="grid w-full grid-cols-2 gap-2.5 min-[400px]:gap-3 sm:gap-3.5 md:grid-cols-3 md:gap-4 lg:grid-cols-3 lg:gap-4 xl:grid-cols-4 xl:gap-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
