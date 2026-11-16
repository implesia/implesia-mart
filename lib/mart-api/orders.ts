import { readOrderTimestamp } from "@/lib/admin/order-timestamps";
import {
  emptyStatusCounts,
  isCallStatus,
  isOrderOrigin,
  isOrderStatus,
  isPaymentMethod,
  isPaymentStatus,
  nextOrderStatuses,
  orderListSearchParams,
  paymentStatusOf,
  type AnyPaymentMethod,
  type CallStatus,
  type CustomerHistoryCounts,
  type OrderListQuery,
  type OrderOrigin,
  type PaymentStatus,
  type StatusCountMap,
} from "@/lib/admin/orders-desk";
import { currentOrderTracking, type OrderTracking } from "@/lib/analytics/order-tracking";
import { orderLookupBody, publicTimelineFrom } from "@/lib/order-lookup";
import { quoteCouponFromBody, type QuoteCoupon } from "@/lib/coupons";
import { guestCartHeaders } from "@/lib/mart-api/cart";
import type { DeliveryZone } from "@/lib/mart-api/delivery";
import { buildQuotePayload, type QuotePayloadInput } from "@/lib/mart-api/order-payload";
import { MartApiError, authorizedFetch, mediaUrl, publicFetch } from "@/lib/mart-api/products";
import { mockOrderApi, mockPlaceOrder, mockQuoteApi } from "@/lib/mart-mock/coupons";
import { mockFallbackAllowed } from "@/lib/mock-mode";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/mart-mock/store";
import {
  advanceOptionsFrom,
  buildPaymentPayload,
  type AdvanceOption,
  type AdvancePercent,
  type PaymentMethod,
} from "@/lib/payment";

export type QuoteLine = {
  productId: string;
  variantId: string | null;
  cartItemId: string | null;
  title: string;
  slug: string;
  imageSrc: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  /** Price before discount and the total discount % the server applied. */
  regularPrice: number;
  totalPercent: number;
  /** Quantity tier % taken off this line's total (0 when none). */
  quantityPercent: number;
  available: boolean;
  maxQuantity: number;
  selection: { name: string; label: string; swatch: string }[];
};

export type OrderQuote = {
  items: QuoteLine[];
  itemCount: number;
  subtotal: number;
  shipping: number;
  total: number;
  deliveryZone: DeliveryZone;
  deliveryAvailable: boolean;
  /** Bangla QR advance choices for this total; empty when no QR is set. */
  banglaQrOptions: AdvanceOption[];
  /** Null when no code was sent. Discount and flags come from the server. */
  coupon: QuoteCoupon | null;
  /** True when the live quote route was missing and the stand-in priced this. */
  mocked: boolean;
};

export type MartOrderItem = {
  id: string;
  productId: string | null;
  variantId: string | null;
  sku: string;
  title: string;
  slug: string;
  imageSrc: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  selection: { name: string; label: string; swatch: string }[];
  /** Discount snapshot from order time. Null on orders placed before it was recorded. */
  regularPrice: number | null;
  basePercent: number | null;
  quantityPercent: number | null;
  totalPercent: number | null;
};

export type OrderActivity = {
  id: string;
  actorUserId: string | null;
  actorName: string | null;
  action: string;
  summary: string;
  detail: Record<string, unknown>;
  createdAt: string;
};

