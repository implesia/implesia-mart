"use client";

import Image from "next/image";
import Link from "next/link";

import {
  isExternalHref,
  type AboutStoryBlock,
} from "@/lib/mart-mock/about-sections";
import { useAboutSections } from "@/lib/mart-mock/hooks";
import { isContentActive } from "@/lib/mart-mock/visibility";
import { cn } from "@/lib/utils";

import { Container } from "../../_components/common/container";
import { MaterialIcon } from "../../_components/common/material-icon";

export function BrandStory({ className }: { className?: string }) {
  const { stories } = useAboutSections();
  const visible = stories.filter(isContentActive);
  if (!visible.length) return null;

  return (
    <div className={className}>
      {visible.map((story) => (
        <StoryBlock key={story.id} story={story} />
      ))}
    </div>
  );
}

function StoryBlock({ story }: { story: AboutStoryBlock }) {
  const paragraphs = story.paragraphs.filter((item) => item.text.trim());
  const images = story.images.filter((item) => item.src);
  const buttonLabel = story.cta.label.trim();
  const buttonHref = story.cta.href.trim();

  return (
    <section className="w-full bg-[#f5f6f8] py-6 sm:py-8">
      <Container className="w-full px-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            "grid grid-cols-1 items-center gap-6 lg:gap-10",
            images.length > 0 && "lg:grid-cols-2",
          )}
        >
          <div className="space-y-3.5 sm:space-y-4">
            {story.kicker ? (
              <p className="text-[11px] font-medium tracking-wide text-primary uppercase sm:text-xs">
                {story.kicker}
              </p>
            ) : null}
            {story.title ? (
              <h2 className="text-xl leading-tight font-semibold tracking-tight text-neutral-950 sm:text-2xl">
                {story.title}
              </h2>
            ) : null}
            {paragraphs.length ? (
              <div className="space-y-3 text-sm leading-relaxed text-neutral-600 sm:text-[15px]">
                {paragraphs.map((paragraph) => (
                  <p key={paragraph.id}>{paragraph.text}</p>
                ))}
              </div>
            ) : null}
            {buttonLabel && buttonHref ? (
              <div className="pt-1">
                {isExternalHref(buttonHref) ? (
                  <a
                    href={buttonHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-primary px-5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary/80"
                  >
                    {buttonLabel}
                    <MaterialIcon
                      name="arrow_forward"
                      className="text-[18px]"
                    />
                  </a>
                ) : (
                  <Link
                    href={buttonHref}
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-primary px-5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary/80"
                  >
                    {buttonLabel}
                    <MaterialIcon
                      name="arrow_forward"
                      className="text-[18px]"
                    />
                  </Link>
                )}
              </div>
            ) : null}
          </div>
          {images.length ? (
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              {images.map((image) => (
                <div
                  key={image.id}
                  className="relative aspect-square overflow-hidden rounded-2xl border border-neutral-200/90 bg-white sm:aspect-4/5"
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
