import assert from "node:assert/strict";
import test from "node:test";

import { splitTrendingRow, TRENDING_ROW_KEY } from "@/lib/mart-api/showcase-trending";

test("splitTrendingRow takes the Trending row out of the showcase", () => {
  const trending = { key: TRENDING_ROW_KEY, productIds: ["a"] };
  const fashion = { key: "fashion", productIds: ["b"] };
  const { trending: picked, rest } = splitTrendingRow({ rows: [trending, fashion] });
  assert.equal(picked, trending);
  assert.deepEqual(rest, { rows: [fashion] });
});

test("splitTrendingRow handles a missing section or Trending-only showcase", () => {
  assert.deepEqual(splitTrendingRow(null), { trending: null, rest: null });
  const only = { key: TRENDING_ROW_KEY };
  assert.deepEqual(splitTrendingRow({ rows: [only] }), { trending: only, rest: null });
  const other = { key: "fashion" };
  assert.deepEqual(splitTrendingRow({ rows: [other] }), { trending: null, rest: { rows: [other] } });
});
