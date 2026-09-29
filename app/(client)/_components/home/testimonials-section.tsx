"use client";

import { useHomeSections } from "@/lib/mart-mock/hooks";

import { Container } from "../common/container";
import { ReviewGallery, type ReviewShot } from "./review-gallery";

export function TestimonialsSection() {
  const { reviews } = useHomeSections();
  const shots: ReviewShot[] = reviews.items.map((item) => ({
    id: item.id,
    imageSrc: item.imageSrc,
    imageAlt: item.imageAlt,
    product: item.product,
    channel: item.channel,
    ready: Boolean(item.imageSrc),
  }));

  return (
    <section
      className="bg-[#f5f6f8] py-6 sm:py-8 dark:bg-background"
      aria-labelledby="customer-reviews-heading"
    >
      <Container className="px-4 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-2xl sm:mb-10">
          <p className="mb-2 text-[11px] font-semibold tracking-[0.16em] text-neutral-500 uppercase dark:text-white/50">
            {reviews.kicker}
          </p>
          <h2
            id="customer-reviews-heading"
            className="text-2xl font-semibold tracking-tight text-neutral-950 sm:text-3xl dark:text-white"
          >
            {reviews.title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600 sm:text-base dark:text-white/65">
            {reviews.subtitle}
          </p>
        </div>
        <ReviewGallery reviews={shots} />
      </Container>
    </section>
  );
}
