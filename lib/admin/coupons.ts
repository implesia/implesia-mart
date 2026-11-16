/**
 * Admin coupon records, form checks, and the coupon report.
 * Money fields here are the coupon's own rules (percent, cap, minimum),
 * not a discount applied to an order.
 */

import { couponCodeFromParam } from "@/lib/coupons";

export const COUPON_STATUSES = ["active", "inactive", "expired", "scheduled"] as const;
export type CouponStatus = (typeof COUPON_STATUSES)[number];
export type CouponDiscountType = "percent" | "fixed";

export type Coupon = {
  id: string;
  code: string;
  discountType: CouponDiscountType;
  value: number;
  maxDiscount: number | null;
  minOrderAmount: number;
  startsAt: string | null;
  endsAt: string | null;
  usageLimitTotal: number | null;
  usageLimitPerPhone: number | null;
  firstOrderOnly: boolean;
  productIds: string[];
  categoryIds: string[];
  freeDelivery: boolean;
  isActive: boolean;
  status: CouponStatus;
  usedCount: number;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CouponListQuery = {
  q?: string;
  status?: CouponStatus | null;
  page: number;
  pageSize: number;
};

export type CouponList = {
  items: Coupon[];
  total: number;
  page: number;
  pages: number;
  pageSize: number;
};

export type CouponRedemption = {
  id: string;
  couponId: string;
  orderId: string;
  orderNumber: string;
  phone: string;
  discountAmount: number;
  /** `active` while the order counts, `cancelled` after the order is cancelled. */
  status: string;
  cancelledAt: string | null;
  createdAt: string;
};

export type CouponRedemptionPage = {
  items: CouponRedemption[];
  total: number;
  page: number;
  pages: number;
  pageSize: number;
};

export type CouponFormValues = {
  code: string;
  discountType: CouponDiscountType;
  value: string;
  maxDiscount: string;
  minOrderAmount: string;
  startsAt: string;
  endsAt: string;
  usageLimitTotal: string;
  usageLimitPerPhone: string;
  firstOrderOnly: boolean;
  productIds: string[];
  categoryIds: string[];
  freeDelivery: boolean;
  isActive: boolean;
};

export type CouponField = keyof CouponFormValues;

export type CouponWrite = {
  code: string;
  discount_type: CouponDiscountType;
  value: number;
  max_discount: number | null;
  min_order_amount: number | null;
  starts_at: string | null;
  ends_at: string | null;
  usage_limit_total: number | null;
  usage_limit_per_phone: number | null;
  first_order_only: boolean;
  product_ids: string[];
  category_ids: string[];
  free_delivery: boolean;
  is_active: boolean;
};

export type CouponReportRow = {
  couponId: string;
  code: string;
  timesUsed: number;
  totalDiscount: number;
  totalSales: number;
};

export type CouponReport = {
  from: string;
  to: string;
  items: CouponReportRow[];
  timesUsed: number;
  totalDiscount: number;
  totalSales: number;
  /** Product, category, and channel filters are not applied to this report. */
  channelApplies: boolean;
};

const BANGLA_DIGITS = "০১২৩৪৫৬৭৮৯";
const DHAKA_OFFSET = "+06:00";

export const COUPON_STATUS_LABEL: Record<CouponStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  expired: "Expired",
  scheduled: "Scheduled",
};

export function emptyCouponForm(): CouponFormValues {
  return {
    code: "",
    discountType: "percent",
    value: "",
    maxDiscount: "",
    minOrderAmount: "0",
    startsAt: "",
    endsAt: "",
    usageLimitTotal: "",
    usageLimitPerPhone: "",
    firstOrderOnly: false,
    productIds: [],
    categoryIds: [],
    freeDelivery: false,
    isActive: true,
  };
}

export function isCouponStatus(value: unknown): value is CouponStatus {
  return value === "active" || value === "inactive" || value === "expired" || value === "scheduled";
}

