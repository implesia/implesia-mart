import assert from "node:assert/strict";
import test from "node:test";

import {
  buildQuotePayload,
  payloadOmitsClientMoney,
} from "../lib/mart-api/order-payload.ts";
import { validateShipping } from "../app/(client)/checkout/_lib/validate-shipping.ts";

test("quote payload sends ids and quantity, not money", () => {
  const body = buildQuotePayload({
    source: "direct",
    district: "ঢাকা",
    area: "ধানমন্ডি",
    items: [{ productId: "11111111-1111-1111-1111-111111111111", quantity: 2 }],
  });
  assert.equal(payloadOmitsClientMoney(body), true);
  assert.deepEqual(body.items, [
    {
      product_id: "11111111-1111-1111-1111-111111111111",
      quantity: 2,
      selection: [],
    },
  ]);
});

test("a declared zone is sent without a client price", () => {
  const body = buildQuotePayload({
    source: "direct",
    district: "চাঁপাইনবাবগঞ্জ",
    area: "নবাবগঞ্জ",
    deliveryZone: "inside",
    items: [{ productId: "11111111-1111-4111-8111-111111111111", quantity: 1 }],
  });
  assert.equal(body.delivery_zone, "inside");
  assert.equal(payloadOmitsClientMoney(body), true);
});

test("cart quotes do not invent line items", () => {
  const body = buildQuotePayload({ source: "cart", district: "চট্টগ্রাম" });
  assert.equal("items" in body, false);
  assert.equal(body.district, "চট্টগ্রাম");
});

test("shipping validation requires a bangladesh mobile and an address", () => {
  const errors = validateShipping({
    name: "",
    email: "not-an-email",
    phone: "123",
    district: "",
    area: "",
    address: "short",
    notes: "",
  });
  assert.ok(errors.name);
  assert.ok(errors.phone);
  assert.ok(errors.email);
  assert.ok(errors.address);
});
