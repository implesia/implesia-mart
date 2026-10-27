import assert from "node:assert/strict";
import test from "node:test";

import { parseProductRef, productPath } from "../lib/mart-api/product-url.ts";

const ID = "3f2a9c1e-5b7d-4e8a-9c01-2d3e4f5a6b7c";

test("productPath uses the stable id when it is a real UUID", () => {
  assert.equal(productPath({ id: ID, slug: "linen-shirt" }), `/products/${ID}`);
  assert.equal(productPath({ id: ID.toUpperCase(), slug: "linen-shirt" }), `/products/${ID}`);
});

test("productPath falls back to the legacy slug for seed rows without a catalog id", () => {
  assert.equal(productPath({ id: "seed-1", slug: "linen-shirt" }), "/products/linen-shirt");
  assert.equal(productPath({ slug: "linen-shirt" }), "/products/linen-shirt");
  assert.equal(productPath({ id: null, slug: "a b" }), "/products/a%20b");
});

test("parseProductRef tells ids, legacy slugs and junk apart", () => {
  assert.deepEqual(parseProductRef(ID), { kind: "id", id: ID, canonical: true });
  assert.deepEqual(parseProductRef(ID.toUpperCase()), { kind: "id", id: ID, canonical: false });
  assert.deepEqual(parseProductRef("linen-shirt"), { kind: "slug", slug: "linen-shirt" });
  assert.deepEqual(parseProductRef("Linen-Shirt"), { kind: "slug", slug: "linen-shirt" });
  for (const bad of ["", "   ", "%E0%A4%A", "a_b", "../x", "-a"]) {
    assert.deepEqual(parseProductRef(bad), { kind: "invalid" }, bad);
  }
});

test("a canonical id URL never resolves to a redirect (no loop)", () => {
  const ref = parseProductRef(productPath({ id: ID, slug: "x" }).split("/")[2]);
  assert.equal(ref.kind, "id");
  assert.equal(ref.kind === "id" && ref.canonical, true);
});

test("a near-UUID that is not a UUID is only a slug candidate (lookup 404s)", () => {
  assert.equal(parseProductRef("12345678-1234-1234-1234-12345678901g").kind, "slug");
});
