import assert from "node:assert/strict";
import test from "node:test";

import { dhakaInputToIso, isoToDhakaInput, type CouponWrite } from "../lib/admin/coupons.ts";
import { mapAnalyticsEvent } from "../lib/analytics/events.ts";
import {
  captureCouponSearch,
  couponCodeFromParam,
  couponDisplay,
  couponForCheckout,
  generateCouponCode,
  quoteCouponFromBody,
  shownCheckoutTotal,
  type CouponStorage,
} from "../lib/coupons.ts";
import { buildQuotePayload, payloadOmitsClientMoney } from "../lib/mart-api/order-payload.ts";
import {
  DEMO_DRESS_ID,
  DEMO_DRESS_PARENT,
  DEMO_PRODUCT_ID,
  mockCreateCoupon,
  mockGetCoupon,
  mockListCoupons,
  mockOrderApi,
  mockPlaceOrder,
  mockQuoteApi,
  mockRedemptions,
  mockCouponReport,
  resetMockCoupons,
} from "../lib/mart-mock/coupons.ts";
import { advanceSplit } from "../lib/payment.ts";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function memory(): CouponStorage {
  const data = new Map<string, string>();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
    removeItem: (key) => {
      data.delete(key);
    },
  };
}

function quote(couponCode: string | null, extra: { phone?: string; productIds?: string[]; district?: string } = {}) {
  return mockQuoteApi({
    couponCode,
    deliveryZone: "inside",
    district: extra.district ?? "ঢাকা",
    phone: extra.phone,
    productIds: extra.productIds,
    source: "cart",
  });
}

function write(overrides: Partial<CouponWrite> = {}): CouponWrite {
  return {
    code: "ODD33",
    discount_type: "percent",
    value: 33.3,
    max_discount: null,
    min_order_amount: 0,
    starts_at: null,
    ends_at: null,
    usage_limit_total: null,
    usage_limit_per_phone: null,
    first_order_only: false,
    product_ids: [],
    category_ids: [],
    free_delivery: false,
    is_active: true,
    ...overrides,
  };
}

test("a coupon query is remembered and filled in at checkout", () => {
  const store = memory();
  assert.equal(captureCouponSearch("?coupon=save10", store), "SAVE10");
  assert.equal(couponForCheckout("", store), "SAVE10");
  assert.equal(couponForCheckout("?coupon=flat100", store), "FLAT100");
  assert.equal(captureCouponSearch("?coupon=ab", store), null);
  assert.equal(couponForCheckout("", store), "FLAT100");
  assert.equal(couponCodeFromParam(" save 10 "), "SAVE10");
  assert.equal(couponCodeFromParam("no spaces!"), null);
});

test("a generated code is eight characters from the unambiguous alphabet", () => {
  assert.equal(generateCouponCode(() => 0), "AAAAAAAA");
  const code = generateCouponCode(() => 0.999999);
  assert.equal(code.length, 8);
  assert.equal(code, CODE_ALPHABET.at(-1)!.repeat(8));
  for (const character of code) assert.equal(CODE_ALPHABET.includes(character), true);
  assert.equal(/[IO01]/.test(code), false);
});

test("Asia/Dhaka datetime fields round-trip to UTC", () => {
  const iso = dhakaInputToIso("2026-11-10T18:00");
  assert.equal(iso, "2026-11-10T12:00:00.000Z");
  assert.equal(isoToDhakaInput(iso), "2026-11-10T18:00");
});

test("the quote payload sends the code and no money", () => {
  const body = buildQuotePayload({
    source: "direct",
    district: "ঢাকা",
    couponCode: " save10 ",
    items: [{ productId: DEMO_PRODUCT_ID, quantity: 1 }],
  });
  assert.equal(body.coupon_code, "SAVE10");
  assert.equal(payloadOmitsClientMoney(body), true);
  assert.equal("discount" in body, false);
  assert.equal("coupon_discount" in body, false);
  assert.equal("phone" in body, false);
  const withPhone = buildQuotePayload({
    source: "cart",
    district: "ঢাকা",
    couponCode: "save-10",
    phone: "01712345678",
  });
  assert.equal(withPhone.coupon_code, "SAVE-10");
  assert.equal(withPhone.phone, "01712345678");
  const blank = buildQuotePayload({ source: "cart", district: "ঢাকা", couponCode: "  " });
  assert.equal("coupon_code" in blank, false);
});

