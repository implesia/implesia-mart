import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

import { Container } from "../../_components/common/container";
import { MaterialIcon } from "../../_components/common/material-icon";
import { aboutCopy } from "../../_data/about/about";

export function BrandStory({ className }: { className?: string }) {
  const { story } = aboutCopy;

  return (
    <section className={cn("w-full py-10 sm:py-14 lg:py-xl", className)}>
      <Container className="w-full px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-14 xl:gap-16">
          <div className="order-2 space-y-5 sm:space-y-6 lg:order-1">
            <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide text-primary uppercase sm:text-sm">
              <span aria-hidden className="h-px w-6 bg-warm-gold" />
              {story.kicker}
            </span>

            <h2 className="text-2xl leading-tight font-semibold text-primary sm:text-3xl lg:text-[2.15rem]">
              {story.title}
            </h2>

            <div className="space-y-4 text-sm leading-relaxed text-on-surface-variant sm:text-base">
              {story.paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>

            <div className="pt-2">
              <Link
                href={story.cta.href}
                className={cn(
                  "inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 sm:px-8",
                  "bg-primary text-sm font-semibold text-on-primary",
                  "transition-colors hover:bg-primary/90 active:scale-[0.98]",
                )}
              >
                {story.cta.label}
                <MaterialIcon name="arrow_forward" className="text-[18px]" />
              </Link>
            </div>
          </div>

          <div className="order-1 grid grid-cols-2 gap-3 sm:gap-4 lg:order-2">
            <div className="relative aspect-square overflow-hidden rounded-2xl ring-1 ring-outline-variant/30 sm:aspect-4/5 dark:ring-white/10">
              <Image
                src={story.images[0].src}
                alt={story.images[0].alt}
                fill
                sizes="(max-width: 1024px) 45vw, 24vw"
                className="object-cover"
              />
            </div>
            <div className="relative aspect-square translate-y-5 overflow-hidden rounded-2xl ring-1 ring-outline-variant/30 sm:aspect-4/5 sm:translate-y-8 dark:ring-white/10">
              <Image
                src={story.images[1].src}
                alt={story.images[1].alt}
                fill
                sizes="(max-width: 1024px) 45vw, 24vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
