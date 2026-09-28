import Image from "next/image";
import Link from "next/link";

import {
  products,
  productsHref,
  type Product,
} from "../../_data/products/products";
import { Container } from "../common/container";
import { MaterialIcon } from "../common/material-icon";

function productBySlug(slug: string) {
  const product = products.find((item) => item.slug === slug);
  if (!product) throw new Error(`Missing product: ${slug}`);
  return product;
}

const recommended = productBySlug("sunset-rainbow-projection-lamp");

const latestProducts = [
  "ai-face-tracking-phone-holder",
  "slim-power-bank-10000mah",
  "bluetooth-neckband-earphone",
  "magnetic-car-phone-holder",
  "baby-comfort-top-shorts-set",
  "womens-daily-wear-dress",
  "fast-charging-3in1-cable",
  "galaxy-projector-humidifier",
].map(productBySlug);

function money(value: number) {
  return `৳${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function discountLabel(product: Product) {
  if (!product.compareAtPrice || product.compareAtPrice <= product.price)
    return null;
  const pct = Math.round(
    ((product.compareAtPrice - product.price) / product.compareAtPrice) * 100,
  );
  return `-${pct}%`;
}

export function LatestProductsSection() {
  return (
    <section
      className="bg-[#f5f6f8] pb-6 sm:pb-8 dark:bg-background"
      aria-labelledby="latest-products-heading"
    >
      <Container className="px-4 sm:px-6 lg:px-8">
        <div className="grid items-stretch gap-4 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[248px_minmax(0,1fr)]">
          <article className="flex flex-col rounded-xl border-2 border-[#8ec5ff] bg-white px-4 py-5 text-center dark:border-sky-400/40 dark:bg-[#121816]">
            <p className="text-xs font-semibold tracking-[0.14em] text-neutral-950 uppercase dark:text-white">
              Recommended Product
            </p>
            <Link
              href={`/products/${recommended.slug}`}
              className="group mt-4 flex flex-1 flex-col"
            >
              <span className="relative mx-auto block min-h-40 w-full max-w-[200px] flex-1">
                <Image
                  src={recommended.imageSrc}
                  alt={recommended.imageAlt}
                  fill
                  sizes="200px"
                  className="object-contain transition-transform duration-300 group-hover:scale-[1.03]"
                />
              </span>
              <span className="mt-4 block line-clamp-2 text-sm text-neutral-800 dark:text-white/85">
                {recommended.title}
              </span>
              <span className="mt-1 block text-base font-semibold text-neutral-950 dark:text-white">
                {money(recommended.price)}
              </span>
            </Link>
            <Link
              href={`/products/${recommended.slug}`}
              className="mx-auto mt-4 inline-flex h-10 items-center justify-center rounded-md bg-neutral-950 px-8 text-xs font-semibold tracking-wide text-white uppercase transition-colors hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-white/90"
            >
              Buy Now
            </Link>
          </article>

          <div>
            <div className="mb-3 flex items-center justify-between gap-4 sm:mb-4">
              <h2
                id="latest-products-heading"
                className="text-lg font-semibold tracking-tight text-neutral-950 sm:text-xl dark:text-white"
              >
                Latest Products
              </h2>
              <Link
                href={productsHref({ view: "latest" })}
                className="inline-flex shrink-0 items-center gap-0.5 text-sm text-neutral-500 transition-colors hover:text-neutral-950 dark:text-white/60 dark:hover:text-white"
              >
                View All
                <MaterialIcon name="chevron_right" className="text-[18px]" />
              </Link>
            </div>

            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {latestProducts.map((product) => {
                const discount = discountLabel(product);
                return (
                  <li key={product.id}>
                    <Link
                      href={`/products/${product.slug}`}
                      className="group block h-full rounded-xl border border-neutral-200/90 bg-white p-2.5 transition-colors hover:border-neutral-300 sm:p-3 dark:border-white/10 dark:bg-[#121816] dark:hover:border-white/20"
                    >
                      <span className="relative block aspect-square">
                        {discount ? (
                          <span className="absolute top-1 left-1 z-10 rounded-sm bg-neutral-950 px-1.5 py-0.5 text-[10px] leading-none font-semibold text-white">
                            {discount}
                          </span>
                        ) : null}
                        <Image
                          src={product.imageSrc}
                          alt=""
                          fill
                          sizes="(max-width: 640px) 42vw, 18vw"
                          className="object-contain p-1 transition-transform duration-300 group-hover:scale-[1.03]"
                        />
                        {product.status === "coming-soon" ? (
                          <span className="absolute inset-x-1.5 bottom-1.5 rounded-sm bg-neutral-950/85 py-1 text-center text-[10px] font-medium text-white sm:text-[11px]">
                            Out of Stock
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-2 block truncate text-[13px] text-neutral-700 dark:text-white/80">
                        {product.title}
                      </span>
                      <span className="mt-1 block text-sm">
                        {product.compareAtPrice ? (
                          <span className="mr-1.5 text-xs text-neutral-400 line-through">
                            {money(product.compareAtPrice)}
                          </span>
                        ) : null}
                        <span className="font-semibold text-neutral-950 dark:text-white">
                          {money(product.price)}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
}
