"use client";

import Image from "next/image";
import Link from "next/link";

import type { ShowcasePublic } from "@/lib/mart-api/showcase";

import { ProductCard } from "../../products/_components/product-card";
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

function ViewAll({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="-mr-1 inline-flex min-h-11 shrink-0 items-center gap-0.5 rounded-md px-1 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-950 focus-visible:outline-2 focus-visible:outline-primary dark:text-white/60 dark:hover:text-white"
    >
      সব দেখুন
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
            ব্র্যান্ড
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
  heading,
  href,
  items,
}: {
  heading: string;
  href: string;
  items: Product[];
}) {
  return (
    <article className="rounded-2xl border border-neutral-200/90 bg-white px-3 py-4 sm:px-5 sm:py-5">
      <div className="mb-2 flex items-center justify-between gap-4 sm:mb-4">
        <h3 className="text-lg leading-snug font-semibold tracking-tight text-neutral-950 sm:text-xl">
          {heading}
        </h3>
        <ViewAll href={href} />
      </div>
      <ul className="grid grid-cols-2 gap-2.5 min-[400px]:gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {items.map((product) => (
          <li key={product.id} className="min-w-0">
            <ProductCard product={product} />
          </li>
        ))}
      </ul>
    </article>
  );
}

export function CategoryShowcaseSection({
  section,
  products,
}: {
  section: ShowcasePublic;
  products: Product[];
}) {
  const byId = new Map(products.map((product) => [product.id, product]));
  const rows = section.rows
    .map((row) => ({
      ...row,
      items: row.productIds
        .map((id) => byId.get(id))
        .filter((product): product is Product => product != null),
    }))
    .filter((row) => row.items.length > 0);
  if (rows.length === 0) return null;

  return (
    <section
      className="bg-[#f5f6f8] pb-5 sm:pb-6 dark:bg-background"
      aria-label="ক্যাটাগরি অনুযায়ী প্রোডাক্ট"
    >
      <Container className="space-y-4 px-4 sm:px-6 lg:px-8">
        {rows.map((row) => (
          <CategoryProductRow key={row.key} heading={row.heading} href={row.href} items={row.items} />
        ))}
      </Container>
    </section>
  );
}
