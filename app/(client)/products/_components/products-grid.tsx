"use client";

import { ProductCard } from "./product-card";
import type { Product } from "../../_data/products/products";

type ProductsGridProps = {
  products: Product[];
};

export function ProductsGrid({ products }: ProductsGridProps) {
  return (
    <div className="grid w-full grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 md:gap-5 lg:grid-cols-2 lg:gap-6 xl:grid-cols-4 xl:gap-5 2xl:gap-6">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