/** `YYYY-MM-DDTHH:mm` as typed, read as Asia/Dhaka (UTC+6, no daylight saving). */
export function dhakaInputToIso(value: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const iso = `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:00${DHAKA_OFFSET}`;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

/** ISO instant as a `datetime-local` value in Asia/Dhaka. */
export function isoToDhakaInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  const year = get("year");
  const month = get("month");
  const day = get("day");
  const hour = get("hour");
  const minute = get("minute");
  if (!year || !month || !day || hour === "" || minute === "") return "";
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

function banglaDigits(raw: string) {
  return raw.trim().replace(/[০-৯]/g, (digit) => {
    const index = BANGLA_DIGITS.indexOf(digit);
    return index === -1 ? digit : String(index);
  });
}

function parseMoney(raw: string, label: string, allowBlank: boolean): { ok: true; value: number | null } | { ok: false; message: string } {
  const text = banglaDigits(raw).replace(/,/g, "");
  if (!text) {
    if (allowBlank) return { ok: true, value: null };
    return { ok: false, message: `Enter ${label}.` };
  }
  if (!/^\d+(?:\.\d{1,2})?$/.test(text)) {
    return { ok: false, message: `${label} must be a number with at most two decimals.` };
  }
  const value = Number(text);
  if (!Number.isFinite(value) || value < 0) return { ok: false, message: `${label} must be 0 or more.` };
  if (value > 9_999_999_999.99) return { ok: false, message: `${label} is too large.` };
  return { ok: true, value };
}

function parseLimit(raw: string, label: string): { ok: true; value: number | null } | { ok: false; message: string } {
  const text = banglaDigits(raw).replace(/,/g, "");
  if (!text) return { ok: true, value: null };
  if (!/^\d+$/.test(text)) return { ok: false, message: `${label} must be a whole number, or empty for no limit.` };
  const value = Number(text);
  if (!Number.isInteger(value) || value < 1) return { ok: false, message: `${label} must be at least 1, or empty.` };
  if (value > 1_000_000) return { ok: false, message: `${label} is too large.` };
  return { ok: true, value };
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function numberOrNull(value: unknown): number | null {
  if (value == null || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return null;
}

function isoOrNull(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

/** Status from the flags when the API omits `status`. Inactive wins over the dates. */
export function couponStatusOf(input: {
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  now?: Date;
}): CouponStatus {
  if (!input.isActive) return "inactive";
  const now = input.now ?? new Date();
  if (input.startsAt) {
    const start = new Date(input.startsAt);
    if (!Number.isNaN(start.getTime()) && start.getTime() > now.getTime()) return "scheduled";
  }
  if (input.endsAt) {
    const end = new Date(input.endsAt);
    if (!Number.isNaN(end.getTime()) && end.getTime() <= now.getTime()) return "expired";
  }
  return "active";
}

export function parseCoupon(value: unknown, now = new Date()): Coupon | null {
  if (!value || typeof value !== "object") return null;
  const body = value as Record<string, unknown>;
  const id = typeof body.id === "string" ? body.id : "";
  const code = couponCodeFromParam(typeof body.code === "string" ? body.code : "");
  if (!id || !code) return null;
  const discountType: CouponDiscountType = body.discount_type === "fixed" ? "fixed" : "percent";
  const amount = numberOrNull(body.value);
  if (amount == null) return null;
  const startsAt = isoOrNull(body.starts_at);
  const endsAt = isoOrNull(body.ends_at);
  const isActive = body.is_active !== false;
  const status = isCouponStatus(body.status)
    ? body.status
    : couponStatusOf({ isActive, startsAt, endsAt, now });
  return {
    id,
    code,
    discountType,
    value: amount,
    maxDiscount: numberOrNull(body.max_discount),
    minOrderAmount: numberOrNull(body.min_order_amount) ?? 0,
    startsAt,
    endsAt,
    usageLimitTotal: numberOrNull(body.usage_limit_total),
    usageLimitPerPhone: numberOrNull(body.usage_limit_per_phone),
    firstOrderOnly: body.first_order_only === true,
    productIds: stringList(body.product_ids),
    categoryIds: stringList(body.category_ids),
    freeDelivery: body.free_delivery === true,
    isActive,
    status,
    usedCount: numberOrNull(body.used_count) ?? 0,
    createdBy: typeof body.created_by === "string" && body.created_by.trim() ? body.created_by : null,
    createdAt: isoOrNull(body.created_at) ?? now.toISOString(),
    updatedAt: isoOrNull(body.updated_at) ?? now.toISOString(),
  };
}

export function parseCouponList(value: unknown, fallbackPage = 1, fallbackSize = 20): CouponList | null {
  if (!value || typeof value !== "object") return null;
  const body = value as Record<string, unknown>;
  if (!Array.isArray(body.items)) return null;
  const items = body.items.flatMap((item) => {
    const coupon = parseCoupon(item);
    return coupon ? [coupon] : [];
  });
  const total = numberOrNull(body.total) ?? items.length;
  const page = numberOrNull(body.page) ?? fallbackPage;
  const pageSize = numberOrNull(body.page_size) ?? fallbackSize;
  const pages = numberOrNull(body.pages) ?? Math.max(1, Math.ceil(total / Math.max(pageSize, 1)));
  return { items, total, page, pages, pageSize };
}

export function parseRedemptions(value: unknown, fallbackPage = 1, fallbackSize = 20): CouponRedemptionPage | null {
  if (!value || typeof value !== "object") return null;
  const body = value as Record<string, unknown>;
  if (!Array.isArray(body.items)) return null;
  const items = body.items.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const orderId = typeof row.order_id === "string" ? row.order_id : "";
    const orderNumber = typeof row.order_number === "string" ? row.order_number : "";
    if (!orderId && !orderNumber) return [];
    const id = typeof row.id === "string" && row.id.trim() ? row.id : orderId || orderNumber;
    return [
      {
        id,
        couponId: typeof row.coupon_id === "string" ? row.coupon_id : "",
        orderId: orderId || orderNumber,
        orderNumber: orderNumber || orderId,
        phone: typeof row.phone === "string" ? row.phone : "",
        discountAmount: numberOrNull(row.discount_amount) ?? 0,
        status: typeof row.status === "string" ? row.status : "active",
        cancelledAt: isoOrNull(row.cancelled_at),
        createdAt: isoOrNull(row.created_at) ?? "",
      },
    ];
  });
  const total = numberOrNull(body.total) ?? items.length;
  const page = numberOrNull(body.page) ?? fallbackPage;
  const pageSize = numberOrNull(body.page_size) ?? fallbackSize;
  const pages = numberOrNull(body.pages) ?? Math.max(1, Math.ceil(total / Math.max(pageSize, 1)));
  return { items, total, page, pages, pageSize };
}

export function parseCouponReport(value: unknown): CouponReport | null {
  if (!value || typeof value !== "object") return null;
  const body = value as Record<string, unknown>;
  if (!Array.isArray(body.items)) return null;
  const items = body.items.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const code = typeof row.code === "string" ? row.code : "";
    if (!code) return [];
    return [
      {
        couponId: typeof row.coupon_id === "string" ? row.coupon_id : code,
        code,
        timesUsed: numberOrNull(row.times_used) ?? numberOrNull(row.uses) ?? 0,
        totalDiscount: numberOrNull(row.total_discount) ?? 0,
        totalSales: numberOrNull(row.total_sales) ?? 0,
      },
    ];
  });
  const filters = body.filters && typeof body.filters === "object" ? (body.filters as Record<string, unknown>) : null;
  const timesUsed = numberOrNull(body.times_used) ?? items.reduce((sum, row) => sum + row.timesUsed, 0);
  const totalDiscount = numberOrNull(body.total_discount) ?? items.reduce((sum, row) => sum + row.totalDiscount, 0);
  const totalSales = numberOrNull(body.total_sales) ?? items.reduce((sum, row) => sum + row.totalSales, 0);
  return {
    from: typeof filters?.from === "string" ? filters.from : typeof body.from === "string" ? body.from : "",
    to: typeof filters?.to === "string" ? filters.to : typeof body.to === "string" ? body.to : "",
    items,
    timesUsed,
    totalDiscount,
    totalSales,
    channelApplies: filters?.channel_applies === true,
  };
}

