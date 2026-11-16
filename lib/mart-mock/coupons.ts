/**
 * Stand-in for the coupon API until those routes answer.
 * This module prices quotes the way the server will. The checkout UI does
 * not import it; `lib/mart-api` calls it only when the live route is missing.
 *
 * `QUOTEONLY` is accepted by the quote and rejected when the order is placed,
 * so the submit-time error can be tried before the backend exists.
 */

import {
  couponStatusOf,
  type Coupon,
  type CouponListQuery,
  type CouponReport,
  type CouponWrite,
} from "@/lib/admin/coupons";
import { dhakaDateString } from "@/lib/admin/inventory";
import { couponCodeFromParam, type QuoteCoupon } from "@/lib/coupons";
import { ADVANCE_PERCENTS, advanceSplit, type AdvancePercent } from "@/lib/payment";
import { workbookBytes } from "@/lib/admin/xlsx-lite";

export const DEMO_PRODUCT_ID = "11111111-1111-4111-8111-111111111111";
export const DEMO_DRESS_ID = "22222222-2222-4222-8222-222222222222";
export const DEMO_GADGETS_CATEGORY = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1";
export const DEMO_DRESSES_CATEGORY = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2";
/** Parent of the dresses category. A coupon on this id also covers dresses. */
export const DEMO_DRESS_PARENT = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa0";
const DEMO_ACTOR = "00000000-0000-4000-8000-0000000000aa";

const CATEGORY_CHILDREN: Record<string, string[]> = {
  [DEMO_DRESS_PARENT]: [DEMO_DRESSES_CATEGORY],
};

const RETURNING_PHONE = "01711111111";

type StoredCoupon = Coupon;

type Redemption = {
  id: string;
  orderId: string;
  orderNumber: string;
  phone: string;
  discountAmount: number;
  createdAt: string;
  status: "active" | "cancelled";
  cancelledAt: string | null;
  couponId: string;
};

type MockOrder = Record<string, unknown>;

type QuoteRequest = {
  couponCode?: string | null;
  district?: string;
  deliveryZone?: "inside" | "suburban" | "outside" | null;
  phone?: string | null;
  productIds?: string[];
  categoryIds?: string[];
  source?: "cart" | "direct";
  now?: Date;
};

type PlaceRequest = QuoteRequest & {
  idempotencyKey?: string;
  customerName?: string;
  phone?: string;
  email?: string;
  area?: string;
  address?: string;
  notes?: string;
  paymentMethod?: "cod" | "bangla_qr";
  advancePercent?: AdvancePercent | null;
  paymentReference?: string;
};

const SHIPPING = { inside: 70, suburban: 100, outside: 130 } as const;

let coupons: StoredCoupon[] = [];
let redemptions: Redemption[] = [];
let orders: MockOrder[] = [];
let idempotency = new Map<string, MockOrder>();
let sequence = 9000;

function iso(date: Date) {
  return date.toISOString();
}

