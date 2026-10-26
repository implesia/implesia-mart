/**
 * Builds the nested category tree shared by the storefront menu and the admin editor.
 *
 * Input is the flat tile list in display order (the API's sort order). Rules:
 * - Siblings keep the input order.
 * - A tile whose parent is missing (deleted, or filtered out by the API) becomes a root.
 * - Hidden tiles (isActive === false) are dropped together with their whole subtree
 *   when `includeHidden` is false, so a hidden branch never resurfaces as roots.
 * - Cycles (a → b → a) cannot be rendered as a tree: the first tile of the cycle
 *   reached in input order is promoted to a root, which breaks the loop. Every tile
 *   appears at most once.
 */

export type CategoryTreeInput = {
  id: string;
  parentId?: string | null;
  isActive?: boolean;
};

export type CategoryNode<T extends CategoryTreeInput> = {
  item: T;
  depth: number;
  children: CategoryNode<T>[];
};

export function buildCategoryTree<T extends CategoryTreeInput>(
  items: readonly T[],
  { includeHidden = false }: { includeHidden?: boolean } = {},
): CategoryNode<T>[] {
  const byId = new Map<string, T>();
  for (const item of items) if (!byId.has(item.id)) byId.set(item.id, item);

  // Effective parent per tile: null for roots, orphans and cycle breakers.
  const parentOf = new Map<string, string | null>();
  for (const item of byId.values()) {
    const parentId = item.parentId ?? null;
    parentOf.set(item.id, parentId && parentId !== item.id && byId.has(parentId) ? parentId : null);
  }
  for (const item of byId.values()) {
    const seen = new Set<string>();
    let current: string | null = item.id;
    while (current !== null) {
      if (seen.has(current)) {
        parentOf.set(current, null);
        break;
      }
      seen.add(current);
      current = parentOf.get(current) ?? null;
    }
  }

  const childrenOf = new Map<string | null, T[]>();
  for (const item of byId.values()) {
    const key = parentOf.get(item.id) ?? null;
    const list = childrenOf.get(key);
    if (list) list.push(item);
    else childrenOf.set(key, [item]);
  }

  const build = (parentId: string | null, depth: number): CategoryNode<T>[] =>
    (childrenOf.get(parentId) ?? [])
      .filter((item) => includeHidden || item.isActive !== false)
      .map((item) => ({ item, depth, children: build(item.id, depth + 1) }));

  return build(null, 0);
}

/** Depth-first list of nodes, parents before children, siblings in order. */
export function flattenCategoryTree<T extends CategoryTreeInput>(
  nodes: readonly CategoryNode<T>[],
): CategoryNode<T>[] {
  const out: CategoryNode<T>[] = [];
  const walk = (list: readonly CategoryNode<T>[]) => {
    for (const node of list) {
      out.push(node);
      walk(node.children);
    }
  };
  walk(nodes);
  return out;
}

/** The tile and every descendant: options a parent picker must not offer. */
export function selfAndDescendantIds(
  items: readonly CategoryTreeInput[],
  id: string,
): Set<string> {
  const blocked = new Set<string>([id]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const item of items) {
      if (item.parentId && blocked.has(item.parentId) && !blocked.has(item.id)) {
        blocked.add(item.id);
        grew = true;
      }
    }
  }
  return blocked;
}

/**
 * Moves a tile one step among its siblings and returns the full id order to send to
 * the reorder endpoint (depth-first, so the stored order matches the tree).
 */
export function moveAmongSiblings<T extends CategoryTreeInput>(
  items: readonly T[],
  id: string,
  direction: -1 | 1,
): string[] | null {
  const tree = buildCategoryTree(items, { includeHidden: true });
  const swap = (list: CategoryNode<T>[]): boolean => {
    const index = list.findIndex((node) => node.item.id === id);
    if (index >= 0) {
      const target = index + direction;
      if (target < 0 || target >= list.length) return false;
      const [node] = list.splice(index, 1);
      if (!node) return false;
      list.splice(target, 0, node);
      return true;
    }
    return list.some((node) => swap(node.children));
  };
  if (!swap(tree)) return null;
  return flattenCategoryTree(tree).map((node) => node.item.id);
}

/**
 * Admin writes reject unknown fields. parent_id is only sent when it carries information
 * (a parent is set, or an existing parent is being cleared), so a backend without category
 * nesting keeps accepting ordinary top-level saves.
 */
export function parentIdField(
  parentId: string | null,
  previousParentId: string | null = null,
): { parent_id?: string | null } {
  if (parentId) return { parent_id: parentId };
  if (previousParentId) return { parent_id: null };
  return {};
}

