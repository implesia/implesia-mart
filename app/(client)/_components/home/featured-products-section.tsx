import Link from "next/link";

import type { Product } from "../../_data/products/products";
import type { FeaturedPublic } from "@/lib/mart-api/featured";
import { ProductCard } from "../../products/_components/product-card";
import { Container } from "../common/container";
import { MaterialIcon } from "../common/material-icon";

export function FeaturedProductsSection({
  section,
  products,
}: {
  section: FeaturedPublic;
  products: Product[];
}) {
  const byId = new Map(products.map((product) => [product.id, product]));
  const featuredProducts = section.productIds
    .map((id) => byId.get(id))
    .filter((product): product is Product => product != null);
  if (featuredProducts.length === 0) return null;

  return (
    <section
      className="bg-[#f5f6f8] pb-6 sm:pb-8 dark:bg-background"
      aria-labelledby="featured-products-heading"
    >
      <Container className="px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-neutral-200/90 bg-white px-3 py-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] sm:px-5 sm:py-5 dark:border-white/10 dark:bg-[#121816]">
          <div className="mb-4 flex items-center justify-between gap-3 sm:mb-5">
            <h2
              id="featured-products-heading"
              className="text-lg font-semibold tracking-tight text-neutral-950 sm:text-xl"
            >
              {section.heading}
            </h2>
            <Link
              href={section.viewAllHref || "/products"}
              className="inline-flex shrink-0 items-center gap-0.5 text-sm text-neutral-500 transition-colors hover:text-neutral-950"
            >
              {section.viewAllLabel}
              <MaterialIcon name="chevron_right" className="text-[18px]" />
            </Link>
          </div>

          <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {featuredProducts.map((product) => (
              <li key={product.id} className="min-w-0">
                <ProductCard product={product} />
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