function seed(now = new Date()): StoredCoupon[] {
  const created = iso(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000));
  const yesterday = iso(new Date(now.getTime() - 24 * 60 * 60 * 1000));
  const nextWeek = iso(new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000));
  const base = {
    minOrderAmount: 0,
    startsAt: null as string | null,
    endsAt: null as string | null,
    usageLimitTotal: null as number | null,
    usageLimitPerPhone: null as number | null,
    firstOrderOnly: false,
    productIds: [] as string[],
    categoryIds: [] as string[],
    freeDelivery: false,
    isActive: true,
    usedCount: 0,
    createdBy: DEMO_ACTOR,
    createdAt: created,
    updatedAt: created,
  };
  const rows: Array<Omit<StoredCoupon, "status"> & { status?: Coupon["status"] }> = [
    {
      ...base,
      id: "c1111111-1111-4111-8111-111111111111",
      code: "SAVE10",
      discountType: "percent",
      value: 10,
      maxDiscount: 500,
      minOrderAmount: 500,
      usedCount: 2,
    },
    {
      ...base,
      id: "c2222222-2222-4222-8222-222222222222",
      code: "FLAT100",
      discountType: "fixed",
      value: 100,
      maxDiscount: null,
      minOrderAmount: 300,
      usedCount: 1,
    },
    {
      ...base,
      id: "c3333333-3333-4333-8333-333333333333",
      code: "FREESHIP",
      discountType: "fixed",
      value: 0,
      maxDiscount: null,
      freeDelivery: true,
    },
    {
      ...base,
      id: "c4444444-4444-4444-8444-444444444444",
      code: "BIG20",
      discountType: "percent",
      value: 20,
      maxDiscount: 150,
      minOrderAmount: 0,
    },
    {
      ...base,
      id: "c5555555-5555-4555-8555-555555555555",
      code: "OLD10",
      discountType: "percent",
      value: 10,
      maxDiscount: null,
      endsAt: yesterday,
    },
    {
      ...base,
      id: "c6666666-6666-4666-8666-666666666666",
      code: "NEXTWEEK",
      discountType: "fixed",
      value: 50,
      maxDiscount: null,
      startsAt: nextWeek,
    },
    {
      ...base,
      id: "c7777777-7777-4777-8777-777777777777",
      code: "PAUSED",
      discountType: "fixed",
      value: 40,
      maxDiscount: null,
      isActive: false,
    },
    {
      ...base,
      id: "c8888888-8888-4888-8888-888888888888",
      code: "FIRST50",
      discountType: "fixed",
      value: 50,
      maxDiscount: null,
      firstOrderOnly: true,
    },
    {
      ...base,
      id: "c9999999-9999-4999-8999-999999999999",
      code: "DRESS20",
      discountType: "percent",
      value: 20,
      maxDiscount: null,
      categoryIds: [DEMO_DRESSES_CATEGORY],
    },
    {
      ...base,
      id: "caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      code: "QUOTEONLY",
      discountType: "fixed",
      value: 40,
      maxDiscount: null,
    },
  ];
  return rows.map((row) => ({
    ...row,
    status: couponStatusOf({ isActive: row.isActive, startsAt: row.startsAt, endsAt: row.endsAt, now }),
  }));
}

function seedRedemptions(now: Date): Redemption[] {
  const day = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  return [
    {
      id: "d1111111-1111-4111-8111-111111111111",
      couponId: "c1111111-1111-4111-8111-111111111111",
      orderId: "00000000-0000-4000-8000-0000000000c1",
      orderNumber: "IM-9001",
      phone: "01712345678",
      discountAmount: 120,
      createdAt: iso(day),
      status: "active",
      cancelledAt: null,
    },
    {
      id: "d2222222-2222-4222-8222-222222222222",
      couponId: "c2222222-2222-4222-8222-222222222222",
      orderId: "00000000-0000-4000-8000-0000000000c2",
      orderNumber: "IM-9002",
      phone: "01812345678",
      discountAmount: 100,
      createdAt: iso(new Date(now.getTime() - 24 * 60 * 60 * 1000)),
      status: "active",
      cancelledAt: null,
    },
  ];
}

function demoLine(productId: string) {
  const dress = productId === DEMO_DRESS_ID;
  return {
    product_id: productId,
    variant_id: null,
    cart_item_id: null,
    title: dress ? "লিলেন ড্রেস" : "USB-C হাব",
    slug: dress ? "linen-dress" : "usb-c-hub",
    image_src: "/images/products/mini-printer/mini-printer.jpg",
    unit_price: dress ? 2200 : 1200,
    quantity: 1,
    line_total: dress ? 2200 : 1200,
    regular_price: dress ? 2600 : 1400,
    total_discount_percent: 0,
    quantity_discount_percent: 0,
    available: true,
    max_quantity: 10,
    selection: [],
  };
}

function categoriesFor(productIds: string[]) {
  return productIds.map((id) => (id === DEMO_DRESS_ID ? DEMO_DRESSES_CATEGORY : DEMO_GADGETS_CATEGORY));
}

function zoneOf(input: QuoteRequest): "inside" | "suburban" | "outside" {
  if (input.deliveryZone === "inside" || input.deliveryZone === "suburban" || input.deliveryZone === "outside") {
    return input.deliveryZone;
  }
  const district = input.district?.trim() ?? "";
  if (!district) return "outside";
  return district.includes("ঢাকা") ? "inside" : "outside";
}

