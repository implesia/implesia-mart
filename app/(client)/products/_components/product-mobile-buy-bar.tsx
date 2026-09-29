"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useCatalogStockStatus } from "@/lib/mart-mock/hooks";

import { MaterialIcon } from "../../_components/common/material-icon";
import type { ProductDetail } from "../../_data/products/product-details";
import { useCart } from "../../_providers/cart-provider";
import {
  getBuyQuantity,
  subscribeBuyQuantity,
} from "./buy-quantity-store";

function formatPrice(value: number) {
  return `৳${value.toLocaleString("en-US")}`;
}

export function ProductMobileBuyBar({ product }: { product: ProductDetail }) {
  const router = useRouter();
  const { addItem } = useCart();
  const quantity = useSyncExternalStore(
    subscribeBuyQuantity,
    getBuyQuantity,
    () => 1,
  );
  const stockStatus = useCatalogStockStatus(product.slug, product.status);
  const isComingSoon = stockStatus === "coming-soon";
  const isSoldOut = stockStatus === "sold-out";

  function handleBuyNow() {
    const ok = addItem(product.slug, quantity, { openDrawer: false });
    if (!ok) return;
    router.push("/checkout");
  }

  function handleAddToCart() {
    addItem(product.slug, quantity, { openDrawer: true });
  }

  return (
    <div className="pb-safe fixed inset-x-0 bottom-0 z-40 flex items-center gap-2.5 border-t border-outline-variant/30 bg-surface-container-lowest/95 px-3 py-2.5 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur-lg sm:gap-3 sm:px-4 sm:py-3 lg:hidden">
      <div className="min-w-0 flex-1">
        <p className="text-[10px] text-outline sm:text-label-sm">
          {isSoldOut ? "শেষ" : isComingSoon ? "প্রত্যাশিত মূল্য" : quantity > 1 ? `${quantity} × মূল্য` : "মোট মূল্য"}
        </p>
        <p className="truncate text-lg font-semibold text-on-background sm:text-xl">
          {formatPrice(product.price * (isComingSoon ? 1 : quantity))}
        </p>
      </div>

      {isSoldOut ? (
        <Button type="button" disabled className="h-11 flex-1 rounded-full text-sm sm:h-12">
          শেষ
        </Button>
      ) : isComingSoon ? (
        <Link
          href="/contact-us"
          className={cn(
            buttonVariants({ size: "lg" }),
            "h-11 flex-1 rounded-full text-sm shadow-lg sm:h-12",
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
            className="size-11 shrink-0 rounded-full sm:size-12"
            aria-label="কার্টে যুক্ত করুন"
            onClick={handleAddToCart}
          >
            <MaterialIcon name="add_shopping_cart" className="text-[20px] sm:text-[22px]" />
          </Button>
          <Button
            type="button"
            className="h-11 flex-1 rounded-full text-sm shadow-lg sm:h-12"
            onClick={handleBuyNow}
          >
            অর্ডার করুন
          </Button>
        </>
      )}
    </div>
  );
}