/** Node of `GET /api/v1/categories/tree` (already nested, visible categories only). */
export type ApiTreeNode = {
  id: string;
  slug: string;
  name: string;
  description?: string;
  image_src?: string;
  depth?: number;
  product_count?: number;
  children?: ApiTreeNode[];
};

export type FlatTreeItem = {
  id: string;
  parentId: string | null;
  slug: string;
  name: string;
  description: string;
  imageSrc: string;
  depth: number;
  productCount: number;
};

/**
 * Flattens the nested public tree depth-first (parents first, siblings in API order) into
 * the parent-pointer shape used by `buildCategoryTree`. A node id seen twice is kept once, so
 * a malformed response can never loop or duplicate rows.
 */
export function flattenApiTree(nodes: readonly ApiTreeNode[], parentId: string | null = null): FlatTreeItem[] {
  const out: FlatTreeItem[] = [];
  const seen = new Set<string>();
  const walk = (list: readonly ApiTreeNode[], parent: string | null, depth: number) => {
    for (const node of list) {
      if (seen.has(node.id)) continue;
      seen.add(node.id);
      out.push({
        id: node.id,
        parentId: parent,
        slug: node.slug,
        name: node.name,
        description: node.description ?? "",
        imageSrc: node.image_src ?? "",
        depth: node.depth ?? depth,
        productCount: node.product_count ?? 0,
      });
      walk(node.children ?? [], node.id, depth + 1);
    }
  };
  walk(nodes, parentId, 1);
  return out;
}

/** Order payload for the reorder endpoint: the siblings of one parent after a move. */
export function siblingOrder<T extends CategoryTreeInput>(
  items: readonly T[],
  id: string,
  direction: -1 | 1,
): { parentId: string | null; ids: string[] } | null {
  const target = items.find((item) => item.id === id);
  if (!target) return null;
  const parentId = target.parentId ?? null;
  const ids = items.filter((item) => (item.parentId ?? null) === parentId).map((item) => item.id);
  const from = ids.indexOf(id);
  const to = from + direction;
  if (from < 0 || to < 0 || to >= ids.length) return null;
  const [moved] = ids.splice(from, 1);
  if (!moved) return null;
  ids.splice(to, 0, moved);
  return { parentId, ids };
}

/** Same as `siblingOrder` for a drag: put `dragId` where `targetId` is (same parent only). */
export function dropOrder<T extends CategoryTreeInput>(
  items: readonly T[],
  dragId: string,
  targetId: string,
): { parentId: string | null; ids: string[] } | null {
  const dragged = items.find((item) => item.id === dragId);
  const target = items.find((item) => item.id === targetId);
  if (!dragged || !target || dragId === targetId) return null;
  const parentId = dragged.parentId ?? null;
  if (parentId !== (target.parentId ?? null)) return null;
  const ids = items.filter((item) => (item.parentId ?? null) === parentId).map((item) => item.id);
  const from = ids.indexOf(dragId);
  const to = ids.indexOf(targetId);
  ids.splice(to, 0, ...ids.splice(from, 1));
  return { parentId, ids };
}

/** Text filter for the admin tree: keeps matches plus their ancestors so the path stays readable. */
export function filterCategoryRows<T extends CategoryTreeInput & { label?: string; slug?: string }>(
  rows: readonly CategoryNode<T>[],
  query: string,
): CategoryNode<T>[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [...rows];
  const byId = new Map(rows.map((row) => [row.item.id, row]));
  const keep = new Set<string>();
  for (const row of rows) {
    const hay = `${row.item.label ?? ""} ${row.item.slug ?? ""}`.toLowerCase();
    if (!hay.includes(needle)) continue;
    let cursor: T | undefined = row.item;
    const guard = new Set<string>();
    while (cursor && !guard.has(cursor.id)) {
      guard.add(cursor.id);
      keep.add(cursor.id);
      cursor = cursor.parentId ? byId.get(cursor.parentId)?.item : undefined;
    }
  }
  return rows.filter((row) => keep.has(row.item.id));
}

export type BranchRow<T> = { item: T; depth: number; active: boolean };

/**
 * Rows for the listing page's category list: every top-level category, plus the children of
 * each category on the path to `activeSlug` (so the open branch is expanded and the rest stay
 * collapsed). Unknown slugs show only the top level.
 */
