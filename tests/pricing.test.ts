import assert from "node:assert/strict";
import test from "node:test";

import {
  derivedBase,
  discountedTotal,
  lineDiscount,
  parsePercent,
  parseTierRows,
  priceLine,
  readPricing,
  sellingPrice,
  maxQuantityText,
  tierOffers,
  type QuantityTier,
} from "@/lib/mart-api/pricing";
import { priceView } from "@/lib/mart-api/variants";

const TIERS: QuantityTier[] = [
  { minQuantity: 2, extraPercent: 0.25 },
  { minQuantity: 3, extraPercent: 0.5 },
  { minQuantity: 4, extraPercent: 0.75 },
  { minQuantity: 5, extraPercent: 1 },
  { minQuantity: 6, extraPercent: 1.25 },
  { minQuantity: 7, extraPercent: 1.5 },
  { minQuantity: 8, extraPercent: 2 },
];
const rules = { tiers: TIERS, maxPercent: 90 };

test("28 % base plus 2 % at eight units is 30 %", () => {
  assert.equal(sellingPrice(1000, 28), 720);
  const one = priceLine({
    regular: 1000,
    price: 720,
    basePercent: 28,
    quantity: 1,
    ...rules,
  });
  assert.equal(one.unitPrice, 720);
  const eight = priceLine({
    regular: 1000,
    price: 720,
    basePercent: 28,
    quantity: 8,
    ...rules,
  });
  assert.equal(eight.totalPercent, 30);
  assert.equal(eight.quantityPercent, 2);
  assert.equal(eight.unitPrice, 720);
  assert.equal(eight.subtotal, 5760);
  assert.equal(eight.lineTotal, 5645); // 5760 less 2 % = 5644.8, rounded up
  assert.equal(eight.discountAmount, 115);
  const two = priceLine({
    regular: 1000,
    price: 720,
    basePercent: 28,
    quantity: 2,
    ...rules,
  });
  assert.equal(two.totalPercent, 28.25);
  assert.equal(two.lineTotal, 1437); // 1440 less 0.25 % = 1436.4, rounded up
});

test("the cap limits the total and it never reaches 100 %", () => {
  const capped = priceLine({
    regular: 1000,
    price: 720,
    basePercent: 28,
    quantity: 8,
    tiers: TIERS,
    maxPercent: 29,
  });
  assert.equal(capped.totalPercent, 29);
  assert.equal(capped.lineTotal, 5703); // 5760 less 1 % = 5702.4
  const low = priceLine({
    regular: 1000,
    price: 720,
    basePercent: 28,
    quantity: 1,
    tiers: TIERS,
    maxPercent: 20,
  });
  assert.equal(low.unitPrice, 800);
  const greedy = priceLine({
    regular: 1000,
    price: 500,
    basePercent: 50,
    quantity: 2,
    tiers: [{ minQuantity: 2, extraPercent: 99 }],
    maxPercent: 100,
  });
  assert.equal(greedy.totalPercent, 99.99);
  assert.equal(greedy.lineTotal, 501); // 1000 less 49.99 % = 500.1
});

const EXAMPLE: QuantityTier[] = [
  { minQuantity: 2, extraPercent: 0.25 },
  { minQuantity: 3, extraPercent: 0.75 },
  { minQuantity: 4, extraPercent: 1 },
];
const plain = (quantity: number, tiers: QuantityTier[]) =>
  priceLine({ regular: 700, price: 700, quantity, tiers, maxPercent: 90 });

test("owner examples: the final price is rounded up to whole taka", () => {
  assert.equal(plain(1, EXAMPLE).lineTotal, 700);
  assert.equal(plain(2, EXAMPLE).lineTotal, 1397); // 1396.5
  assert.equal(plain(2, EXAMPLE).discountAmount, 3);
  assert.equal(plain(3, EXAMPLE).lineTotal, 2085); // 2084.25
  assert.equal(plain(4, EXAMPLE).lineTotal, 2772); // exact, never 2773
  assert.equal(plain(4, EXAMPLE).discountAmount, 28);
  assert.equal(discountedTotal(2800, 1), 2772);
});

