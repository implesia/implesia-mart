import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

import { Container } from "../../_components/common/container";
import { MaterialIcon } from "../../_components/common/material-icon";
import { aboutCopy } from "../../_data/about/about";

export function BrandStory({ className }: { className?: string }) {
  const { story } = aboutCopy;

  return (
    <section className={cn("w-full py-6 sm:py-8 lg:py-10", className)}>
      <Container className="w-full px-3 min-[400px]:px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-2 lg:gap-10">
          <div className="space-y-3.5 sm:space-y-4">
            <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide text-primary uppercase">
              <span aria-hidden className="h-px w-5 bg-warm-gold" />
              {story.kicker}
            </span>

            <h2 className="text-xl leading-tight font-semibold text-neutral-950 sm:text-2xl lg:text-[1.85rem]">
              {story.title}
            </h2>

            <div className="space-y-3 text-sm leading-relaxed text-neutral-600 sm:text-[15px]">
              {story.paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>

            <div className="pt-1">
              <Link
                href={story.cta.href}
                className={cn(
                  "inline-flex h-11 items-center justify-center gap-1.5 rounded-xl px-5 text-sm font-semibold sm:px-6",
                  "bg-primary text-on-primary",
                  "transition-colors hover:bg-primary/90 active:scale-[0.98]",
                )}
              >
                {story.cta.label}
                <MaterialIcon name="arrow_forward" className="text-[18px]" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <div className="relative aspect-square overflow-hidden rounded-xl ring-1 ring-neutral-200 sm:aspect-4/5 sm:rounded-2xl">
              <Image
                src={story.images[0].src}
                alt={story.images[0].alt}
                fill
                sizes="(max-width: 1024px) 45vw, 24vw"
                className="object-cover"
              />
            </div>
            <div className="relative aspect-square overflow-hidden rounded-xl ring-1 ring-neutral-200 sm:aspect-4/5 sm:rounded-2xl">
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
