"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { catalogProductId } from "@/lib/mart-api/catalog";
import { useCatalogStockStatus } from "@/lib/mart-mock/hooks";

import { MaterialIcon } from "../../_components/common/material-icon";
import type { ProductDetail } from "../../_data/products/product-details";
import { activePicks, rememberBuySelection } from "./purchase-selection";
import { usePurchaseQuantity } from "./use-purchase-quantity";

function formatPrice(value: number) {
  return `৳${value.toLocaleString("en-US")}`;
}

export function ProductMobileBuyBar({ product }: { product: ProductDetail }) {
  const router = useRouter();
  const {
    quantity,
    inCart,
    lineTotal,
    atMin,
    atMax,
    decrease,
    increase,
    addItem,
    openCart,
    selected,
  } = usePurchaseQuantity(product.slug);
  const overlay = useCatalogStockStatus(product.slug, product.status);
  const stockStatus = catalogProductId(product.id) ? product.status : overlay;
  const isComingSoon = stockStatus === "coming-soon";
  const isSoldOut = stockStatus === "sold-out";

  function handleBuyNow() {
    const qty = Math.min(5, Math.max(1, selected()));
    rememberBuySelection(product.slug, activePicks());
    router.push(
      `/checkout?product=${encodeURIComponent(product.slug)}&qty=${qty}`,
    );
  }

  function handleAddToCart() {
    if (inCart) {
      openCart();
      return;
    }
    void addItem(product.slug, selected(), {
      openDrawer: true,
      productId: catalogProductId(product.id),
      selection: activePicks(),
    });
  }

  return (
    <div className="pb-safe fixed inset-x-0 bottom-0 z-40 flex items-center gap-2.5 border-t border-outline-variant/30 bg-surface-container-lowest/95 px-3 py-2.5 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur-lg sm:gap-3 sm:px-4 sm:py-3 lg:hidden">
      <div className="min-w-0 flex-1">
        <p className="text-[10px] text-outline sm:text-label-sm">
          {isSoldOut
            ? "শেষ"
            : isComingSoon
              ? "প্রত্যাশিত মূল্য"
              : quantity > 1
                ? `${quantity} × মূল্য`
                : "মোট মূল্য"}
        </p>
        <p className="truncate text-lg font-semibold text-on-background sm:text-xl">
          {formatPrice(
            isComingSoon
              ? product.price
              : (lineTotal ?? product.price * quantity),
          )}
        </p>
      </div>

      {isSoldOut || isComingSoon ? null : (
        <div className="inline-flex shrink-0 items-center rounded-full border border-outline-variant/40">
          <button
            type="button"
            className="flex size-9 items-center justify-center text-on-surface disabled:opacity-40"
            onClick={decrease}
            disabled={atMin}
            aria-label="পরিমাণ কমান"
          >
            <MaterialIcon name="remove" className="text-[18px]" />
          </button>
          <span className="w-5 text-center text-sm font-semibold text-on-surface">
            {quantity}
          </span>
          <button
            type="button"
            className="flex size-9 items-center justify-center text-on-surface disabled:opacity-40"
            onClick={increase}
            disabled={atMax}
            aria-label="পরিমাণ বাড়ান"
          >
            <MaterialIcon name="add" className="text-[18px]" />
          </button>
        </div>
      )}

      {isSoldOut ? (
        <Button
          type="button"
          disabled
          className="h-11 flex-1 rounded-full text-sm sm:h-12"
        >
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
            <MaterialIcon
              name="add_shopping_cart"
              className="text-[20px] sm:text-[22px]"
            />
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