export function couponToForm(coupon: Coupon): CouponFormValues {
  return {
    code: coupon.code,
    discountType: coupon.discountType,
    value: String(coupon.value),
    maxDiscount: coupon.maxDiscount == null ? "" : String(coupon.maxDiscount),
    minOrderAmount: String(coupon.minOrderAmount),
    startsAt: isoToDhakaInput(coupon.startsAt),
    endsAt: isoToDhakaInput(coupon.endsAt),
    usageLimitTotal: coupon.usageLimitTotal == null ? "" : String(coupon.usageLimitTotal),
    usageLimitPerPhone: coupon.usageLimitPerPhone == null ? "" : String(coupon.usageLimitPerPhone),
    firstOrderOnly: coupon.firstOrderOnly,
    productIds: [...coupon.productIds],
    categoryIds: [...coupon.categoryIds],
    freeDelivery: coupon.freeDelivery,
    isActive: coupon.isActive,
  };
}

export function validateCouponForm(values: CouponFormValues): Partial<Record<CouponField, string>> {
  const errors: Partial<Record<CouponField, string>> = {};
  const code = couponCodeFromParam(values.code);
  if (!code) errors.code = "Use 3–32 letters, numbers, hyphens, or underscores.";

  const amount = parseMoney(values.value, "the value", false);
  if (!amount.ok) errors.value = amount.message;
  else if (values.discountType === "percent" && (amount.value ?? 0) > 100) {
    errors.value = "A percent cannot be more than 100.";
  } else if (values.discountType === "fixed" && amount.value != null && !Number.isInteger(amount.value)) {
    errors.value = "A fixed amount is whole taka.";
  } else if ((amount.value ?? 0) === 0 && !values.freeDelivery) {
    errors.value = "Enter a value above 0, or turn on free delivery.";
  }

  if (values.discountType === "percent") {
    const cap = parseMoney(values.maxDiscount, "the maximum discount", true);
    if (!cap.ok) errors.maxDiscount = cap.message;
    else if (cap.value === 0) errors.maxDiscount = "Enter at least 1, or leave the maximum empty.";
  }

  const minimum = parseMoney(values.minOrderAmount, "the minimum order", true);
  if (!minimum.ok) errors.minOrderAmount = minimum.message;
  else if (minimum.value === 0) errors.minOrderAmount = "Enter at least 1, or leave the minimum empty.";

  const starts = values.startsAt.trim() ? dhakaInputToIso(values.startsAt) : null;
  const ends = values.endsAt.trim() ? dhakaInputToIso(values.endsAt) : null;
  if (values.startsAt.trim() && !starts) errors.startsAt = "Enter a valid start date and time.";
  if (values.endsAt.trim() && !ends) errors.endsAt = "Enter a valid end date and time.";
  if (starts && ends && new Date(ends).getTime() <= new Date(starts).getTime()) {
    errors.endsAt = "The end must be after the start.";
  }

  const totalLimit = parseLimit(values.usageLimitTotal, "The total limit");
  if (!totalLimit.ok) errors.usageLimitTotal = totalLimit.message;
  const phoneLimit = parseLimit(values.usageLimitPerPhone, "The per-customer limit");
  if (!phoneLimit.ok) errors.usageLimitPerPhone = phoneLimit.message;

  return errors;
}

