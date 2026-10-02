"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { catalogProductId } from "@/lib/mart-api/catalog";
import { useCatalogStockStatus } from "@/lib/mart-mock/hooks";

import { MaterialIcon } from "../../_components/common/material-icon";
import type { ProductDetail } from "../../_data/products/product-details";
import { setBuyQuantity } from "./buy-quantity-store";
import { usePurchaseQuantity } from "./use-purchase-quantity";
import { ProductSupportPanel } from "./product-support-panel";

function formatPrice(value: number) {
  return `৳${value.toLocaleString("en-US")}`;
}

const TRUST_BADGES = [
  { icon: "payments", label: "ক্যাশ অন ডেলিভারি" },
  { icon: "local_shipping", label: "সারাদেশে ডেলিভারি" },
  { icon: "assignment_return", label: "৩ দিন ইজি রিটার্ন" },
  { icon: "verified", label: "১০০% কোয়ালিটি চেকড" },
];

export function ProductInfo({ product }: { product: ProductDetail }) {
  const router = useRouter();
  const { quantity, inCart, atMin, atMax, decrease, increase, addItem, openCart, selected } =
    usePurchaseQuantity(product.slug);
  const [justAdded, setJustAdded] = useState(false);
  const overlay = useCatalogStockStatus(product.slug, product.status);
  const stockStatus = catalogProductId(product.id) ? product.status : overlay;
  const isComingSoon = stockStatus === "coming-soon";
  const isSoldOut = stockStatus === "sold-out";

  useEffect(() => {
    setBuyQuantity(1);
  }, [product.slug]);

  function handleAddToCart() {
    void (async () => {
      if (inCart) {
        openCart();
        setJustAdded(true);
        window.setTimeout(() => setJustAdded(false), 1600);
        return;
      }
      const ok = await addItem(product.slug, selected(), {
        openDrawer: true,
        productId: catalogProductId(product.id),
      });
      if (!ok) return;
      setJustAdded(true);
      window.setTimeout(() => setJustAdded(false), 1600);
    })();
  }

  function handleBuyNow() {
    const qty = Math.min(5, Math.max(1, selected()));
    router.push(`/checkout?product=${encodeURIComponent(product.slug)}&qty=${qty}`);
  }

  const discountPct =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(
          ((product.compareAtPrice - product.price) / product.compareAtPrice) * 100,
        )
      : null;

  return (
    <div id="buy-box" className="flex flex-col">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
        <span className="text-[11px] font-semibold tracking-[0.12em] text-primary uppercase sm:text-sm sm:tracking-[0.18em]">
          {product.tagline}
        </span>
        {product.rating ? (
          <div className="flex shrink-0 items-center gap-1 text-tertiary">
            <MaterialIcon name="star" filled className="text-sm" />
            <span className="text-[11px] text-outline sm:text-label-sm">
              {product.rating.value.toFixed(1)} ({product.rating.count})
            </span>
          </div>
        ) : null}
      </div>

      <h1 className="mb-3 text-[1.625rem] leading-tight font-semibold tracking-tight text-on-background sm:mb-4 sm:text-[2rem] lg:text-[2.25rem] xl:text-[2.5rem]">
        {product.title}
      </h1>

      <p className="mb-5 text-sm leading-relaxed text-on-surface-variant sm:mb-6 sm:text-base">
        {product.description}
      </p>

      <div className="mb-5 flex flex-wrap items-baseline gap-x-3 gap-y-1.5 sm:mb-6">
        {product.unitLabel ? (
          <span className="text-xs text-muted-foreground sm:text-sm">{product.unitLabel}</span>
        ) : null}
        <span className="text-2xl font-semibold tracking-tight text-on-background sm:text-3xl">
          {formatPrice(product.price)}
        </span>
        {product.compareAtPrice ? (
          <>
            <span className="text-base text-muted-foreground line-through sm:text-lg">
              {formatPrice(product.compareAtPrice)}
            </span>
            {discountPct ? (
              <span className="text-sm font-bold text-red-500">-{discountPct}%</span>
            ) : null}
          </>
        ) : null}
        <span className="rounded-full bg-surface-container px-2.5 py-1 text-[11px] font-semibold text-outline sm:px-3 sm:text-sm">
          {isSoldOut ? "শেষ" : isComingSoon ? "প্রত্যাশিত মূল্য" : product.stockLabel}
        </span>
      </div>

      {product.keyFeatures?.length ? (
        <ul className="mb-5 space-y-2.5 sm:mb-6 sm:space-y-3">
          {product.keyFeatures.map((feature) => (
            <li
              key={feature}
              className="flex items-start gap-2.5 text-sm text-on-surface sm:gap-3 sm:text-base"
            >
              <MaterialIcon
                name="check_circle"
                filled
                className="mt-0.5 shrink-0 text-[16px] text-primary sm:text-[18px]"
              />
              {feature}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mb-5 grid grid-cols-2 gap-2.5 rounded-xl bg-surface-container-low p-3 sm:mb-6 sm:gap-x-6 sm:gap-y-3 sm:rounded-2xl sm:p-4">
        {TRUST_BADGES.map((badge) => (
          <div
            key={badge.label}
            className="flex items-center gap-1.5 text-[11px] leading-snug text-on-surface-variant sm:gap-2 sm:text-sm"
          >
            <MaterialIcon
              name={badge.icon}
              className="shrink-0 text-[18px] text-primary sm:text-[20px]"
            />
            <span>{badge.label}</span>
          </div>
        ))}
      </div>

      {product.suitableFor?.length ? (
        <div className="mb-6 sm:mb-8">
          <label className="mb-2.5 block text-sm font-semibold text-on-background sm:mb-3">
            কার জন্য উপযোগী
          </label>
          <div className="flex flex-wrap gap-2">
            {product.suitableFor.map((item) => (
              <span
                key={item}
                className="rounded-full bg-surface-container px-2.5 py-1 text-[11px] text-on-surface-variant sm:px-3 sm:py-1.5 sm:text-label-sm"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {isSoldOut ? (
        <div className="mb-6 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-4 sm:mb-8 sm:p-6">
          <div className="mb-3 flex items-center gap-2 text-neutral-800">
            <MaterialIcon name="block" />
            <span className="text-sm font-semibold tracking-widest uppercase">শেষ</span>
          </div>
          <p className="mb-4 text-sm text-on-surface-variant sm:text-base">
            এই প্রোডাক্টটি এখন শেষ। কার্টে যোগ করা যাবে না।
          </p>
          <Button type="button" disabled className="hidden h-auto w-full rounded-full py-4 lg:inline-flex lg:py-5">
            কার্টে যোগ বন্ধ
          </Button>
        </div>
      ) : isComingSoon ? (
        <div className="mb-6 rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-4 sm:mb-8 sm:p-6">
          <div className="mb-3 flex items-center gap-2 text-primary">
            <MaterialIcon name="hourglass_top" />
            <span className="text-sm font-semibold tracking-widest uppercase">কামিং সুন</span>
          </div>
          <p className="mb-4 text-sm text-on-surface-variant sm:mb-5 sm:text-base">
            এই প্রোডাক্টটি শীঘ্রই স্টকে আসছে। আগে থেকে জানতে বা প্রি-বুকিংয়ে আগ্রহী হলে আমাদের সাথে
            যোগাযোগ করুন।
          </p>
          <Link
            href="/contact-us"
            className={cn(
              buttonVariants({ size: "lg" }),
              "hidden h-auto w-full rounded-full py-4 text-sm shadow-xl lg:inline-flex lg:py-5",
            )}
          >
            <MaterialIcon name="chat" className="mr-2 text-[20px]" />
            মেসেজ করে জানুন
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-5 flex items-center gap-3 sm:mb-6 sm:gap-4">
            <label className="text-sm font-semibold text-on-background">পরিমাণ</label>
            <div className="inline-flex items-center rounded-full border border-outline-variant/40">
              <button
                type="button"
                className="flex size-9 items-center justify-center text-on-surface transition-colors hover:text-primary disabled:opacity-40 sm:size-10"
                onClick={decrease}
                disabled={atMin}
                aria-label="পরিমাণ কমান"
              >
                <MaterialIcon name="remove" className="text-[18px]" />
              </button>
              <span className="w-9 text-center text-sm font-semibold text-on-surface sm:w-10">
                {quantity}
              </span>
              <button
                type="button"
                className="flex size-9 items-center justify-center text-on-surface transition-colors hover:text-primary disabled:opacity-40 sm:size-10"
                onClick={increase}
                disabled={atMax}
                aria-label="পরিমাণ বাড়ান"
              >
                <MaterialIcon name="add" className="text-[18px]" />
              </button>
            </div>
          </div>

          {/* Desktop CTAs — mobile uses sticky buy bar */}
          <div className="mb-0 hidden flex-col gap-3 lg:mb-0 lg:flex lg:gap-4">
            <Button
              type="button"
              onClick={handleAddToCart}
              className="h-auto w-full rounded-full py-5 text-label-md shadow-xl hover:translate-y-[-2px] hover:shadow-2xl active:scale-95"
            >
              <MaterialIcon
                name={justAdded ? "check_circle" : "shopping_bag"}
                className="mr-2 text-[22px]"
              />
              {justAdded ? "কার্টে যোগ হয়েছে" : "কার্টে যুক্ত করুন"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleBuyNow}
              className="h-auto w-full rounded-full bg-warm-gold py-5 text-label-md text-white shadow-lg transition-all hover:translate-y-[-2px] hover:bg-warm-gold/95 hover:shadow-xl active:scale-95"
            >
              অর্ডার করুন
            </Button>
          </div>
        </>
      )}

      <ProductSupportPanel product={product} className="mt-6 sm:mt-8 lg:hidden" />
    </div>
  );
}
