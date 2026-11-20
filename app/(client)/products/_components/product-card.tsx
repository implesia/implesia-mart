"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { badgeToneClass, CARD_BADGE_LIMIT, visibleBadges } from "@/lib/mart-api/badge-rules";
import { cardAction } from "@/lib/mart-api/card-action";
import { isCatalogProductId } from "@/lib/mart-api/catalog-rules";

import { MaterialIcon } from "../../_components/common/material-icon";
import { categoryLabel, type Product } from "../../_data/products/catalog-meta";
import { useCart } from "../../_providers/cart-provider";
import { productPath } from "@/lib/mart-api/product-url";

type ProductCardProps = {
  product: Product;
  priority?: boolean;
};

function formatPrice(value: number) {
  return `৳${value.toLocaleString("en-US")}`;
}

/**
 * Add to Cart: white text on the dark teal `primary-ink` (#0b5e56, about 7.6:1). White on the
 * brand teal (#2bc0b5) is only about 2.2:1 and fails WCAG AA, so only this button's background
 * uses the darker token. Hover/active go one step darker; the focus ring is always visible.
 */
const CART_BUTTON =
  "h-10 sm:h-10.5 w-full gap-1.5 rounded-xl bg-primary-ink text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-neutral-900 hover:shadow-md hover:shadow-primary-ink/15 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-ink motion-reduce:transition-none transition-all duration-200";

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const { addItem } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const [imageBroken, setImageBroken] = useState(false);
  const productId = isCatalogProductId(product.id) ? product.id : undefined;
  const isComingSoon = product.status === "coming-soon";
  const isSoldOut = product.status === "sold-out";
  // A status pill takes one of the card's badge slots so the corner never gets crowded.
  const badges = visibleBadges(product.badges, product.badge).slice(
    0,
    isComingSoon || isSoldOut ? CARD_BADGE_LIMIT - 1 : CARD_BADGE_LIMIT,
  );
  const isFashion = product.categoryId === "fashion";
  const action = cardAction(product);

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (pending || !productId) return;
    setPending(true);
    setFailed(false);
    void (async () => {
      const ok = await addItem(product.slug, 1, {
        openDrawer: true,
        productId,
      });
      setPending(false);
      if (!ok) {
        setFailed(true);
        return;
      }
      setJustAdded(true);
      window.setTimeout(() => setJustAdded(false), 1400);
    })();
  }

  const discountPct =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(
          ((product.compareAtPrice - product.price) / product.compareAtPrice) *
            100,
        )
      : null;

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl",
        "bg-white dark:bg-[#121a19]",
        "border border-neutral-200/80 dark:border-white/10",
        "shadow-[0_2px_10px_rgba(0,0,0,0.03)] dark:shadow-none",
        "transition-all duration-300 ease-out",
        "hover:-translate-y-1 hover:border-neutral-300 hover:shadow-[0_16px_36px_rgba(6,47,44,0.09)] dark:hover:border-white/20 dark:hover:shadow-[0_16px_36px_rgba(0,0,0,0.35)]",
      )}
    >
      <Link
        href={productPath(product)}
        className="relative block aspect-square sm:aspect-[4/3] md:aspect-square overflow-hidden bg-gradient-to-b from-neutral-50/90 to-neutral-100/60 dark:from-white/[0.04] dark:to-white/[0.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
        aria-label={`View ${product.title}`}
      >
        {product.imageSrc && !imageBroken ? (
          <Image
            src={product.imageSrc}
            alt={product.imageAlt || product.title}
            fill
            priority={priority}
            onError={() => setImageBroken(true)}
            className={cn(
              "relative z-[1] object-contain p-3 sm:p-3.5 md:p-4 drop-shadow-xs motion-reduce:transition-none motion-reduce:group-hover:transform-none",
              "transition-transform duration-500 ease-out group-hover:scale-108",
              (isComingSoon || isSoldOut) && "opacity-50 grayscale-[50%]",
            )}
            sizes="(max-width: 639px) 50vw, (max-width: 1023px) 33vw, 25vw"
          />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-1 text-neutral-300 dark:text-neutral-600">
            <MaterialIcon name="image" className="text-3xl opacity-40" />
            <span className="text-[10px] font-semibold tracking-wider text-neutral-400 dark:text-neutral-500 uppercase">
              Implesia Mart
            </span>
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 z-10 flex max-w-[calc(100%-3rem)] flex-wrap gap-1 sm:gap-1.5">
          {isComingSoon ? (
            <span className="rounded-full bg-neutral-900/90 px-2.5 py-0.5 text-[9px] sm:text-[10px] font-bold tracking-wide text-white shadow-xs backdrop-blur-xs">
              Coming soon
            </span>
          ) : isSoldOut ? (
            <span className="rounded-full bg-neutral-900/90 px-2.5 py-0.5 text-[9px] sm:text-[10px] font-bold tracking-wide text-white shadow-xs backdrop-blur-xs">
              Sold out
            </span>
          ) : null}
          {badges.map((badge) => (
            <span
              key={badge.slug}
              className={cn(
                "max-w-full truncate rounded-full px-2.5 py-0.5 text-[9px] sm:text-[10px] font-bold tracking-wide uppercase shadow-xs backdrop-blur-xs",
                badgeToneClass(badge.tone),
              )}
            >
              {badge.name}
            </span>
          ))}
        </div>

        {/* Discount Badge */}
        {discountPct && !isComingSoon && !isSoldOut ? (
          <span className="absolute top-2.5 right-2.5 z-10 rounded-full bg-rose-600 px-2 py-0.5 text-[10px] sm:text-[11px] font-extrabold tracking-tight text-white shadow-md shadow-rose-600/25 ring-1 ring-white/20">
            <span className="sr-only">Discount </span>-{discountPct}%
          </span>
        ) : null}

        {/* Desktop hover quick view cue */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 hidden bg-gradient-to-t from-black/35 via-black/10 to-transparent px-3 pb-3 pt-6 opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100 md:block">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/95 backdrop-blur-md px-2.5 py-1 text-[11px] font-semibold text-neutral-900 shadow-sm dark:bg-neutral-900/95 dark:text-white">
            <MaterialIcon
              name="visibility"
              className="text-[14px] text-primary"
            />
            View details
          </span>
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:gap-2 sm:p-3.5">
        {/* Category & Tag Row */}
        <div className="flex items-center justify-between gap-1 text-[11px]">
          <span className="truncate font-semibold text-primary">
            {categoryLabel(product.categorySlug ?? product.categoryId, product.categoryName)}
          </span>
          {isFashion ? (
            <span className="hidden shrink-0 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 sm:inline-flex dark:bg-amber-950/40 dark:text-amber-300">
              Handmade
            </span>
          ) : (
            <span className="hidden shrink-0 items-center gap-1 rounded-md bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-600 sm:inline-flex dark:bg-white/10 dark:text-neutral-300">
              <MaterialIcon name="local_shipping" className="text-[12px] text-neutral-400" />
              Cash on delivery
            </span>
          )}
        </div>

        {/* Title & Subtitle */}
        <div className="min-w-0">
          <Link href={productPath(product)} className="block">
            <h3 className="line-clamp-2 min-h-[2.6em] text-[13.5px] sm:text-[14.5px] font-semibold text-neutral-900 leading-snug transition-colors group-hover:text-primary dark:text-neutral-100">
              {product.title}
            </h3>
          </Link>
          {product.subtitle ? (
            <p className="mt-0.5 line-clamp-1 text-[11.5px] text-neutral-500 leading-relaxed dark:text-neutral-400">
              {product.subtitle}
            </p>
          ) : (
            <div className="mt-0.5 h-[17px]" aria-hidden="true" />
          )}
        </div>

        {/* Pricing & CTA */}
        <div className="mt-auto space-y-2 pt-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            {product.unitLabel ? (
              <span className="text-[10px] font-medium text-neutral-500">
                {product.unitLabel}
              </span>
            ) : null}
            <span className="text-[17px] sm:text-lg md:text-[19px] font-extrabold tabular-nums text-neutral-950 dark:text-white">
              <span className="sr-only">Current price </span>
              {product.hasVariants ? (
                <span className="mr-1 text-xs font-medium text-neutral-500">
                  From
                </span>
              ) : null}
              {formatPrice(product.price)}
            </span>
            {product.compareAtPrice && !isComingSoon ? (
              <span className="text-xs sm:text-[13px] tabular-nums text-neutral-400 line-through">
                <span className="sr-only">Previous price </span>
                {formatPrice(product.compareAtPrice)}
              </span>
            ) : null}
            {discountPct && !isComingSoon && !isSoldOut ? (
              <span className="hidden min-[380px]:inline-block rounded-md bg-rose-50 px-1.5 py-0.2 text-[10px] font-bold text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                Save {discountPct}%
              </span>
            ) : null}
          </div>

          {action === "coming-soon" ? (
            <Link
              href={productPath(product)}
              className={cn(
                "inline-flex h-10 sm:h-10.5 w-full items-center justify-center gap-1 rounded-xl text-xs sm:text-sm font-semibold",
                "border border-neutral-300/80 bg-white text-neutral-800",
                "transition-colors hover:border-primary hover:text-primary hover:bg-primary/5",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                "dark:bg-transparent dark:border-white/15 dark:text-neutral-200",
              )}
            >
              <span>View details</span>
              <MaterialIcon
                name="arrow_forward"
                className="text-[14px] sm:text-[16px]"
              />
            </Link>
          ) : action === "sold-out" ? (
            <Button
              type="button"
              disabled
              className="h-10 sm:h-10.5 w-full rounded-xl text-xs sm:text-sm font-semibold"
            >
              Out of stock
            </Button>
          ) : action === "choose-on-page" ? (
            <Link
              href={productPath(product)}
              data-card-action="add-to-cart"
              aria-label={`Add ${product.title} to cart — choose options on the product page`}
              className={cn(
                "inline-flex items-center justify-center",
                CART_BUTTON,
              )}
            >
              <MaterialIcon
                name="add_shopping_cart"
                className="text-[16px] sm:text-[17px]"
              />
              <span>Add to Cart</span>
            </Link>
          ) : (
            <Button
              type="button"
              onClick={handleAddToCart}
              disabled={pending || !productId}
              aria-busy={pending}
              data-card-action="add-to-cart"
              aria-label={
                pending
                  ? `Adding ${product.title} to cart`
                  : `Add ${product.title} to cart`
              }
              className={cn(
                CART_BUTTON,
                justAdded && "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20 text-white",
              )}
            >
              <MaterialIcon
                name={justAdded ? "check" : pending ? "hourglass_top" : "add_shopping_cart"}
                className={cn("text-[16px] sm:text-[17px]", pending && "animate-spin")}
              />
              <span>
                {pending ? "Adding…" : justAdded ? "Added to Cart!" : "Add to Cart"}
              </span>
            </Button>
          )}
          {failed ? (
            <p
              role="alert"
              className="text-[11px] leading-snug text-rose-600 sm:text-xs"
            >
              Could not add to cart. Please try again.
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}
