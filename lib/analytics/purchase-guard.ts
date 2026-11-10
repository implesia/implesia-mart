const STORAGE_KEY = "implesia.analytics.purchases.v1";
const MAX_REMEMBERED = 100;

export type PurchaseMemory = Set<string>;
export type PurchaseStorage = Pick<Storage, "getItem" | "setItem">;

function readSeen(storage: PurchaseStorage | undefined): string[] {
  if (!storage) return [];
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string" && item.length > 0);
  } catch {
    return [];
  }
}

function writeSeen(storage: PurchaseStorage | undefined, seen: string[]) {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(seen.slice(-MAX_REMEMBERED)));
  } catch {
    /* Private mode or a full disk: the in-memory set still blocks this page. */
  }
}

/**
 * Returns true the first time this order number is tracked.
 * `memory` blocks a second call in the same page (including React strict mode).
 * `storage` blocks a refresh, back navigation, or a later visit.
 */
export function claimPurchase(
  orderNumber: string,
  storage: PurchaseStorage | undefined,
  memory: PurchaseMemory,
): boolean {
  const key = orderNumber.trim();
  if (!key) return false;
  if (memory.has(key)) return false;
  const seen = readSeen(storage);
  if (seen.includes(key)) {
    memory.add(key);
    return false;
  }
  memory.add(key);
  writeSeen(storage, [...seen, key]);
  return true;
}
