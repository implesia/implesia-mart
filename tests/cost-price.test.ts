import assert from "node:assert/strict";
import test from "node:test";

import {
  COST_PRICE_MESSAGE,
  costMargin,
  costPriceError,
  costPriceForApi,
  costPriceLiveError,
  formatCostPriceInput,
  formatMarginTaka,
  readCostPrice,
} from "@/lib/admin/cost-price";

test("Shopify margin is profit divided by the selling price", () => {
  // Price 50, cost 30 -> 20 taka, 40% of the selling price (not 66.67% markup).
  const margin = costMargin(50, 30);
  assert.deepEqual(margin, { profit: 20, percent: 40 });
  assert.equal(formatMarginTaka(margin!.profit), "৳20");
});

test("margin profit, loss, even, and a zero selling price", () => {
  assert.deepEqual(costMargin(1000, 750), { profit: 250, percent: 25 });
  assert.deepEqual(costMargin(720, 800), { profit: -80, percent: -11.11 });
  assert.deepEqual(costMargin(100, 100), { profit: 0, percent: 0 });
  assert.deepEqual(costMargin(0, 40), { profit: -40, percent: null });
  assert.equal(costMargin(Number.NaN, 10), null);
  assert.equal(formatMarginTaka(-80.5), "৳80.50");
});

test("empty cost price is null and invalid values are refused", () => {
  assert.equal(costPriceError(""), null);
  assert.equal(costPriceError("   "), null);
  assert.equal(costPriceForApi(""), null);
  assert.equal(costPriceForApi("0"), 0);
  assert.equal(costPriceForApi("750"), 750);
  assert.equal(costPriceForApi("10.5"), 10.5);
  assert.equal(costPriceForApi("10."), 10);
  assert.equal(costPriceForApi(".5"), 0.5);
  assert.equal(costPriceForApi("৭৫০.৫০"), 750.5);
  assert.equal(costPriceError("-1"), COST_PRICE_MESSAGE);
  assert.equal(costPriceError("abc"), COST_PRICE_MESSAGE);
  assert.equal(costPriceError("10.555"), COST_PRICE_MESSAGE);
  assert.throws(() => costPriceForApi("-5"), /কেনা দাম/);
});

test("live validation waits for an unfinished decimal", () => {
  assert.equal(costPriceLiveError(""), null);
  assert.equal(costPriceLiveError("10."), null);
  assert.equal(costPriceLiveError("10"), null);
  assert.equal(costPriceLiveError("-2"), COST_PRICE_MESSAGE);
  assert.equal(costPriceLiveError("12.345"), COST_PRICE_MESSAGE);
  assert.equal(costPriceLiveError("১২a"), COST_PRICE_MESSAGE);
});

test("API cost_price accepts a decimal string or a number", () => {
  assert.equal(readCostPrice("12.50"), 12.5);
  assert.equal(readCostPrice(12), 12);
  assert.equal(readCostPrice(0), 0);
  assert.equal(readCostPrice("0.00"), 0);
  assert.equal(readCostPrice(null), null);
  assert.equal(readCostPrice(""), null);
  assert.equal(readCostPrice(undefined), null);
  assert.equal(readCostPrice(-3), null);
  assert.equal(readCostPrice("nope"), null);
  assert.equal(formatCostPriceInput(12.5), "12.5");
  assert.equal(formatCostPriceInput(null), "");
  assert.equal(formatCostPriceInput(readCostPrice("450.00")), "450");
});
