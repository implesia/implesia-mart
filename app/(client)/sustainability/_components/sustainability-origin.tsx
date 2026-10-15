import Image from "next/image";

import type { SustainabilityOrigin } from "@/lib/mart-api/sustainability-origin";
import { cn } from "@/lib/utils";

import { Container } from "../../_components/common/container";

export function SustainabilityOrigin({
  origin,
  className,
}: {
  origin: SustainabilityOrigin;
  className?: string;
}) {
  const images = origin.images.filter((image) => image.isActive && image.src);
  if (!origin.title.trim() && !origin.body.trim() && !images.length) return null;

  return (
    <section className={cn("w-full bg-[#f5f6f8] py-6 sm:py-8", className)}>
      <Container className="w-full px-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            "grid grid-cols-1 items-center gap-6 lg:gap-10",
            images.length > 0 && "lg:grid-cols-2",
          )}
        >
          <div className="space-y-3.5 sm:space-y-4">
            {origin.eyebrow.trim() ? (
              <p className="text-xs font-semibold tracking-wide text-primary-ink uppercase">
                {origin.eyebrow}
              </p>
            ) : null}

            <h2 className="text-xl leading-tight font-semibold tracking-tight text-neutral-950 sm:text-2xl">
              {origin.title}
            </h2>

            <p className="text-sm leading-relaxed text-neutral-600 sm:text-[15px]">
              {origin.body}
            </p>

            {origin.quote.trim() ? (
              <blockquote className="rounded-2xl border border-neutral-200/90 bg-white px-4 py-3.5 text-sm leading-relaxed text-neutral-700 italic sm:px-5">
                {origin.quote}
              </blockquote>
            ) : null}
          </div>

          {images.length ? (
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            {images.map((image) => (
              <div
                key={image.id}
                className="relative aspect-4/5 overflow-hidden rounded-2xl border border-neutral-200/90 bg-white"
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="(max-width: 1024px) 45vw, 24vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
