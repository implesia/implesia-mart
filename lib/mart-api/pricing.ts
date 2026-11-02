/**
 * Discount maths for DISPLAY. Pure functions only, so node:test can load them.
 *
 * Mirrors the backend's pricing service (app/services/pricing_service.py): the API prices the
 * cart, the quote and the order itself and never takes a price from the browser.
 *
 * tier %   = extra % of the nearest tier at or below the quantity (0 when none),
 *            capped so base % + tier % <= min(max %, 99.99 %)
 * total    = selling price × quantity
 * final    = ceil(total − total × tier % / 100)   (whole taka, always rounded UP)
 * discount = total − final
 * Percentages are handled as whole hundredths (2800 = 28 %) and the maths stays in integers,
 * so there is no float drift (an exact 2772 never becomes 2773).
 */

export type QuantityTier = { minQuantity: number; extraPercent: number };

export type ProductPricing = {
  regularPrice: number;
  sellingPrice: number;
  basePercent: number;
  maxPercent: number;
  tiers: QuantityTier[];
};

export type PricedLine = {
  regularPrice: number;
  basePercent: number;
  quantityPercent: number;
  totalPercent: number;
  /** Quantity-1 selling price (before the quantity discount). */
  unitPrice: number;
  /** unitPrice × quantity, before the quantity discount. */
  subtotal: number;
  /** subtotal − lineTotal, whole taka. */
  discountAmount: number;
  /** What is charged: ceil(subtotal less the quantity %). */
  lineTotal: number;
};

const CEILING = 9999; // 99.99 %: a discount never reaches 100 %.

const hundredths = (value: number) => Math.round(value * 100);
const fromHundredths = (value: number) => value / 100;
/** Half-up division of non-negative integers. */
const divRound = (value: number, by: number) =>
  Math.floor((2 * value + by) / (2 * by));

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

const isPercent = (value: unknown): value is number =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  value >= 0 &&
  value < 100;
const isMoney = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 0;

export function readTiers(value: unknown): QuantityTier[] {
  if (!Array.isArray(value)) return [];
  return value
    .flatMap((item): QuantityTier[] => {
      const row = asRecord(item);
      const minQuantity = row?.min_quantity;
      const extraPercent = row?.extra_percent;
      return typeof minQuantity === "number" &&
        Number.isInteger(minQuantity) &&
        minQuantity >= 2 &&
        isPercent(extraPercent)
        ? [{ minQuantity, extraPercent }]
        : [];
    })
    .sort((a, b) => a.minQuantity - b.minQuantity);
}

/** The public product `pricing` block, or null when missing or malformed. */
export function readPricing(value: unknown): ProductPricing | null {
  const row = asRecord(value);
  if (!row) return null;
  const {
    regular_price,
    selling_price,
    base_discount_percent,
    max_discount_percent,
  } = row;
  if (
    !isMoney(regular_price) ||
    !isMoney(selling_price) ||
    !isPercent(base_discount_percent) ||
    !isPercent(max_discount_percent)
  ) {
    return null;
  }
  return {
    regularPrice: regular_price,
    sellingPrice: selling_price,
    basePercent: base_discount_percent,
    maxPercent: max_discount_percent,
    tiers: readTiers(row.tiers),
  };
}

/** Extra % of the highest tier reached. */
export function extraFor(quantity: number, tiers: QuantityTier[]) {
  let reached = 0;
  let extra = 0;
  for (const tier of tiers) {
    if (tier.minQuantity <= quantity && tier.minQuantity > reached) {
      reached = tier.minQuantity;
      extra = tier.extraPercent;
    }
  }
  return extra;
}

/** Base % derived from two prices, two decimals, half up (older rows and variants). */
export function derivedBase(regular: number, price: number) {
  if (regular <= 0 || price >= regular) return 0;
  return fromHundredths(divRound((regular - price) * 10000, regular));
}

/** `total` less `percent` %, rounded UP to whole taka (integer maths). */
export function discountedTotal(total: number, percent: number) {
  const keep = 10000 - hundredths(percent);
  if (total <= 0 || keep >= 10000) return Math.max(total, 0);
  return Math.max(Math.ceil((total * keep) / 10000), 0);
}

/** Taka a line saves through its quantity discount (0 when none). */
export function lineDiscount(unitPrice: number, quantity: number, lineTotal: number) {
  return Math.max(unitPrice * quantity - lineTotal, 0);
}

/** Selling price for a regular price and a discount %. */
export function sellingPrice(regular: number, percent: number) {
  return Math.max(divRound(regular * (10000 - hundredths(percent)), 10000), 0);
}

