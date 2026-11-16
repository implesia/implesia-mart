/**
 * Pure helpers for Admin › Orders Management.
 * Field names and allowed moves match implesia-mart-backend PR #18
 * (`app/schemas/order.py`, `docs/API.md`). Money the server returns is shown
 * as-is. `offlineMoneyPreview` is only a form estimate.
 */

import type { OrderStatus } from "@/lib/mart-mock/store";
import { ORDER_STATUSES } from "@/lib/mart-mock/store";

export const CALL_STATUSES = ["not_called", "confirmed", "no_answer", "fake"] as const;
export type CallStatus = (typeof CALL_STATUSES)[number];

export const ORDER_ORIGINS = ["online", "offline"] as const;
export type OrderOrigin = (typeof ORDER_ORIGINS)[number];

export const PAYMENT_METHODS = ["cod", "bangla_qr", "cash", "bkash", "nagad", "card", "due"] as const;
export type AnyPaymentMethod = (typeof PAYMENT_METHODS)[number];

export const OFFLINE_PAYMENT_METHODS = ["cash", "bkash", "nagad", "card", "due"] as const;
export type OfflinePaymentMethod = (typeof OFFLINE_PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = ["unpaid", "partial", "paid"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PRINT_KINDS = ["invoice", "label", "both"] as const;
export type PrintKind = (typeof PRINT_KINDS)[number];

export const CALL_STATUS_LABEL: Record<CallStatus, string> = {
  not_called: "Not called",
  confirmed: "Call confirmed",
  no_answer: "No answer",
  fake: "Fake",
};

export const ORIGIN_LABEL: Record<OrderOrigin, string> = {
  online: "Online",
  offline: "Offline",
};

export const PAYMENT_METHOD_LABEL: Record<AnyPaymentMethod, string> = {
  cod: "Cash on delivery",
  bangla_qr: "Bangla QR",
  cash: "Cash",
  bkash: "bKash",
  nagad: "Nagad",
  card: "Card",
  due: "Due",
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  unpaid: "Unpaid",
  partial: "Partial",
  paid: "Paid",
};

/** Confirmed is the ready-to-pack queue. Packed is required before shipped. */
export const ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  new: ["confirmed", "cancelled"],
  confirmed: ["packed", "cancelled"],
  packed: ["shipped", "cancelled"],
  shipped: ["delivered", "returned"],
  delivered: ["returned"],
  cancelled: [],
  returned: [],
};

const STATUS_FLOW: OrderStatus[] = ["new", "confirmed", "packed", "shipped", "delivered"];

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && (ORDER_STATUSES as readonly string[]).includes(value);
}

export function isCallStatus(value: unknown): value is CallStatus {
  return typeof value === "string" && (CALL_STATUSES as readonly string[]).includes(value);
}

export function isOrderOrigin(value: unknown): value is OrderOrigin {
  return value === "online" || value === "offline";
}

export function isPaymentMethod(value: unknown): value is AnyPaymentMethod {
  return typeof value === "string" && (PAYMENT_METHODS as readonly string[]).includes(value);
}

export function isOfflinePaymentMethod(value: unknown): value is OfflinePaymentMethod {
  return typeof value === "string" && (OFFLINE_PAYMENT_METHODS as readonly string[]).includes(value);
}

export function isPaymentStatus(value: unknown): value is PaymentStatus {
  return value === "unpaid" || value === "partial" || value === "paid";
}

export function isPrintKind(value: unknown): value is PrintKind {
  return value === "invoice" || value === "label" || value === "both";
}

/** Server `next_statuses` when the API sent the list. Otherwise the local map. */
export function nextOrderStatuses(current: OrderStatus, fromServer: readonly OrderStatus[] | null) {
  const allowed = fromServer ?? ORDER_TRANSITIONS[current];
  return STATUS_FLOW.concat(["cancelled", "returned"]).filter(
    (status) => status !== current && allowed.includes(status),
  );
}

export type CustomerHistoryCounts = {
  phone: string;
  totalOrders: number;
  delivered: number;
  returnedCancelled: number;
};

export function historyBadge(history: CustomerHistoryCounts) {
  const orders = `${history.totalOrders} ${history.totalOrders === 1 ? "order" : "orders"}`;
  return {
    label: `${orders} · ${history.delivered} delivered · ${history.returnedCancelled} returned/cancelled`,
    caution: history.returnedCancelled > 0,
  };
}