export type MartOrder = {
  id: string;
  number: string;
  source: "cart" | "direct";
  /** Online checkout or an order typed by staff. Not the same as `source`. */
  origin: OrderOrigin;
  status: OrderStatus;
  callStatus: CallStatus;
  paymentMethod: AnyPaymentMethod;
  paymentStatus: PaymentStatus;
  advancePercent: number | null;
  advanceAmount: number;
  dueAmount: number;
  /** Bangla QR transaction ID / sender number ("" for COD). */
  paymentReference: string;
  anonymous: boolean;
  customerName: string;
  phone: string;
  email: string;
  district: string;
  area: string;
  address: string;
  notes: string;
  deliveryZone: DeliveryZone;
  subtotal: number;
  shipping: number;
  total: number;
  /** Null on orders placed before coupons, and when no coupon was used. */
  couponCode: string | null;
  /** Null when no coupon was used. Whole taka taken off by the server. */
  couponDiscount: number | null;
  /** Staff discount, whole taka. Already taken off `total`. 0 on checkout orders. */
  manualDiscount: number;
  paidAmount: number;
  courierName: string;
  trackingNumber: string;
  printedAt: string | null;
  /** Set for offline orders. Online checkout leaves this null and counts on `createdAt`. */
  orderedAt: string | null;
  items: MartOrderItem[];
  createdAt: string;
  /** Null when this response did not include `customer_history` (older list payloads). */
  customerHistory: CustomerHistoryCounts | null;
  duplicateWarning: boolean;
  activity: OrderActivity[];
  /**
   * `OrderRead.delivered_at`. ISO 8601 UTC, or null until the first move to
   * delivered. A later status change does not replace it.
   */
  deliveredAt: string | null;
  /**
   * `OrderRead.returned_at`. ISO 8601 UTC, or null until the first move to
   * returned. Kept when the order was delivered earlier.
   */
  returnedAt: string | null;
  /**
   * Purchase dedupe id from the create response (`analytics_event_id`).
   * Null when the API does not send it; the storefront then uses
   * `purchase_<number>`.
   */
  analyticsEventId: string | null;
  /** Statuses the backend will accept next; empty once the order is final. */
  /** Null when the payload omitted `next_statuses` (the UI then uses the known map). */
  nextStatuses: OrderStatus[] | null;
};

export type OrderDirectory = {
  items: MartOrder[];
  total: number;
  page: number;
  pages: number;
  metrics: {
    orders: number;
    new: number;
    confirmed: number;
    shipped: number;
    delivered: number;
    cancelled: number;
    returned: number;
    packed: number;
    inTransit: number;
    revenue: number;
  };
  /** Counts for the current filters, ignoring the status filter. */
  statusCounts: StatusCountMap;
  pageSize: number;
};

type ApiQuoteLine = {
  product_id: string;
  variant_id?: string | null;
  cart_item_id: string | null;
  title: string;
  slug: string;
  image_src: string;
  unit_price: number;
  quantity: number;
  line_total: number;
  regular_price?: number;
  total_discount_percent?: number;
  quantity_discount_percent?: number;
  available: boolean;
  max_quantity: number;
  selection?: { name: string; label: string; swatch?: string }[];
};

type ApiQuote = {
  items: ApiQuoteLine[];
  item_count: number;
  subtotal: number;
  shipping: number;
  total: number;
  delivery_zone: DeliveryZone;
  delivery_available?: boolean;
  bangla_qr_options?: unknown;
  coupon?: unknown;
};

type ApiOrderItem = {
  id: string;
  product_id: string | null;
  variant_id?: string | null;
  sku?: string;
  title: string;
  slug: string;
  image_src: string;
  unit_price: number;
  quantity: number;
  line_total: number;
  selection?: { name: string; label: string; swatch?: string }[];
  regular_price?: number | null;
  base_discount_percent?: number | null;
  quantity_discount_percent?: number | null;
  total_discount_percent?: number | null;
};

type ApiOrder = {
  id: string;
  number: string;
  source: "cart" | "direct";
  origin?: string;
  status: OrderStatus;
  call_status?: string;
  payment_method: string;
  payment_status?: string;
  advance_percent?: number | null;
  advance_amount?: number;
  due_amount?: number;
  payment_reference?: string;
  anonymous: boolean;
  customer_name: string;
  phone: string;
  email: string;
  district: string;
  area: string;
  address: string;
  notes: string;
  delivery_zone: DeliveryZone;
  subtotal: number;
  shipping: number;
  total: number;
  coupon_code?: string | null;
  coupon_discount?: number | null;
  manual_discount?: number;
  paid_amount?: number;
  courier_name: string;
  tracking_number: string;
  printed_at?: string | null;
  ordered_at?: string | null;
  customer_history?: {
    phone?: string;
    total_orders?: number;
    delivered?: number;
    returned_cancelled?: number;
  };
  duplicate_warning?: boolean;
  activity?: {
    id?: string;
    actor_user_id?: string | null;
    actor_name?: string | null;
    action?: string;
    summary?: string;
    detail?: Record<string, unknown>;
    created_at?: string;
  }[];
  items: ApiOrderItem[];
  created_at: string;
  /** ISO 8601 with a UTC offset, or null. Always on admin OrderRead. */
  delivered_at: string | null;
  /** ISO 8601 with a UTC offset, or null. Always on admin OrderRead. */
  returned_at: string | null;
  next_statuses?: OrderStatus[];
  /** Present on order create once the API emits the CAPI event id. */
  analytics_event_id?: string | null;
};

