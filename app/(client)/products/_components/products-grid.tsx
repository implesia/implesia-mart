"use client";

import { ProductCard } from "./product-card";
import type { Product } from "../../_data/products/catalog-meta";

type ProductsGridProps = {
  products: Product[];
};

export function ProductsGrid({ products }: ProductsGridProps) {
  return (
    <section aria-labelledby="products-grid-heading" className="w-full min-w-0">
      <h2 id="products-grid-heading" className="sr-only">Product List</h2>
      <div className="grid w-full min-w-0 grid-cols-2 gap-3 sm:gap-3.5 md:gap-4 md:grid-cols-3 xl:grid-cols-4">
        {products.map((product, index) => (
          <ProductCard key={product.id} product={product} priority={index === 0} />
        ))}
      </div>
    </section>
  );
}
