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

const newArrivals = [
  "ai-face-tracking-phone-holder",
  "custom-gorgeous-womens-gown",
  "custom-baby-party-frock",
  "womens-daily-wear-dress",
].map(productBySlug);

const bestSellings = [
  "sunset-rainbow-projection-lamp",
  "ai-face-tracking-phone-holder",
  "custom-gorgeous-womens-gown",
  "custom-baby-party-frock",
  "baby-comfort-top-shorts-set",
  "womens-daily-wear-dress",
].map(productBySlug);

const topRated = [
  "custom-gorgeous-womens-gown",
  "sunset-rainbow-projection-lamp",
  "ai-face-tracking-phone-holder",
  "womens-daily-wear-dress",
  "custom-baby-party-frock",
  "baby-comfort-top-shorts-set",
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

function RankCard({
  title,
  icon,
  items,
  headingId,
  href,
}: {
  title: string;
  icon: string;
  items: Product[];
  headingId: string;
  href: string;
}) {
  return (
    <article className="rounded-xl border border-neutral-200/90 bg-white p-4 sm:p-5 dark:border-white/10 dark:bg-[#121816]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3
          id={headingId}
          className="flex items-center gap-2 text-lg font-semibold tracking-tight text-neutral-950 sm:text-xl dark:text-white"
        >
          <MaterialIcon
            name={icon}
            filled
            className="text-[20px] text-amber-500"
          />
          {title}
        </h3>
        <Link
          href={href}
          className="inline-flex shrink-0 items-center gap-0.5 text-sm text-neutral-500 transition-colors hover:text-neutral-950 dark:text-white/60 dark:hover:text-white"
        >
          View All
          <MaterialIcon name="chevron_right" className="text-[18px]" />
        </Link>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2">
        {items.map((product) => (
          <li key={product.id}>
            <Link
              href={`/products/${product.slug}`}
              className="group flex items-center gap-3"
            >
              <span className="relative size-16 shrink-0">
                <Image
                  src={product.imageSrc}
                  alt=""
                  fill
                  sizes="64px"
                  className="object-contain transition-transform duration-300 group-hover:scale-105"
                />
              </span>
              <span className="min-w-0">
                <span className="line-clamp-2 text-sm text-neutral-800 dark:text-white/85">
                  {product.title}
                </span>
                <span className="mt-1 flex" aria-hidden>
                  {Array.from({ length: 5 }, (_, index) => (
                    <MaterialIcon
                      key={index}
                      name="star"
                      filled
                      className="text-[13px] text-amber-400"
                    />
                  ))}
                </span>
                <span className="mt-0.5 block text-sm font-semibold text-neutral-950 dark:text-white">
                  {money(product.price)}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </article>
  );
}

export function ArrivalsRankingsSection() {
  return (
    <section
      className="bg-[#f5f6f8] pb-5 sm:pb-6 dark:bg-background"
      aria-labelledby="new-arrivals-heading"
    >
      <Container className="px-4 sm:px-6 lg:px-8">
        <div className="mb-3 flex items-center justify-between gap-4 sm:mb-4">
          <h2
            id="new-arrivals-heading"
            className="text-lg font-semibold tracking-tight text-neutral-950 sm:text-xl dark:text-white"
          >
            New Arrivals
          </h2>
          <Link
            href={productsHref({ view: "new" })}
            className="inline-flex shrink-0 items-center gap-0.5 text-sm text-neutral-500 transition-colors hover:text-neutral-950 dark:text-white/60 dark:hover:text-white"
          >
            View All
            <MaterialIcon name="chevron_right" className="text-[18px]" />
          </Link>
        </div>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {newArrivals.map((product) => {
            const discount = discountLabel(product);
            return (
              <li key={product.id}>
                <Link
                  href={`/products/${product.slug}`}
                  className="group flex h-full items-center gap-3 rounded-xl border border-neutral-200/90 bg-white p-3 transition-colors hover:border-neutral-300 dark:border-white/10 dark:bg-[#121816] dark:hover:border-white/20"
                >
                  <span className="relative size-[4.75rem] shrink-0">
                    {discount ? (
                      <span className="absolute top-0 left-0 z-10 rounded-sm bg-neutral-950 px-1 py-0.5 text-[10px] leading-none font-semibold text-white">
                        {discount}
                      </span>
                    ) : null}
                    <Image
                      src={product.imageSrc}
                      alt=""
                      fill
                      sizes="76px"
                      className="object-contain transition-transform duration-300 group-hover:scale-105"
                    />
                  </span>
                  <span className="min-w-0">
                    <span className="line-clamp-2 text-sm text-neutral-800 dark:text-white/85">
                      {product.title}
                    </span>
                    {product.compareAtPrice ? (
                      <span className="mt-1 block text-xs text-neutral-400 line-through">
                        {money(product.compareAtPrice)}
                      </span>
                    ) : null}
                    <span className="mt-0.5 block text-sm font-semibold text-neutral-950 dark:text-white">
                      {product.unitLabel ? (
                        <span className="mr-1 text-xs font-normal text-neutral-500">
                          {product.unitLabel}
                        </span>
                      ) : null}
                      {money(product.price)}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <RankCard
            title="Best sellings"
            icon="emoji_events"
            items={bestSellings}
            headingId="best-sellings-heading"
            href={productsHref({ view: "featured" })}
          />
          <RankCard
            title="Top rated"
            icon="military_tech"
            items={topRated}
            headingId="top-rated-heading"
            href={productsHref()}
          />
        </div>
      </Container>
    </section>
  );
}