/** A listed category also covers its descendants. */
function categoryCovers(couponCategories: string[], productCategories: string[]) {
  const expanded = new Set(couponCategories);
  for (const id of couponCategories) {
    for (const child of CATEGORY_CHILDREN[id] ?? []) expanded.add(child);
  }
  return productCategories.some((id) => expanded.has(id));
}

function findCoupon(code: string | null | undefined) {
  const normalized = couponCodeFromParam(code);
  if (!normalized) return null;
  return coupons.find((coupon) => coupon.code === normalized) ?? null;
}

function rejection(code: string, errorCode: string, message: string): QuoteCoupon {
  return { code, valid: false, discount: 0, freeDelivery: false, errorCode, message };
}

function percentOff(subtotal: number, value: number, maxDiscount: number | null) {
  const raw = Math.ceil((subtotal * value) / 100);
  const capped = maxDiscount == null ? raw : Math.min(raw, maxDiscount);
  return Math.min(Math.max(0, capped), subtotal);
}

export function resetMockCoupons(now = new Date()) {
  coupons = seed(now);
  redemptions = seedRedemptions(now);
  orders = [demoPlainOrder(now), demoCouponOrder(now)];
  idempotency = new Map();
  sequence = 9010;
}

function ensure() {
  if (coupons.length === 0) resetMockCoupons();
}

function priceCoupon(input: QuoteRequest, subtotal: number): QuoteCoupon | null {
  const code = couponCodeFromParam(input.couponCode);
  if (!code) return null;
  const now = input.now ?? new Date();
  const coupon = findCoupon(code);
  if (!coupon) return rejection(code, "coupon_not_found", "এই কুপন কোডটি পাওয়া যায়নি। বানানটা আবার দেখুন।");
  const status = couponStatusOf({
    isActive: coupon.isActive,
    startsAt: coupon.startsAt,
    endsAt: coupon.endsAt,
    now,
  });
  if (status === "inactive") return rejection(code, "coupon_inactive", "এই কুপনটি এখন বন্ধ আছে।");
  if (status === "expired") return rejection(code, "coupon_expired", "এই কুপনের মেয়াদ শেষ হয়ে গেছে।");
  if (status === "scheduled") return rejection(code, "coupon_not_started", "এই কুপনটি এখনো চালু হয়নি।");
  if (coupon.minOrderAmount > 0 && subtotal < coupon.minOrderAmount) {
    const taka = `৳${coupon.minOrderAmount.toLocaleString("en-US")}`.replace(/[0-9]/g, (digit) => "০১২৩৪৫৬৭৮৯"[Number(digit)] ?? digit);
    return rejection(code, "coupon_min_amount", `এই কুপনটি কমপক্ষে ${taka}-এর অর্ডারে ব্যবহার করা যাবে।`);
  }
  if (coupon.usageLimitTotal != null && coupon.usedCount >= coupon.usageLimitTotal) {
    return rejection(code, "coupon_usage_limit", "এই কুপনটি ব্যবহারের সর্বোচ্চ সীমায় পৌঁছে গেছে।");
  }
  const phone = (input.phone ?? "").trim();
  if (coupon.usageLimitPerPhone != null && phone) {
    const used = redemptions.filter((row) => row.couponId === coupon.id && row.phone === phone).length;
    if (used >= coupon.usageLimitPerPhone) {
      return rejection(code, "coupon_phone_limit", "এই মোবাইল নম্বরে এই কুপনটি আর ব্যবহার করা যাবে না।");
    }
  }
  if (coupon.firstOrderOnly && phone === RETURNING_PHONE) {
    return rejection(code, "coupon_first_order_only", "এই কুপনটি শুধু আপনার প্রথম অর্ডারে ব্যবহার করা যাবে।");
  }
  const productIds = input.productIds?.length ? input.productIds : [DEMO_PRODUCT_ID];
  const categoryIds = input.categoryIds?.length ? input.categoryIds : categoriesFor(productIds);
  if (coupon.productIds.length > 0 && !productIds.some((id) => coupon.productIds.includes(id))) {
    return rejection(code, "coupon_not_eligible", "আপনার কার্টে এই কুপনের জন্য কোনো পণ্য নেই।");
  }
  if (coupon.categoryIds.length > 0 && !categoryCovers(coupon.categoryIds, categoryIds)) {
    return rejection(code, "coupon_not_eligible", "আপনার কার্টে এই কুপনের জন্য কোনো পণ্য নেই।");
  }
  const discount =
    coupon.discountType === "percent"
      ? percentOff(subtotal, coupon.value, coupon.maxDiscount)
      : Math.min(coupon.value, subtotal);
  return {
    code: coupon.code,
    valid: true,
    discount,
    freeDelivery: coupon.freeDelivery,
    errorCode: null,
    message: null,
  };
}

