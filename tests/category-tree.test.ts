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

import {
  cascadeLevels,
  cascadeSelect,
  categoryBranch,
  categoryChips,
  categoryTrail,
  dropOrder,
  filterCategoryRows,
  flattenApiTree,
  parentIdField,
  siblingOrder,
} from "@/lib/mart-api/category-tree";

type Row = { id: string; parentId: string | null; slug: string; label: string; isActive?: boolean };
const rows: Row[] = [
  { id: "g", parentId: null, slug: "gadgets", label: "Gadgets" },
  { id: "sg", parentId: "g", slug: "smart-gadgets", label: "Smart Gadgets" },
  { id: "lamps", parentId: "sg", slug: "lamps", label: "Lamps" },
  { id: "f", parentId: null, slug: "fashion", label: "Fashion" },
  { id: "d", parentId: "f", slug: "dresses", label: "Dresses" },
  { id: "h", parentId: "f", slug: "hidden", label: "Hidden", isActive: false },
];

test("cascade shows a select per level and one more when the node has children", () => {
  const levels = cascadeLevels(rows, "lamps");
  assert.deepEqual(
    levels.map((level) => [level.parentId, level.value]),
    [
      [null, "g"],
      ["g", "sg"],
      ["sg", "lamps"],
    ],
  );
  assert.deepEqual(levels[0]?.options.map((row) => row.id), ["g", "f"]);
  // A parent with children offers the next select; a leaf does not.
  assert.equal(cascadeLevels(rows, "g").length, 2);
  assert.equal(cascadeLevels(rows, "g")[1]?.value, "");
  assert.equal(cascadeLevels(rows, "d").length, 2);
  assert.deepEqual(cascadeLevels(rows, ""), [{ parentId: null, options: rows.filter((r) => !r.parentId), value: "" }]);
});

test("clearing a select steps back to its parent, choosing sets the new node", () => {
  assert.equal(cascadeSelect("g", ""), "g");
  assert.equal(cascadeSelect(null, ""), "");
  assert.equal(cascadeSelect("sg", "lamps"), "lamps");
});

test("cascade survives an unknown id and a parent loop", () => {
  assert.equal(cascadeLevels(rows, "nope").length, 1);
  const loop: Row[] = [
    { id: "a", parentId: "b", slug: "a", label: "A" },
    { id: "b", parentId: "a", slug: "b", label: "B" },
  ];
  assert.ok(cascadeLevels(loop, "a").length <= 3);
});

test("sibling reorder sends only the siblings of one parent", () => {
  assert.deepEqual(siblingOrder(rows, "f", -1), { parentId: null, ids: ["f", "g"] });
  assert.deepEqual(siblingOrder(rows, "h", -1), { parentId: "f", ids: ["h", "d"] });
  assert.equal(siblingOrder(rows, "g", -1), null);
  assert.equal(siblingOrder(rows, "lamps", 1), null);
  assert.equal(siblingOrder(rows, "missing", 1), null);
});

test("drag and drop only reorders inside one parent", () => {
  assert.deepEqual(dropOrder(rows, "f", "g"), { parentId: null, ids: ["f", "g"] });
  assert.equal(dropOrder(rows, "d", "g"), null);
  assert.equal(dropOrder(rows, "g", "g"), null);
});

test("search keeps matches and their ancestors", () => {
  const tree = flattenCategoryTree(buildCategoryTree(rows, { includeHidden: true }));
  const shown = filterCategoryRows(tree, "lamp").map((row) => row.item.id);
  assert.deepEqual(shown, ["g", "sg", "lamps"]);
  assert.equal(filterCategoryRows(tree, "").length, tree.length);
  assert.deepEqual(filterCategoryRows(tree, "FASH").map((row) => row.item.id), ["f"]);
  assert.deepEqual(filterCategoryRows(tree, "zzz"), []);
});

test("the listing branch expands only the path to the active category", () => {
  const branch = categoryBranch(rows, "lamps").map((row) => [row.item.id, row.depth, row.active]);
  assert.deepEqual(branch, [
    ["g", 0, false],
    ["sg", 1, false],
    ["lamps", 2, true],
    ["f", 0, false],
  ]);
  assert.deepEqual(categoryBranch(rows, "nope").map((row) => row.item.id), ["g", "f"]);
});

test("chips show children, else siblings, else roots; hidden ones never appear", () => {
  assert.deepEqual(categoryChips(rows, "fashion").map((row) => row.id), ["d"]);
  assert.deepEqual(categoryChips(rows, "lamps").map((row) => row.id), ["lamps"]);
  assert.deepEqual(categoryChips(rows, null).map((row) => row.id), ["g", "f"]);
});

test("the trail runs from the root to the category", () => {
  assert.deepEqual(categoryTrail(rows, "lamps").map((row) => row.slug), ["gadgets", "smart-gadgets", "lamps"]);
  assert.deepEqual(categoryTrail(rows, "nope"), []);
});

test("the public tree flattens depth-first and drops duplicate ids", () => {
  const flat = flattenApiTree([
    {
      id: "a",
      slug: "a",
      name: "A",
      product_count: 3,
      children: [{ id: "b", slug: "b", name: "B", children: [{ id: "a", slug: "a", name: "loop" }] }],
    },
    { id: "c", slug: "c", name: "C" },
  ]);
  assert.deepEqual(
    flat.map((item) => [item.id, item.parentId, item.depth, item.productCount]),
    [
      ["a", null, 1, 3],
      ["b", "a", 2, 0],
      ["c", null, 1, 0],
    ],
  );
});

test("parent_id is sent only when it carries information", () => {
  assert.deepEqual(parentIdField(null), {});
  assert.deepEqual(parentIdField("x"), { parent_id: "x" });
  assert.deepEqual(parentIdField(null, "old"), { parent_id: null });
});