export const DUPLICATE_ORDER_WARNING =
  "Another order with this phone was placed within 24 hours.";

const BD_DIGITS: Record<string, string> = {
  "০": "0",
  "১": "1",
  "২": "2",
  "৩": "3",
  "৪": "4",
  "৫": "5",
  "৬": "6",
  "৭": "7",
  "৮": "8",
  "৯": "9",
};

/** Stored form `01XXXXXXXXX`, or null when it is not a Bangladesh mobile. */
export function normalizeBdPhone(value: string) {
  const digits = value
    .replace(/[০-৯]/g, (digit) => BD_DIGITS[digit] ?? digit)
    .replace(/\D/g, "");
  const local = digits.startsWith("880") ? `0${digits.slice(3)}` : digits;
  return /^01[3-9]\d{8}$/.test(local) ? local : null;
}

export function dhakaToday(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Inclusive Asia/Dhaka dates. Empty ends are allowed. Mirrors the list query rules. */
export function dateSpanError(from: string, to: string) {
  if (!from && !to) return null;
  const shape = /^\d{4}-\d{2}-\d{2}$/;
  if ((from && !shape.test(from)) || (to && !shape.test(to))) return "Use dates as YYYY-MM-DD.";
  if (from && to && from > to) return "The start date is after the end date.";
  if (from && to) {
    const start = Date.parse(`${from}T00:00:00Z`);
    const end = Date.parse(`${to}T00:00:00Z`);
    const days = Math.round((end - start) / 86_400_000);
    if (days > 366) return "Date range is longer than 366 days.";
  }
  return null;
}

const IDEMPOTENCY_KEY = /^[A-Za-z0-9_-]{8,80}$/;

export function isIdempotencyKey(value: string) {
  return IDEMPOTENCY_KEY.test(value);
}

/** 32 hex characters. Safe to send as `Idempotency-Key` on offline create. */
export function newIdempotencyKey() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export type PreviewLine = {
  quantity: number;
  unitPrice: number;
  /** Staff typed a price. The server then charges that price times quantity. */
  priceEdited: boolean;
};

export type OfflineMoneyPreview = {
  /** `server` only when the quote covers every figure that will be saved. */
  source: "server" | "estimate";
  subtotal: number;
  discount: number;
  /** Null when the zone fee is still unknown. */
  shipping: number | null;
  total: number | null;
  note: string;
};

/**
 * A form preview. Catalog lines can use a quote. An edited price, a staff
 * discount, or a custom delivery charge makes the total an estimate.
 * The saved order total always comes back from the server.
 */
export function offlineMoneyPreview(input: {
  lines: PreviewLine[];
  manualDiscount: number;
  deliveryCharge: number | null;
  quote: { subtotal: number; shipping: number } | null;
}): OfflineMoneyPreview {
  const discount = Math.max(0, Math.trunc(input.manualDiscount));
  const customDelivery = input.deliveryCharge == null ? null : Math.max(0, Math.trunc(input.deliveryCharge));
  const catalog = input.lines.length > 0 && input.lines.every((line) => !line.priceEdited);
  if (catalog && input.quote) {
    const shipping = customDelivery ?? Math.trunc(input.quote.shipping);
    const subtotal = Math.trunc(input.quote.subtotal);
    const untouched = discount === 0 && customDelivery == null;
    return {
      source: untouched ? "server" : "estimate",
      subtotal,
      discount,
      shipping,
      total: Math.max(0, subtotal - discount) + shipping,
      note: untouched
        ? "Subtotal, delivery, and total are from the server preview."
        : "Merchandise is from the server preview. The discount or custom delivery is applied when you save, so this total is an estimate.",
    };
  }
  const subtotal = input.lines.reduce(
    (sum, line) => sum + Math.trunc(line.unitPrice) * Math.trunc(line.quantity),
    0,
  );
  return {
    source: "estimate",
    subtotal,
    discount,
    shipping: customDelivery,
    total: customDelivery == null ? null : Math.max(0, subtotal - discount) + customDelivery,
    note: "Estimate from the prices on this form. Quantity discounts apply only when the price is left unchanged, and the saved total comes from the server.",
  };
}

export type OfflineDraft = {
  customerName: string;
  phone: string;
  email: string;
  district: string;
  area: string;
  address: string;
  items: { quantity: number }[];
  manualDiscount: string;
  deliveryCharge: string;
  paymentMethod: string;
  paidAmount: string;
  paymentReference: string;
  orderDate: string;
};

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const REFERENCE = /^[A-Za-z0-9+-]{4,64}$/;

function wholeMoney(value: string) {
  const text = value.trim();
  if (!/^\d+$/.test(text)) return null;
  const number = Number(text);
  return Number.isSafeInteger(number) ? number : null;
}

/** Field errors for the offline form. Empty when the draft can be sent. */
export function offlineFieldErrors(draft: OfflineDraft, today = dhakaToday()) {
  const errors: Record<string, string> = {};
  const name = draft.customerName.trim();
  if (name.length < 2) errors.customerName = "Enter the customer name.";
  else if (name.length > 160) errors.customerName = "Name is too long.";
  if (!normalizeBdPhone(draft.phone)) errors.phone = "Enter an 11-digit Bangladesh mobile number.";
  const email = draft.email.trim();
  if (email && !EMAIL.test(email)) errors.email = "Email is invalid.";
  if (draft.district.trim().length < 2) errors.district = "Enter the district.";
  if (draft.area.trim().length < 2) errors.area = "Enter the area.";
  const address = draft.address.trim();
  if (address.length < 8) errors.address = "Enter the full address (at least 8 characters).";
  else if (address.length > 500) errors.address = "Address is too long.";
  if (draft.items.length < 1) errors.items = "Add at least one product.";
  else if (draft.items.length > 12) errors.items = "An order can have at most 12 lines.";
  else if (draft.items.some((item) => !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 1000)) {
    errors.items = "Each quantity must be from 1 to 1000.";
  }
  if (draft.manualDiscount.trim() && wholeMoney(draft.manualDiscount) == null) {
    errors.manualDiscount = "Discount must be a whole number of taka.";
  }
  if (draft.deliveryCharge.trim() && wholeMoney(draft.deliveryCharge) == null) {
    errors.deliveryCharge = "Delivery charge must be a whole number of taka, or left blank.";
  }
  if (!isOfflinePaymentMethod(draft.paymentMethod)) errors.paymentMethod = "Choose a payment method.";
  if (wholeMoney(draft.paidAmount) == null) errors.paidAmount = "Paid amount must be a whole number of taka.";
  const reference = draft.paymentReference.replace(/\s+/g, "");
  if (reference && !REFERENCE.test(reference)) {
    errors.paymentReference = "Reference must be 4–64 letters, digits, + or -.";
  }
  if (draft.orderDate) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.orderDate)) errors.orderDate = "Use a real date.";
    else if (draft.orderDate < "2020-01-01" || draft.orderDate > today) {
      errors.orderDate = "Order date must be from 2020 through today in Asia/Dhaka.";
    }
  }
  return errors;
}

