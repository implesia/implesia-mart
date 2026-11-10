/**
 * Admin-only cost price. The storefront never imports this module.
 *
 * Backend (`AdminProductCard` / `AdminProductRead`, PR 8): `cost_price` is
 * `numeric(12, 2)`, null or >= 0. JSON reads are a number (`float` of that
 * decimal) or `null`. Writes accept a number or `null`. Omitting the field on
 * PATCH keeps the stored value; `null` clears it. Public product schemas omit it.
 *
 * Margin follows Shopify: percent of the selling price, not markup on cost.
 *   profit taka = selling price − cost price
 *   margin %    = profit taka ÷ selling price × 100
 * A selling price of 0 has no percent (division by zero). Amounts use paisa
 * (two decimal places) so binary floats do not drift.
 */

export const COST_PRICE_MESSAGE =
  "কেনা দাম ০ বা তার বেশি সংখ্যা দিন (সর্বোচ্চ দুই দশমিক), নাহলে খালি রাখুন। Enter 0 or more, up to two decimals, or leave it blank.";

/** `numeric(12, 2)`: 10 digits before the decimal and 2 after. */
export const COST_PRICE_MAX = 9_999_999_999.99;

export const COST_PRICE_RANGE_MESSAGE =
  "কেনা দাম ৯,৯৯৯,৯৯৯,৯৯৯.৯৯ টাকার বেশি হতে পারে না। Cost price cannot be more than 9,999,999,999.99.";

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

/**
 * Paisa from a canonical cost string, or why it cannot be stored as numeric(12, 2).
 * Integer maths, so 9999999999.99 does not drift.
 */
function centsFromCanonical(text: string): { cents: number } | { error: "format" | "range" } {
  if (!COST_PRICE_PATTERN.test(text)) return { error: "format" };
  const [wholeRaw, fraction = ""] = text.split(".");
  const whole = wholeRaw.replace(/^0+(?=\d)/, "");
  if (whole.length > 10) return { error: "range" };
  const paisa = Number((fraction + "00").slice(0, 2));
  const amount = Number(whole) * 100 + paisa;
  if (!Number.isSafeInteger(amount) || amount < 0) return { error: "range" };
  return { cents: amount };
}

/** Empty is null (PATCH clears the field). Anything else must fit numeric(12, 2). */
export function parseCostPriceInput(raw: string): ParsedCostPrice {
  const text = canonicalizeCostPrice(raw);
  if (!text) return { ok: true, value: null };
  const parsed = centsFromCanonical(text);
  if ("error" in parsed) {
    return {
      ok: false,
      message: parsed.error === "range" ? COST_PRICE_RANGE_MESSAGE : COST_PRICE_MESSAGE,
    };
  }
  return { ok: true, value: parsed.cents / 100 };
}

/** Message that blocks save, or null when the field may be submitted. */
export function costPriceError(raw: string) {
  const parsed = parseCostPriceInput(raw);
  return parsed.ok ? null : parsed.message;
}

/**
 * Live message while typing. A lone "." is still being typed. "10." is already
 * a whole number once the trailing dot is dropped, so it is checked normally.
 */
export function costPriceLiveError(raw: string) {
  const text = raw.trim();
  if (!text || text === ".") return null;
  return costPriceError(raw);
}

/** Value for the admin product payload. Empty -> null. Invalid throws (the form blocks it). */
export function costPriceForApi(raw: string): number | null {
  const parsed = parseCostPriceInput(raw);
  if (!parsed.ok) throw new Error(parsed.message);
  return parsed.value;
}

/**
 * `cost_price` on an admin product read. The schema serialises `numeric(12, 2)`
 * as a JSON number (`float(Decimal)`) or `null`. A decimal string is still
 * accepted so a hand-edited payload cannot blank the field.
 */
export function readCostPrice(value: unknown): number | null {
  if (value == null || value === "") return null;
  if (typeof value === "number") {
    if (!Number.isFinite(value) || value < 0) return null;
    return cents(value) / 100;
  }
  if (typeof value === "string") {
    const parsed = parseCostPriceInput(value);
    return parsed.ok ? parsed.value : null;
  }
  return null;
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
