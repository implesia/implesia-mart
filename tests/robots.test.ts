import assert from "node:assert/strict";
import test from "node:test";

import robots from "../app/robots.ts";

test("robots.txt disallows admin and order status", () => {
  const body = robots();
  const rules = Array.isArray(body.rules) ? body.rules : [body.rules];
  const disallowed = rules.flatMap((rule) => {
    const value = rule.disallow ?? [];
    return Array.isArray(value) ? value : [value];
  });
  assert.ok(disallowed.includes("/admin"));
  assert.ok(disallowed.includes("/order-status"));
  assert.ok(disallowed.includes("/checkout"));
});
