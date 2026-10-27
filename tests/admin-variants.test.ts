import assert from "node:assert/strict";
import test from "node:test";

import {
  addMissingRows,
  combinations,
  optionKey,
  rollup,
  rowsFromVariants,
  rowsToVariants,
  sameVariants,
  validateVariants,
  variantLabel,
  variantPayload,
  type VariantRow,
} from "../lib/mart-api/admin-variants.ts";

const groups = [
  {
    id: "size",
    name: "Size",
    kind: "size" as const,
    values: [
      { id: "s", label: "S", swatch: "" },
      { id: "m", label: "M", swatch: "" },
    ],
  },
  {
    id: "color",
    name: "Color",
    kind: "color" as const,
    values: [
      { id: "red", label: "Red", swatch: "#f00" },
      { id: "blue", label: "Blue", swatch: "#00f" },
    ],
  },
];

function row(key: string, options: Record<string, string>, extra: Partial<VariantRow> = {}): VariantRow {
  return { key, options, sku: "", price: "100", compareAtPrice: "", quantity: "", isActive: true, ...extra };
}

test("combinations lists one value per group and skips empty groups", () => {
  assert.equal(combinations(groups).length, 4);
  assert.deepEqual(combinations(groups)[0], { size: "s", color: "red" });
  assert.deepEqual(combinations([{ ...groups[0], name: "  " }, groups[1]]).map((o) => o.color), ["red", "blue"]);
  assert.deepEqual(combinations([]), []);
});

test("option key does not depend on the order of the groups", () => {
  assert.equal(optionKey({ a: "1", b: "2" }), optionKey({ b: "2", a: "1" }));
});

test("generating never duplicates or disturbs existing rows", () => {
  const existing = [row("keep", { size: "s", color: "red" }, { price: "555", sku: "TEE-S-R" })];
  const first = addMissingRows(groups, existing, { price: "100" });
  assert.equal(first.added, 3);
  assert.equal(first.rows[0], existing[0]);
  assert.equal(new Set(first.rows.map((r) => optionKey(r.options))).size, 4);
  const again = addMissingRows(groups, first.rows, { price: "100" });
  assert.equal(again.added, 0);
  assert.equal(again.rows.length, 4);
});

test("generating stops at the API limit of 100 variants", () => {
  const big = [
    {
      id: "a",
      name: "A",
      kind: "text" as const,
      values: Array.from({ length: 11 }, (_, i) => ({ id: `a${i}`, label: `A${i}`, swatch: "" })),
    },
    {
      id: "b",
      name: "B",
      kind: "text" as const,
      values: Array.from({ length: 11 }, (_, i) => ({ id: `b${i}`, label: `B${i}`, swatch: "" })),
    },
  ];
  const result = addMissingRows(big, [], { price: "1" });
  assert.equal(result.rows.length, 100);
  assert.equal(result.truncated, true);
});

test("labels follow the option order and flag removed values", () => {
  assert.equal(variantLabel(groups, { size: "m", color: "blue" }), "M / Blue");
  assert.equal(variantLabel(groups, { size: "xl", color: "blue" }), "? / Blue");
});

test("validation blocks duplicates, contradictory prices and bad stock", () => {
  const rows = [
    row("a", { size: "s", color: "red" }, { sku: "Tee-1" }),
    row("b", { size: "s", color: "red" }, { sku: "tee-1" }),
    row("c", { size: "m", color: "red" }, { price: "100", compareAtPrice: "90" }),
    row("d", { size: "m", color: "blue" }, { price: "12.5", quantity: "-1" }),
  ];
  const check = validateVariants(rows, groups);
  assert.equal(check.ok, false);
  assert.match(check.rows.b.options ?? "", /combination/);
  assert.match(check.rows.b.sku ?? "", /SKU/);
  assert.match(check.rows.c.compareAtPrice ?? "", /at least/);
  assert.match(check.rows.d.price ?? "", /whole/);
  assert.match(check.rows.d.quantity ?? "", /Whole number/);
  assert.equal(check.rows.a, undefined);
});

test("validation flags a variant whose option was removed", () => {
  const rows = [row("a", { size: "xl", color: "red" })];
  assert.match(validateVariants(rows, groups).rows.a.options ?? "", /removed/);
  assert.match(validateVariants([row("a", { size: "s" })], groups).rows.a.options ?? "", /removed/);
});

test("unusable sku characters and an empty option list are rejected", () => {
  assert.match(
    validateVariants([row("a", { size: "s", color: "red" }, { sku: "a|b" })], groups).rows.a.sku ?? "",
    /\|/,
  );
  assert.ok(validateVariants([row("a", { size: "s" })], []).form);
  assert.equal(validateVariants([], []).ok, true);
});

test("a valid set passes", () => {
  const rows = addMissingRows(groups, [], { price: "250" }).rows;
  assert.equal(validateVariants(rows, groups).ok, true);
});

test("payload has only the fields the API accepts", () => {
  const body = variantPayload(
    row("k", { size: "s", color: "red" }, { id: "abc", sku: " X1 ", price: "200", compareAtPrice: "250", quantity: "7", isActive: false }),
  );
  assert.deepEqual(body, {
    id: "abc",
    options: { size: "s", color: "red" },
    sku: "X1",
    price: 200,
    compare_at_price: 250,
    quantity: 7,
    is_active: false,
  });
  const fresh = variantPayload(row("k", { size: "s", color: "red" }));
  assert.equal("id" in fresh, false);
  assert.equal(fresh.quantity, null);
  assert.equal(fresh.compare_at_price, null);
  assert.equal("key" in fresh, false);
});

test("rows round trip from the API and keep their ids", () => {
  const variants = [
    { id: "v1", options: { size: "s" }, sku: "A", price: 10, compareAtPrice: null, quantity: 3, isActive: true },
    { id: "v2", options: { size: "m" }, sku: "", price: 12, compareAtPrice: 15, quantity: null, isActive: false },
  ];
  const rows = rowsFromVariants(variants);
  assert.deepEqual(rowsToVariants(rows), variants);
  assert.equal(sameVariants(rows, rowsFromVariants(variants)), true);
  assert.equal(sameVariants(rows, [{ ...rows[0], price: "11" }, rows[1]]), false);
});

test("roll-up mirrors the API: lowest active price, summed stock", () => {
  assert.deepEqual(rollup([]), { price: null, quantity: 0, soldOut: true });
  const rows = [
    row("a", { size: "s" }, { price: "300", quantity: "2" }),
    row("b", { size: "m" }, { price: "200", quantity: "3" }),
    row("c", { size: "l" }, { price: "100", quantity: "9", isActive: false }),
  ];
  assert.deepEqual(rollup(rows), { price: 200, quantity: 5, soldOut: false });
  assert.equal(rollup([...rows, row("d", { size: "xl" }, { quantity: "" })]).quantity, null);
  assert.deepEqual(rollup([row("a", { size: "s" }, { price: "50", isActive: false })]), {
    price: 50,
    quantity: 0,
    soldOut: true,
  });
});
