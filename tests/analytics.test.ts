import assert from "node:assert/strict";
import test from "node:test";

import { analyticsConfig, validGa4, validPixel } from "../lib/analytics/config.ts";
import { mapAnalyticsEvent, purchaseEventId } from "../lib/analytics/events.ts";
import { buildFbc, buildOrderTracking } from "../lib/analytics/order-tracking.ts";
import { isAdminPath } from "../lib/analytics/paths.ts";
import type { AnalyticsSinks } from "../lib/analytics/providers.ts";
import { track, trackPurchase } from "../lib/analytics/track.ts";

const lamp = { id: "p1", name: "Lamp", price: 700, quantity: 2 };
const dress = { id: "p2", name: "Dress", price: 1200, quantity: 1 };

function recordingSinks() {
  const gtag: unknown[][] = [];
  const fbq: unknown[][] = [];
  const sinks: AnalyticsSinks = {
    gtag: (command, ...args) => {
      gtag.push([command, ...args]);
    },
    fbq: (command, eventName, params, options) => {
      fbq.push([command, eventName, params, options]);
    },
  };
  return { gtag, fbq, sinks };
}

const enabled = { ga4Id: "G-TEST1234", metaPixelId: "1234567890" };

test("ecommerce payloads map ids, names, price, quantity, BDT, value, and transaction_id", () => {
  const view = mapAnalyticsEvent(
    { name: "view_item", items: [{ ...lamp, quantity: 1 }], value: 700 },
    "evt-view",
  );
  assert.equal(view.ga4.name, "view_item");
  assert.equal(view.meta.name, "ViewContent");
  assert.equal(view.ga4.params.currency, "BDT");
  assert.equal(view.ga4.params.value, 700);
  assert.deepEqual(view.ga4.params.items, [
    { item_id: "p1", item_name: "Lamp", price: 700, quantity: 1 },
  ]);
  assert.equal(view.ga4.params.event_id, "evt-view");
  assert.equal(view.meta.eventID, "evt-view");
  assert.equal(view.meta.params.currency, "BDT");
  assert.equal(view.meta.params.content_name, "Lamp");
  assert.deepEqual(view.meta.params.contents, [
    { id: "p1", quantity: 1, item_price: 700, item_name: "Lamp" },
  ]);

  const added = mapAnalyticsEvent({ name: "add_to_cart", items: [lamp] }, "evt-add");
  assert.equal(added.ga4.name, "add_to_cart");
  assert.equal(added.meta.name, "AddToCart");
  assert.equal(added.ga4.params.value, 1400);
  assert.equal(added.ga4.params.currency, "BDT");
  assert.deepEqual(added.ga4.params.items, [
    { item_id: "p1", item_name: "Lamp", price: 700, quantity: 2 },
  ]);

  const checkout = mapAnalyticsEvent(
    { name: "begin_checkout", items: [lamp, dress], value: 2700 },
    "evt-checkout",
  );
  assert.equal(checkout.ga4.name, "begin_checkout");
  assert.equal(checkout.meta.name, "InitiateCheckout");
  assert.equal(checkout.ga4.params.value, 2700);
  assert.equal(checkout.ga4.params.currency, "BDT");
  assert.deepEqual(checkout.meta.params.content_ids, ["p1", "p2"]);

  const purchase = mapAnalyticsEvent(
    {
      name: "purchase",
      items: [lamp, dress],
      value: 2800,
      transactionId: "IM100",
    },
    "purchase_IM100",
  );
  assert.equal(purchase.ga4.name, "purchase");
  assert.equal(purchase.meta.name, "Purchase");
  assert.equal(purchase.ga4.params.currency, "BDT");
  assert.equal(purchase.ga4.params.value, 2800);
  assert.equal(purchase.ga4.params.transaction_id, "IM100");
  assert.equal(purchase.ga4.params.event_id, "purchase_IM100");
  assert.equal(purchase.meta.eventID, "purchase_IM100");
  assert.equal(purchase.meta.params.transaction_id, "IM100");
  assert.deepEqual(purchase.ga4.params.items, [
    { item_id: "p1", item_name: "Lamp", price: 700, quantity: 2 },
    { item_id: "p2", item_name: "Dress", price: 1200, quantity: 1 },
  ]);
});

test("purchase event_id is purchase_<order_number>, or the API id when it is sent", () => {
  assert.equal(purchaseEventId("IM100", null), "purchase_IM100");
  assert.equal(purchaseEventId("IM100", "  "), "purchase_IM100");
  assert.equal(purchaseEventId("IM100", "purchase_IM100"), "purchase_IM100");
  assert.equal(purchaseEventId("IM100", " from-api "), "from-api");
});

