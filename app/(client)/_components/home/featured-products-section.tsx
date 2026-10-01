"use client";

import Link from "next/link";

import { productsForSlugs } from "@/lib/mart-mock/home-sections";
import { useAdminProducts, useHomeSections } from "@/lib/mart-mock/hooks";

import { ProductCard } from "../../products/_components/product-card";
import { Container } from "../common/container";
import { MaterialIcon } from "../common/material-icon";

export function FeaturedProductsSection() {
  const { featured } = useHomeSections();
  const adminProducts = useAdminProducts();
  const hidden = new Set(
    (adminProducts ?? []).filter((product) => !product.published).map((product) => product.slug),
  );
  const featuredProducts = productsForSlugs(featured.slugs).filter((product) => !hidden.has(product.slug));
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
              {featured.heading}
            </h2>
            <Link
              href={featured.viewAllHref || "/products"}
              className="inline-flex shrink-0 items-center gap-0.5 text-sm text-neutral-500 transition-colors hover:text-neutral-950"
            >
              {featured.viewAllLabel}
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
