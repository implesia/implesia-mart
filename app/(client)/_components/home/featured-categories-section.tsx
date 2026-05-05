import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

import { Container } from "../common/container";
import { featuredCategories } from "../../_data/home/home";

export function FeaturedCategoriesSection() {
  return (
    <section id="collections" className="py-xl">
      <Container className="px-8">
        <div className="grid h-[600px] grid-cols-1 gap-6 md:grid-cols-4">
          {featuredCategories.map((cat) => (
            <Link
              key={cat.id}
              href={`#${cat.id}`}
              className={cn(
                "group relative cursor-pointer overflow-hidden rounded-xl",
                cat.colSpan === 2 &&
                  cat.rowSpan === 2 &&
                  "md:col-span-2 md:row-span-2",
                cat.colSpan === 2 && cat.rowSpan === 1 && "md:col-span-2",
                cat.colSpan === 1 && "md:col-span-1",
              )}
            >
              <Image
                src={cat.imageSrc}
                alt={cat.imageAlt}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 to-transparent p-6 md:p-8">
                <h3
                  className={cn(
                    "mb-1 text-white md:mb-2",
                    "headlineClass" in cat && cat.headlineClass
                      ? cat.headlineClass
                      : "font-headline-sm",
                  )}
                >
                  {cat.title}
                </h3>
                <p
                  className={cn(
                    "subtitleUppercase" in cat && cat.subtitleUppercase
                      ? "text-xs uppercase tracking-widest text-white/70"
                      : "font-label-md text-white/80",
                  )}
                >
                  {cat.subtitle}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
