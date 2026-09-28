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

const accessoryProducts = [
  "magnetic-car-phone-holder",
  "fast-charging-3in1-cable",
  "tws-wireless-earbuds",
  "bluetooth-neckband-earphone",
  "slim-power-bank-10000mah",
  "mini-thermal-printer",
].map(productBySlug);

const promises = [
  {
    icon: "local_shipping",
    color: "text-orange-500",
    label: "Fast delivery all across the country",
    href: "/shipping-returns",
  },
  {
    icon: "payments",
    color: "text-sky-500",
    label: "Cash on Delivery",
    href: "/shipping-returns",
  },
  {
    icon: "assignment_return",
    color: "text-rose-500",
    label: "3 Days Easy Return",
    href: "/shipping-returns",
  },
  {
    icon: "verified_user",
    color: "text-blue-600",
    label: "Quality Checked Products",
    href: "/about-us",
  },
] as const;

const infoLinks = [
  { href: "/about-us", icon: "apartment", label: "About Company", color: "text-sky-500" },
  { href: "/contact-us", icon: "headset_mic", label: "Contact Us", color: "text-blue-500" },
  { href: "/faqs", icon: "contact_support", label: "FAQ", color: "text-pink-500" },
] as const;

function money(value: number) {
  return `৳${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function AccessoryRail({ items }: { items: Product[] }) {
  return (
    <article className="rounded-xl border border-neutral-200/70 bg-white px-4 py-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] sm:px-6 sm:py-5 dark:border-white/10 dark:bg-[#121816]">
      <div className="mb-4 flex items-center justify-between gap-4 sm:mb-5">
        <h2
          id="accessory-rail-heading"
          className="text-lg font-semibold tracking-tight text-neutral-950 sm:text-xl dark:text-white"
        >
          Trending Gadgets
        </h2>
        <Link
          href={productsHref({ category: "gadgets" })}
          className="inline-flex shrink-0 items-center gap-0.5 text-[13px] text-neutral-500 transition-colors hover:text-neutral-950 dark:text-white/60 dark:hover:text-white"
        >
          View All
          <MaterialIcon name="chevron_right" className="text-[16px]" />
        </Link>
      </div>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 lg:grid-cols-6 lg:gap-x-4">
        {items.map((product) => (
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
              </span>
              <span className="mt-2 block truncate text-[13px] leading-snug text-neutral-600 dark:text-white/75">
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

export function StorePromisesSection() {
  return (
    <section className="bg-[#f5f6f8] dark:bg-background" aria-labelledby="accessory-rail-heading">
      <Container className="space-y-4 px-4 sm:space-y-5 sm:px-6 lg:px-8">
        <AccessoryRail items={accessoryProducts} />

        <ul className="grid grid-cols-2 gap-y-6 rounded-xl border border-neutral-200/70 bg-white px-4 py-6 sm:grid-cols-4 sm:px-6 sm:py-8 dark:border-white/10 dark:bg-[#121816]">
          {promises.map((item) => (
            <li key={item.label}>
              <Link href={item.href} className="group flex flex-col items-center text-center">
                <MaterialIcon name={item.icon} className={`text-[36px] ${item.color}`} />
                <span className="mt-3 max-w-[11rem] text-[13px] leading-snug text-neutral-600 transition-colors group-hover:text-neutral-950 dark:text-white/70 dark:group-hover:text-white">
                  {item.label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>

      <div className="mt-6 bg-[#e6e8eb] py-8 sm:py-10 dark:bg-white/5">
        <Container className="px-4 sm:px-6 lg:px-8">
          <ul className="grid grid-cols-3 gap-3">
            {infoLinks.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="group flex flex-col items-center text-center">
                  <MaterialIcon name={item.icon} className={`text-[40px] ${item.color}`} />
                  <span className="mt-2 text-xs text-neutral-800 transition-colors group-hover:text-neutral-950 sm:text-sm dark:text-white/85 dark:group-hover:text-white">
                    {item.label}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </div>
    </section>
  );
}
