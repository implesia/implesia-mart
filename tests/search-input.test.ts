import assert from "node:assert/strict";
import test from "node:test";

import { isRepeatSubmit, SUBMIT_GUARD_MS, submitTarget } from "../lib/search-input.ts";

test("submitTarget: typed text goes to the results page, cleaned and encoded", () => {
  assert.equal(submitTarget("  red   lamp "), "/search?q=red+lamp");
  assert.equal(submitTarget("চা & কফি"), `/search?${new URLSearchParams({ q: "চা & কফি" })}`);
});

test("submitTarget: a blank or whitespace-only box opens the catalog", () => {
  assert.equal(submitTarget(""), "/products");
  assert.equal(submitTarget("   \n\t "), "/products");
});

test("submitTarget: a highlighted suggestion wins over the typed text", () => {
  assert.equal(submitTarget("lamp", "/products/red-lamp"), "/products/red-lamp");
  assert.equal(submitTarget("", "/blogs/x"), "/blogs/x");
  assert.equal(submitTarget("lamp", null), "/search?q=lamp");
});

test("isRepeatSubmit: only a submit inside the guard window is a repeat", () => {
  assert.equal(isRepeatSubmit(null, 1000), false);
  assert.equal(isRepeatSubmit(1000, 1000 + SUBMIT_GUARD_MS - 1), true);
  assert.equal(isRepeatSubmit(1000, 1000 + SUBMIT_GUARD_MS), false);
  assert.equal(isRepeatSubmit(1000, 999), false);
});
