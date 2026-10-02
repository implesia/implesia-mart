"use client";

import Image from "next/image";
import Link from "next/link";

import { useHomeSections } from "@/lib/mart-mock/hooks";

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
      className="inline-flex shrink-0 items-center gap-0.5 text-sm text-neutral-500 transition-colors hover:text-neutral-950 dark:text-white/60 dark:hover:text-white"
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
      <div className="mb-4 flex items-center justify-between gap-4">
        <h3 className="text-lg font-semibold tracking-tight text-neutral-950 sm:text-xl">
          {heading}
        </h3>
        <ViewAll href={href} />
      </div>
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {items.map((product) => (
          <li key={product.id} className="min-w-0">
            <ProductCard product={product} />
          </li>
        ))}
      </ul>
    </article>
  );
}

export function CategoryShowcaseSection({ products }: { products: Product[] }) {
  const { showcase } = useHomeSections();

  return (
    <section
      className="bg-[#f5f6f8] pb-5 sm:pb-6 dark:bg-background"
      aria-label="ক্যাটাগরি অনুযায়ী প্রোডাক্ট"
    >
      <Container className="space-y-4 px-4 sm:px-6 lg:px-8">
        {showcase.map((row) => {
          const items = (
            row.id === "gadgets" || row.id === "fashion"
              ? products.filter((product) => product.categoryId === row.id)
              : products
          ).slice(0, 4);
          if (items.length === 0) return null;
          return (
            <CategoryProductRow
              key={row.id}
              heading={row.heading}
              href={row.href}
              items={items}
            />
          );
        })}
      </Container>
    </section>
  );
}
