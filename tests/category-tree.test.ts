import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildCategoryTree,
  flattenCategoryTree,
  moveAmongSiblings,
  selfAndDescendantIds,
} from "@/lib/mart-api/category-tree";

type Tile = { id: string; parentId?: string | null; isActive?: boolean };

const ids = (nodes: ReturnType<typeof buildCategoryTree<Tile>>): unknown =>
  nodes.map((node) =>
    node.children.length ? [node.item.id, ids(node.children)] : node.item.id,
  );

test("nests to any depth and keeps sibling order", () => {
  const tiles: Tile[] = [
    { id: "a" },
    { id: "a2", parentId: "a" },
    { id: "b" },
    { id: "a1", parentId: "a" },
    { id: "a1x", parentId: "a1" },
    { id: "a1xy", parentId: "a1x" },
  ];
  assert.deepEqual(ids(buildCategoryTree(tiles)), [
    ["a", ["a2", ["a1", [["a1x", ["a1xy"]]]]]],
    "b",
  ]);
  const depths = flattenCategoryTree(buildCategoryTree(tiles)).map((n) => `${n.item.id}:${n.depth}`);
  assert.deepEqual(depths, ["a:0", "a2:1", "a1:1", "a1x:2", "a1xy:3", "b:0"]);
});

test("orphans become roots", () => {
  const tiles: Tile[] = [{ id: "x", parentId: "gone" }, { id: "y" }];
  assert.deepEqual(ids(buildCategoryTree(tiles)), ["x", "y"]);
});

test("self-parent and cycles are broken without losing or duplicating tiles", () => {
  const tiles: Tile[] = [
    { id: "s", parentId: "s" },
    { id: "a", parentId: "c" },
    { id: "b", parentId: "a" },
    { id: "c", parentId: "b" },
  ];
  const flat = flattenCategoryTree(buildCategoryTree(tiles)).map((n) => n.item.id);
  assert.equal(new Set(flat).size, 4);
  assert.equal(flat.length, 4);
  assert.ok(buildCategoryTree(tiles).some((n) => n.item.id === "s"));
});

test("hidden tiles drop with their subtree unless includeHidden", () => {
  const tiles: Tile[] = [
    { id: "h", isActive: false },
    { id: "h1", parentId: "h" },
    { id: "v" },
    { id: "v1", parentId: "v", isActive: false },
  ];
  assert.deepEqual(ids(buildCategoryTree(tiles)), ["v"]);
  assert.deepEqual(ids(buildCategoryTree(tiles, { includeHidden: true })), [
    ["h", ["h1"]],
    ["v", ["v1"]],
  ]);
});

test("empty input gives an empty tree", () => {
  assert.deepEqual(buildCategoryTree([]), []);
});

test("parent picker excludes self and every descendant", () => {
  const tiles: Tile[] = [
    { id: "a" },
    { id: "b", parentId: "a" },
    { id: "c", parentId: "b" },
    { id: "d" },
  ];
  assert.deepEqual([...selfAndDescendantIds(tiles, "a")].sort(), ["a", "b", "c"]);
  assert.deepEqual([...selfAndDescendantIds(tiles, "d")], ["d"]);
});

test("moving among siblings returns a depth-first order", () => {
  const tiles: Tile[] = [
    { id: "a" },
    { id: "a1", parentId: "a" },
    { id: "a2", parentId: "a" },
    { id: "b" },
  ];
  assert.deepEqual(moveAmongSiblings(tiles, "a2", -1), ["a", "a2", "a1", "b"]);
  assert.deepEqual(moveAmongSiblings(tiles, "b", -1), ["b", "a", "a1", "a2"]);
  assert.equal(moveAmongSiblings(tiles, "a1", -1), null);
});

test("parent_id is omitted unless set or being cleared (old backends forbid extra fields)", async () => {
  const { parentIdField } = await import("@/lib/mart-api/category-tree");
  assert.deepEqual(parentIdField(null), {});
  assert.deepEqual(parentIdField(null, null), {});
  assert.deepEqual(parentIdField("p1"), { parent_id: "p1" });
  assert.deepEqual(parentIdField(null, "p0"), { parent_id: null });
});
