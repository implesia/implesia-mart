import assert from "node:assert/strict";
import test from "node:test";

import {
  bulkDeleteMessage,
  parseBulkDeleteResult,
  selectAllState,
} from "../lib/mart-api/product-bulk-delete.ts";

test("reads the API result and names the count", () => {
  const result = parseBulkDeleteResult({
    requested: 3,
    deleted: 3,
    deleted_ids: ["a", "b", "c"],
    skipped: [],
    failed: [],
  });
  assert.deepEqual(result.deletedIds, ["a", "b", "c"]);
  assert.equal(bulkDeleteMessage(result), "3 products deleted");
});

test("mentions skipped and failed products", () => {
  const result = parseBulkDeleteResult({
    requested: 4,
    deleted: 1,
    deleted_ids: ["a"],
    skipped: [{ id: "b", reason: "not_found", message: "Product not found" }],
    failed: [
      { id: "c", reason: "error", message: "The product could not be deleted" },
      { id: "d", reason: "error", message: "The product could not be deleted" },
    ],
  });
  assert.equal(
    bulkDeleteMessage(result),
    "1 product deleted · 1 skipped (already removed) · 2 could not be deleted",
  );
});

test("a malformed body reads as nothing deleted", () => {
  const result = parseBulkDeleteResult(null);
  assert.equal(result.deleted, 0);
  assert.deepEqual(result.skipped, []);
});

test("select-all state follows the current page only", () => {
  const rows = ["a", "b", "c"];
  assert.equal(selectAllState(rows, new Set()), "none");
  assert.equal(selectAllState(rows, new Set(["a", "z"])), "some");
  assert.equal(selectAllState(rows, new Set(rows)), "all");
  assert.equal(selectAllState([], new Set(["a"])), "none");
});
