/**
 * Coupon codes shared by checkout and admin.
 * The browser never prices an order: it only remembers a code and reads
 * `coupon` plus the totals from the quote or order response.
 */

export const COUPON_STORAGE_KEY = "implesia.coupon.v1";

/** Same rule as the API: 3–32 of A–Z, digits, hyphen, underscore. */
const CODE_PATTERN = /^[A-Z0-9_-]{3,32}$/;
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export type CouponStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

/** Quote `coupon` object. `discount` is 0 when the server says the code is not valid. */
export type QuoteCoupon = {
  code: string;
  valid: boolean;
  discount: number;
  freeDelivery: boolean;
  errorCode: string | null;
  message: string | null;
};

export type CouponDisplay =
  | { state: "none" }
  | { state: "applied"; code: string; discount: number; freeDelivery: boolean }
  | { state: "rejected"; code: string; message: string };

const UNAVAILABLE_MESSAGE = "কুপন এখন যাচাই করা যাচ্ছে না। একটু পরে আবার চেষ্টা করুন।";
const REJECTED_MESSAGE = "এই কুপন কোডটি ব্যবহার করা যাচ্ছে না।";

/** Uppercase, no spaces. Empty when the text is not a coupon code. */
export function couponCodeFromParam(value: string | null | undefined): string | null {
  if (!value) return null;
  const code = value.trim().toUpperCase().replace(/\s+/g, "");
  return CODE_PATTERN.test(code) ? code : null;
}

/**
 * Eight-character code from the characters the API accepts.
 * I, O, 0, and 1 are left out so a code read aloud is unambiguous.
 * Hyphen and underscore are allowed when someone types a code; the
 * generator does not use them.
 */
export function generateCouponCode(random: () => number = Math.random, length = 8): string {
  const size = Math.max(3, Math.min(32, Math.floor(length)));
  let code = "";
  for (let index = 0; index < size; index += 1) {
    const pick = Math.floor(Math.min(0.999999, Math.max(0, random())) * CODE_ALPHABET.length);
    code += CODE_ALPHABET[pick] ?? "A";
  }
  return code;
}

export function readRememberedCoupon(storage: CouponStorage | null | undefined): string | null {
  if (!storage) return null;
  try {
    return couponCodeFromParam(storage.getItem(COUPON_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function rememberCoupon(storage: CouponStorage | null | undefined, code: string): string | null {
  const normalized = couponCodeFromParam(code);
  if (!storage || !normalized) return null;
  try {
    storage.setItem(COUPON_STORAGE_KEY, normalized);
  } catch {
    /* Private mode can refuse storage. The code still applies for this page. */
  }
  return normalized;
}

export function forgetCoupon(storage: CouponStorage | null | undefined) {
  if (!storage) return;
  try {
    storage.removeItem(COUPON_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Store `?coupon=` from a landing URL (Facebook ads use this).
 * Returns the stored code, or null when the query has no usable code.
 */
export function captureCouponSearch(search: string, storage: CouponStorage | null | undefined): string | null {
  const query = search.startsWith("?") ? search.slice(1) : search;
  const code = couponCodeFromParam(new URLSearchParams(query).get("coupon"));
  if (!code) return null;
  return rememberCoupon(storage, code);
}

/** Prefer the URL code, then the code remembered earlier in this tab. */
export function couponForCheckout(search: string, storage: CouponStorage | null | undefined): string | null {
  const fromUrl = captureCouponSearch(search, storage);
  if (fromUrl) return fromUrl;
  return readRememberedCoupon(storage);
}

export function parseQuoteCoupon(value: unknown): QuoteCoupon | null {
  if (!value || typeof value !== "object") return null;
  const body = value as Record<string, unknown>;
  const code = couponCodeFromParam(typeof body.code === "string" ? body.code : "");
  if (!code) return null;
  const valid = body.valid === true;
  const rawDiscount = typeof body.discount === "number" && Number.isFinite(body.discount) ? body.discount : 0;
  return {
    code,
    valid,
    discount: valid ? Math.max(0, rawDiscount) : 0,
    freeDelivery: valid && body.free_delivery === true,
    errorCode: typeof body.error_code === "string" && body.error_code.trim() ? body.error_code : null,
    message: typeof body.message === "string" && body.message.trim() ? body.message : null,
  };
}

function unavailableCoupon(code: string): QuoteCoupon {
  return {
    code,
    valid: false,
    discount: 0,
    freeDelivery: false,
    errorCode: "coupon_unavailable",
    message: UNAVAILABLE_MESSAGE,
  };
}

/**
 * Read `coupon` from a quote body. A missing or null coupon while a code was
 * sent does not invent a discount; it only explains that the code was not applied.
 */
export function quoteCouponFromBody(body: unknown, sentCode: string | null): QuoteCoupon | null {
  const sent = couponCodeFromParam(sentCode);
  if (!body || typeof body !== "object" || !("coupon" in body)) {
    return sent ? unavailableCoupon(sent) : null;
  }
  const coupon = (body as { coupon?: unknown }).coupon;
  if (coupon == null) return sent ? unavailableCoupon(sent) : null;
  return parseQuoteCoupon(coupon) ?? (sent ? unavailableCoupon(sent) : null);
}

export function couponDisplay(coupon: QuoteCoupon | null | undefined): CouponDisplay {
  if (!coupon) return { state: "none" };
  if (coupon.valid) {
    return {
      state: "applied",
      code: coupon.code,
      discount: coupon.discount,
      freeDelivery: coupon.freeDelivery,
    };
  }
  return {
    state: "rejected",
    code: coupon.code,
    message: coupon.message?.trim() || REJECTED_MESSAGE,
  };
}

/** Product total after the server discount, before a delivery zone is chosen. */
export function merchandiseAfterCoupon(subtotal: number, coupon: QuoteCoupon | null | undefined): number {
  const discount = coupon?.valid ? coupon.discount : 0;
  return Math.max(0, subtotal - discount);
}

/**
 * The figure next to সর্বমোট. Once a zone is known this is the server `total`.
 * Before that, delivery is not shown, so the figure is the server subtotal
 * minus the server discount.
 */
export function shownCheckoutTotal(
  zoneKnown: boolean,
  quote: { subtotal: number; total: number; coupon: QuoteCoupon | null | undefined },
): number {
  if (zoneKnown) return quote.total;
  return merchandiseAfterCoupon(quote.subtotal, quote.coupon);
}

export function isCouponErrorCode(code: string | null | undefined): boolean {
  return typeof code === "string" && code.startsWith("coupon");
}
