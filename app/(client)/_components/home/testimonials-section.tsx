import fs from "node:fs";
import path from "node:path";

import { testimonials } from "../../_data/home/home";
import { Container } from "../common/container";
import { ReviewGallery, type ReviewShot } from "./review-gallery";

function withFiles(): ReviewShot[] {
  return testimonials.map((review) => ({
    ...review,
    ready: fs.existsSync(
      path.join(process.cwd(), "public", review.imageSrc.replace(/^\//, "")),
    ),
  }));
}

export function TestimonialsSection() {
  const reviews = withFiles();

  return (
    <section
      className="bg-[#f5f6f8] py-6 sm:py-8 dark:bg-background"
      aria-labelledby="customer-reviews-heading"
    >
      <Container className="px-4 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-2xl sm:mb-10">
          <p className="mb-2 text-[11px] font-semibold tracking-[0.16em] text-neutral-500 uppercase dark:text-white/50">
            রিভিউ
          </p>
          <h2
            id="customer-reviews-heading"
            className="text-2xl font-semibold tracking-tight text-neutral-950 sm:text-3xl dark:text-white"
          >
            কাস্টমাররা যা বলছেন
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600 sm:text-base dark:text-white/65">
            {reviews.some((review) => review.ready)
              ? "হোয়াটসঅ্যাপ ও মেসেঞ্জারের রিভিউ স্ক্রিনশট। ছবিতে ক্লিক করলে পুরো কথোপকথন খোলে।"
              : "হোয়াটসঅ্যাপ ও মেসেঞ্জারের কাস্টমার রিভিউ স্ক্রিনশট।"}
          </p>
        </div>
        <ReviewGallery reviews={reviews} />
      </Container>
    </section>
  );
}