test("purchase does not fire twice for the same order number", () => {
  const storage = new Map<string, string>();
  const store = {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => {
      storage.set(key, value);
    },
  };
  const first = recordingSinks();
  const input = {
    orderNumber: "IM100",
    value: 2800,
    items: [lamp, dress],
  };
  const base = {
    pathname: "/checkout",
    config: enabled,
    storage: store,
    randomId: () => "should-not-be-used",
  };
  assert.equal(trackPurchase(input, { ...base, claimed: new Set(), sinks: first.sinks }), true);
  assert.equal(first.gtag.length, 1);
  assert.equal(first.fbq.length, 1);
  const ga4Params = first.gtag[0]?.[2] as { event_id?: string; transaction_id?: string };
  assert.equal(ga4Params.event_id, "purchase_IM100");
  assert.equal(ga4Params.transaction_id, "IM100");
  assert.equal((first.fbq[0]?.[3] as { eventID?: string }).eventID, "purchase_IM100");

  const second = recordingSinks();
  assert.equal(
    trackPurchase(input, { ...base, claimed: new Set(), sinks: second.sinks }),
    false,
  );
  assert.equal(second.gtag.length, 0);
  assert.equal(second.fbq.length, 0);

  const third = recordingSinks();
  assert.equal(
    trackPurchase(
      { ...input, analyticsEventId: "purchase_IM100" },
      { ...base, claimed: new Set(), sinks: third.sinks },
    ),
    false,
  );
  assert.equal(third.gtag.length, 0);
});

test("trackers stay off when the env ids are empty", () => {
  assert.deepEqual(analyticsConfig({}), { ga4Id: "", metaPixelId: "" });
  assert.deepEqual(
    analyticsConfig({ NEXT_PUBLIC_GA4_ID: "  ", NEXT_PUBLIC_META_PIXEL_ID: "" }),
    { ga4Id: "", metaPixelId: "" },
  );
  assert.equal(validGa4("not-a-measurement-id"), "");
  assert.equal(validPixel("G-TEST1234"), "");
  assert.equal(validGa4("G-TEST1234"), "G-TEST1234");
  assert.equal(validPixel("1234567890"), "1234567890");

  const recorded = recordingSinks();
  const sent = track(
    { name: "add_to_cart", items: [lamp] },
    {
      pathname: "/products/p1",
      config: analyticsConfig({ NEXT_PUBLIC_GA4_ID: "", NEXT_PUBLIC_META_PIXEL_ID: " " }),
      sinks: recorded.sinks,
      randomId: () => "evt",
    },
  );
  assert.equal(sent, false);
  assert.equal(recorded.gtag.length, 0);
  assert.equal(recorded.fbq.length, 0);
});

test("a set id does not call the tracker whose id is empty", () => {
  const recorded = recordingSinks();
  track(
    { name: "view_item", items: [{ ...lamp, quantity: 1 }] },
    {
      pathname: "/",
      config: { ga4Id: "G-TEST1234", metaPixelId: "" },
      sinks: recorded.sinks,
      randomId: () => "evt-1",
    },
  );
  assert.equal(recorded.gtag.length, 1);
  assert.equal(recorded.gtag[0]?.[1], "view_item");
  assert.equal(recorded.fbq.length, 0);
});

test("no tracking on /admin paths", () => {
  for (const pathname of ["/admin", "/admin/", "/admin/orders/IM100"]) {
    assert.equal(isAdminPath(pathname), true);
    const recorded = recordingSinks();
    const sent = track(
      { name: "page_view", pagePath: pathname },
      { pathname, config: enabled, sinks: recorded.sinks, randomId: () => "evt" },
    );
    assert.equal(sent, false, pathname);
    assert.equal(recorded.gtag.length, 0);
    assert.equal(recorded.fbq.length, 0);
  }
  assert.equal(isAdminPath("/administrator"), false);
  assert.equal(isAdminPath("/products/admin-lamp"), false);
});

test("fbc is built from fbclid when the _fbc cookie is missing", () => {
  assert.equal(buildFbc("IwAR0test", 1554763741205), "fb.1.1554763741205.IwAR0test");
  const fromUrl = buildOrderTracking({
    cookieHeader: "_fbp=fb.1.111.browser",
    href: "https://mart.implesia.com/products/1?fbclid=IwAR0test",
    nowMs: 1554763741205,
  });
  assert.deepEqual(fromUrl, {
    fbp: "fb.1.111.browser",
    fbc: "fb.1.1554763741205.IwAR0test",
    event_source_url: "https://mart.implesia.com/products/1?fbclid=IwAR0test",
  });
  const fromStore = buildOrderTracking({
    cookieHeader: "",
    href: "https://mart.implesia.com/checkout",
    storedFbclid: "IwAR0test",
    nowMs: 1700000000000,
  });
  assert.equal(fromStore.fbc, "fb.1.1700000000000.IwAR0test");
  assert.equal(fromStore.fbp, null);
  const cookieWins = buildOrderTracking({
    cookieHeader: "_fbc=fb.1.9.already",
    href: "https://mart.implesia.com/?fbclid=IwAR0test",
    nowMs: 5,
  });
  assert.equal(cookieWins.fbc, "fb.1.9.already");
  assert.deepEqual(
    buildOrderTracking({ cookieHeader: "", href: "https://mart.implesia.com/checkout", nowMs: 5 }),
    {
      fbp: null,
      fbc: null,
      event_source_url: "https://mart.implesia.com/checkout",
    },
  );
});
