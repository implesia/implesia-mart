import Image from "next/image";
import Link from "next/link";

import { products, productsHref, type Product } from "../../_data/products/products";
import { Container } from "../common/container";
import { MaterialIcon } from "../common/material-icon";

function productBySlug(slug: string) {
  const product = products.find((item) => item.slug === slug);
  if (!product) throw new Error(`Missing product: ${slug}`);
  return product;
}

const rails: {
  id: string;
  title: string;
  href: string;
  slugs: string[];
  ratedSlug?: string;
}[] = [
  {
    id: "lights",
    title: "ট্রেন্ডিং গ্যাজেট",
    href: productsHref({ category: "gadgets" }),
    slugs: [
      "sunset-rainbow-projection-lamp",
      "galaxy-projector-humidifier",
      "ai-face-tracking-phone-holder",
      "slim-power-bank-10000mah",
      "mini-thermal-printer",
      "smart-fitness-ring",
    ],
  },
  {
    id: "audio",
    title: "গর্জিয়াস ড্রেস",
    href: productsHref({ category: "fashion" }),
    ratedSlug: "womens-daily-wear-dress",
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

const badgeLabel = {
  "Best Seller": "Best Seller",
  New: "New",
  Limited: "Limited",
} as const;

function RailCard({
  title,
  href,
  items,
  ratedSlug,
  headingId,
}: {
  title: string;
  href: string;
  items: Product[];
  ratedSlug?: string;
  headingId: string;
}) {
  return (
    <article className="rounded-xl border border-neutral-200/70 bg-white px-4 py-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] sm:px-6 sm:py-5 dark:border-white/10 dark:bg-[#121816]">
      <div className="mb-4 flex items-center justify-between gap-4 sm:mb-5">
        <h2
          id={headingId}
          className="text-lg font-semibold tracking-tight text-neutral-950 sm:text-xl dark:text-white"
        >
          {title}
        </h2>
        <Link
          href={href}
          className="inline-flex shrink-0 items-center gap-0.5 text-[13px] text-neutral-500 transition-colors hover:text-neutral-950 dark:text-white/60 dark:hover:text-white"
        >
          View All
          <MaterialIcon name="chevron_right" className="text-[16px]" />
        </Link>
      </div>

      <ul
        className={
          items.length >= 6
            ? "grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 lg:grid-cols-6 lg:gap-x-4"
            : "grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-6"
        }
      >
        {items.map((product) => {
          const rated = product.slug === ratedSlug;
          return (
            <li key={product.id}>
              <Link href={`/products/${product.slug}`} className="group block">
                <span className="relative mx-auto block h-[118px] sm:h-[136px]">
                  <Image
                    src={product.imageSrc}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 42vw, 16vw"
                    className="object-contain transition-transform duration-300 group-hover:scale-[1.04]"
                  />
                  {product.badge ? (
                    <span className="absolute bottom-2 left-1/2 z-10 -translate-x-1/2 rounded-[3px] bg-[#e10600] px-1.5 py-0.5 text-[10px] leading-none font-semibold whitespace-nowrap text-white">
                      {badgeLabel[product.badge]}
                    </span>
                  ) : null}
                </span>
                {rated ? (
                  <span className="mt-2 flex items-center gap-px" aria-hidden>
                    {Array.from({ length: 5 }, (_, index) => (
                      <MaterialIcon
                        key={index}
                        name="star"
                        filled
                        className="text-[13px] text-amber-400"
                      />
                    ))}
                  </span>
                ) : null}
                <span className="mt-1.5 block truncate text-[13px] leading-snug text-neutral-600 dark:text-white/75">
                  {product.title}
                </span>
                <span className="mt-0.5 block text-sm font-medium text-neutral-950 dark:text-white">
                  {money(product.price)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </article>
  );
}

export function SpotlightRailsSection() {
  return (
    <section
      className="bg-[#f5f6f8] pb-5 sm:pb-6 dark:bg-background"
      aria-labelledby="spotlight-rail-lights"
    >
      <Container className="space-y-4 px-4 sm:space-y-5 sm:px-6 lg:px-8">
        {rails.map((rail) => (
          <RailCard
            key={rail.id}
            title={rail.title}
            href={rail.href}
            items={rail.slugs.map(productBySlug)}
            ratedSlug={rail.ratedSlug}
            headingId={`spotlight-rail-${rail.id}`}
          />
        ))}
      </Container>
    </section>
  );
}
