import type { ProductPricing } from "@/lib/mart-api/pricing";
import { QUANTITY_CEILING } from "@/lib/mart-api/variants";

export type CartLineResolved = {
  id: string;
  /** Stable line identity: the slug, plus the variant id for a variant line. */
  key: string;
  variantId: string | null;
  sku: string;
  /** False when the product or variant can no longer be bought. */
  available: boolean;
  minQuantity: number;
  maxQuantity: number;
  slug: string;
  title: string;
  meta: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  /** Price before discount and the total discount % (from the server). */
  regularPrice?: number;
  totalPercent?: number;
  /** Base %, tiers and cap, so a quantity change shows its price at once. */
  pricing?: ProductPricing | null;
  imageSrc: string;
  imageAlt: string;
};

export type CartPricing = {
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  insideDhaka: number;
  dhakaSuburban: number;
  outsideDhaka: number;
  insideEnabled: boolean;
  suburbanEnabled: boolean;
  outsideEnabled: boolean;
  /** False until a cart or quote response supplies the zone fees. */
  ratesConfirmed: boolean;
};

export function clampCartQty(
  value: number,
  limits: { min?: number; max?: number | null } = {},
) {
  const min = Math.max(1, Math.min(QUANTITY_CEILING, Math.floor(limits.min ?? 1)));
  const ceiling = limits.max
    ? Math.min(QUANTITY_CEILING, Math.floor(limits.max))
    : QUANTITY_CEILING;
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(Math.max(min, ceiling), Math.floor(value)));
}

export function formatCartMoney(value: number) {
  return `৳${value.toLocaleString("en-US")}`;
}

export function offeredDeliveryLabel(pricing: CartPricing) {
  if (!pricing.ratesConfirmed) return "চেকআউটে";
  const offered = [
    pricing.insideEnabled ? pricing.insideDhaka : null,
    pricing.suburbanEnabled ? pricing.dhakaSuburban : null,
    pricing.outsideEnabled ? pricing.outsideDhaka : null,
  ].filter((fee): fee is number => fee != null);
  if (offered.length === 0) return "বন্ধ";
  if (offered.every((fee) => fee === offered[0]))
    return formatCartMoney(pricing.shipping);
  return "চেকআউটে";
}