function readAnalyticsEventId(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function mapSelection(selection: { name: string; label: string; swatch?: string }[] | undefined) {
  return (selection ?? []).map((choice) => ({
    name: choice.name,
    label: choice.label,
    swatch: choice.swatch ?? "",
  }));
}

/** Payment fields of an order; older orders (no due sent) owe the whole total. */
function paymentFrom(body: {
  payment_method: string;
  payment_status?: string;
  advance_percent?: number | null;
  advance_amount?: number;
  due_amount?: number;
  paid_amount?: number;
  total: number;
}) {
  const advanceAmount = body.advance_amount ?? 0;
  const method = isPaymentMethod(body.payment_method) ? body.payment_method : "cod";
  const paidFromField = typeof body.paid_amount === "number" ? body.paid_amount : null;
  const paidAmount = paidFromField ?? (method === "bangla_qr" ? advanceAmount : 0);
  return {
    paymentMethod: method,
    paymentStatus: isPaymentStatus(body.payment_status)
      ? body.payment_status
      : paymentStatusOf(paidAmount, body.total),
    advancePercent: body.advance_percent ?? null,
    advanceAmount,
    dueAmount: body.due_amount ?? Math.max(body.total - advanceAmount, 0),
    paidAmount,
  };
}

function mapQuote(body: ApiQuote, sentCode: string | null, mocked = false): OrderQuote {
  return {
    items: body.items.map((item) => ({
      productId: item.product_id,
      variantId: item.variant_id ?? null,
      cartItemId: item.cart_item_id,
      title: item.title,
      slug: item.slug,
      imageSrc: mediaUrl(item.image_src),
      unitPrice: item.unit_price,
      quantity: item.quantity,
      lineTotal: item.line_total,
      regularPrice: Math.max(item.regular_price ?? 0, item.unit_price),
      totalPercent: item.total_discount_percent ?? 0,
      quantityPercent: item.quantity_discount_percent ?? 0,
      available: item.available,
      maxQuantity: item.max_quantity,
      selection: mapSelection(item.selection),
    })),
    itemCount: body.item_count,
    subtotal: body.subtotal,
    shipping: body.shipping,
    total: body.total,
    deliveryZone: body.delivery_zone,
    deliveryAvailable: body.delivery_available !== false,
    banglaQrOptions: advanceOptionsFrom(body.bangla_qr_options),
    coupon: quoteCouponFromBody(body, sentCode),
    mocked,
  };
}

function mapActivity(body: NonNullable<ApiOrder["activity"]>): OrderActivity[] {
  return body.flatMap((row) => {
    if (!row.id || !row.created_at) return [];
    return [
      {
        id: row.id,
        actorUserId: row.actor_user_id ?? null,
        actorName: row.actor_name ?? null,
        action: row.action ?? "",
        summary: row.summary ?? "",
        detail: row.detail ?? {},
        createdAt: row.created_at,
      },
    ];
  });
}

export function mapOrder(body: ApiOrder): MartOrder {
  const payment = paymentFrom(body);
  const status = isOrderStatus(body.status) ? body.status : "new";
  return {
    id: body.id,
    number: body.number,
    source: body.source,
    origin: isOrderOrigin(body.origin) ? body.origin : "online",
    status,
    callStatus: isCallStatus(body.call_status) ? body.call_status : "not_called",
    ...payment,
    paymentReference: body.payment_reference ?? "",
    anonymous: body.anonymous,
    customerName: body.customer_name,
    phone: body.phone,
    email: body.email,
    district: body.district,
    area: body.area,
    address: body.address,
    notes: body.notes,
    deliveryZone: body.delivery_zone,
    subtotal: body.subtotal,
    shipping: body.shipping,
    total: body.total,
    couponCode: typeof body.coupon_code === "string" && body.coupon_code.trim() ? body.coupon_code.trim() : null,
    couponDiscount:
      typeof body.coupon_discount === "number" && Number.isFinite(body.coupon_discount) ? body.coupon_discount : null,
    manualDiscount: typeof body.manual_discount === "number" ? body.manual_discount : 0,
    courierName: body.courier_name,
    trackingNumber: body.tracking_number,
    printedAt: readOrderTimestamp(body.printed_at),
    orderedAt: readOrderTimestamp(body.ordered_at),
    customerHistory: body.customer_history
      ? {
          phone: body.customer_history.phone || body.phone,
          totalOrders: body.customer_history.total_orders ?? 0,
          delivered: body.customer_history.delivered ?? 0,
          returnedCancelled: body.customer_history.returned_cancelled ?? 0,
        }
      : null,
    duplicateWarning: body.duplicate_warning === true,
    activity: mapActivity(body.activity ?? []),
    createdAt: body.created_at,
    deliveredAt: readOrderTimestamp(body.delivered_at),
    returnedAt: readOrderTimestamp(body.returned_at),
    analyticsEventId: readAnalyticsEventId(body.analytics_event_id),
    nextStatuses: Array.isArray(body.next_statuses)
      ? nextOrderStatuses(
          status,
          body.next_statuses.filter((item): item is OrderStatus => isOrderStatus(item)),
        )
      : null,
    items: body.items.map((item) => ({
      id: item.id,
      productId: item.product_id,
      variantId: item.variant_id ?? null,
      sku: item.sku ?? "",
      title: item.title,
      slug: item.slug,
      imageSrc: mediaUrl(item.image_src),
      unitPrice: item.unit_price,
      quantity: item.quantity,
      lineTotal: item.line_total,
      selection: mapSelection(item.selection),
      regularPrice: item.regular_price ?? null,
      basePercent: item.base_discount_percent ?? null,
      quantityPercent: item.quantity_discount_percent ?? null,
      totalPercent: item.total_discount_percent ?? null,
    })),
  };
}

async function readFailure(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as {
      message?: string;
      error_code?: string;
      error?: { message?: string; code?: string; error_code?: string };
    };
    const message = body.error?.message || (typeof body.message === "string" ? body.message : "") || fallback;
    const raw = body.error?.error_code || body.error?.code || body.error_code || null;
    return { message, code: typeof raw === "string" && raw.trim() ? raw : null };
  } catch {
    return { message: fallback, code: null };
  }
}

