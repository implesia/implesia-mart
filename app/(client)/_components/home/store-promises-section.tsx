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
    label: "সারাদেশে দ্রুত ডেলিভারি",
    href: "/shipping-returns",
  },
  {
    icon: "payments",
    color: "text-sky-500",
    label: "ক্যাশ অন ডেলিভারি",
    href: "/shipping-returns",
  },
  {
    icon: "assignment_return",
    color: "text-rose-500",
    label: "৩ দিনের ইজি রিটার্ন",
    href: "/shipping-returns",
  },
  {
    icon: "verified_user",
    color: "text-blue-600",
    label: "কোয়ালিটি চেকড প্রোডাক্ট",
    href: "/about-us",
  },
] as const;

const infoLinks = [
  { href: "/about-us", icon: "apartment", label: "আমাদের সম্পর্কে", color: "text-sky-500" },
  { href: "/contact-us", icon: "headset_mic", label: "যোগাযোগ", color: "text-blue-500" },
  { href: "/faqs", icon: "contact_support", label: "প্রশ্নোত্তর", color: "text-pink-500" },
] as const;

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
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {items.map((product) => (
          <li key={product.id} className="min-w-0">
            <ProductCard product={product} />
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
