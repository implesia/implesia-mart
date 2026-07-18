"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { ProductDetail } from "../../_data/products/product-details";
import { useCart } from "../../_providers/cart-provider";
import { MaterialIcon } from "../../_components/common/material-icon";

function formatPrice(value: number) {
  return `৳${value.toLocaleString("en-US")}`;
}

export function ProductMobileBuyBar({ product }: { product: ProductDetail }) {
  const router = useRouter();
  const { addItem } = useCart();
  const isComingSoon = product.status === "coming-soon";

  function handleBuyNow() {
    const ok = addItem(product.slug, 1, { openDrawer: false });
    if (!ok) return;
    router.push("/checkout");
  }

  function handleAddToCart() {
    addItem(product.slug, 1, { openDrawer: true });
  }

  return (
    <div className="pb-safe fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-outline-variant/30 bg-surface-container-lowest/95 px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur-lg lg:hidden">
      <div className="min-w-0 flex-1">
        <p className="text-label-sm text-outline">
          {isComingSoon ? "প্রত্যাশিত মূল্য" : "মোট মূল্য"}
        </p>
        <p className="truncate font-headline-sm text-on-background">
          {formatPrice(product.price)}
        </p>
      </div>

      {isComingSoon ? (
        <Link
          href="/contact-us"
          className={cn(
            buttonVariants({ size: "lg" }),
            "h-12 flex-1 rounded-full text-label-md shadow-lg",
          )}
        >
          মেসেজ করুন
        </Link>
      ) : (
        <>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-12 shrink-0 rounded-full"
            aria-label="কার্টে যুক্ত করুন"
            onClick={handleAddToCart}
          >
            <MaterialIcon name="add_shopping_cart" className="text-[22px]" />
          </Button>
          <Button
            type="button"
            className="h-12 flex-1 rounded-full text-label-md shadow-lg"
            onClick={handleBuyNow}
          >
            অর্ডার করুন
          </Button>
        </>
      )}
    </div>
  );
}
