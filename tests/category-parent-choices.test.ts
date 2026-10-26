import assert from "node:assert/strict";
import { test } from "node:test";

import {
  MAX_CATEGORY_DEPTH,
  defaultParentId,
  parentChoices,
} from "@/lib/mart-api/category-tree";

type Tile = { id: string; label: string; parentId?: string | null; isActive?: boolean };

const tiles: Tile[] = [
  { id: "a", label: "Gadgets" },
  { id: "b", label: "Fashion", isActive: false },
  { id: "a1", label: "Phones", parentId: "a" },
  { id: "a1x", label: "  ", parentId: "a1" },
];

test("lists every category parents first with depth, hidden flag and a fallback label", () => {
  const rows = parentChoices(tiles);
  assert.deepEqual(
    rows.map((row) => [row.id, row.depth, row.hidden, row.label]),
    [
      ["a", 0, false, "Gadgets"],
      ["a1", 1, false, "Phones"],
      ["a1x", 2, false, "Untitled category"],
      ["b", 0, true, "Fashion"],
    ],
  );
});

test("a category at the deepest level cannot take a child", () => {
  const chain: Tile[] = Array.from({ length: MAX_CATEGORY_DEPTH }, (_, index) => ({
    id: `n${index}`,
    label: `L${index + 1}`,
    parentId: index === 0 ? null : `n${index - 1}`,
  }));
  const rows = parentChoices(chain);
  assert.equal(rows.at(-1)?.disabled, true);
  assert.equal(rows.at(-2)?.disabled, false);
  assert.equal(parentChoices(tiles).some((row) => row.disabled), false);
});

test("the new category starts under the selected one when it can hold a child", () => {
  const rows = parentChoices(tiles);
  assert.equal(defaultParentId(rows, "a1"), "a1");
  assert.equal(defaultParentId(rows, ""), "");
  assert.equal(defaultParentId(rows, "missing"), "");
  const full = parentChoices(
    Array.from({ length: MAX_CATEGORY_DEPTH }, (_, index) => ({
      id: `n${index}`,
      label: `L${index}`,
      parentId: index === 0 ? null : `n${index - 1}`,
    })),
  );
  assert.equal(defaultParentId(full, `n${MAX_CATEGORY_DEPTH - 1}`), "");
});