async function readError(response: Response, fallback: string) {
  return (await readFailure(response, fallback)).message;
}

let pricingMode: "unknown" | "live" | "mock" = "unknown";

export function resetOrderPricingMode() {
  pricingMode = "unknown";
}

function pricingMockForced() {
  if (!mockFallbackAllowed()) return false;
  return process.env.NEXT_PUBLIC_COUPONS_MOCK === "1" || pricingMode === "mock";
}

/** Shown when the live quote/order route is down and no stand-in is allowed. */
export const PRICING_UNAVAILABLE_MESSAGE = "অর্ডারের দাম এখন লোড করা যাচ্ছে না। একটু পরে আবার চেষ্টা করুন।";
export const ORDER_UNAVAILABLE_MESSAGE =
  "অর্ডারটি এখন সম্পন্ন করা যায়নি। কিছুক্ষণ পরে আবার চেষ্টা করুন। সমস্যা থাকলে আমাদের সাথে যোগাযোগ করুন।";
export const API_UNREACHABLE_MESSAGE = "সার্ভারের সাথে সংযোগ করা যাচ্ছে না। ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন।";

/**
 * 4xx keeps the API message (coupon invalid/expired, stock, validation). A 5xx
 * without an error code shows the retryable message instead of server text.
 */
async function failureError(response: Response, fallback: string) {
  const failure = await readFailure(response, fallback);
  const server = response.status >= 500;
  return new MartApiError(server && !failure.code ? fallback : failure.message, {
    code: failure.code,
    kind: server ? "server" : "request",
  });
}

