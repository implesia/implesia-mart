import Image from "next/image";
import Link from "next/link";

import {
  categoryLabels,
  products,
  productsHref,
  type Product,
  type ProductCategoryId,
} from "../../_data/products/products";
import { Container } from "../common/container";
import { MaterialIcon } from "../common/material-icon";

function productBySlug(slug: string) {
  const product = products.find((item) => item.slug === slug);
  if (!product) throw new Error(`Missing product: ${slug}`);
  return product;
}

const brandProducts = [
  "sunset-rainbow-projection-lamp",
  "ai-face-tracking-phone-holder",
  "tws-wireless-earbuds",
  "bluetooth-neckband-earphone",
  "magnetic-car-phone-holder",
  "fast-charging-3in1-cable",
  "slim-power-bank-10000mah",
  "mini-thermal-printer",
  "smart-fitness-ring",
  "galaxy-projector-humidifier",
  "custom-gorgeous-womens-gown",
].map(productBySlug);

const categoryRows: { id: ProductCategoryId; slugs: string[] }[] = [
  {
    id: "gadgets",
    slugs: [
      "sunset-rainbow-projection-lamp",
      "ai-face-tracking-phone-holder",
      "tws-wireless-earbuds",
      "bluetooth-neckband-earphone",
      "slim-power-bank-10000mah",
      "smart-fitness-ring",
    ],
  },
  {
    id: "fashion",
    slugs: [
      "custom-gorgeous-womens-gown",
      "custom-baby-party-frock",
      "baby-comfort-top-shorts-set",
      "womens-daily-wear-dress",
    ],
  },
];

function money(value: number) {
  return `৳${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function ViewAll({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex shrink-0 items-center gap-0.5 text-sm text-neutral-500 transition-colors hover:text-neutral-950 dark:text-white/60 dark:hover:text-white"
    >
      View All
      <MaterialIcon name="chevron_right" className="text-[18px]" />
    </Link>
  );
}

export function BrandsSection() {
  return (
    <section
      className="bg-[#f5f6f8] pb-4 sm:pb-5 dark:bg-background"
      aria-labelledby="home-brands-heading"
    >
      <Container className="px-4 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center justify-between gap-4 sm:mb-5">
          <h2
            id="home-brands-heading"
            className="text-lg font-semibold tracking-tight text-neutral-950 sm:text-xl dark:text-white"
          >
            Brands
          </h2>
          <ViewAll href={productsHref()} />
        </div>
        <ul className="flex items-center justify-between gap-4 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {brandProducts.map((product) => (
            <li key={product.id} className="shrink-0">
              <Link
                href={`/products/${product.slug}`}
                aria-label={product.title}
                className="relative block size-14 overflow-hidden rounded-full border border-neutral-200 bg-white shadow-sm transition-transform hover:scale-105 sm:size-16 dark:border-white/15 dark:bg-[#121816]"
              >
                <Image
                  src={product.imageSrc}
                  alt=""
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

function CategoryProductRow({
  id,
  items,
}: {
  id: ProductCategoryId;
  items: Product[];
}) {
  return (
    <article className="rounded-xl bg-white px-4 py-4 sm:px-5 sm:py-5 dark:bg-[#121816]">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h3 className="text-lg font-semibold tracking-tight text-neutral-950 sm:text-xl dark:text-white">
          {categoryLabels[id]}
        </h3>
        <ViewAll href={productsHref({ category: id })} />
      </div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {items.map((product) => (
          <li key={product.id}>
            <Link href={`/products/${product.slug}`} className="group block">
              <span className="relative block aspect-square">
                <Image
                  src={product.imageSrc}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 42vw, 16vw"
                  className="object-contain transition-transform duration-300 group-hover:scale-[1.03]"
                />
              </span>
              <span className="mt-2 block truncate text-[13px] text-neutral-700 dark:text-white/80">
                {product.title}
              </span>
              <span className="mt-0.5 block text-sm font-medium text-neutral-950 dark:text-white">
                {money(product.price)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </article>
  );
}

export function CategoryShowcaseSection() {
  return (
    <section
      className="bg-[#f5f6f8] pb-5 sm:pb-6 dark:bg-background"
      aria-label="ক্যাটাগরি অনুযায়ী প্রোডাক্ট"
    >
      <Container className="space-y-4 px-4 sm:px-6 lg:px-8">
        {categoryRows.map((row) => (
          <CategoryProductRow
            key={row.id}
            id={row.id}
            items={row.slugs.map(productBySlug)}
          />
        ))}
      </Container>
    </section>
  );
}
