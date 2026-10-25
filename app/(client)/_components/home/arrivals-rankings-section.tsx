import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

import { ProductCard } from "../../products/_components/product-card";
import {
  products,
  productsHref,
  type Product,
  type ProductBadge,
} from "../../_data/products/products";
import { Container } from "../common/container";
import { MaterialIcon } from "../common/material-icon";
import { productPath } from "@/lib/mart-api/product-url";

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

function formatPrice(value: number) {
  return `৳${value.toLocaleString("en-US")}`;
}

const BADGE_LABEL: Record<ProductBadge, string> = {
  New: "নতুন",
  "Best Seller": "বেস্ট সেলার",
  Limited: "লিমিটেড",
};

function discountPct(product: Product) {
  if (!product.compareAtPrice || product.compareAtPrice <= product.price) return null;
  return Math.round(
    ((product.compareAtPrice - product.price) / product.compareAtPrice) * 100,
  );
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
        {items.map((product) => {
          const comingSoon = product.status === "coming-soon";
          const discount = discountPct(product);
          return (
            <li key={product.id}>
              <Link
                href={productPath(product)}
                className="group flex items-center gap-3"
              >
                <span className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-surface-container-low">
                  <span
                    aria-hidden
                    className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_20%,rgba(43,192,181,0.14),transparent_60%)] dark:bg-[radial-gradient(ellipse_70%_60%_at_50%_20%,rgba(61,212,200,0.1),transparent_60%)]"
                  />
                  <Image
                    src={product.imageSrc}
                    alt=""
                    fill
                    sizes="64px"
                    className={cn(
                      "object-contain p-1 transition-transform duration-300 group-hover:scale-105",
                      comingSoon && "opacity-55 grayscale-[40%]",
                    )}
                  />
                  {comingSoon ? (
                    <span className="absolute inset-x-0.5 bottom-0.5 rounded-full bg-on-surface/85 px-1 py-px text-center text-[8px] font-semibold text-white">
                      কামিং সুন
                    </span>
                  ) : product.badge ? (
                    <span
                      className={cn(
                        "absolute top-0.5 left-0.5 rounded-full px-1 py-px text-[8px] font-semibold",
                        product.badge === "Best Seller"
                          ? "bg-warm-gold text-on-surface"
                          : "bg-primary text-on-primary",
                      )}
                    >
                      {BADGE_LABEL[product.badge]}
                    </span>
                  ) : null}
                  {discount ? (
                    <span className="absolute top-0.5 right-0.5 rounded-full bg-red-500 px-1 text-[8px] font-bold text-white">
                      -{discount}%
                    </span>
                  ) : null}
                </span>
                <span className="min-w-0">
                  <span className="line-clamp-2 text-sm font-semibold text-on-surface transition-colors group-hover:text-primary">
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
                  <span className="mt-0.5 flex flex-wrap items-baseline gap-x-1.5">
                    {product.unitLabel ? (
                      <span className="text-[11px] font-medium text-on-surface-variant">
                        {product.unitLabel}
                      </span>
                    ) : null}
                    <span className="text-sm font-bold tabular-nums text-primary">
                      {formatPrice(product.price)}
                    </span>
                    {product.compareAtPrice ? (
                      <span className="text-[11px] tabular-nums text-on-surface-variant line-through">
                        {formatPrice(product.compareAtPrice)}
                      </span>
                    ) : null}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
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
            নতুন আগমন
          </h2>
          <Link
            href={productsHref({ view: "new" })}
            className="inline-flex shrink-0 items-center gap-0.5 text-sm text-neutral-500 transition-colors hover:text-neutral-950 dark:text-white/60 dark:hover:text-white"
          >
            View All
            <MaterialIcon name="chevron_right" className="text-[18px]" />
          </Link>
        </div>
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {newArrivals.map((product) => (
            <li key={product.id} className="min-w-0">
              <ProductCard product={product} />
            </li>
          ))}
        </ul>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <RankCard
            title="বেস্ট সেলার"
            icon="emoji_events"
            items={bestSellings}
            headingId="best-sellings-heading"
            href={productsHref({ view: "featured" })}
          />
          <RankCard
            title="টপ রেটেড"
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
