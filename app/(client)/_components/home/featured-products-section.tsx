import Image from "next/image";
import Link from "next/link";

import { productsHref } from "../../_data/products/products";
import { bestSellingProducts } from "../../_data/home/home";
import { Container } from "../common/container";
import { MaterialIcon } from "../common/material-icon";

const featuredProducts = bestSellingProducts.slice(0, 6);

function formatFeaturedPrice(value: number) {
  return `৳${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function FeaturedProductsSection() {
  return (
    <section
      className="bg-[#f5f6f8] pb-6 sm:pb-8 dark:bg-background"
      aria-labelledby="featured-products-heading"
    >
      <Container className="px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-neutral-200/90 bg-white px-3 py-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] sm:px-5 sm:py-5 dark:border-white/10 dark:bg-[#121816]">
          <div className="relative mb-4 flex items-center justify-end sm:mb-5">
            <h2
              id="featured-products-heading"
              className="pointer-events-none absolute left-1/2 w-max -translate-x-1/2 text-center text-lg font-semibold tracking-tight text-neutral-950 sm:text-xl dark:text-white"
            >
              Featured Products
            </h2>
            <Link
              href={productsHref({ view: "featured" })}
              className="relative z-10 inline-flex items-center gap-0.5 text-sm text-neutral-500 transition-colors hover:text-neutral-950 dark:text-white/60 dark:hover:text-white"
            >
              View All
              <MaterialIcon name="chevron_right" className="text-[18px]" />
            </Link>
          </div>

          <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-6">
            {featuredProducts.map((product) => (
              <li key={product.id}>
                <Link
                  href={`/products/${product.slug}`}
                  className="group block h-full rounded-lg border border-neutral-200 bg-white p-2 transition-colors hover:border-neutral-300 sm:p-2.5 dark:border-white/10 dark:bg-transparent dark:hover:border-white/20"
                >
                  <div className="relative aspect-square overflow-hidden">
                    {product.badge ? (
                      <span className="absolute top-1 left-1 z-10 rounded-sm bg-[#e10600] px-1.5 py-0.5 text-[10px] leading-none font-semibold text-white">
                        {product.badge === "Best Seller"
                          ? "Best Seller"
                          : product.badge === "New"
                            ? "New"
                            : "Limited"}
                      </span>
                    ) : null}
                    <Image
                      src={product.imageSrc}
                      alt={product.imageAlt}
                      fill
                      sizes="(max-width: 640px) 46vw, (max-width: 1024px) 30vw, 16vw"
                      className="object-contain p-1 transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  </div>
                  <p className="mt-2 truncate text-[13px] text-neutral-800 dark:text-white/85">
                    {product.name}
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-neutral-950 dark:text-white">
                    {product.unitLabel ? (
                      <span className="mr-1 text-xs font-normal text-neutral-500">
                        {product.unitLabel}
                      </span>
                    ) : null}
                    {formatFeaturedPrice(product.price)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
