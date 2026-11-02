/** The most products one bulk delete may send. The API enforces the same cap. */
export const MAX_BULK_DELETE = 100;

export type BulkDeleteIssue = {
  id: string;
  reason: "not_found" | "error";
  message: string;
};

export type ProductBulkDeleteResult = {
  requested: number;
  deleted: number;
  deletedIds: string[];
  skipped: BulkDeleteIssue[];
  failed: BulkDeleteIssue[];
};

type Wire = {
  requested?: unknown;
  deleted?: unknown;
  deleted_ids?: unknown;
  skipped?: unknown;
  failed?: unknown;
};

function issues(value: unknown): BulkDeleteIssue[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is BulkDeleteIssue =>
      typeof item === "object" && item !== null && typeof item.id === "string",
  );
}

export function parseBulkDeleteResult(body: unknown): ProductBulkDeleteResult {
  const wire = (typeof body === "object" && body !== null ? body : {}) as Wire;
  const deletedIds = Array.isArray(wire.deleted_ids)
    ? wire.deleted_ids.filter((id): id is string => typeof id === "string")
    : [];
  return {
    requested: typeof wire.requested === "number" ? wire.requested : 0,
    deleted: typeof wire.deleted === "number" ? wire.deleted : deletedIds.length,
    deletedIds,
    skipped: issues(wire.skipped),
    failed: issues(wire.failed),
  };
}

function products(count: number) {
  return `${count} product${count === 1 ? "" : "s"}`;
}

/** The toast after a bulk delete: how many went, and why any were left. */
export function bulkDeleteMessage(result: ProductBulkDeleteResult): string {
  const parts = [`${products(result.deleted)} deleted`];
  if (result.skipped.length) {
    parts.push(`${result.skipped.length} skipped (already removed)`);
  }
  if (result.failed.length) {
    parts.push(`${result.failed.length} could not be deleted`);
  }
  return parts.join(" · ");
}

/** Header checkbox state for the rows on the current page. */
export function selectAllState(
  rowIds: readonly string[],
  selected: ReadonlySet<string>,
): "none" | "some" | "all" {
  const picked = rowIds.filter((id) => selected.has(id)).length;
  if (picked === 0) return "none";
  return picked === rowIds.length ? "all" : "some";
}