export function mockQuoteApi(input: QuoteRequest) {
  ensure();
  const productId = input.productIds?.[0] || DEMO_PRODUCT_ID;
  const line = demoLine(productId);
  const subtotal = line.line_total;
  const zone = zoneOf(input);
  const baseShipping = SHIPPING[zone];
  const coupon = priceCoupon({ ...input, productIds: [productId], categoryIds: categoriesFor([productId]) }, subtotal);
  const discount = coupon?.valid ? coupon.discount : 0;
  const shipping = coupon?.valid && coupon.freeDelivery ? 0 : baseShipping;
  const total = Math.max(0, subtotal - discount + shipping);
  const bangla =
    total > 0
      ? ADVANCE_PERCENTS.map((percent) => {
          const split = advanceSplit(total, percent);
          return { percent, advance: split.advance, due: split.due };
        })
      : [];
  return {
    items: [line],
    item_count: line.quantity,
    subtotal,
    shipping,
    total,
    delivery_zone: zone,
    delivery_available: true,
    bangla_qr_options: bangla,
    coupon: coupon
      ? {
          code: coupon.code,
          valid: coupon.valid,
          discount: coupon.discount,
          free_delivery: coupon.freeDelivery,
          error_code: coupon.errorCode,
          message: coupon.message,
        }
      : null,
  };
}

function orderItem(line: ReturnType<typeof demoLine>, index: number) {
  return {
    id: `line-${index + 1}`,
    product_id: line.product_id,
    variant_id: null,
    sku: "",
    title: line.title,
    slug: line.slug,
    image_src: line.image_src,
    unit_price: line.unit_price,
    quantity: line.quantity,
    line_total: line.line_total,
    selection: [],
    regular_price: line.regular_price,
    base_discount_percent: 0,
    quantity_discount_percent: 0,
    total_discount_percent: 0,
  };
}

function buildOrder(input: PlaceRequest, quote: ReturnType<typeof mockQuoteApi>, now: Date): MockOrder {
  sequence += 1;
  const number = `IM-${sequence}`;
  const id = crypto.randomUUID();
  const coupon = quote.coupon;
  const applied = coupon?.valid === true;
  const total = quote.total;
  const method = input.paymentMethod === "bangla_qr" ? "bangla_qr" : "cod";
  const percent = method === "bangla_qr" ? input.advancePercent ?? null : null;
  const split =
    method === "bangla_qr" && percent ? advanceSplit(total, percent) : { advance: 0, due: total };
  const order: MockOrder = {
    id,
    number,
    source: input.source === "direct" ? "direct" : "cart",
    status: "new",
    payment_method: method,
    advance_percent: percent,
    advance_amount: split.advance,
    due_amount: split.due,
    payment_reference: method === "bangla_qr" ? (input.paymentReference ?? "") : "",
    anonymous: true,
    customer_name: input.customerName?.trim() || "কাস্টমার",
    phone: input.phone?.trim() || "",
    email: input.email?.trim() || "",
    district: input.district?.trim() || "",
    area: input.area?.trim() || "",
    address: input.address?.trim() || "",
    notes: input.notes?.trim() || "",
    delivery_zone: quote.delivery_zone,
    subtotal: quote.subtotal,
    shipping: quote.shipping,
    total,
    coupon_code: applied ? coupon.code : null,
    coupon_discount: applied ? coupon.discount : null,
    courier_name: "",
    tracking_number: "",
    items: quote.items.map(orderItem),
    created_at: iso(now),
    delivered_at: null,
    returned_at: null,
    next_statuses: ["confirmed", "cancelled"],
    analytics_event_id: `purchase_${number}`,
  };
  if (applied) {
    const stored = findCoupon(coupon.code);
    if (stored) {
      stored.usedCount += 1;
      stored.updatedAt = iso(now);
      redemptions.unshift({
        id: crypto.randomUUID(),
        couponId: stored.id,
        orderId: id,
        orderNumber: number,
        phone: String(order.phone),
        discountAmount: coupon.discount,
        createdAt: iso(now),
        status: "active",
        cancelledAt: null,
      });
    }
  }
  orders.unshift(order);
  return order;
}

