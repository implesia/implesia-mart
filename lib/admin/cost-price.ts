/**
 * Admin-only cost price. The storefront never imports this module.
 *
 * Margin follows Shopify: percent of the selling price, not markup on cost.
 *   profit taka = selling price − cost price
 *   margin %    = profit taka ÷ selling price × 100
 * A selling price of 0 has no percent (division by zero). Amounts use paisa
 * (two decimal places) so binary floats do not drift.
 */

export const COST_PRICE_MESSAGE =
  "কেনা দাম ০ বা তার বেশি সংখ্যা দিন (সর্বোচ্চ দুই দশমিক), নাহলে খালি রাখুন। Enter 0 or more, up to two decimals, or leave it blank.";

const BANGLA_DIGITS = "০১২৩৪৫৬৭৮৯";

/** Blank, or a non-negative number with at most two decimal places. */
const COST_PRICE_PATTERN = /^\d+(?:\.\d{1,2})?$/;

export type CostMargin = {
  /** Selling price minus cost price, in taka. Negative is a loss. */
  profit: number;
  /**
   * Margin on the selling price, two decimal places.
   * Null when the selling price is 0.
   */
  percent: number | null;
};

function cents(value: number) {
  return Math.round(value * 100);
}

/** Trim the field and accept Bengali digits. A trailing dot is the whole taka. */
export function canonicalizeCostPrice(raw: string) {
  const text = raw.trim().replace(/[০-৯]/g, (digit) => {
    const index = BANGLA_DIGITS.indexOf(digit);
    return index === -1 ? digit : String(index);
  });
  if (!text || text === ".") return text;
  const unsigned = text.endsWith(".") ? text.slice(0, -1) : text;
  if (unsigned.startsWith(".")) return `0${unsigned}`;
  return unsigned;
}

export type ParsedCostPrice =
  | { ok: true; value: number | null }
  | { ok: false; message: string };

/** Empty is null (the API clears the field). Anything else must be >= 0. */
export function parseCostPriceInput(raw: string): ParsedCostPrice {
  const text = canonicalizeCostPrice(raw);
  if (!text) return { ok: true, value: null };
  if (!COST_PRICE_PATTERN.test(text)) return { ok: false, message: COST_PRICE_MESSAGE };
  const value = cents(Number(text)) / 100;
  if (!Number.isFinite(value) || value < 0) return { ok: false, message: COST_PRICE_MESSAGE };
  return { ok: true, value };
}

/** Message that blocks save, or null when the field may be submitted. */
export function costPriceError(raw: string) {
  const parsed = parseCostPriceInput(raw);
  return parsed.ok ? null : parsed.message;
}

/**
 * Live message while typing. An unfinished decimal ("10.") is not flagged;
 * save still accepts it as whole taka via `parseCostPriceInput`.
 */
export function costPriceLiveError(raw: string) {
  const text = raw.trim();
  if (!text) return null;
  if (text.includes("-") || /[^\d.\s০-৯]/.test(text)) return COST_PRICE_MESSAGE;
  const canonical = canonicalizeCostPrice(text);
  if (/^\d+\.$/.test(text.trim()) || /^\d*$/.test(canonical)) return null;
  if (/^\d+\.\d{0,2}$/.test(canonical)) return null;
  return costPriceError(raw);
}

/** Value for the admin product payload. Empty -> null. Invalid throws (the form blocks it). */
export function costPriceForApi(raw: string): number | null {
  const parsed = parseCostPriceInput(raw);
  if (!parsed.ok) throw new Error(parsed.message);
  return parsed.value;
}

/** `cost_price` from the admin API: a number, a decimal string, or empty. */
export function readCostPrice(value: unknown): number | null {
  if (value == null || value === "") return null;
  const number =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value.trim())
        : Number.NaN;
  if (!Number.isFinite(number) || number < 0) return null;
  return cents(number) / 100;
}

/** What the cost field shows when a product is opened. */
export function formatCostPriceInput(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value) || value < 0) return "";
  const rounded = cents(value) / 100;
  return String(rounded);
}

/**
 * Margin on the selling price (Shopify). `selling` is the quantity-1 price,
 * or the lowest active variant price when the product has variants.
 */
export function costMargin(selling: number, cost: number): CostMargin | null {
  if (!Number.isFinite(selling) || !Number.isFinite(cost)) return null;
  if (selling < 0 || cost < 0) return null;
  const sellingCents = cents(selling);
  const profitCents = sellingCents - cents(cost);
  const profit = profitCents / 100;
  if (sellingCents === 0) return { profit, percent: null };
  const percent = Math.round((profitCents / sellingCents) * 10000) / 100;
  return { profit, percent };
}

/** Whole taka without decimals; otherwise two decimals. Absolute value. */
export function formatMarginTaka(value: number) {
  const rounded = Math.abs(cents(value)) / 100;
  const text = Number.isInteger(rounded)
    ? rounded.toLocaleString("en-US")
    : rounded.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `৳${text}`;
}
