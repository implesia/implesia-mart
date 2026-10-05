export const MAX_CART_QTY = 5;

export type CartLineResolved = {
  id: string;
  slug: string;
  title: string;
  meta: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
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

export function clampCartQty(value: number) {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.min(MAX_CART_QTY, Math.floor(value)));
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