test("a missing coupon object does not invent a discount", () => {
  const missing = quoteCouponFromBody({ subtotal: 1200, total: 1270 }, "SAVE10");
  assert.equal(missing?.valid, false);
  assert.equal(missing?.discount, 0);
  assert.match(missing?.message ?? "", /যাচাই/);
  assert.equal(couponDisplay(missing).state, "rejected");
  const none = quoteCouponFromBody({ coupon: null, total: 1270 }, null);
  assert.equal(none, null);
  const forced = quoteCouponFromBody({ coupon: { code: "SAVE10", valid: false, discount: 500 } }, "SAVE10");
  assert.equal(forced?.discount, 0);
});

test("percent, fixed, free delivery, and the cap come from the mock quote", () => {
  resetMockCoupons(new Date("2026-11-10T06:00:00.000Z"));
  const percent = quote("save10");
  assert.equal(percent.coupon?.valid, true);
  assert.equal(percent.coupon?.discount, 120);
  assert.equal(percent.subtotal, 1200);
  assert.equal(percent.shipping, 70);
  assert.equal(percent.total, 1150);
  assert.equal(shownCheckoutTotal(false, { subtotal: 1200, total: 1150, coupon: quoteCouponFromBody(percent, "SAVE10") }), 1080);
  assert.equal(shownCheckoutTotal(true, { subtotal: 1200, total: 1150, coupon: quoteCouponFromBody(percent, "SAVE10") }), 1150);

  const fixed = quote("flat100");
  assert.equal(fixed.coupon?.discount, 100);
  assert.equal(fixed.total, 1170);

  const ship = quote("freeship");
  assert.equal(ship.coupon?.free_delivery, true);
  assert.equal(ship.coupon?.discount, 0);
  assert.equal(ship.shipping, 0);
  assert.equal(ship.total, 1200);

  const capped = quote("big20");
  assert.equal(capped.coupon?.discount, 150);
  assert.equal(capped.total, 1120);

  const created = mockCreateCoupon(write());
  assert.equal(created.ok, true);
  const odd = quote("odd33");
  assert.equal(odd.coupon?.discount, 400);
});

test("invalid codes return a Bangla message and leave the total unchanged", () => {
  resetMockCoupons(new Date("2026-11-10T06:00:00.000Z"));
  const unknown = quote("nope");
  assert.equal(unknown.coupon?.valid, false);
  assert.equal(unknown.coupon?.discount, 0);
  assert.equal(unknown.coupon?.message, "এই কুপন কোডটি পাওয়া যায়নি। বানানটা আবার দেখুন।");
  assert.equal(unknown.total, 1270);

  assert.equal(quote("old10").coupon?.error_code, "coupon_expired");
  assert.equal(quote("nextweek").coupon?.error_code, "coupon_not_started");
  assert.equal(quote("paused").coupon?.error_code, "coupon_inactive");
  assert.match(quote("first50", { phone: "01711111111" }).coupon?.message ?? "", /প্রথম অর্ডার/);
  assert.equal(quote("dress20").coupon?.error_code, "coupon_not_eligible");
  assert.equal(quote("dress20", { productIds: [DEMO_DRESS_ID] }).coupon?.valid, true);

  const minimum = mockCreateCoupon(write({ code: "MIN5K", value: 10, max_discount: null, min_order_amount: 5000 }));
  assert.equal(minimum.ok, true);
  assert.equal(quote("min5k").coupon?.error_code, "coupon_min_amount");
  assert.match(quote("min5k").coupon?.message ?? "", /কমপক্ষে/);
});

test("Bangla QR options use the discounted total", () => {
  resetMockCoupons(new Date("2026-11-10T06:00:00.000Z"));
  const body = quote("save10");
  assert.equal(body.total, 1150);
  const option = body.bangla_qr_options.find((row) => row.percent === 25);
  const split = advanceSplit(body.total, 25);
  assert.deepEqual(option, { percent: 25, advance: split.advance, due: split.due });
  assert.equal(split.advance, 288);
  assert.equal(split.due, 862);
});

