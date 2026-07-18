"use client";

import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";

export function CheckoutSuccess() {
  return (
    <section className="rounded-2xl border border-primary/20 bg-surface-container-lowest px-6 py-14 text-center sm:px-10">
      <span className="mb-5 inline-flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        <MaterialIcon name="check_circle" filled className="text-[36px]" />
      </span>
      <h2 className="mb-2 font-headline-sm text-on-background">অর্ডার সফল হয়েছে!</h2>
      <p className="mx-auto mb-8 max-w-md text-body-md text-on-surface-variant">
        আপনার অর্ডারটি আমাদের কাছে পৌঁছেছে। শীঘ্রই মোবাইলে কল/মেসেজ করে কনফার্ম করা হবে।
      </p>
      <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link
          href="/products"
          className={cn(buttonVariants({ size: "lg" }), "rounded-full px-8")}
        >
          আরও কেনাকাটা
        </Link>
        <Link
          href="/"
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "rounded-full px-8",
          )}
        >
          হোমে যান
        </Link>
      </div>
    </section>
  );
}
