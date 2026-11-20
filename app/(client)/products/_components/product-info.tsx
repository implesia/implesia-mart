"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { track } from "@/lib/analytics";
import { catalogProductId } from "@/lib/mart-api/catalog";
import { directCheckoutHref } from "@/lib/mart-api/product-page";
import { maxQuantityText, percentText, tierOffers } from "@/lib/mart-api/pricing";
import {
  chooseOption,
  clampQuantity,
  defaultChoices,
  findVariant,
  priceView,
  purchaseCheck,
  valueIsOffered,
} from "@/lib/mart-api/variants";

import { BanglaQrCard } from "../../_components/common/bangla-qr";
import { MaterialIcon } from "../../_components/common/material-icon";
import type { ProductDetail } from "../../_data/products/product-details";
import { usePaymentQr } from "../../_providers/payment-qr-provider";
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
  { icon: "payments", label: "Cash on Delivery", subtitle: "Pay when you receive" },
  { icon: "local_shipping", label: "Nationwide Delivery", subtitle: "2-4 days express shipping" },
  { icon: "assignment_return", label: "3-Day Easy Return", subtitle: "Hassle-free replacement" },
  { icon: "verified", label: "100% Quality Checked", subtitle: "Authentic & verified item" },
];

export function ProductInfo({ product }: { product: ProductDetail }) {
  const router = useRouter();
  const qrSrc = usePaymentQr();
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
  const limits = {
    min: product.minPerOrder,
    max: selectedVariant?.maxQuantity ?? product.maxPerOrder,
  };
  const {
    quantity,
    inCart,
    max,
    atMin,
    atMax,
    decrease,
    increase,
    addItem,
    openCart,
    selected,
  } = usePurchaseQuantity(product.slug, selectedVariant?.id ?? null, limits);
  const view = priceView(product, selectedVariant, quantity);
  const offers = product.pricing
    ? tierOffers(
        product.pricing,
        max,
        selectedVariant
          ? {
              regular: Math.max(
                selectedVariant.compareAtPrice ?? 0,
                selectedVariant.price,
              ),
              price: selectedVariant.price,
            }
          : undefined,
      )
    : [];
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

  useEffect(() => {
    const price = selectedVariant?.price ?? product.price;
    track({
      name: "view_item",
      value: price,
      items: [{ id: product.id, name: product.title, price, quantity: 1 }],
    });
  }, [product.id, product.title, product.price, selectedVariant?.id, selectedVariant?.price]);

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
        setActionError("Could not add to cart. Please try again.");
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
    ? "Sold Out"
    : isComingSoon
      ? "Coming Soon"
      : !check.ok
        ? "Option Unavailable"
        : "In Stock";

  return (
    <div id="buy-box" className="flex flex-col">
      {/* Category / Tagline / Rating Header */}
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
        <div className="flex items-center gap-2">
          {product.categoryName ? (
            <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
              {product.categoryName}
            </span>
          ) : null}
          {product.tagline ? (
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
              {product.tagline}
            </span>
          ) : null}
        </div>
        {product.rating ? (
          <div className="flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
            <MaterialIcon name="star" filled className="text-xs text-amber-500" />
            <span className="text-xs font-bold tabular-nums">
              {product.rating.value.toFixed(1)}
            </span>
            <span className="text-[10px] text-neutral-400">
              ({product.rating.count})
            </span>
          </div>
        ) : null}
      </div>

      {/* Main Title */}
      <h1 className="mb-4 text-2xl font-extrabold tracking-tight text-neutral-950 sm:text-3xl md:text-[2rem] lg:text-[2.2rem] leading-tight dark:text-white">
        {product.title}
      </h1>

      {/* Modern Price Card */}
      <div className="mb-5 rounded-2xl border border-neutral-200/90 bg-gradient-to-br from-neutral-50/90 to-neutral-100/40 p-4 sm:p-4.5 dark:border-white/10 dark:bg-white/5 shadow-2xs">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
          {product.unitLabel ? (
            <span className="text-xs font-medium text-neutral-500">
              {product.unitLabel}
            </span>
          ) : null}
          <span
            data-testid="product-unit-price"
            className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-neutral-950 tabular-nums dark:text-white"
          >
            {hasVariants && !selectedVariant ? (
              <span className="mr-1.5 text-sm font-semibold text-neutral-500">
                From
              </span>
            ) : null}
            {formatPrice(view.unitPrice)}
          </span>

          {view.compareAtPrice ? (
            <>
              <span className="text-base sm:text-lg text-neutral-400 line-through tabular-nums">
                <span className="sr-only">Regular price </span>
                {formatPrice(view.compareAtPrice)}
              </span>
              {view.discountPercent ? (
                <span className="rounded-full bg-rose-600 px-2.5 py-0.5 text-xs font-extrabold tracking-tight text-white shadow-xs shadow-rose-600/25">
                  Save {percentText(view.discountPercent)}%
                </span>
              ) : null}
            </>
          ) : null}

          {/* Stock availability badge */}
          <span
            className={cn(
              "ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold shadow-2xs",
              canBuy
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300"
                : "bg-neutral-100 text-neutral-700 dark:bg-white/10 dark:text-neutral-300",
            )}
          >
            {canBuy ? (
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            ) : null}
            {availabilityLabel}
          </span>
        </div>

        {/* Tier bulk offers */}
        {offers.length > 0 && !isSoldOut && !isComingSoon ? (
          <div
            data-testid="product-tier-offers"
            className="mt-3 flex flex-wrap gap-2 border-t border-neutral-200/70 pt-2.5 dark:border-white/10"
          >
            {offers.map((offer) => (
              <span
                key={offer.quantity}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs transition-colors",
                  quantity >= offer.quantity
                    ? "bg-primary/10 font-bold text-primary"
                    : "bg-white text-neutral-600 border border-neutral-200/60 dark:bg-white/5 dark:text-neutral-400",
                )}
              >
                {offer.label}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {/* Options / Variants */}
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
          className="mb-4 rounded-xl border border-dashed border-rose-300 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800 dark:bg-rose-950/30 dark:text-rose-300"
        >
          This option is currently unavailable. Please select another variant.
        </p>
      ) : null}

      {isSoldOut ? (
        <div className="mb-6 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-4 sm:mb-8 sm:p-5 dark:border-white/10 dark:bg-white/5">
          <p className="text-sm font-bold text-neutral-900 dark:text-white">Out of Stock</p>
          <p className="mt-1 text-xs text-neutral-500 leading-relaxed dark:text-neutral-400">
            This item is currently sold out. You can contact us via WhatsApp to inquire about restocks.
          </p>
          <ProductWhatsAppButton product={product} layout="full" className="mt-4" />
        </div>
      ) : isComingSoon ? (
        <div className="mb-6 rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-4 sm:mb-8 sm:p-5 dark:border-primary/20">
          <p className="text-sm font-bold text-primary">Coming Soon</p>
          <p className="mt-1 text-xs text-neutral-600 leading-relaxed dark:text-neutral-400">
            This item is arriving soon. Reach out to pre-order or get notified.
          </p>
          <Link
            href="/contact-us"
            className={cn(
              buttonVariants({ size: "lg" }),
              "mt-4 hidden h-11 w-full rounded-xl text-xs font-bold lg:inline-flex bg-primary hover:bg-primary-ink text-white",
            )}
          >
            Contact Us
          </Link>
          <ProductWhatsAppButton product={product} layout="full" className="mt-3" />
        </div>
      ) : (
        <>
          {/* Quantity Selector & Total calculation */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-200/90 bg-white p-3 shadow-2xs dark:border-white/10 dark:bg-[#121a19]">
            <div className="flex items-center gap-3">
              <span
                id={`${product.slug}-qty-label`}
                className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400"
              >
                Quantity
              </span>
              <div
                className="inline-flex items-center rounded-xl border border-neutral-200/90 bg-neutral-50/60 dark:border-white/10 dark:bg-white/5"
                role="group"
                aria-labelledby={`${product.slug}-qty-label`}
              >
                <button
                  type="button"
                  className="flex size-9 items-center justify-center text-neutral-700 transition-colors hover:text-neutral-950 disabled:opacity-30 dark:text-neutral-300"
                  onClick={decrease}
                  disabled={atMin || pending !== null}
                  aria-label={`Decrease quantity of ${product.title}`}
                >
                  <MaterialIcon name="remove" className="text-[16px]" />
                </button>
                <span
                  className="w-9 text-center text-xs font-extrabold tabular-nums text-neutral-900 dark:text-white"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {quantity}
                </span>
                <button
                  type="button"
                  className="flex size-9 items-center justify-center text-neutral-700 transition-colors hover:text-neutral-950 disabled:opacity-30 dark:text-neutral-300"
                  onClick={increase}
                  disabled={atMax || pending !== null}
                  aria-label={`Increase quantity of ${product.title}`}
                >
                  <MaterialIcon name="add" className="text-[16px]" />
                </button>
              </div>
            </div>

            {/* Line Total */}
            <div className="text-right">
              <span className="block text-[10px] font-semibold text-neutral-400 uppercase">
                Total Price
              </span>
              <span className="text-base font-extrabold text-neutral-950 tabular-nums dark:text-white">
                {formatPrice(view.lineTotal)}
              </span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="mb-3 hidden flex-col gap-2.5 lg:flex">
            <div className="grid grid-cols-2 gap-2.5">
              <Button
                type="button"
                onClick={handleAddToCart}
                disabled={pending !== null}
                className={cn(
                  "h-12 w-full rounded-xl text-xs sm:text-sm font-bold text-white shadow-xs transition-all active:scale-[0.98]",
                  justAdded
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-primary-ink hover:bg-neutral-900",
                )}
              >
                <MaterialIcon
                  name={justAdded ? "check" : pending === "cart" ? "hourglass_top" : "add_shopping_cart"}
                  className={cn("text-[18px]", pending === "cart" && "animate-spin")}
                />
                <span>
                  {pending === "cart"
                    ? "Adding…"
                    : justAdded
                      ? "Added to Cart!"
                      : "Add to Cart"}
                </span>
              </Button>

              <Button
                type="button"
                onClick={handleBuyNow}
                disabled={pending !== null}
                className="h-12 w-full rounded-xl bg-primary hover:bg-primary-ink text-xs sm:text-sm font-bold text-white shadow-md shadow-primary/20 transition-all active:scale-[0.98]"
              >
                <MaterialIcon name="flash_on" className="text-[18px]" />
                <span>{pending === "buy" ? "Proceeding…" : "Order Now"}</span>
              </Button>
            </div>
          </div>

          <ProductWhatsAppButton
            product={product}
            layout="full"
            className="mb-2 mt-2 lg:mt-0"
          />
          {qrSrc ? <BanglaQrCard src={qrSrc} className="mb-2 mt-2" /> : null}
        </>
      )}

      {actionError ? (
        <p role="alert" className="mt-2 text-xs font-semibold text-rose-600">
          {actionError}
        </p>
      ) : null}

      {/* Trust Badges 2x2 Grid */}
      <div className="mt-4 mb-5 grid grid-cols-2 gap-2.5">
        {TRUST_BADGES.map((badge) => (
          <div
            key={badge.label}
            className="flex items-center gap-2.5 rounded-xl border border-neutral-200/80 bg-white p-2.5 shadow-2xs dark:border-white/10 dark:bg-[#121a19]"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <MaterialIcon name={badge.icon} className="text-[17px]" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                {badge.label}
              </p>
              <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">
                {badge.subtitle}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Key features bullets */}
      {product.keyFeatures?.length ? (
        <div className="mb-5 rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-2xs dark:border-white/10 dark:bg-[#121a19]">
          <h2 className="mb-2.5 text-xs font-bold tracking-wider text-neutral-900 uppercase dark:text-white">
            Key Highlights
          </h2>
          <ul className="space-y-2">
            {product.keyFeatures.map((feature) => (
              <li
                key={feature}
                className="flex items-start gap-2 text-xs text-neutral-700 dark:text-neutral-300"
              >
                <MaterialIcon
                  name="check_circle"
                  filled
                  className="mt-0.5 shrink-0 text-[15px] text-primary"
                />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Suitable for */}
      {product.suitableFor?.length ? (
        <div className="mb-6">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
            Suitable For
          </p>
          <div className="flex flex-wrap gap-1.5">
            {product.suitableFor.map((item) => (
              <span
                key={item}
                className="rounded-lg bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700 dark:bg-white/10 dark:text-neutral-300"
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