function assertMockAllowed() {
  if (!mockFallbackAllowed()) throw new MartApiError(PRICING_UNAVAILABLE_MESSAGE, { kind: "server" });
}

function routeMissing(status: number) {
  return status === 404 || status === 501 || status >= 500;
}

function unreachable(error: unknown) {
  return error instanceof MartApiError && error.message === "Could not reach the API.";
}

function mockQuoteInput(input: QuoteInput) {
  return {
    couponCode: input.couponCode,
    phone: input.phone,
    district: input.district,
    deliveryZone: input.deliveryZone,
    source: input.source,
    productIds: input.items?.map((item) => item.productId),
  };
}

type QuoteInput = QuotePayloadInput;

function quoteBody(input: QuoteInput) {
  return buildQuotePayload(input);
}

function pricedByMock(input: QuoteInput) {
  assertMockAllowed();
  pricingMode = "mock";
  return mapQuote(mockQuoteApi(mockQuoteInput(input)) as ApiQuote, input.couponCode ?? null, true);
}

export async function quoteOrder(input: QuoteInput) {
  if (pricingMockForced()) return pricedByMock(input);
  try {
    const response = await publicFetch("/api/v1/orders/quote", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...guestCartHeaders(),
      },
      body: JSON.stringify(quoteBody(input)),
    });
    if (routeMissing(response.status) && mockFallbackAllowed()) return pricedByMock(input);
    if (!response.ok) throw await failureError(response, PRICING_UNAVAILABLE_MESSAGE);
    pricingMode = "live";
    return mapQuote((await response.json()) as ApiQuote, input.couponCode ?? null, false);
  } catch (error) {
    if (unreachable(error)) {
      if (mockFallbackAllowed()) return pricedByMock(input);
      throw new MartApiError(API_UNREACHABLE_MESSAGE, { kind: "network" });
    }
    throw error;
  }
}

export async function placeOrder(
  input: QuoteInput & {
    idempotencyKey: string;
    customerName: string;
    phone: string;
    email: string;
    area: string;
    address: string;
    notes: string;
    payment?: { method: PaymentMethod; advancePercent?: AdvancePercent | null; reference?: string };
    /**
     * Optional. Older APIs ignore unknown JSON. Nulls are sent when a value
     * is missing so the field shape stays stable.
     */
    tracking?: OrderTracking;
  },
) {
  if (pricingMockForced()) return placedByMock(input);
  try {
    const response = await publicFetch("/api/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": input.idempotencyKey,
        ...guestCartHeaders(),
      },
      body: JSON.stringify({
        ...quoteBody(input),
        customer_name: input.customerName.trim(),
        phone: input.phone.trim(),
        email: input.email.trim(),
        area: input.area.trim(),
        address: input.address.trim(),
        notes: input.notes.trim(),
        ...buildPaymentPayload(input.payment ?? { method: "cod" }),
        tracking: input.tracking ?? currentOrderTracking(),
      }),
    });
    if (
      (response.status === 404 || response.status === 501) &&
      pricingMode !== "live" &&
      mockFallbackAllowed()
    ) {
      return placedByMock(input);
    }
    if (!response.ok) throw await failureError(response, ORDER_UNAVAILABLE_MESSAGE);
    pricingMode = "live";
    return mapOrder((await response.json()) as ApiOrder);
  } catch (error) {
    if (unreachable(error)) {
      if (pricingMode !== "live" && mockFallbackAllowed()) return placedByMock(input);
      throw new MartApiError(API_UNREACHABLE_MESSAGE, { kind: "network" });
    }
    throw error;
  }
}

