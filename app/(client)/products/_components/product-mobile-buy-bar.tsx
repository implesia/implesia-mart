"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { catalogProductId } from "@/lib/mart-api/catalog";
import { directCheckoutHref } from "@/lib/mart-api/product-page";
import { priceView } from "@/lib/mart-api/variants";

import { MaterialIcon } from "../../_components/common/material-icon";
import type { ProductDetail } from "../../_data/products/product-details";
import { activePicks, rememberBuySelection } from "./purchase-selection";
import { ProductWhatsAppButton } from "./product-whatsapp-button";
import { usePurchaseQuantity } from "./use-purchase-quantity";
import { useSelectedVariant } from "./use-selected-variant";

function formatPrice(value: number) {
  return `৳${value.toLocaleString("en-US")}`;
}

export function ProductMobileBuyBar({ product }: { product: ProductDetail }) {
  const router = useRouter();
  const { hasVariants, variant, check } = useSelectedVariant(product);
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
  } = usePurchaseQuantity(product.slug, variant?.id ?? null, {
    min: product.minPerOrder,
    max: product.maxPerOrder,
  });
  const view = priceView(product, variant, quantity);
  const [pending, setPending] = useState<"cart" | "buy" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const isComingSoon = product.status === "coming-soon";
  const isSoldOut = product.status === "sold-out";
  const canBuy = !isComingSoon && !isSoldOut && check.ok;

  function handleBuyNow() {
    if (pending || !canBuy) return;
    setPending("buy");
    setActionError(null);
    rememberBuySelection(product.slug, activePicks());
    router.push(directCheckoutHref(product, selected(), variant?.id));
  }

  function handleAddToCart() {
    if (pending || !canBuy) return;
    if (inCart) {
      openCart();
      return;
    }
    setPending("cart");
    setActionError(null);
    void addItem(product.slug, selected(), {
      openDrawer: true,
      productId: catalogProductId(product.id),
      variantId: variant?.id ?? null,
      selection: hasVariants ? [] : activePicks(),
    }).then((ok) => {
      setPending(null);
      if (!ok) setActionError("কার্টে যোগ করা যায়নি। আবার চেষ্টা করুন।");
    });
  }

  return (
    <div className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-outline-variant/30 bg-surface-container-lowest/95 px-3 py-2.5 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur-lg sm:px-4 sm:py-3 lg:hidden">
      {actionError ? (
        <p role="alert" className="mb-2 text-xs font-medium text-[#ba1a1a]">
          {actionError}
        </p>
      ) : null}
      <div className="flex items-center gap-2">
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
                ? view.unitPrice
                : (lineTotal ?? view.lineTotal),
            )}
          </p>
        </div>

        {isSoldOut || isComingSoon ? null : (
          <div className="inline-flex shrink-0 items-center rounded-full border border-outline-variant/40">
            <button
              type="button"
              className="flex size-11 items-center justify-center text-on-surface focus-visible:outline-2 focus-visible:outline-[#0b5e56] disabled:opacity-40"
              onClick={decrease}
              disabled={atMin || pending !== null}
              aria-label={`${product.title} এর পরিমাণ কমান`}
            >
              <MaterialIcon name="remove" className="text-[18px]" />
            </button>
            <span
              className="w-6 text-center text-sm font-semibold text-on-surface"
              aria-live="polite"
            >
              {quantity}
            </span>
            <button
              type="button"
              className="flex size-11 items-center justify-center text-on-surface focus-visible:outline-2 focus-visible:outline-[#0b5e56] disabled:opacity-40"
              onClick={increase}
              disabled={atMax || pending !== null}
              aria-label={`${product.title} এর পরিমাণ বাড়ান`}
            >
              <MaterialIcon name="add" className="text-[18px]" />
            </button>
          </div>
        )}

        {isSoldOut ? (
          <>
            <ProductWhatsAppButton
              product={product}
              layout="icon"
              className="hidden min-[420px]:inline-flex"
            />
            <Button
              type="button"
              disabled
              className="h-11 flex-1 rounded-full text-sm sm:h-12"
            >
              শেষ
            </Button>
          </>
        ) : isComingSoon ? (
          <>
            <ProductWhatsAppButton
              product={product}
              layout="icon"
              className="hidden min-[420px]:inline-flex"
            />
            <Link
              href="/contact-us"
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-11 flex-1 rounded-full text-sm shadow-lg sm:h-12",
              )}
            >
              মেসেজ করুন
            </Link>
          </>
        ) : (
          <>
            <ProductWhatsAppButton
              product={product}
              layout="icon"
              className="hidden min-[420px]:inline-flex"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-11 shrink-0 rounded-full sm:size-12"
              aria-label={`${product.title} কার্টে যুক্ত করুন`}
              disabled={pending !== null || !canBuy}
              onClick={handleAddToCart}
            >
              <MaterialIcon
                name="add_shopping_cart"
                className="text-[20px] sm:text-[22px]"
              />
            </Button>
            <Button
              type="button"
              className="h-11 min-w-0 flex-1 rounded-full px-3 text-sm shadow-lg sm:h-12"
              disabled={pending !== null || !canBuy}
              onClick={handleBuyNow}
            >
              {pending === "buy" ? "যাচ্ছে…" : "অর্ডার করুন"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