export function mockPlaceOrder(input: PlaceRequest):
  | { ok: true; order: MockOrder }
  | { ok: false; status: number; errorCode: string; message: string } {
  ensure();
  const now = input.now ?? new Date();
  const key = input.idempotencyKey?.trim();
  if (key && idempotency.has(key)) return { ok: true, order: idempotency.get(key)! };
  const code = couponCodeFromParam(input.couponCode);
  if (code === "QUOTEONLY") {
    return {
      ok: false,
      status: 422,
      errorCode: "coupon_usage_limit",
      message: "এই কুপনটি আর ব্যবহার করা যাচ্ছে না। কোডটি সরিয়ে আবার অর্ডার করুন।",
    };
  }
  const quote = mockQuoteApi(input);
  if (code && quote.coupon && quote.coupon.valid === false) {
    return {
      ok: false,
      status: 422,
      errorCode: quote.coupon.error_code ?? "coupon_not_found",
      message: quote.coupon.message ?? "এই কুপন কোডটি ব্যবহার করা যাচ্ছে না।",
    };
  }
  const order = buildOrder(input, quote, now);
  if (key) idempotency.set(key, order);
  return { ok: true, order };
}

export function mockOrderApi(orderId: string): MockOrder | null {
  ensure();
  return orders.find((order) => order.id === orderId || order.number === orderId) ?? null;
}

function demoPlainOrder(now: Date): MockOrder {
  const quote = {
    items: [demoLine(DEMO_PRODUCT_ID)],
    subtotal: 1200,
    shipping: 70,
    total: 1270,
    delivery_zone: "inside" as const,
    coupon: null,
  };
  return {
    id: "00000000-0000-4000-8000-0000000000c0",
    number: "IM-9000",
    source: "cart",
    status: "confirmed",
    payment_method: "cod",
    advance_percent: null,
    advance_amount: 0,
    due_amount: 1270,
    payment_reference: "",
    anonymous: true,
    customer_name: "Rina Akter",
    phone: "01712345678",
    email: "",
    district: "ঢাকা",
    area: "মিরপুর",
    address: "House 12, Road 4",
    notes: "",
    delivery_zone: "inside",
    subtotal: quote.subtotal,
    shipping: quote.shipping,
    total: quote.total,
    coupon_code: null,
    coupon_discount: null,
    courier_name: "",
    tracking_number: "",
    items: quote.items.map(orderItem),
    created_at: iso(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)),
    delivered_at: null,
    returned_at: null,
    next_statuses: ["shipped", "cancelled"],
  };
}

function demoCouponOrder(now: Date): MockOrder {
  return {
    id: "00000000-0000-4000-8000-0000000000c1",
    number: "IM-9001",
    source: "cart",
    status: "confirmed",
    payment_method: "cod",
    advance_percent: null,
    advance_amount: 0,
    due_amount: 1150,
    payment_reference: "",
    anonymous: true,
    customer_name: "Nusrat Jahan",
    phone: "01712345678",
    email: "",
    district: "ঢাকা",
    area: "ধানমন্ডি",
    address: "House 4, Road 8",
    notes: "সন্ধ্যায় কল করবেন",
    delivery_zone: "inside",
    subtotal: 1200,
    shipping: 70,
    total: 1150,
    coupon_code: "SAVE10",
    coupon_discount: 120,
    courier_name: "Pathao",
    tracking_number: "PTH-100",
    items: [demoLine(DEMO_PRODUCT_ID)].map(orderItem),
    created_at: iso(new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)),
    delivered_at: null,
    returned_at: null,
    next_statuses: ["shipped", "cancelled"],
  };
}

