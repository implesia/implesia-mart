import assert from "node:assert/strict";
import test from "node:test";

import { cartItemBody } from "../lib/mart-api/cart-body.ts";
import { buildQuotePayload, payloadOmitsClientMoney } from "../lib/mart-api/order-payload.ts";
import { directCheckoutHref } from "../lib/mart-api/product-page.ts";
import {
  chooseOption,
  clampQuantity,
  defaultChoices,
  findVariant,
  lineKey,
  priceRange,
  priceView,
  purchaseCheck,
  readVariants,
  valueIsOffered,
  type ProductVariant,
} from "../lib/mart-api/variants.ts";

const ID = (n: number) => `00000000-0000-0000-0000-00000000000${n}`;

const variants: ProductVariant[] = [
  { id: ID(1), options: { size: "s", color: "red" }, label: "S / Red", price: 500, compareAtPrice: 600, available: true },
  { id: ID(2), options: { size: "s", color: "blue" }, label: "S / Blue", price: 520, compareAtPrice: null, available: false },
  { id: ID(3), options: { size: "m", color: "red" }, label: "M / Red", price: 700, compareAtPrice: null, available: true },
];

test("line key keeps one cart line per product and variant", () => {
  assert.equal(lineKey("lamp"), "lamp");
  assert.equal(lineKey("lamp", null), "lamp");
  assert.equal(lineKey("tee", ID(1)), `tee::${ID(1)}`);
  assert.notEqual(lineKey("tee", ID(1)), lineKey("tee", ID(2)));
});

test("findVariant needs an exact combination", () => {
  assert.equal(findVariant(variants, { size: "m", color: "red" })?.id, ID(3));
  assert.equal(findVariant(variants, { size: "m", color: "blue" }), null);
  assert.equal(findVariant(variants, { size: "m" })?.id, undefined);
  assert.equal(findVariant([], { size: "m" }), null);
});

test("the page opens on a buyable variant", () => {
  assert.deepEqual(defaultChoices(variants), { size: "s", color: "red" });
  assert.deepEqual(defaultChoices([variants[1]]), { size: "s", color: "blue" });
  assert.equal(defaultChoices([]), null);
});

test("values nobody can buy are not offered", () => {
  assert.equal(valueIsOffered(variants, "color", "blue"), false);
  assert.equal(valueIsOffered(variants, "color", "red"), true);
  assert.equal(valueIsOffered(variants, "size", "xl"), false);
});

test("picking a value moves the other groups to a buyable variant", () => {
  const current = { size: "s", color: "red" };
  // M + Red exists and is buyable.
  assert.deepEqual(chooseOption(variants, current, "size", "m"), { size: "m", color: "red" });
  // Blue is unbuyable everywhere, so it cannot be picked.
  assert.equal(chooseOption(variants, current, "color", "blue"), null);
  // M has no blue; moving from S/Blue-ish state lands on M/Red.
  assert.deepEqual(
    chooseOption(variants, { size: "s", color: "blue" }, "size", "m"),
    { size: "m", color: "red" },
  );
});

test("quantity is clamped to the product limits and the platform cap of 5", () => {
  assert.equal(clampQuantity(0), 1);
  assert.equal(clampQuantity(9), 5);
  assert.equal(clampQuantity(1, { min: 2 }), 2);
  assert.equal(clampQuantity(5, { max: 3 }), 3);
  assert.equal(clampQuantity(5, { min: 2, max: 3 }), 3);
  assert.equal(clampQuantity(1, { min: 4, max: 2 }), 4);
  assert.equal(clampQuantity(NaN, { min: 2 }), 2);
  assert.equal(clampQuantity(2.9), 2);
  assert.equal(clampQuantity(3, { max: 20 }), 3);
  assert.equal(clampQuantity(9, { max: null }), 5);
});

test("price view follows the variant and the quantity", () => {
  const base = { price: 500, compareAtPrice: 600 };
  const none = priceView(base, null, 3);
  assert.equal(none.unitPrice, 500);
  assert.equal(none.lineTotal, 1500);
  assert.equal(none.discountPercent, 17);
  const m = priceView(base, variants[2], 2);
  assert.equal(m.unitPrice, 700);
  assert.equal(m.lineTotal, 1400);
  assert.equal(m.compareAtPrice, null);
  assert.equal(m.discountPercent, null);
  // A compare-at price that is not higher than the price is not shown.
  assert.equal(priceView({ price: 500, compareAtPrice: 500 }, null, 1).compareAtPrice, null);
});

test("price range ignores unavailable variants", () => {
  assert.deepEqual(priceRange(variants), { min: 500, max: 700 });
  assert.equal(priceRange([variants[1]]), null);
});

test("purchase check blocks missing and unavailable selections", () => {
  assert.deepEqual(purchaseCheck(false, null), { ok: true });
  assert.deepEqual(purchaseCheck(true, null), { ok: false, reason: "choose" });
  assert.deepEqual(purchaseCheck(true, variants[1]), { ok: false, reason: "unavailable" });
  assert.deepEqual(purchaseCheck(true, variants[0]), { ok: true });
});

test("readVariants keeps usable rows only and never reads stock", () => {
  const rows = readVariants([
    { id: ID(1), options: { size: "s" }, label: "S", price: 100, compare_at_price: 150, available: true, quantity: 9 },
    { id: "", options: { size: "m" }, price: 1 },
    { id: ID(2), options: {}, price: 1 },
    { id: ID(3), options: { size: "l" }, price: "oops" },
    { id: ID(4), options: { size: "xl" }, price: 90, compare_at_price: 80, available: false },
    null,
  ]);
  assert.deepEqual(rows.map((row) => row.id), [ID(1), ID(4)]);
  assert.equal(rows[0].compareAtPrice, 150);
  assert.equal(rows[1].compareAtPrice, null);
  assert.equal(rows[1].available, false);
  assert.equal("quantity" in rows[0], false);
  assert.deepEqual(readVariants("nope"), []);
});

test("cart body carries the variant only when there is one", () => {
  const plain = cartItemBody(ID(5), 1, []);
  assert.equal("variant_id" in plain, false);
  const withVariant = cartItemBody(ID(5), 2, [], ID(1));
  assert.equal(withVariant.variant_id, ID(1));
  assert.equal(withVariant.quantity, 2);
  assert.equal(Object.keys(withVariant).some((key) => key.includes("price")), false);
});

test("order payload carries the variant and no money", () => {
  const body = buildQuotePayload({
    source: "direct",
    district: "ঢাকা",
    area: "ধানমন্ডি",
    items: [{ productId: ID(5), variantId: ID(1), quantity: 2 }],
  });
  assert.equal(payloadOmitsClientMoney(body), true);
  assert.equal((body.items as { variant_id?: string }[])[0].variant_id, ID(1));
});

test("direct checkout link carries a valid variant id only", () => {
  const product = { slug: "tee", id: ID(5) };
  const url = new URL(directCheckoutHref(product, 2, ID(1)), "https://x.test");
  assert.equal(url.searchParams.get("variant"), ID(1));
  assert.equal(url.searchParams.get("qty"), "2");
  assert.equal(new URL(directCheckoutHref(product, 2), "https://x.test").searchParams.has("variant"), false);
  assert.equal(
    new URL(directCheckoutHref(product, 2, "<script>"), "https://x.test").searchParams.has("variant"),
    false,
  );
});
