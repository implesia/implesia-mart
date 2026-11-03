import { mediaUrl } from "@/lib/mart-api/media-url";

/** Bangla QR payment: shared types and pure helpers (no fetch, safe for tests). */

export type PaymentMethod = "cod" | "bangla_qr";
export const ADVANCE_PERCENTS = [25, 50, 75, 100] as const;
export type AdvancePercent = (typeof ADVANCE_PERCENTS)[number];

export type AdvanceOption = { percent: AdvancePercent; advance: number; due: number };

/** The store's Bangla QR. `qrSrc` is a ready-to-render URL, or null when none is set. */
export type PaymentSettings = { qrSrc: string | null };

export const BANGLA_QR_HINT =
  "Bangla QR স্ক্যান করে যেকোনো মোবাইল ব্যাংকিং বা ব্যাংক থেকে পেমেন্ট করুন";

export const NO_PAYMENT_SETTINGS: PaymentSettings = { qrSrc: null };

export function paymentSettingsFrom(body: unknown): PaymentSettings {
  const raw = (body as { bangla_qr_src?: unknown } | null)?.bangla_qr_src;
  const src = typeof raw === "string" ? mediaUrl(raw) : "";
  return { qrSrc: src || null };
}

export function isAdvancePercent(value: unknown): value is AdvancePercent {
  return ADVANCE_PERCENTS.includes(value as AdvancePercent);
}

/**
 * Same rule as the API (display only, the server recomputes): advance = ceil(total × % / 100)
 * in whole taka, due = the rest, paid in cash on delivery.
 */
export function advanceSplit(total: number, percent: AdvancePercent) {
  const safe = Math.max(0, Math.trunc(total));
  const advance = Math.min(safe, Math.ceil((safe * percent) / 100));
  return { advance, due: safe - advance };
}

export function advanceOptionsFrom(body: unknown): AdvanceOption[] {
  if (!Array.isArray(body)) return [];
  return body.flatMap((item) => {
    const option = item as { percent?: unknown; advance?: unknown; due?: unknown };
    if (!isAdvancePercent(option.percent)) return [];
    if (typeof option.advance !== "number" || typeof option.due !== "number") return [];
    return [{ percent: option.percent, advance: option.advance, due: option.due }];
  });
}

/** Spaces removed; the API stores the same value. */
export function normalizePaymentReference(value: string) {
  return value.replace(/\s+/g, "");
}

/** Bengali message for the transaction ID / sender number field, or "" when it is fine. */
export function paymentReferenceError(value: string) {
  const reference = normalizePaymentReference(value);
  if (!reference) return "ট্রানজেকশন আইডি বা যে নম্বর থেকে পাঠিয়েছেন সেটি লিখুন।";
  if (!/^[A-Za-z0-9+-]{4,64}$/.test(reference)) {
    return "৪–৬৪ অক্ষরের ইংরেজি অক্ষর বা সংখ্যা লিখুন (যেমন 8N7A6D5C4B বা 01712345678)।";
  }
  return "";
}

/** The payment part of the order body. COD sends only the method. */
export function buildPaymentPayload(input: {
  method: PaymentMethod;
  advancePercent?: AdvancePercent | null;
  reference?: string;
}): Record<string, unknown> {
  if (input.method !== "bangla_qr") return { payment_method: "cod" };
  return {
    payment_method: "bangla_qr",
    advance_percent: input.advancePercent ?? null,
    payment_reference: normalizePaymentReference(input.reference ?? ""),
  };
}