function couponJson(coupon: StoredCoupon) {
  return {
    id: coupon.id,
    code: coupon.code,
    discount_type: coupon.discountType,
    value: coupon.value,
    max_discount: coupon.maxDiscount,
    min_order_amount: coupon.minOrderAmount,
    starts_at: coupon.startsAt,
    ends_at: coupon.endsAt,
    usage_limit_total: coupon.usageLimitTotal,
    usage_limit_per_phone: coupon.usageLimitPerPhone,
    first_order_only: coupon.firstOrderOnly,
    product_ids: coupon.productIds,
    category_ids: coupon.categoryIds,
    free_delivery: coupon.freeDelivery,
    is_active: coupon.isActive,
    status: coupon.status,
    used_count: coupon.usedCount,
    created_by: coupon.createdBy,
    created_at: coupon.createdAt,
    updated_at: coupon.updatedAt,
  };
}

function refreshStatus(coupon: StoredCoupon, now: Date) {
  coupon.status = couponStatusOf({
    isActive: coupon.isActive,
    startsAt: coupon.startsAt,
    endsAt: coupon.endsAt,
    now,
  });
}

export function mockListCoupons(query: CouponListQuery, now = new Date()) {
  ensure();
  for (const coupon of coupons) refreshStatus(coupon, now);
  const needle = query.q?.trim().toUpperCase() ?? "";
  const filtered = coupons.filter((coupon) => {
    if (query.status && coupon.status !== query.status) return false;
    if (needle && !coupon.code.includes(needle)) return false;
    return true;
  });
  const pageSize = Math.min(100, Math.max(1, query.pageSize));
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const page = Math.min(Math.max(1, query.page), pages);
  const start = (page - 1) * pageSize;
  return {
    items: filtered.slice(start, start + pageSize).map(couponJson),
    total: filtered.length,
    page,
    page_size: pageSize,
    pages,
  };
}

export function mockGetCoupon(id: string, now = new Date()) {
  ensure();
  const coupon = coupons.find((item) => item.id === id);
  if (!coupon) return null;
  refreshStatus(coupon, now);
  return couponJson(coupon);
}

function applyWrite(coupon: StoredCoupon, body: CouponWrite, now: Date) {
  coupon.code = body.code;
  coupon.discountType = body.discount_type;
  coupon.value = body.value;
  coupon.maxDiscount = body.max_discount;
  coupon.minOrderAmount = body.min_order_amount ?? 0;
  coupon.startsAt = body.starts_at;
  coupon.endsAt = body.ends_at;
  coupon.usageLimitTotal = body.usage_limit_total;
  coupon.usageLimitPerPhone = body.usage_limit_per_phone;
  coupon.firstOrderOnly = body.first_order_only;
  coupon.productIds = [...body.product_ids];
  coupon.categoryIds = [...body.category_ids];
  coupon.freeDelivery = body.free_delivery;
  coupon.isActive = body.is_active;
  coupon.updatedAt = iso(now);
  refreshStatus(coupon, now);
}

export function mockCreateCoupon(body: CouponWrite, now = new Date()):
  | { ok: true; coupon: ReturnType<typeof couponJson> }
  | { ok: false; message: string } {
  ensure();
  if (coupons.some((coupon) => coupon.code === body.code)) {
    return { ok: false, message: "That code is already in use." };
  }
  const coupon: StoredCoupon = {
    id: crypto.randomUUID(),
    code: body.code,
    discountType: body.discount_type,
    value: body.value,
    maxDiscount: body.max_discount,
    minOrderAmount: body.min_order_amount ?? 0,
    startsAt: body.starts_at,
    endsAt: body.ends_at,
    usageLimitTotal: body.usage_limit_total,
    usageLimitPerPhone: body.usage_limit_per_phone,
    firstOrderOnly: body.first_order_only,
    productIds: [...body.product_ids],
    categoryIds: [...body.category_ids],
    freeDelivery: body.free_delivery,
    isActive: body.is_active,
    status: "active",
    usedCount: 0,
    createdBy: DEMO_ACTOR,
    createdAt: iso(now),
    updatedAt: iso(now),
  };
  refreshStatus(coupon, now);
  coupons.unshift(coupon);
  return { ok: true, coupon: couponJson(coupon) };
}

export function mockUpdateCoupon(id: string, body: CouponWrite, now = new Date()) {
  ensure();
  const coupon = coupons.find((item) => item.id === id);
  if (!coupon) return { ok: false as const, status: 404, message: "Coupon not found." };
  if (coupons.some((item) => item.id !== id && item.code === body.code)) {
    return { ok: false as const, status: 409, message: "That code is already in use." };
  }
  applyWrite(coupon, body, now);
  return { ok: true as const, coupon: couponJson(coupon) };
}

