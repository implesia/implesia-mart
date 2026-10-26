import assert from "node:assert/strict";
import test from "node:test";

import {
  CATALOG_SEARCH_MAX_CHARS,
  catalogHref,
  interpretPublicCatalog,
  isUnfilteredCatalog,
  readCatalogSearch,
  toApiSearchParams,
  toBrowserSearchParams,
} from "../lib/mart-api/catalog-query.ts";

const published = {
  id: "11111111-1111-4111-8111-111111111111",
  slug: "night-upload-check",
  title: "Night upload check",
  subtitle: "API row",
  category: "gadgets",
  price: 500,
  compare_at_price: 700,
  unit_label: "",
  image_src: "/media/night.jpg",
  image_alt: "Night upload check",
  badge: null,
  status: "available",
  featured: false,
};

test("published names are kept, seed rows are dropped", () => {
  const parsed = interpretPublicCatalog({
    items: [
      published,
      {
        id: "sunset-lamp",
        slug: "sunset-rainbow-projection-lamp",
        title: "সানসেট প্রজেকশন ল্যাম্প",
        subtitle: "seed",
        category: "gadgets",
        price: 999,
        status: "available",
      },
      { id: "not-a-card" },
    ],
    total: 3,
    page: 1,
    pages: 1,
    category_counts: { gadgets: 2, fashion: 0 },
    availability_counts: { available: 2, sold_out: 0, coming_soon: 0 },
  });
  if (parsed === null) throw new Error("expected a catalog");
  assert.equal(parsed.items.length, 1);
  assert.equal(parsed.items[0]?.title, "Night upload check");
  assert.equal(parsed.items[0]?.compareAtPrice, 700);
});

test("an unpublished row and a failed body are not a catalog", () => {
  const hidden = interpretPublicCatalog({
    items: [{ ...published, published: false }],
    total: 1,
    page: 1,
    pages: 1,
  });
  if (hidden === null) throw new Error("expected a catalog");
  assert.deepEqual(hidden.items, []);
  assert.equal(interpretPublicCatalog(null), null);
  assert.equal(interpretPublicCatalog({ error: "down" }), null);
});

test("an empty catalog is empty, not a fallback list", () => {
  const parsed = interpretPublicCatalog({
    items: [],
    total: 0,
    page: 1,
    pages: 0,
  });
  if (parsed === null) throw new Error("expected a catalog");
  assert.deepEqual(parsed.items, []);
  assert.equal(parsed.total, 0);
});

test("a malformed catalog body is not a product list", () => {
  assert.equal(interpretPublicCatalog(null), null);
  assert.equal(interpretPublicCatalog({ items: "nope" }), null);
  assert.equal(interpretPublicCatalog([]), null);
});

test("invalid query params fall back safely", () => {
  const search = readCatalogSearch({
    category: "Not A Slug!",
    sort: "<script>",
    view: "nope",
    page: "0",
    status: "hacked,available",
    min_price: "-5",
    max_price: "1000",
    q: "  lamp\u0000  ",
  });
  assert.equal(search.category, undefined);
  assert.equal(search.sort, "popularity");
  assert.equal(search.view, undefined);
  assert.equal(search.page, 1);
  assert.deepEqual(search.statuses, ["available"]);
  assert.equal(search.minPrice, null);
  assert.equal(search.maxPrice, 1000);
  assert.equal(search.q, "lamp");
  assert.equal(isUnfilteredCatalog(search), false);
});

test("any well-formed category slug is kept, so new categories need no code change", () => {
  assert.equal(readCatalogSearch({ category: "bed-heaters" }).category, "bed-heaters");
  assert.equal(readCatalogSearch({ category: "gadgets" }).category, "gadgets");
  assert.equal(readCatalogSearch({ category: "a/b" }).category, undefined);
  assert.equal(readCatalogSearch({ category: "" }).category, undefined);
});

test("the default catalog query is shareable without extra params", () => {
  const search = readCatalogSearch({});
  assert.equal(isUnfilteredCatalog(search), true);
  assert.equal(catalogHref(search), "/products");
  assert.deepEqual(search.statuses, ["available", "sold-out"]);
});

test("the public catalog request is one products page and carries no money", () => {
  const search = readCatalogSearch({ category: "fashion", sort: "price-asc" });
  const params = toApiSearchParams(search, { page: 2, pageSize: 12 });
  const path = `/api/v1/products?${params}`;
  assert.equal(path.startsWith("/api/v1/products?"), true);
  assert.equal(path.includes("/admin"), false);
  assert.equal(params.get("category"), "fashion");
  assert.equal(params.get("sort"), "price-asc");
  assert.equal(params.get("page"), "2");
  assert.equal(params.get("page_size"), "12");
  assert.equal(params.get("status"), "available,sold-out");
  for (const key of [
    "price",
    "subtotal",
    "total",
    "discount",
    "authorization",
  ]) {
    assert.equal(params.has(key), false);
  }
});

test("clearing every stock filter is explicit and matches nothing by itself", () => {
  const search = readCatalogSearch({ status: "none" });
  assert.deepEqual(search.statuses, []);
  assert.equal(catalogHref(search).includes("status=none"), true);
});

test("the typed query is cleaned and sent to the API, not matched in the browser", () => {
  const search = readCatalogSearch({ q: "  লাল \n  শার্ট\u0000 " + "x".repeat(200) });
  assert.equal(search.q.startsWith("লাল শার্ট x"), true);
  assert.equal(search.q.length, CATALOG_SEARCH_MAX_CHARS);
  const params = toApiSearchParams(search, { page: 2, pageSize: 12 });
  assert.equal(params.get("q"), search.q);
  assert.equal(params.get("page"), "2");
  assert.equal(toApiSearchParams(readCatalogSearch({}), { page: 1, pageSize: 12 }).has("q"), false);
  assert.equal(toBrowserSearchParams(search).get("q"), search.q);
});
