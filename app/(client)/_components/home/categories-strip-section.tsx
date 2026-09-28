import Image from "next/image";
import Link from "next/link";

import { products, productsHref } from "../../_data/products/products";
import { Container } from "../common/container";
import { MaterialIcon } from "../common/material-icon";

const stripIds = [
  "tws-earbuds",
  "ai-tracking-holder",
  "sunset-lamp",
  "neckband",
  "power-bank",
  "smart-ring",
  "womens-gorgeous-gown",
  "custom-baby-frock",
] as const;

const stripItems = stripIds.flatMap((id) => {
  const product = products.find((item) => item.id === id);
  return product ? [product] : [];
});

export function CategoriesStripSection() {
  return (
    <section
      className="bg-[#f5f6f8] pb-6 sm:pb-8 dark:bg-background"
      aria-labelledby="home-categories-heading"
    >
      <Container className="px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-neutral-200/90 bg-white px-4 py-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] sm:px-6 sm:py-5 dark:border-white/10 dark:bg-[#121816]">
          <div className="mb-5 flex items-center justify-between gap-4 sm:mb-6">
            <h2
              id="home-categories-heading"
              className="text-lg font-semibold tracking-tight text-neutral-950 sm:text-xl dark:text-white"
            >
              Categories
            </h2>
            <Link
              href={productsHref()}
              className="inline-flex shrink-0 items-center gap-0.5 text-sm text-neutral-500 transition-colors hover:text-neutral-950 dark:text-white/60 dark:hover:text-white"
            >
              View All
              <MaterialIcon name="chevron_right" className="text-[18px]" />
            </Link>
          </div>

          <ul className="flex items-start justify-between gap-4 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {stripItems.map((product) => (
              <li
                key={product.id}
                className="w-[4.75rem] shrink-0 sm:w-[5.75rem]"
              >
                <Link
                  href={`/products/${product.slug}`}
                  className="group flex flex-col items-center gap-2.5"
                >
                  <span className="relative grid size-14 place-items-center sm:size-16">
                    <Image
                      src={product.imageSrc}
                      alt=""
                      fill
                      sizes="64px"
                      className="object-contain transition-transform duration-300 group-hover:scale-105"
                    />
                  </span>
                  <span className="w-full truncate text-center text-xs text-neutral-600 dark:text-white/70">
                    {product.title}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
