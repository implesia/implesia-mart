/**
 * Variant helpers. Pure functions only (no React, no Next), so node:test can load them.
 *
 * Everything here is for DISPLAY and for building the request. The API prices the cart and the
 * order from its own variant row; a price calculated here is never sent as an authority.
 */

import { priceLine, type ProductPricing } from "@/lib/mart-api/pricing";

export type ProductVariant = {
  id: string;
  /** Option group id -> option value id. */
  options: Record<string, string>;
  label: string;
  price: number;
  compareAtPrice: number | null;
  available: boolean;
};

export type OptionChoices = Record<string, string>;

export const ORDER_QTY_CAP = 5;

/** One cart line is one product, or one product and one variant. */
export function lineKey(slug: string, variantId?: string | null) {
  return variantId ? `${slug}::${variantId}` : slug;
}

function sameOptions(variant: ProductVariant, choices: OptionChoices) {
  const keys = Object.keys(variant.options);
  return keys.length > 0 && keys.every((key) => choices[key] === variant.options[key]);
}

/** The variant that exactly matches the picks, or null when that combination is not offered. */
export function findVariant(
  variants: ProductVariant[],
  choices: OptionChoices,
): ProductVariant | null {
  return variants.find((variant) => sameOptions(variant, choices)) ?? null;
}

/** First variant that can be bought, so the page opens on a selection that works. */
export function defaultChoices(variants: ProductVariant[]): OptionChoices | null {
  const first = variants.find((variant) => variant.available) ?? variants[0];
  return first ? { ...first.options } : null;
}

/** True when at least one buyable variant uses this option value. */
export function valueIsOffered(
  variants: ProductVariant[],
  groupId: string,
  valueId: string,
) {
  return variants.some((variant) => variant.available && variant.options[groupId] === valueId);
}

/**
 * Applies a pick. When the new combination is not buyable, the other groups move to the closest
 * buyable variant that has the picked value. Null means that value is not offered at all.
 */
export function chooseOption(
  variants: ProductVariant[],
  current: OptionChoices,
  groupId: string,
  valueId: string,
): OptionChoices | null {
  const next = { ...current, [groupId]: valueId };
  const exact = findVariant(variants, next);
  if (exact?.available) return next;
  const candidates = variants.filter(
    (variant) => variant.available && variant.options[groupId] === valueId,
  );
  if (candidates.length === 0) return null;
  const agreement = (variant: ProductVariant) =>
    Object.keys(variant.options).filter((key) => variant.options[key] === next[key]).length;
  const best = candidates.reduce((top, variant) =>
    agreement(variant) > agreement(top) ? variant : top,
  );
  return { ...best.options };
}

export type PriceView = {
  unitPrice: number;
  compareAtPrice: number | null;
  lineTotal: number;
  discountPercent: number | null;
  /** Extra % the chosen quantity adds on top of the base discount. */
  quantityPercent: number;
};

export function clampQuantity(
  quantity: number,
  limits: { min?: number; max?: number | null } = {},
) {
  const min = Math.max(1, Math.min(ORDER_QTY_CAP, Math.floor(limits.min ?? 1)));
  const ceiling = limits.max ? Math.min(ORDER_QTY_CAP, Math.floor(limits.max)) : ORDER_QTY_CAP;
  const max = Math.max(min, ceiling);
  if (!Number.isFinite(quantity)) return min;
  return Math.max(min, Math.min(max, Math.floor(quantity)));
}

/** What the page shows while the shopper picks. The API recalculates at cart and order time. */
export function priceView(
  base: {
    price: number;
    compareAtPrice?: number | null;
    /** Base %, quantity tiers and cap from the API; null keeps plain compare-at display. */
    pricing?: ProductPricing | null;
  },
  variant: ProductVariant | null,
  quantity: number,
): PriceView {
  const price = variant ? variant.price : base.price;
  const compare = variant ? variant.compareAtPrice : (base.compareAtPrice ?? null);
  const regular = compare != null && compare > price ? compare : price;
  const line = priceLine({
    regular,
    price,
    // The saved base % belongs to the product row; a variant's is derived from its prices.
    basePercent: variant ? null : (base.pricing?.basePercent ?? null),
    quantity,
    tiers: base.pricing?.tiers ?? [],
    maxPercent: base.pricing?.maxPercent ?? 99.99,
  });
  const discounted = line.unitPrice < regular;
  return {
    unitPrice: line.unitPrice,
    compareAtPrice: discounted ? regular : null,
    lineTotal: line.lineTotal,
    discountPercent: discounted
      ? base.pricing
        ? line.totalPercent
        : Math.round(((regular - line.unitPrice) / regular) * 100)
      : null,
    quantityPercent: line.quantityPercent,
  };
}

/** Lowest and highest price among buyable variants, for "From ৳X" on cards. */
export function priceRange(variants: ProductVariant[]) {
  const prices = variants.filter((variant) => variant.available).map((variant) => variant.price);
  if (prices.length === 0) return null;
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

export type PurchaseCheck =
  | { ok: true }
  | { ok: false; reason: "choose" | "unavailable" };

/** Whether Add to cart / Buy now may run for the current picks. */
export function purchaseCheck(
  hasVariants: boolean,
  variant: ProductVariant | null,
): PurchaseCheck {
  if (!hasVariants) return { ok: true };
  if (!variant) return { ok: false, reason: "choose" };
  if (!variant.available) return { ok: false, reason: "unavailable" };
  return { ok: true };
}

/** Reads the public `variants` array. Rows that cannot be used are dropped, not repaired. */
export function readVariants(value: unknown): ProductVariant[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item): ProductVariant[] => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const options = row.options;
    if (typeof row.id !== "string" || !row.id) return [];
    if (!options || typeof options !== "object" || Array.isArray(options)) return [];
    const picked: Record<string, string> = {};
    for (const [key, entry] of Object.entries(options)) {
      if (typeof entry !== "string") return [];
      picked[key] = entry;
    }
    if (Object.keys(picked).length === 0) return [];
    const price = row.price;
    if (typeof price !== "number" || !Number.isFinite(price) || price < 0) return [];
    const compare = row.compare_at_price;
    return [
      {
        id: row.id,
        options: picked,
        label: typeof row.label === "string" ? row.label : "",
        price,
        compareAtPrice:
          typeof compare === "number" && Number.isFinite(compare) && compare > price
            ? compare
            : null,
        available: row.available === true,
      },
    ];
  });
}
