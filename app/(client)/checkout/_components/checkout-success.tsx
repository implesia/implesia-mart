"use client";

import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";

export function CheckoutSuccess() {
  return (
    <section className="rounded-2xl border border-primary/20 bg-surface-container-lowest px-4 py-10 text-center sm:px-10 sm:py-14">
      <span className="mb-4 inline-flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary sm:mb-5 sm:size-16">
        <MaterialIcon name="check_circle" filled className="text-[32px] sm:text-[36px]" />
      </span>
      <h2 className="mb-2 text-xl font-semibold text-on-background sm:text-2xl">
        অর্ডার সফল হয়েছে!
      </h2>
      <p className="mx-auto mb-6 max-w-md text-sm leading-relaxed text-on-surface-variant sm:mb-8 sm:text-base">
        আপনার অর্ডারটি আমাদের কাছে পৌঁছেছে। শীঘ্রই মোবাইলে কল/মেসেজ করে কনফার্ম করা হবে।
      </p>
      <div className="mx-auto flex w-full max-w-sm flex-col items-stretch justify-center gap-2.5 sm:max-w-none sm:flex-row sm:items-center">
        <Link
          href="/products"
          className={cn(
            buttonVariants({ size: "lg" }),
            "h-11 w-full rounded-full px-8 sm:h-12 sm:w-auto",
          )}
        >
          আরও কেনাকাটা
        </Link>
        <Link
          href="/"
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "h-11 w-full rounded-full px-8 sm:h-12 sm:w-auto",
          )}
        >
          হোমে যান
        </Link>
      </div>
    </section>
  );
}
