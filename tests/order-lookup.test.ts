import assert from "node:assert/strict";
import test from "node:test";

import {
  orderLookupBody,
  orderLookupErrorText,
  orderStatusQuery,
  publicTimelineFrom,
} from "@/lib/order-lookup";

test("lookup sends the phone and exactly one of number or tracking id", () => {
  assert.deepEqual(orderLookupBody({ phone: " 01700000000 ", number: "im-ab12cd34" }), {
    phone: "01700000000",
    number: "IM-AB12CD34",
  });
  assert.equal("tracking_number" in orderLookupBody({ phone: "01700000000", number: "IM-AB12CD34" })!, false);
  assert.deepEqual(
    orderLookupBody({ phone: "01700000000", trackingNumber: " Pathao-9 " }),
    { phone: "01700000000", tracking_number: "Pathao-9" },
  );
  assert.equal(orderLookupBody({ phone: "01700000000" }), null);
  assert.equal(
    orderLookupBody({ phone: "01700000000", number: "IM-AB12CD34", trackingNumber: "Pathao-9" }),
    null,
  );
});

test("order-status prefers number and still reads the older order query", () => {
  assert.equal(orderStatusQuery({ number: " im-ab12cd34 ", order: "IM-00000000" }), "IM-AB12CD34");
  assert.equal(orderStatusQuery({ order: "im-00ff00aa" }), "IM-00FF00AA");
  assert.equal(orderStatusQuery({}), "");
});

test("timeline keeps known statuses and a not-found lookup is one Bangla sentence", () => {
  assert.deepEqual(
    publicTimelineFrom([
      { status: "new", at: "2026-11-16T09:00:00Z" },
      { status: "shipped", at: "2026-11-16T12:00:00Z" },
      { status: "secret", at: "2026-11-16T12:00:00Z" },
      { status: "packed" },
    ]),
    [
      { status: "new", at: "2026-11-16T09:00:00Z" },
      { status: "shipped", at: "2026-11-16T12:00:00Z" },
    ],
  );
  const missing = orderLookupErrorText("Order not found");
  assert.match(missing, /অর্ডার/);
  assert.equal(missing, orderLookupErrorText("Order not found."));
  assert.equal(missing.includes("ফোন ভুল"), false);
  assert.match(orderLookupErrorText("Send the order number or the tracking number, and the phone"), /ট্র্যাকিং/);
});
