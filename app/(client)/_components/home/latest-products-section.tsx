import Link from "next/link";

import { ProductCard } from "../../products/_components/product-card";
import { products, productsHref } from "../../_data/products/products";
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

export function LatestProductsSection() {
  return (
    <section
      className="bg-[#f5f6f8] pb-6 sm:pb-8 dark:bg-background"
      aria-labelledby="latest-products-heading"
    >
      <Container className="px-4 sm:px-6 lg:px-8">
        <div className="grid items-start gap-4 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[248px_minmax(0,1fr)]">
          <aside className="flex min-w-0 flex-col gap-3">
            <p className="text-xs font-semibold tracking-[0.14em] text-neutral-950 uppercase dark:text-white">
              রিকমেন্ডেড প্রোডাক্ট
            </p>
            <ProductCard product={recommended} />
          </aside>

          <div className="min-w-0">
            <div className="mb-3 flex items-center justify-between gap-4 sm:mb-4">
              <h2
                id="latest-products-heading"
                className="text-lg font-semibold tracking-tight text-neutral-950 sm:text-xl dark:text-white"
              >
                সর্বশেষ প্রোডাক্ট
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
              {latestProducts.map((product) => (
                <li key={product.id} className="min-w-0">
                  <ProductCard product={product} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
}
