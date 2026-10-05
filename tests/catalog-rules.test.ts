import assert from "node:assert/strict";
import test from "node:test";

import {
  isCatalogProductId,
  isPublicCatalogCard,
} from "../lib/mart-api/catalog-rules.ts";

test("catalog ids are uuids", () => {
  assert.equal(isCatalogProductId("11111111-1111-1111-1111-111111111111"), true);
  assert.equal(isCatalogProductId("sunset-lamp"), false);
});

test("seed rows are not public cards", () => {
  assert.equal(
    isPublicCatalogCard({
      id: "sunset-lamp",
      slug: "sunset-rainbow-projection-lamp",
      title: "সানসেট প্রজেকশন ল্যাম্প",
      price: 999,
    }),
    false,
  );
  assert.equal(
    isPublicCatalogCard({
      id: "11111111-1111-1111-1111-111111111111",
      slug: "real-lamp",
      title: "ল্যাম্প",
      price: 999,
    }),
    true,
  );
  assert.equal(
    isPublicCatalogCard({
      id: "11111111-1111-1111-1111-111111111111",
      slug: "",
      title: "ল্যাম্প",
      price: 999,
    }),
    false,
  );
});