/** JSON body for create and update. No order discount is included. */
export function couponWriteBody(values: CouponFormValues): CouponWrite | null {
  if (Object.keys(validateCouponForm(values)).length > 0) return null;
  const code = couponCodeFromParam(values.code);
  const amount = parseMoney(values.value, "the value", false);
  const cap = values.discountType === "percent" ? parseMoney(values.maxDiscount, "the maximum discount", true) : { ok: true as const, value: null };
  const minimum = parseMoney(values.minOrderAmount, "the minimum order", true);
  const totalLimit = parseLimit(values.usageLimitTotal, "The total limit");
  const phoneLimit = parseLimit(values.usageLimitPerPhone, "The per-customer limit");
  if (!code || !amount.ok || amount.value == null || !cap.ok || !minimum.ok || !totalLimit.ok || !phoneLimit.ok) {
    return null;
  }
  return {
    code,
    discount_type: values.discountType,
    value: amount.value,
    max_discount: values.discountType === "percent" ? cap.value : null,
    min_order_amount: minimum.value != null && minimum.value > 0 ? minimum.value : null,
    starts_at: values.startsAt.trim() ? dhakaInputToIso(values.startsAt) : null,
    ends_at: values.endsAt.trim() ? dhakaInputToIso(values.endsAt) : null,
    usage_limit_total: totalLimit.value,
    usage_limit_per_phone: phoneLimit.value,
    first_order_only: values.firstOrderOnly,
    product_ids: values.productIds,
    category_ids: values.categoryIds,
    free_delivery: values.freeDelivery,
    is_active: values.isActive,
  };
}

export function formatCouponValue(coupon: Pick<Coupon, "discountType" | "value" | "freeDelivery">) {
  if (coupon.value === 0 && coupon.freeDelivery) return "Free delivery";
  if (coupon.discountType === "percent") return `${coupon.value}%`;
  return `৳${coupon.value.toLocaleString("en-US")}`;
}

export function formatCouponLimit(coupon: Pick<Coupon, "usedCount" | "usageLimitTotal">) {
  if (coupon.usageLimitTotal == null) return `${coupon.usedCount} / ∞`;
  return `${coupon.usedCount} / ${coupon.usageLimitTotal}`;
}
