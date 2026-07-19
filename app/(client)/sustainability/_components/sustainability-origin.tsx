import Image from "next/image";

import { cn } from "@/lib/utils";

import { Container } from "../../_components/common/container";
import { sustainabilityCopy } from "../../_data/sustainability/sustainability";

export function SustainabilityOrigin({ className }: { className?: string }) {
  const { origin } = sustainabilityCopy;

  return (
    <section className={cn("w-full py-10 sm:py-14 lg:py-xl", className)}>
      <Container className="w-full px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="space-y-5 sm:space-y-6">
            <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide text-primary uppercase sm:text-sm">
              <span aria-hidden className="h-px w-6 bg-warm-gold" />
              {origin.eyebrow}
            </span>

            <h2 className="text-2xl leading-tight font-semibold text-primary sm:text-3xl lg:text-[2.15rem]">
              {origin.title}
            </h2>

            <p className="text-sm leading-relaxed text-on-surface-variant sm:text-base">
              {origin.body}
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2 sm:gap-4">
              {origin.images.map((img) => (
                <div
                  key={img.src}
                  className="relative aspect-square overflow-hidden rounded-2xl ring-1 ring-outline-variant/30 dark:ring-white/10"
                >
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    sizes="(max-width: 1024px) 45vw, 24vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="relative aspect-4/5 w-full overflow-hidden rounded-2xl ring-1 ring-outline-variant/30 sm:rounded-3xl lg:aspect-square dark:ring-white/10">
              <Image
                src={origin.featureImage.src}
                alt={origin.featureImage.alt}
                fill
                sizes="(max-width: 1024px) 90vw, 46vw"
                className="object-cover"
              />
            </div>

            <div
              className={cn(
                "absolute -bottom-6 -left-4 hidden max-w-[15rem] rounded-2xl p-6 sm:-left-6 lg:block",
                "bg-primary text-on-primary shadow-[0_16px_36px_rgba(6,47,44,0.25)]",
              )}
            >
              <p className="text-sm leading-relaxed italic">{origin.quote}</p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
