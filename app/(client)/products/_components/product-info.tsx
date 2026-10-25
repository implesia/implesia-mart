"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { catalogProductId } from "@/lib/mart-api/catalog";
import { directCheckoutHref } from "@/lib/mart-api/product-page";
import {
  chooseOption,
  clampQuantity,
  defaultChoices,
  findVariant,
  priceView,
  purchaseCheck,
  valueIsOffered,
} from "@/lib/mart-api/variants";

import { MaterialIcon } from "../../_components/common/material-icon";
import type { ProductDetail } from "../../_data/products/product-details";
import { setBuyQuantity } from "./buy-quantity-store";
import { ProductPurchaseOptions } from "./product-purchase-options";
import { ProductWhatsAppButton } from "./product-whatsapp-button";
import {
  activePicks,
  defaultPicks,
  picksFromChoices,
  rememberBuySelection,
  setActivePicks,
} from "./purchase-selection";
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
  const groups = useMemo(
    () => product.purchaseOptions ?? [],
    [product.purchaseOptions],
  );
  const variants = useMemo(() => product.variants ?? [], [product.variants]);
  const hasVariants = product.hasVariants === true;
  const initialChoices = useMemo<Record<string, string>>(
    () =>
      (hasVariants ? defaultChoices(variants) : null) ??
      Object.fromEntries(
        defaultPicks(groups).map((pick) => [pick.groupId, pick.valueId]),
      ),
    [hasVariants, variants, groups],
  );
  const [choices, setChoices] = useState<Record<string, string>>(initialChoices);
  const selectedVariant = hasVariants ? findVariant(variants, choices) : null;
  const check = purchaseCheck(hasVariants, selectedVariant);
  const limits = { min: product.minPerOrder, max: product.maxPerOrder };
  const {
    quantity,
    inCart,
    atMin,
    atMax,
    decrease,
    increase,
    addItem,
    openCart,
    selected,
  } = usePurchaseQuantity(product.slug, selectedVariant?.id ?? null, limits);
  const view = priceView(product, selectedVariant, quantity);
  const [justAdded, setJustAdded] = useState(false);
  const [pending, setPending] = useState<"cart" | "buy" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const isComingSoon = product.status === "coming-soon";
  const isSoldOut = product.status === "sold-out";
  const canBuy = !isComingSoon && !isSoldOut && check.ok;

  useEffect(() => {
    setBuyQuantity(clampQuantity(1, { min: product.minPerOrder }));
    setActivePicks(picksFromChoices(groups, initialChoices));
  }, [product.slug, product.minPerOrder, initialChoices, groups]);

  function choose(groupId: string, valueId: string) {
    const next = hasVariants
      ? chooseOption(variants, choices, groupId, valueId)
      : { ...choices, [groupId]: valueId };
    if (!next) return;
    setActionError(null);
    setActivePicks(picksFromChoices(groups, next));
    setChoices(next);
  }

  function handleAddToCart() {
    if (pending || !canBuy) return;
    void (async () => {
      setActionError(null);
      if (inCart) {
        openCart();
        setJustAdded(true);
        window.setTimeout(() => setJustAdded(false), 1600);
        return;
      }
      setPending("cart");
      const ok = await addItem(product.slug, selected(), {
        openDrawer: true,
        productId: catalogProductId(product.id),
        variantId: selectedVariant?.id ?? null,
        selection: hasVariants ? [] : activePicks(),
      });
      setPending(null);
      if (!ok) {
        setActionError("কার্টে যোগ করা যায়নি। আবার চেষ্টা করুন।");
        return;
      }
      setJustAdded(true);
      window.setTimeout(() => setJustAdded(false), 1600);
    })();
  }

  function handleBuyNow() {
    if (pending || !canBuy) return;
    setPending("buy");
    setActionError(null);
    rememberBuySelection(product.slug, activePicks());
    router.push(directCheckoutHref(product, selected(), selectedVariant?.id));
  }

  const availabilityLabel = isSoldOut
    ? "শেষ"
    : isComingSoon
      ? "শীঘ্রই আসছে"
      : !check.ok
        ? "এই অপশন নেই"
        : product.stockLabel || "স্টকে আছে";

  return (
    <div id="buy-box" className="flex flex-col">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
        {product.tagline ? (
          <span className="text-xs font-semibold text-[#0b5e56] sm:text-sm">
            {product.tagline}
          </span>
        ) : null}
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

      <div className="mb-5 flex flex-wrap items-baseline gap-x-3 gap-y-1.5 sm:mb-6">
        {product.unitLabel ? (
          <span className="text-xs text-muted-foreground sm:text-sm">
            {product.unitLabel}
          </span>
        ) : null}
        <span
          data-testid="product-unit-price"
          className="text-2xl font-semibold tracking-tight text-on-background sm:text-3xl"
        >
          {hasVariants && !selectedVariant ? (
            <span className="mr-1 text-sm font-medium text-muted-foreground">
              শুরু
            </span>
          ) : null}
          {formatPrice(view.unitPrice)}
        </span>
        {view.compareAtPrice ? (
          <>
            <span className="text-base text-muted-foreground line-through sm:text-lg">
              <span className="sr-only">আগের দাম </span>
              {formatPrice(view.compareAtPrice)}
            </span>
            {view.discountPercent ? (
              <span className="text-sm font-bold text-[#ba1a1a]">
                {view.discountPercent}% ছাড়
              </span>
            ) : null}
          </>
        ) : null}
        <span className="rounded-full bg-surface-container px-2.5 py-1 text-[11px] font-semibold text-[#042422] sm:px-3 sm:text-sm">
          {availabilityLabel}
        </span>
      </div>

      <ProductPurchaseOptions
        groups={groups}
        choices={choices}
        onChoose={choose}
        isOffered={
          hasVariants
            ? (groupId, valueId) => valueIsOffered(variants, groupId, valueId)
            : undefined
        }
      />

      {hasVariants && !isSoldOut && !isComingSoon && !check.ok ? (
        <p
          role="status"
          data-testid="variant-unavailable"
          className="mb-4 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-3 text-sm text-neutral-800"
        >
          এই অপশনটি এখন পাওয়া যাচ্ছে না। অন্য অপশন বেছে নিন।
        </p>
      ) : null}

      {isSoldOut ? (
        <div className="mb-6 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-4 sm:mb-8 sm:p-6">
          <p className="text-sm font-semibold text-neutral-800">শেষ</p>
          <p className="mt-2 text-sm text-on-surface-variant sm:text-base">
            এই প্রোডাক্টটি এখন শেষ। কার্টে যোগ করা যাবে না।
          </p>
          <ProductWhatsAppButton product={product} layout="full" className="mt-4" />
        </div>
      ) : isComingSoon ? (
        <div className="mb-6 rounded-2xl border border-dashed border-[#0b5e56]/40 bg-[#2BC0B5]/10 p-4 sm:mb-8 sm:p-6">
          <p className="text-sm font-semibold text-[#0b5e56]">শীঘ্রই আসছে</p>
          <p className="mt-2 text-sm text-on-surface-variant sm:text-base">
            এই প্রোডাক্টটি এখনও অর্ডার করা যাচ্ছে না। জানতে চাইলে আমাদের সাথে
            যোগাযোগ করুন।
          </p>
          <Link
            href="/contact-us"
            className={cn(
              buttonVariants({ size: "lg" }),
              "mt-4 hidden h-11 w-full rounded-full text-sm lg:inline-flex",
            )}
          >
            মেসেজ করে জানুন
          </Link>
          <ProductWhatsAppButton product={product} layout="full" className="mt-3" />
        </div>
      ) : (
        <>
          <div className="mb-5 flex items-center gap-3 sm:mb-6 sm:gap-4">
            <span
              id={`${product.slug}-qty-label`}
              className="text-sm font-semibold text-on-background"
            >
              পরিমাণ
            </span>
            <div
              className="inline-flex items-center rounded-full border border-outline-variant/40"
              role="group"
              aria-labelledby={`${product.slug}-qty-label`}
            >
              <button
                type="button"
                className="flex size-11 items-center justify-center text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b5e56] disabled:opacity-40"
                onClick={decrease}
                disabled={atMin || pending !== null}
                aria-label={`${product.title} এর পরিমাণ কমান`}
              >
                <MaterialIcon name="remove" className="text-[18px]" />
              </button>
              <span
                className="w-8 text-center text-sm font-semibold text-on-surface"
                aria-live="polite"
                aria-atomic="true"
              >
                <span className="sr-only">বর্তমান পরিমাণ </span>
                {quantity}
              </span>
              <button
                type="button"
                className="flex size-11 items-center justify-center text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b5e56] disabled:opacity-40"
                onClick={increase}
                disabled={atMax || pending !== null}
                aria-label={`${product.title} এর পরিমাণ বাড়ান`}
              >
                <MaterialIcon name="add" className="text-[18px]" />
              </button>
            </div>
          </div>

          <p
            className="mb-4 text-sm text-on-surface-variant"
            data-testid="product-line-total"
            aria-live="polite"
          >
            {quantity > 1
              ? `${quantity} × ${formatPrice(view.unitPrice)} = `
              : "মোট: "}
            <span className="font-semibold text-on-background">
              {formatPrice(view.lineTotal)}
            </span>
          </p>

          <div className="mb-2 hidden flex-col gap-3 lg:flex">
            <Button
              type="button"
              onClick={handleAddToCart}
              disabled={pending !== null}
              className="h-12 w-full rounded-full text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b5e56]"
            >
              {pending === "cart"
                ? "যোগ হচ্ছে…"
                : justAdded
                  ? "কার্টে যোগ হয়েছে"
                  : "কার্টে যুক্ত করুন"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleBuyNow}
              disabled={pending !== null}
              className="h-12 w-full rounded-full border border-[#d7a20a] bg-warm-gold text-sm font-semibold text-[#042422] hover:bg-[#e0a400] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b5e56]"
            >
              {pending === "buy" ? "চেকআউটে যাচ্ছে…" : "অর্ডার করুন"}
            </Button>
          </div>
          <ProductWhatsAppButton
            product={product}
            layout="full"
            className="mb-2 mt-3 lg:mt-0"
          />
        </>
      )}

      {actionError ? (
        <p role="alert" className="mt-3 text-sm font-medium text-[#ba1a1a]">
          {actionError}
        </p>
      ) : null}
      {justAdded ? (
        <p
          role="status"
          className="mt-3 text-sm font-medium text-[#0b5e56] lg:sr-only"
        >
          {product.title} কার্টে যোগ হয়েছে।
        </p>
      ) : null}

      {product.description ? (
        <p className="mt-6 text-sm leading-relaxed text-on-surface-variant sm:text-base">
          {product.description}
        </p>
      ) : null}

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
          <p className="mb-2.5 text-sm font-semibold text-on-background sm:mb-3">
            কার জন্য উপযোগী
          </p>
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

      <ProductSupportPanel
        product={product}
        className="mt-6 sm:mt-8 lg:hidden"
      />
    </div>
  );
}