export function priceLine(input: {
  regular: number;
  price: number;
  basePercent?: number | null;
  quantity: number;
  tiers: QuantityTier[];
  maxPercent: number;
}): PricedLine {
  const quantity = Math.max(1, Math.floor(input.quantity));
  const regular = Math.max(input.regular, input.price);
  const base = hundredths(
    input.basePercent ?? derivedBase(regular, input.price),
  );
  const cap = Math.min(hundredths(input.maxPercent), CEILING);
  const total = Math.min(
    base + hundredths(extraFor(quantity, input.tiers)),
    cap,
  );
  const unit = Math.max(
    total >= base ? input.price : sellingPrice(regular, fromHundredths(total)),
    0,
  );
  const extra = Math.max(total - base, 0);
  const subtotal = unit * quantity;
  const lineTotal = discountedTotal(subtotal, fromHundredths(extra));
  return {
    regularPrice: regular,
    basePercent: fromHundredths(base),
    quantityPercent: fromHundredths(extra),
    totalPercent: fromHundredths(total),
    unitPrice: unit,
    subtotal,
    discountAmount: subtotal - lineTotal,
    lineTotal,
  };
}

/** "28.25" -> "28.25", 30 -> "30" (no trailing zeros). */
export function percentText(value: number) {
  return String(Number(value.toFixed(2)));
}

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
const bangla = (value: string) =>
  value.replace(/\d/g, (d) => BN_DIGITS[Number(d)] ?? d);

/**
 * Compact tier list for the product page, e.g. "৮টি কিনলে ৩০% ছাড়". Only quantities the
 * shopper can actually buy (up to `maxQuantity`) are listed.
 */
export function tierOffers(
  pricing: ProductPricing,
  maxQuantity: number,
  base: { regular: number; price: number; basePercent?: number | null } = {
    regular: pricing.regularPrice,
    price: pricing.sellingPrice,
    basePercent: pricing.basePercent,
  },
) {
  const rules = { tiers: pricing.tiers, maxPercent: pricing.maxPercent };
  const start = priceLine({ ...base, quantity: 1, ...rules }).totalPercent;
  return pricing.tiers
    .filter((tier) => tier.minQuantity <= maxQuantity)
    .map((tier) => {
      const line = priceLine({ ...base, quantity: tier.minQuantity, ...rules });
      return {
        quantity: tier.minQuantity,
        totalPercent: line.totalPercent,
        label: `${bangla(String(tier.minQuantity))}টি কিনলে ${bangla(percentText(line.totalPercent))}% ছাড়`,
      };
    })
    .filter(
      (offer, index, all) =>
        offer.totalPercent >
        (index === 0 ? start : all[index - 1].totalPercent),
    );
}

/** "সর্বোচ্চ ৮টি নেওয়া যাবে": shown next to a quantity selector at its limit. */
export function maxQuantityText(maxQuantity: number) {
  return `সর্বোচ্চ ${bangla(String(maxQuantity))}টি নেওয়া যাবে`;
}

/** A typed percent: blank = 0; 0–99.99 with at most two decimals, else null. */
export function parsePercent(value: string): number | null {
  const text = value.trim();
  if (!text) return 0;
  if (!/^\d{1,2}(\.\d{1,2})?$/.test(text)) return null;
  return Number(text);
}

/** One editable tier row in the admin (strings as typed). */
export type TierRow = { minQuantity: string; extra: string };

export const MAX_TIER_ROWS = 20;

export function tierRowsFrom(tiers: QuantityTier[]): TierRow[] {
  return tiers.map((tier) => ({
    minQuantity: String(tier.minQuantity),
    extra: percentText(tier.extraPercent),
  }));
}

/** Typed rows -> sorted tiers, or the first problem in plain words. */
export function parseTierRows(
  rows: TierRow[],
): { tiers: QuantityTier[]; error: null } | { tiers: null; error: string } {
  if (rows.length > MAX_TIER_ROWS) {
    return { tiers: null, error: `Use at most ${MAX_TIER_ROWS} quantity tiers.` };
  }
  const tiers: QuantityTier[] = [];
  for (const row of rows) {
    const minQuantity = Number(row.minQuantity.trim());
    if (
      !row.minQuantity.trim() ||
      !Number.isInteger(minQuantity) ||
      minQuantity < 2 ||
      minQuantity > 1000
    ) {
      return { tiers: null, error: "Each tier quantity must be a whole number from 2 to 1000." };
    }
    const extraPercent = parsePercent(row.extra);
    if (extraPercent == null || !row.extra.trim()) {
      return { tiers: null, error: "Each tier needs an extra % from 0 to 99.99." };
    }
    if (tiers.some((tier) => tier.minQuantity === minQuantity)) {
      return { tiers: null, error: "Each quantity tier needs a different quantity." };
    }
    tiers.push({ minQuantity, extraPercent });
  }
  return { tiers: tiers.sort((a, b) => a.minQuantity - b.minQuantity), error: null };
}
