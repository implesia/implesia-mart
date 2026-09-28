import Link from "next/link";

import { ProductCard } from "../../products/_components/product-card";
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
    slugs: [
      "custom-gorgeous-womens-gown",
      "custom-baby-party-frock",
      "baby-comfort-top-shorts-set",
      "womens-daily-wear-dress",
    ],
  },
];

function RailCard({
  title,
  href,
  items,
  headingId,
}: {
  title: string;
  href: string;
  items: Product[];
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
          সব দেখুন
          <MaterialIcon name="chevron_right" className="text-[16px]" />
        </Link>
      </div>

      <ul
        className={
          items.length >= 6
            ? "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
            : "grid grid-cols-2 gap-3 lg:grid-cols-4"
        }
      >
        {items.map((product) => (
          <li key={product.id} className="min-w-0">
            <ProductCard product={product} />
          </li>
        ))}
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
            headingId={`spotlight-rail-${rail.id}`}
          />
        ))}
      </Container>
    </section>
  );
}
