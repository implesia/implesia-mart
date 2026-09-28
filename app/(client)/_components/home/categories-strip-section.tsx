import Image from "next/image";
import Link from "next/link";

import {
  categoryLabels,
  productsHref,
  type ProductCategoryId,
} from "../../_data/products/products";
import { Container } from "../common/container";

const categoryEntries: {
  id: ProductCategoryId;
  imageSrc: string;
}[] = [
  {
    id: "gadgets",
    imageSrc: "/images/products/lamp/lamp-5.jpg",
  },
  {
    id: "fashion",
    imageSrc: "/images/products/baby-products/wedding-dress.jpeg",
  },
];

export function CategoriesStripSection() {
  return (
    <section
      className="bg-[#f5f6f8] pb-6 sm:pb-8 dark:bg-background"
      aria-labelledby="home-categories-heading"
    >
      <Container className="px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-neutral-200/90 bg-white px-4 py-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] sm:px-6 sm:py-5 dark:border-white/10 dark:bg-[#121816]">
          <h2
            id="home-categories-heading"
            className="mb-4 text-lg font-semibold tracking-tight text-neutral-950 sm:mb-5 sm:text-xl dark:text-white"
          >
            ক্যাটাগরি
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {categoryEntries.map((entry) => (
              <li key={entry.id}>
                <Link
                  href={productsHref({ category: entry.id })}
                  className="group relative flex min-h-44 overflow-hidden rounded-2xl sm:min-h-56"
                >
                  <Image
                    src={entry.imageSrc}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, 50vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                  <span
                    aria-hidden
                    className="absolute inset-0 bg-linear-to-t from-black/75 via-black/25 to-black/10"
                  />
                  <span className="relative z-10 mt-auto px-5 py-5 text-xl font-semibold text-white sm:text-2xl">
                    {categoryLabels[entry.id]}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
