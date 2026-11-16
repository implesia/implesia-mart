import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";

import { couponsBackend, resetCouponsBackendMode } from "@/lib/mart-api/coupons";
import { inventoryBackend } from "@/lib/mart-api/inventory";
import { fetchNewOrders, resetOrderAlertsMode } from "@/lib/mart-api/order-alerts";
import {
  API_UNREACHABLE_MESSAGE,
  ORDER_UNAVAILABLE_MESSAGE,
  PRICING_UNAVAILABLE_MESSAGE,
  placeOrder,
  quoteOrder,
  resetOrderPricingMode,
} from "@/lib/mart-api/orders";
import { MartApiError } from "@/lib/mart-api/products";
import { reportsBackend } from "@/lib/mart-api/reports";
import { mockFallbackAllowed } from "@/lib/mock-mode";

const realFetch = globalThis.fetch;
const env = process.env as Record<string, string | undefined>;
const saved = {
  NODE_ENV: env.NODE_ENV,
  NEXT_PUBLIC_ENABLE_MOCK: env.NEXT_PUBLIC_ENABLE_MOCK,
  NEXT_PUBLIC_COUPONS_MOCK: env.NEXT_PUBLIC_COUPONS_MOCK,
};
let calls: string[] = [];

function productionConfig() {
  env.NODE_ENV = "production";
  delete env.NEXT_PUBLIC_ENABLE_MOCK;
}

function respond(status: number, body: unknown = {}) {
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    calls.push(String(input));
    return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
  }) as typeof fetch;
}

function networkDown() {
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    calls.push(String(input));
    throw new TypeError("fetch failed");
  }) as typeof fetch;
}

const quoteInput = {
  source: "direct" as const,
  district: "Dhaka",
  area: "Dhanmondi",
  items: [{ productId: "11111111-1111-4111-8111-111111111111", variantId: null, quantity: 1, selection: [] }],
  couponCode: "SAVE10",
  phone: "01712345678",
};

const orderInput = {
  ...quoteInput,
  idempotencyKey: "test-key",
  customerName: "Rahim",
  email: "",
  address: "House 1, Road 2",
  notes: "",
  payment: { method: "cod" as const },
};

beforeEach(() => {
  calls = [];
  resetOrderPricingMode();
  resetCouponsBackendMode();
  resetOrderAlertsMode();
  productionConfig();
});

afterEach(() => {
  globalThis.fetch = realFetch;
  for (const [key, value] of Object.entries(saved)) {
    if (value === undefined) delete env[key];
    else env[key] = value;
  }
});

test("stand-ins are off unless development or NEXT_PUBLIC_ENABLE_MOCK=true", () => {
  assert.equal(mockFallbackAllowed(), false);
  env.NEXT_PUBLIC_ENABLE_MOCK = "1";
  assert.equal(mockFallbackAllowed(), false);
  env.NEXT_PUBLIC_ENABLE_MOCK = "true";
  assert.equal(mockFallbackAllowed(), true);
  delete env.NEXT_PUBLIC_ENABLE_MOCK;
  env.NODE_ENV = "development";
  assert.equal(mockFallbackAllowed(), true);
});

for (const status of [404, 501, 500, 503]) {
  test(`production: quote ${status} is an error, then placing the order is not faked`, async () => {
    respond(status);
    await assert.rejects(quoteOrder(quoteInput), (error: unknown) => {
      assert.ok(error instanceof MartApiError);
      if (status >= 500) assert.equal(error.message, PRICING_UNAVAILABLE_MESSAGE);
      return true;
    });
    // The failed quote must not switch the tab to the stand-in: the order goes to the API.
    calls = [];
    await assert.rejects(placeOrder(orderInput), (error: unknown) => {
      assert.ok(error instanceof MartApiError);
      if (status >= 500) assert.equal(error.message, ORDER_UNAVAILABLE_MESSAGE);
      return true;
    });
    assert.equal(calls.length, 1);
    assert.match(calls[0], /\/api\/v1\/orders$/);
  });
}

test("production: API unreachable gives a retryable error, never a placed order", async () => {
  networkDown();
  await assert.rejects(quoteOrder(quoteInput), { message: API_UNREACHABLE_MESSAGE });
  await assert.rejects(placeOrder(orderInput), { message: API_UNREACHABLE_MESSAGE });
});

test("production: NEXT_PUBLIC_COUPONS_MOCK=1 alone does not enable the stand-in", async () => {
  env.NEXT_PUBLIC_COUPONS_MOCK = "1";
  respond(503);
  await assert.rejects(quoteOrder(quoteInput), MartApiError);
  await assert.rejects(placeOrder(orderInput), MartApiError);
  assert.equal(calls.length, 2);
});

test("production: coupon rejection keeps the backend message and code", async () => {
  respond(422, { error: { message: "This coupon has expired.", code: "coupon_expired" } });
  await assert.rejects(quoteOrder(quoteInput), (error: unknown) => {
    assert.ok(error instanceof MartApiError);
    assert.equal(error.message, "This coupon has expired.");
    assert.equal(error.code, "coupon_expired");
    return true;
  });
  await assert.rejects(placeOrder(orderInput), { message: "This coupon has expired." });
});

test("production: admin coupons, order alerts, inventory and reports stay live", async () => {
  respond(503);
  assert.equal(await couponsBackend(), "live");
  assert.equal(await inventoryBackend(), "live");
  assert.equal(await reportsBackend(), "live");
  await assert.rejects(fetchNewOrders(null), MartApiError);
  networkDown();
  resetCouponsBackendMode();
  assert.equal(await couponsBackend(), "live");
  await assert.rejects(fetchNewOrders(null), MartApiError);
});

test("explicit opt-in still prices from the stand-in when the route is missing", async () => {
  env.NEXT_PUBLIC_ENABLE_MOCK = "true";
  respond(404);
  const quote = await quoteOrder(quoteInput);
  assert.equal(quote.mocked, true);
});
