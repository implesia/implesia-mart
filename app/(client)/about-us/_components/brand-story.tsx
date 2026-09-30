"use client";

import Image from "next/image";
import Link from "next/link";

import { isExternalHref } from "@/lib/mart-mock/about-sections";
import { useAboutSections } from "@/lib/mart-mock/hooks";
import { cn } from "@/lib/utils";

import { Container } from "../../_components/common/container";
import { MaterialIcon } from "../../_components/common/material-icon";

export function BrandStory({ className }: { className?: string }) {
  const { story } = useAboutSections();

  return (
    <section className={cn("w-full bg-[#f5f6f8] py-6 sm:py-8", className)}>
      <Container className="w-full px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-2 lg:gap-10">
          <div className="space-y-3.5 sm:space-y-4">
            <p className="text-[11px] font-medium tracking-wide text-primary uppercase sm:text-xs">
              {story.kicker}
            </p>

            <h2 className="text-xl leading-tight font-semibold tracking-tight text-neutral-950 sm:text-2xl">
              {story.title}
            </h2>

            <div className="space-y-3 text-sm leading-relaxed text-neutral-600 sm:text-[15px]">
              {story.paragraphs.map((paragraph) => (
                <p key={paragraph.id}>{paragraph.text}</p>
              ))}
            </div>

            <div className="pt-1">
              {isExternalHref(story.cta.href) ? (
                <a
                  href={story.cta.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "inline-flex h-10 items-center justify-center gap-1.5 rounded-full px-5 text-sm font-semibold",
                    "bg-primary text-on-primary transition-colors hover:bg-primary/80",
                  )}
                >
                  {story.cta.label}
                  <MaterialIcon name="arrow_forward" className="text-[18px]" />
                </a>
              ) : (
                <Link
                  href={story.cta.href || "/"}
                  className={cn(
                    "inline-flex h-10 items-center justify-center gap-1.5 rounded-full px-5 text-sm font-semibold",
                    "bg-primary text-on-primary transition-colors hover:bg-primary/80",
                  )}
                >
                  {story.cta.label}
                  <MaterialIcon name="arrow_forward" className="text-[18px]" />
                </Link>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            {story.images.map((image) => (
              <div
                key={image.id}
                className="relative aspect-square overflow-hidden rounded-2xl border border-neutral-200/90 bg-white sm:aspect-4/5"
              >
                {image.src ? (
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    sizes="(max-width: 1024px) 45vw, 24vw"
                    className="object-cover"
                  />
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