export type OrderListQuery = {
  q?: string;
  status?: OrderStatus | null;
  origin?: OrderOrigin | null;
  paymentMethod?: AnyPaymentMethod | null;
  paymentStatus?: PaymentStatus | null;
  callStatus?: CallStatus | null;
  courier?: string;
  dateFrom?: string;
  dateTo?: string;
  scope?: "all" | "transit";
  sort?: "newest" | "oldest" | "high" | "low";
  page: number;
  pageSize?: number;
};

/** Query string for `GET /api/v1/admin/orders`. Omits empty filters. */
export function orderListSearchParams(query: OrderListQuery) {
  const search = new URLSearchParams();
  if (query.q?.trim()) search.set("q", query.q.trim());
  if (query.status) search.set("status", query.status);
  if (query.origin) search.set("origin", query.origin);
  if (query.paymentMethod) search.set("payment_method", query.paymentMethod);
  if (query.paymentStatus) search.set("payment_status", query.paymentStatus);
  if (query.callStatus) search.set("call_status", query.callStatus);
  if (query.courier?.trim()) search.set("courier", query.courier.trim());
  if (query.dateFrom) search.set("date_from", query.dateFrom);
  if (query.dateTo) search.set("date_to", query.dateTo);
  if (query.scope && query.scope !== "all") search.set("scope", query.scope);
  if (query.sort && query.sort !== "newest") search.set("sort", query.sort);
  search.set("page", String(Math.max(1, query.page)));
  search.set("page_size", String(Math.min(50, Math.max(1, query.pageSize ?? 20))));
  return search;
}