export function categoryBranch<T extends CategoryTreeInput & { slug: string }>(
  items: readonly T[],
  activeSlug?: string | null,
): BranchRow<T>[] {
  const tree = buildCategoryTree(items);
  const open = new Set<string>();
  if (activeSlug) {
    const byId = new Map(items.map((item) => [item.id, item]));
    let cursor = items.find((item) => item.slug === activeSlug);
    while (cursor && !open.has(cursor.id)) {
      open.add(cursor.id);
      cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined;
    }
  }
  const rows: BranchRow<T>[] = [];
  const walk = (nodes: readonly CategoryNode<T>[], depth: number) => {
    for (const node of nodes) {
      rows.push({ item: node.item, depth, active: node.item.slug === activeSlug });
      if (open.has(node.item.id)) walk(node.children, depth + 1);
    }
  };
  walk(tree, 0);
  return rows;
}

/** Chips for narrow screens: the children of the active category, else its siblings, else the roots. */
export function categoryChips<T extends CategoryTreeInput & { slug: string }>(
  items: readonly T[],
  activeSlug?: string | null,
): T[] {
  const visible = items.filter((item) => item.isActive !== false);
  const active = activeSlug ? visible.find((item) => item.slug === activeSlug) : undefined;
  if (!active) return visible.filter((item) => !item.parentId);
  const children = visible.filter((item) => item.parentId === active.id);
  if (children.length > 0) return children;
  return visible.filter((item) => (item.parentId ?? null) === (active.parentId ?? null));
}

/** Root-to-node chain for a slug (empty when the slug is not in the list). */
export function categoryTrail<T extends CategoryTreeInput & { slug: string }>(
  items: readonly T[],
  slug: string,
): T[] {
  const byId = new Map(items.map((item) => [item.id, item]));
  const trail: T[] = [];
  const seen = new Set<string>();
  let cursor = items.find((item) => item.slug === slug);
  while (cursor && !seen.has(cursor.id)) {
    seen.add(cursor.id);
    trail.unshift(cursor);
    cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined;
  }
  return trail;
}

export type CascadeLevel<T> = {
  /** Parent whose children this select lists; null for the first (top-level) select. */
  parentId: string | null;
  options: T[];
  /** The option chosen at this level ("" when none). */
  value: string;
};

/**
 * Parent > child > grandchild selects for a product form. One level per node on the path to
 * `selectedId`, plus one more level when the selected node has children (so the editor can
 * go deeper, or stop: a product may sit at any level).
 */
export function cascadeLevels<T extends CategoryTreeInput>(
  items: readonly T[],
  selectedId: string | null | undefined,
): CascadeLevel<T>[] {
  const byId = new Map(items.map((item) => [item.id, item]));
  const path: T[] = [];
  const seen = new Set<string>();
  let cursor = selectedId ? byId.get(selectedId) : undefined;
  while (cursor && !seen.has(cursor.id)) {
    seen.add(cursor.id);
    path.unshift(cursor);
    cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined;
  }
  const childrenOf = (parentId: string | null) =>
    items.filter((item) => (item.parentId ?? null) === parentId);
  const levels: CascadeLevel<T>[] = [
    { parentId: null, options: childrenOf(null), value: path[0]?.id ?? "" },
  ];
  path.forEach((node, index) => {
    const options = childrenOf(node.id);
    if (options.length > 0) levels.push({ parentId: node.id, options, value: path[index + 1]?.id ?? "" });
  });
  return levels;
}

/** New selection after a select changes: picking nothing falls back to that level's parent. */
export function cascadeSelect(parentId: string | null, value: string): string {
  return value || parentId || "";
}

/** Deepest level the API allows (root = level 1); mirrors the backend `MAX_DEPTH`. */
export const MAX_CATEGORY_DEPTH = 6;

export type ParentChoice = {
  id: string;
  label: string;
  /** 0 for a top-level category; used to indent the option. */
  depth: number;
  hidden: boolean;
  /** True when a child of this category would exceed `MAX_CATEGORY_DEPTH`. */
  disabled: boolean;
};

/** Every category as a parent option, parents first, deeper levels indented. */
export function parentChoices<T extends CategoryTreeInput & { label: string }>(
  items: readonly T[],
  maxDepth: number = MAX_CATEGORY_DEPTH,
): ParentChoice[] {
  return flattenCategoryTree(buildCategoryTree(items, { includeHidden: true })).map(
    ({ item, depth }) => ({
      id: item.id,
      label: item.label.trim() || "Untitled category",
      depth,
      hidden: item.isActive === false,
      disabled: depth + 1 >= maxDepth,
    }),
  );
}

/** The parent a new category starts under: the category being viewed when it can hold a child. */
export function defaultParentId(choices: readonly ParentChoice[], selectedId: string): string {
  const match = choices.find((choice) => choice.id === selectedId);
  return match && !match.disabled ? match.id : "";
}
