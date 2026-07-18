"use client";

import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { ProductDetail } from "../../_data/products/product-details";

function formatPrice(value: number) {
  return `৳${value.toLocaleString("en-US")}`;
}

export function ProductMobileBuyBar({ product }: { product: ProductDetail }) {
  const isComingSoon = product.status === "coming-soon";

  return (
    <div className="pb-safe fixed inset-x-0 bottom-0 z-40 flex items-center gap-4 border-t border-outline-variant/30 bg-surface-container-lowest/95 px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur-lg lg:hidden">
      <div className="min-w-0 flex-1">
        <p className="text-label-sm text-outline">
          {isComingSoon ? "প্রত্যাশিত মূল্য" : "মোট মূল্য"}
        </p>
        <p className="truncate font-headline-sm text-on-background">
          {formatPrice(product.price)}
        </p>
      </div>
      <Link
        href={
          isComingSoon
            ? "/contact-us"
            : `/checkout?product=${encodeURIComponent(product.slug)}`
        }
        className={cn(
          buttonVariants({ size: "lg" }),
          "h-12 flex-1 rounded-full text-label-md shadow-lg",
        )}
      >
        {isComingSoon ? "মেসেজ করুন" : "অর্ডার করুন"}
      </Link>
    </div>
  );
}