test("placing an order keeps the code, and QUOTEONLY fails at submit", () => {
  resetMockCoupons(new Date("2026-11-10T06:00:00.000Z"));
  const accepted = quote("quoteonly");
  assert.equal(accepted.coupon?.valid, true);
  assert.equal(accepted.coupon?.discount, 40);
  const rejected = mockPlaceOrder({
    couponCode: "QUOTEONLY",
    district: "ঢাকা",
    deliveryZone: "inside",
    source: "cart",
    idempotencyKey: "quote-only",
    customerName: "Rina",
    phone: "01712345678",
  });
  assert.equal(rejected.ok, false);
  if (!rejected.ok) {
    assert.equal(rejected.errorCode, "coupon_usage_limit");
    assert.match(rejected.message, /আর ব্যবহার করা যাচ্ছে না/);
  }

  const placed = mockPlaceOrder({
    couponCode: "flat100",
    district: "ঢাকা",
    deliveryZone: "inside",
    source: "direct",
    productIds: [DEMO_PRODUCT_ID],
    idempotencyKey: "flat-100",
    customerName: "Rina",
    phone: "01712345678",
  });
  assert.equal(placed.ok, true);
  if (placed.ok) {
    assert.equal(placed.order.coupon_code, "FLAT100");
    assert.equal(placed.order.coupon_discount, 100);
    assert.equal(placed.order.total, 1170);
  }

  const oldOrder = mockOrderApi("00000000-0000-4000-8000-0000000000c0");
  assert.equal(oldOrder?.coupon_code, null);
  assert.equal(oldOrder?.coupon_discount, null);
  assert.equal(oldOrder?.total, 1270);
  const saved = mockOrderApi("00000000-0000-4000-8000-0000000000c1");
  assert.equal(saved?.coupon_code, "SAVE10");
  assert.equal(saved?.coupon_discount, 120);
});

test("the mock list, history, and report stay in the admin shape", () => {
  const now = new Date("2026-11-10T06:00:00.000Z");
  resetMockCoupons(now);
  const listed = mockListCoupons({ q: "save", status: "active", page: 1, pageSize: 20 }, now);
  assert.equal(listed.items.some((row) => row.code === "SAVE10"), true);
  const saved = mockGetCoupon("c1111111-1111-4111-8111-111111111111", now);
  assert.equal(saved?.code, "SAVE10");
  const history = mockRedemptions("c1111111-1111-4111-8111-111111111111");
  assert.equal(history?.items[0]?.order_number, "IM-9001");
  assert.equal(history?.items[0]?.discount_amount, 120);
  const report = mockCouponReport("2026-11-01", "2026-11-10");
  const row = report.items.find((item) => item.code === "SAVE10");
  assert.equal(row?.timesUsed, 1);
  assert.equal(row?.totalDiscount, 120);
  const rejected = mockPlaceOrder({ couponCode: "NOPE", district: "ঢাকা", deliveryZone: "inside" });
  assert.equal(rejected.ok, false);
  if (!rejected.ok) assert.match(rejected.message, /পাওয়া যায়নি/);
});

test("a parent category covers its child, and a filled phone is checked on the quote", () => {
  resetMockCoupons(new Date("2026-11-10T06:00:00.000Z"));
  const created = mockCreateCoupon(
    write({ code: "PARENT10", value: 10, category_ids: [DEMO_DRESS_PARENT], first_order_only: true }),
  );
  assert.equal(created.ok, true);
  const child = quote("parent10", { productIds: [DEMO_DRESS_ID] });
  assert.equal(child.coupon?.valid, true);
  const returning = quote("parent10", { productIds: [DEMO_DRESS_ID], phone: "01711111111" });
  assert.equal(returning.coupon?.error_code, "coupon_first_order_only");
  const report = mockCouponReport("2026-11-01", "2026-11-10");
  assert.equal(report.channelApplies, false);
});

test("the purchase event includes the coupon code and omits it when absent", () => {
  const withCoupon = mapAnalyticsEvent(
    {
      name: "purchase",
      items: [{ id: DEMO_PRODUCT_ID, name: "USB-C হাব", price: 1200, quantity: 1 }],
      value: 1150,
      transactionId: "IM-9011",
      coupon: "SAVE10",
    },
    "purchase_IM-9011",
  );
  assert.equal(withCoupon.ga4.params.coupon, "SAVE10");
  assert.equal(withCoupon.meta.params.coupon, "SAVE10");
  assert.equal(withCoupon.ga4.params.transaction_id, "IM-9011");

  const without = mapAnalyticsEvent(
    {
      name: "purchase",
      items: [{ id: DEMO_PRODUCT_ID, name: "USB-C হাব", price: 1200, quantity: 1 }],
      value: 1270,
      transactionId: "IM-9000",
      coupon: "  ",
    },
    "purchase_IM-9000",
  );
  assert.equal("coupon" in without.ga4.params, false);
  assert.equal("coupon" in without.meta.params, false);
});