function placedByMock(
  input: QuoteInput & {
    idempotencyKey: string;
    customerName: string;
    phone: string;
    email: string;
    area: string;
    address: string;
    notes: string;
    payment?: { method: PaymentMethod; advancePercent?: AdvancePercent | null; reference?: string };
  },
) {
  if (!mockFallbackAllowed()) throw new MartApiError(ORDER_UNAVAILABLE_MESSAGE, { kind: "server" });
  pricingMode = "mock";
  const result = mockPlaceOrder({
    ...mockQuoteInput(input),
    phone: input.phone,
    idempotencyKey: input.idempotencyKey,
    customerName: input.customerName,
    email: input.email,
    area: input.area,
    address: input.address,
    notes: input.notes,
    paymentMethod: input.payment?.method,
    advancePercent: input.payment?.advancePercent,
    paymentReference: input.payment?.reference,
  });
  if (!result.ok) throw new MartApiError(result.message, { code: result.errorCode });
  return mapOrder(result.order as ApiOrder);
}

export async function listOrders(query: OrderListQuery) {
  const response = await authorizedFetch(`/api/v1/admin/orders?${orderListSearchParams(query)}`);
  if (!response.ok) throw new MartApiError(await readError(response, "Could not load orders."));
  const body = (await response.json()) as {
    items: ApiOrder[];
    total: number;
    page: number;
    page_size?: number;
    pages: number;
    metrics: {
      orders: number;
      new: number;
      confirmed: number;
      packed?: number;
      shipped: number;
      delivered: number;
      cancelled: number;
      returned: number;
      in_transit: number;
      revenue: number;
    };
    status_counts?: Partial<Record<OrderStatus, number>>;
  };
  const statusCounts = emptyStatusCounts();
  for (const status of ORDER_STATUSES) {
    const fromTabs = body.status_counts?.[status];
    const fromMetrics = body.metrics[status];
    statusCounts[status] = typeof fromTabs === "number" ? fromTabs : typeof fromMetrics === "number" ? fromMetrics : 0;
  }
  return {
    items: body.items.map(mapOrder),
    total: body.total,
    page: body.page,
    pages: body.pages,
    pageSize: body.page_size ?? query.pageSize ?? 20,
    statusCounts,
    metrics: {
      orders: body.metrics.orders,
      new: body.metrics.new,
      confirmed: body.metrics.confirmed,
      packed: body.metrics.packed ?? statusCounts.packed,
      shipped: body.metrics.shipped,
      delivered: body.metrics.delivered,
      cancelled: body.metrics.cancelled,
      returned: body.metrics.returned,
      inTransit: body.metrics.in_transit,
      revenue: body.metrics.revenue,
    },
  } satisfies OrderDirectory;
}

function orderFromMock(orderId: string) {
  if (!mockFallbackAllowed()) return null;
  const mocked = mockOrderApi(orderId);
  return mocked ? mapOrder(mocked as ApiOrder) : null;
}

export async function getOrder(orderId: string) {
  if (pricingMockForced()) {
    const mocked = orderFromMock(orderId);
    if (!mocked) throw new MartApiError("Order not found");
    return mocked;
  }
  try {
    const response = await authorizedFetch(`/api/v1/admin/orders/${orderId}`);
    if (!response.ok) {
      if (routeMissing(response.status)) {
        const mocked = orderFromMock(orderId);
        if (mocked) return mocked;
      }
      if (response.status === 404) throw new MartApiError("Order not found");
      throw new MartApiError(await readError(response, "Could not load this order."));
    }
    return mapOrder((await response.json()) as ApiOrder);
  } catch (error) {
    if (unreachable(error)) {
      const mocked = orderFromMock(orderId);
      if (mocked) return mocked;
    }
    throw error;
  }
}

export type PublicOrderItem = {
  title: string;
  slug: string;
  /** Null once the product is deleted. */
  productId: string | null;
  imageSrc: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  /** Option labels joined with " / ", or "" when the line has none. */
  variantLabel: string;
  selection: { name: string; label: string; swatch: string }[];
};

