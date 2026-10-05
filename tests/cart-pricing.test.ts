import assert from "node:assert/strict";
import test from "node:test";

import {
  offeredDeliveryLabel,
  type CartPricing,
} from "../app/(client)/_lib/cart-shared.ts";

const base: CartPricing = {
  subtotal: 500,
  shipping: 0,
  tax: 0,
  total: 500,
  insideDhaka: 0,
  dhakaSuburban: 0,
  outsideDhaka: 0,
  insideEnabled: false,
  suburbanEnabled: false,
  outsideEnabled: false,
  ratesConfirmed: false,
};

test("an unconfirmed cart does not show a seed delivery price", () => {
  assert.equal(offeredDeliveryLabel(base), "চেকআউটে");
  assert.equal(
    offeredDeliveryLabel({
      ...base,
      insideDhaka: 70,
      dhakaSuburban: 100,
      outsideDhaka: 130,
      insideEnabled: true,
      suburbanEnabled: true,
      outsideEnabled: true,
    }),
    "চেকআউটে",
  );
});

test("a confirmed quote shows the server fee or that delivery is off", () => {
  assert.equal(
    offeredDeliveryLabel({
      ...base,
      ratesConfirmed: true,
      shipping: 90,
      insideDhaka: 90,
      dhakaSuburban: 90,
      outsideDhaka: 90,
      insideEnabled: true,
      suburbanEnabled: true,
      outsideEnabled: true,
    }),
    "৳90",
  );
  assert.equal(
    offeredDeliveryLabel({
      ...base,
      ratesConfirmed: true,
      insideDhaka: 70,
      dhakaSuburban: 90,
      outsideDhaka: 120,
    }),
    "বন্ধ",
  );
});
