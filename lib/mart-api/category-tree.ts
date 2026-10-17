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