export function mockSetCouponActive(id: string, active: boolean, now = new Date()) {
  ensure();
  const coupon = coupons.find((item) => item.id === id);
  if (!coupon) return null;
  coupon.isActive = active;
  coupon.updatedAt = iso(now);
  refreshStatus(coupon, now);
  return couponJson(coupon);
}

export function mockRedemptions(id: string, page = 1, pageSize = 20) {
  ensure();
  const matched = redemptions.filter((row) => row.couponId === id);
  const size = Math.min(100, Math.max(1, pageSize));
  const pages = Math.max(1, Math.ceil(matched.length / size));
  const current = Math.min(Math.max(1, page), pages);
  const start = (current - 1) * size;
  return {
    items: matched.slice(start, start + size).map((row) => ({
      id: row.id,
      coupon_id: row.couponId,
      order_id: row.orderId,
      order_number: row.orderNumber,
      phone: row.phone,
      discount_amount: row.discountAmount,
      status: row.status,
      cancelled_at: row.cancelledAt,
      created_at: row.createdAt,
    })),
    total: matched.length,
    page: current,
    page_size: size,
    pages,
  };
}

export function mockCouponReport(from: string, to: string): CouponReport {
  ensure();
  const rows = new Map<string, CouponReport["items"][number]>();
  for (const row of redemptions) {
    if (row.status === "cancelled") continue;
    const day = dhakaDateString(new Date(row.createdAt));
    if (day < from || day > to) continue;
    const coupon = coupons.find((item) => item.id === row.couponId);
    const current = rows.get(row.couponId) ?? {
      couponId: row.couponId,
      code: coupon?.code ?? row.couponId,
      timesUsed: 0,
      totalDiscount: 0,
      totalSales: 0,
    };
    const order = orders.find((item) => item.id === row.orderId);
    const sale = typeof order?.total === "number" ? order.total : 0;
    current.timesUsed += 1;
    current.totalDiscount += row.discountAmount;
    current.totalSales += sale;
    rows.set(row.couponId, current);
  }
  const items = [...rows.values()].sort((a, b) => b.totalDiscount - a.totalDiscount);
  return {
    from,
    to,
    items,
    timesUsed: items.reduce((sum, row) => sum + row.timesUsed, 0),
    totalDiscount: items.reduce((sum, row) => sum + row.totalDiscount, 0),
    totalSales: items.reduce((sum, row) => sum + row.totalSales, 0),
    channelApplies: false,
  };
}

export function mockCouponReportApi(from: string, to: string, preset: string | null = null) {
  const report = mockCouponReport(from, to);
  return {
    filters: {
      timezone: "Asia/Dhaka",
      preset,
      from: report.from,
      to: report.to,
      product_id: null,
      category_id: null,
      channel: null,
      channel_applies: false,
    },
    items: report.items.map((row) => ({
      coupon_id: row.couponId,
      code: row.code,
      times_used: row.timesUsed,
      total_discount: row.totalDiscount,
      total_sales: row.totalSales,
    })),
    times_used: report.timesUsed,
    total_discount: report.totalDiscount,
    total_sales: report.totalSales,
  };
}

export function mockCouponWorkbook(from: string, to: string) {
  const report = mockCouponReport(from, to);
  const rows = [
    ["Report", "Coupons"],
    ["Timezone", "Asia/Dhaka"],
    ["From", from],
    ["To", to],
    [],
    ["Code", "Uses", "Total discount", "Total sales"],
    ...report.items.map((row) => [row.code, String(row.timesUsed), String(row.totalDiscount), String(row.totalSales)]),
  ];
  return workbookBytes("coupons", rows);
}

export function mockCouponCatalog() {
  return {
    products: [
      { id: DEMO_PRODUCT_ID, title: "USB-C হাব" },
      { id: DEMO_DRESS_ID, title: "লিলেন ড্রেস" },
    ],
    categories: [
      { id: DEMO_GADGETS_CATEGORY, label: "Gadgets" },
      { id: DEMO_DRESSES_CATEGORY, label: "Dresses" },
    ],
  };
}

/** Used by tests that build a write body without the form. */
