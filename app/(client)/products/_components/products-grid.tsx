"use client";

import { ProductCard } from "./product-card";
import type { Product } from "../../_data/products/catalog-meta";

type ProductsGridProps = {
  products: Product[];
};

export function ProductsGrid({ products }: ProductsGridProps) {
  return (
    <section aria-labelledby="products-grid-heading" className="w-full min-w-0">
    {/* Cards use h3; this keeps the outline h1 -> h2 -> h3. */}
    <h2 id="products-grid-heading" className="sr-only">প্রোডাক্ট তালিকা</h2>
    <div className="grid w-full min-w-0 grid-cols-1 gap-3 min-[360px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
      {products.map((product, index) => (
        <ProductCard key={product.id} product={product} priority={index === 0} />
      ))}
    </div>
    </section>
  );
}