test("a missing quantity uses the nearest lower tier; no tiers = price × quantity", () => {
  const gaps: QuantityTier[] = [
    { minQuantity: 2, extraPercent: 0.25 },
    { minQuantity: 5, extraPercent: 1 },
  ];
  assert.equal(plain(4, gaps).quantityPercent, 0.25);
  assert.equal(plain(4, gaps).lineTotal, 2793);
  assert.equal(plain(9, gaps).lineTotal, 6237);
  assert.equal(plain(1, gaps).discountAmount, 0);
  const none = plain(7, []);
  assert.equal(none.quantityPercent, 0);
  assert.equal(none.lineTotal, 4900);
  assert.equal(none.discountAmount, 0);
  assert.equal(lineDiscount(700, 4, 2772), 28);
});

test("older prices keep their quantity-1 price", () => {
  assert.equal(derivedBase(999, 777), 22.22);
  const line = priceLine({ regular: 999, price: 777, quantity: 1, ...rules });
  assert.equal(line.unitPrice, 777);
});

test("reads the API block and lists reachable tiers in Bangla", () => {
  const pricing = readPricing({
    regular_price: 1000,
    selling_price: 720,
    base_discount_percent: 28,
    max_discount_percent: 90,
    tiers: TIERS.map((tier) => ({
      min_quantity: tier.minQuantity,
      extra_percent: tier.extraPercent,
    })),
  });
  assert.ok(pricing);
  const offers = tierOffers(pricing, 8);
  assert.equal(offers.at(-1)?.label, "৮টি কিনলে ৩০% ছাড়");
  assert.equal(offers[0].label, "২টি কিনলে ২৮.২৫% ছাড়");
  assert.equal(tierOffers(pricing, 5).length, 4);
  // With a limit of 10 every default tier, up to 8 pieces = 30 %, is reachable.
  assert.equal(tierOffers(pricing, 10).length, 7);
  assert.equal(maxQuantityText(10), "সর্বোচ্চ ১০টি নেওয়া যাবে");
  assert.equal(readPricing({ regular_price: "x" }), null);
});

test("price view follows the quantity with pricing", () => {
  const pricing = {
    regularPrice: 1000,
    sellingPrice: 720,
    basePercent: 28,
    maxPercent: 90,
    tiers: TIERS,
  };
  const view = priceView(
    { price: 720, compareAtPrice: 1000, pricing },
    null,
    4,
  );
  assert.equal(view.unitPrice, 720);
  assert.equal(view.compareAtPrice, 1000);
  assert.equal(view.discountPercent, 28);
  assert.equal(view.quantityPercent, 0.75);
  assert.equal(view.subtotal, 2880);
  assert.equal(view.lineTotal, 2859); // 2858.4, rounded up
  assert.equal(view.discountAmount, 21);
});

test("admin tier rows parse, sort and reject duplicates", () => {
  assert.deepEqual(
    parseTierRows([
      { minQuantity: "8", extra: "2" },
      { minQuantity: "2", extra: "0.25" },
    ]).tiers,
    [
      { minQuantity: 2, extraPercent: 0.25 },
      { minQuantity: 8, extraPercent: 2 },
    ],
  );
  assert.ok(parseTierRows([{ minQuantity: "2", extra: "1" }, { minQuantity: "2", extra: "2" }]).error);
  assert.ok(parseTierRows([{ minQuantity: "1", extra: "1" }]).error);
  assert.ok(parseTierRows([{ minQuantity: "3", extra: "100" }]).error);
  assert.equal(parsePercent(""), 0);
  assert.equal(parsePercent("28.25"), 28.25);
  assert.equal(parsePercent("28.255"), null);
});
