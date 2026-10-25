import assert from "node:assert/strict";
import { test } from "node:test";

import {
  PREVIEW_LIMIT,
  categoryPreviewPath,
  parseCategoryPreview,
} from "@/lib/mart-api/category-preview";

const item = (n: number, extra: Record<string, unknown> = {}) => ({
  id: `p${n}`,
  slug: `product-${n}`,
  title: `Product ${n}`,
  price: 100 * n,
  image_src: `/media/p${n}.jpg`,
  status: "available",
  ...extra,
});

test("the preview request is bounded, includes descendants and escapes the slug", () => {
  const path = categoryPreviewPath("bed heaters/x");
  assert.match(path, /^\/api\/v1\/categories\/bed%20heaters%2Fx\/products\?/);
  assert.match(path, /page_size=6/);
  assert.match(path, /include_descendants=true/);
  assert.match(categoryPreviewPath("a", 500), /page_size=48/);
  assert.match(categoryPreviewPath("a", 0), /page_size=1/);
});

test("a list body becomes at most PREVIEW_LIMIT products with the total kept", () => {
  const body = { items: Array.from({ length: 10 }, (_, i) => item(i + 1)), total: 25 };
  const parsed = parseCategoryPreview(body);
  assert.ok(parsed);
  assert.equal(parsed.products.length, PREVIEW_LIMIT);
  assert.equal(parsed.total, 25);
  assert.equal(parsed.products[0]?.imageAlt, "Product 1");
});

test("malformed bodies are rejected so the menu shows its error state", () => {
  assert.equal(parseCategoryPreview(null), null);
  assert.equal(parseCategoryPreview([]), null);
  assert.equal(parseCategoryPreview({ items: "x" }), null);
});

test("rows with a missing id, title or a bad price are skipped, not rendered", () => {
  const parsed = parseCategoryPreview({
    items: [item(1), { ...item(2), price: -1 }, { ...item(3), title: 7 }, { slug: "x" }, item(4)],
    total: 2,
  });
  assert.deepEqual(
    parsed?.products.map((product) => product.id),
    ["p1", "p4"],
  );
  assert.equal(parsed?.total, 2);
});

test("compare-at only counts when it is above the price, and an empty list is valid", () => {
  const parsed = parseCategoryPreview({
    items: [item(1, { compare_at_price: 50 }), item(2, { compare_at_price: 900 })],
  });
  assert.equal(parsed?.products[0]?.compareAtPrice, null);
  assert.equal(parsed?.products[1]?.compareAtPrice, 900);
  assert.deepEqual(parseCategoryPreview({ items: [], total: 0 }), { products: [], total: 0 });
});

test("the preview never carries a stock count", () => {
  const parsed = parseCategoryPreview({ items: [item(1, { quantity: 3 })], total: 1 });
  assert.equal(JSON.stringify(parsed).includes("quantity"), false);
});
