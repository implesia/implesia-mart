import assert from "node:assert/strict";
import test from "node:test";

import { cartItemBody } from "../lib/mart-api/cart-body.ts";
import { publicRequestInit } from "../lib/mart-api/public-request.ts";

test("a shop cart write sends the product id and quantity", () => {
  const body = cartItemBody("11111111-1111-4111-8111-111111111111", 2, [
    { groupId: "size", valueId: "m" },
  ]);
  assert.deepEqual(body, {
    product_id: "11111111-1111-4111-8111-111111111111",
    quantity: 2,
    selection: [{ group_id: "size", value_id: "m" }],
  });
  assert.equal("price" in body || "unit_price" in body, false);
});

test("public cart requests do not carry an admin session", () => {
  const init = publicRequestInit({
    method: "GET",
    headers: { Authorization: "Bearer admin-token", "X-Cart-Token": "guest" },
    credentials: "include",
  });
  const headers = new Headers(init.headers);
  assert.equal(headers.get("Authorization"), null);
  assert.equal(headers.get("X-Cart-Token"), "guest");
  assert.equal(init.credentials, "omit");
  assert.equal(init.cache, "no-store");
});
