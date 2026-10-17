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
        <div>
          <div className="mb-3 flex items-center justify-between gap-3 sm:mb-4">
            <h2
              id="featured-products-heading"
              className="text-lg leading-snug font-semibold tracking-tight text-neutral-950 sm:text-xl"
            >
              {section.heading}
            </h2>
            <Link
              href={section.viewAllHref || "/products"}
              className="-mr-1 inline-flex min-h-11 shrink-0 items-center gap-0.5 rounded-md px-1 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-950 focus-visible:outline-2 focus-visible:outline-primary"
            >
              {section.viewAllLabel}
              <MaterialIcon name="chevron_right" className="text-[18px]" />
            </Link>
          </div>

          <ul className="grid grid-cols-2 gap-2.5 min-[400px]:gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
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
