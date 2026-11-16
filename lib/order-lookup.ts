/**
 * Public `POST /api/v1/orders/lookup` (implesia-mart-backend PR #18).
 * The body is the phone plus exactly one of `number` or `tracking_number`.
 */

import { isOrderStatus } from "@/lib/admin/orders-desk";
import type { OrderStatus } from "@/lib/mart-mock/store";

export type OrderLookupBody =
  | { phone: string; number: string }
  | { phone: string; tracking_number: string };

export function orderLookupBody(input: {
  phone: string;
  number?: string;
  trackingNumber?: string;
}): OrderLookupBody | null {
  const phone = input.phone.trim();
  const number = (input.number ?? "").replace(/\s+/g, "").toUpperCase();
  const tracking = (input.trackingNumber ?? "").trim();
  const hasNumber = number.length > 0;
  const hasTracking = tracking.length > 0;
  if (hasNumber === hasTracking) return null;
  if (hasNumber) return { phone, number };
  return { phone, tracking_number: tracking };
}

/** Prefill from `/order-status?number=`. `order` remains for older checkout links. */
export function orderStatusQuery(params: { number?: string | null; order?: string | null }) {
  const raw = (params.number ?? "").trim() || (params.order ?? "").trim();
  return raw.replace(/\s+/g, "").toUpperCase();
}

export function publicTimelineFrom(value: unknown): { status: OrderStatus; at: string }[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as { status?: unknown; at?: unknown };
    if (!isOrderStatus(row.status) || typeof row.at !== "string" || !row.at.trim()) return [];
    return [{ status: row.status, at: row.at }];
  });
}

const NOT_FOUND = "এই তথ্য দিয়ে অর্ডার পাওয়া যায়নি। মোবাইল নম্বরটা অর্ডারের সময় যেটা দিয়েছিলেন, সেটাই দিন।";

/** Bangla copy for the public lookup form. A wrong phone and an unknown id share one sentence. */
export function orderLookupErrorText(message: string) {
  if (message === "Order not found" || message === "Order not found.") return NOT_FOUND;
  if (message.includes("reach")) return "এখন সংযোগ হয়নি। একটু পরে আবার চেষ্টা করুন।";
  if (message.includes("Send the order number")) {
    return "অর্ডার নম্বর অথবা ট্র্যাকিং আইডি, আর মোবাইল নম্বর দিন।";
  }
  return "অর্ডার নম্বর বা ট্র্যাকিং আইডি, আর ১১ সংখ্যার মোবাইল দিন।";
}