export type PublicOrder = {
  number: string;
  status: OrderStatus;
  customerName: string;
  phone: string;
  deliveryZone: DeliveryZone;
  subtotal: number;
  shipping: number;
  total: number;
  couponCode: string | null;
  couponDiscount: number | null;
  courierName: string;
  trackingNumber: string;
  paymentMethod: AnyPaymentMethod;
  advancePercent: number | null;
  advanceAmount: number;
  dueAmount: number;
  items: PublicOrderItem[];
  timeline: { status: OrderStatus; at: string }[];
  createdAt: string;
  // PublicOrderRead does not include delivered_at or returned_at.
};

type ApiPublicOrderItem = {
  title: string;
  slug: string;
  product_id?: string | null;
  image_src: string;
  unit_price: number;
  quantity: number;
  line_total: number;
  variant_label?: string;
  selection?: { name: string; label: string; swatch?: string }[];
};

type ApiPublicOrder = {
  number: string;
  status: OrderStatus;
  customer_name: string;
  phone: string;
  delivery_zone: DeliveryZone;
  subtotal: number;
  shipping: number;
  total: number;
  courier_name: string;
  tracking_number: string;
  payment_method: string;
  advance_percent?: number | null;
  advance_amount?: number;
  due_amount?: number;
  coupon_code?: string | null;
  coupon_discount?: number | null;
  items: ApiPublicOrderItem[];
  timeline?: { status?: string; at?: string }[];
  created_at: string;
};

function mapPublicOrder(body: ApiPublicOrder): PublicOrder {
  return {
    number: body.number,
    status: body.status,
    customerName: body.customer_name,
    phone: body.phone,
    deliveryZone: body.delivery_zone,
    subtotal: body.subtotal,
    shipping: body.shipping,
    total: body.total,
    courierName: body.courier_name,
    trackingNumber: body.tracking_number,
    couponCode: typeof body.coupon_code === "string" && body.coupon_code.trim() ? body.coupon_code.trim() : null,
    couponDiscount: typeof body.coupon_discount === "number" ? body.coupon_discount : null,
    ...paymentFrom(body),
    createdAt: body.created_at,
    timeline: publicTimelineFrom(body.timeline),
    items: body.items.map((item) => {
      const selection = mapSelection(item.selection);
      return {
        title: item.title,
        slug: item.slug,
        productId: item.product_id ?? null,
        imageSrc: mediaUrl(item.image_src),
        unitPrice: item.unit_price,
        quantity: item.quantity,
        lineTotal: item.line_total,
        variantLabel:
          typeof item.variant_label === "string"
            ? item.variant_label
            : selection.map((choice) => choice.label.trim()).filter(Boolean).join(" / "),
        selection,
      };
    }),
  };
}

export async function lookupPublicOrder(input: {
  phone: string;
  number?: string;
  trackingNumber?: string;
}) {
  const body = orderLookupBody(input);
  if (!body) {
    throw new MartApiError("Send the order number or the tracking number, and the phone");
  }
  const response = await publicFetch("/api/v1/orders/lookup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Order not found."));
  }
  return mapPublicOrder((await response.json()) as ApiPublicOrder);
}

export async function patchOrder(
  orderId: string,
  patch: {
    status?: OrderStatus;
    callStatus?: CallStatus;
    courierName?: string;
    trackingNumber?: string;
    notes?: string;
  },
) {
  const body: Record<string, string> = {};
  if (patch.status) body.status = patch.status;
  if (patch.callStatus) body.call_status = patch.callStatus;
  if (patch.courierName !== undefined) body.courier_name = patch.courierName;
  if (patch.trackingNumber !== undefined) body.tracking_number = patch.trackingNumber;
  if (patch.notes !== undefined) body.notes = patch.notes;
  const response = await authorizedFetch(`/api/v1/admin/orders/${orderId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new MartApiError(await readError(response, "Could not update this order."));
  return mapOrder((await response.json()) as ApiOrder);
}