const LEGACY_LIST_KEYS = [
  "q",
  "status",
  "lane",
  "sort",
  "page",
  "origin",
  "payment_method",
  "payment_status",
  "call_status",
  "courier",
  "date_from",
  "date_to",
  "scope",
];

/**
 * Old `/admin/orders?...` list links. Overview now owns `/admin/orders`, so a
 * list query moves to `/admin/orders/list`. `lane=transit` becomes `scope=transit`.
 */
export function legacyOrdersRedirect(search: URLSearchParams) {
  const keys = [...search.keys()];
  if (!keys.some((key) => LEGACY_LIST_KEYS.includes(key))) return null;
  const next = new URLSearchParams(search);
  if (next.get("lane") === "transit" && !next.get("scope")) next.set("scope", "transit");
  next.delete("lane");
  const query = next.toString();
  return query ? `/admin/orders/list?${query}` : "/admin/orders/list";
}

export type StatusCountMap = Record<OrderStatus, number>;

export function emptyStatusCounts(): StatusCountMap {
  return {
    new: 0,
    confirmed: 0,
    packed: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    returned: 0,
  };
}

export function sumStatusCounts(counts: StatusCountMap) {
  return ORDER_STATUSES.reduce((sum, status) => sum + counts[status], 0);
}

/** Two-decimal rate from the overview, or null when the API sent null. */
export function readRatePercent(value: unknown) {
  if (value == null) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value.toFixed(2);
  if (typeof value === "string" && value.trim()) return value.trim();
  return null;
}

export function formatRatePercent(value: string | null) {
  return value == null ? "—" : `${value}%`;
}

export function paymentStatusOf(paid: number, total: number): PaymentStatus {
  if (paid <= 0) return "unpaid";
  if (paid >= total) return "paid";
  return "partial";
}

export function stockBlockMessage(message: string) {
  return message.includes("স্টকে") || /not enough stock/i.test(message);
}

export type OfflineLineInput = {
  productId: string;
  variantId: string | null;
  quantity: number;
  unitPrice: number;
  /** When false, `unit_price` is omitted and the server prices the line. */
  priceEdited: boolean;
};

export type OfflineOrderInput = {
  customerName: string;
  phone: string;
  email: string;
  district: string;
  area: string;
  address: string;
  notes: string;
  items: OfflineLineInput[];
  manualDiscount: number;
  /** Null omits the field so the server uses the zone fee. */
  deliveryCharge: number | null;
  paymentMethod: OfflinePaymentMethod;
  paidAmount: number;
  paymentReference: string;
  /** Null omits the field so the server uses now. */
  orderDate: string | null;
};

function lineBody(item: OfflineLineInput) {
  return {
    product_id: item.productId,
    ...(item.variantId ? { variant_id: item.variantId } : {}),
    quantity: item.quantity,
    ...(item.priceEdited ? { unit_price: Math.trunc(item.unitPrice) } : {}),
  };
}

/** JSON for `POST /api/v1/admin/orders/offline`. Client totals are not included. */
export function offlineCreateBody(input: OfflineOrderInput) {
  return {
    customer_name: input.customerName.trim(),
    phone: normalizeBdPhone(input.phone) ?? input.phone.trim(),
    email: input.email.trim(),
    district: input.district.trim(),
    area: input.area.trim(),
    address: input.address.trim(),
    notes: input.notes.trim(),
    items: input.items.map(lineBody),
    manual_discount: Math.trunc(input.manualDiscount),
    ...(input.deliveryCharge == null ? {} : { delivery_charge: Math.trunc(input.deliveryCharge) }),
    payment_method: input.paymentMethod,
    paid_amount: Math.trunc(input.paidAmount),
    payment_reference: input.paymentReference.replace(/\s+/g, ""),
    ...(input.orderDate ? { order_date: input.orderDate } : {}),
  };
}

/** JSON for `PUT /api/v1/admin/orders/{id}/items`. Null discount or delivery keeps the current value. */
export function orderItemsBody(input: {
  items: OfflineLineInput[];
  manualDiscount: number | null;
  deliveryCharge: number | null;
}) {
  return {
    items: input.items.map(lineBody),
    ...(input.manualDiscount == null ? {} : { manual_discount: Math.trunc(input.manualDiscount) }),
    ...(input.deliveryCharge == null ? {} : { delivery_charge: Math.trunc(input.deliveryCharge) }),
  };
}
