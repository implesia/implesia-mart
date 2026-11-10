/**
 * Stand-in for `GET /api/v1/admin/orders/new` until that route answers.
 * Items are newest first. With `since` set, only `created_at` > since is
 * returned. `now` is the clock passed in (or the current time) and is the
 * next cursor. Nothing here is shown on the storefront.
 */

import {
  clampLimit,
  isOrderId,
  isOrderPaymentMethod,
  sortNewest,
  type NewOrderNotice,
  type NewOrdersPage,
} from "@/lib/admin/order-alerts";

let book: NewOrderNotice[] = [];
const listeners = new Set<() => void>();

export function resetMockNewOrders() {
  book = [];
  listeners.clear();
}

export function pushMockNewOrder(order: NewOrderNotice) {
  if (!isOrderId(order.id) || !isOrderPaymentMethod(order.paymentMethod)) return;
  book = [order, ...book.filter((item) => item.id !== order.id)];
  for (const listener of [...listeners]) listener();
}

export function subscribeMockNewOrders(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function mockNewOrders(input: { since: string | null; limit?: number; now?: Date }): NewOrdersPage {
  const now = input.now ?? new Date();
  const sinceMs =
    input.since && !Number.isNaN(Date.parse(input.since)) ? Date.parse(input.since) : null;
  const items = sortNewest(book).filter((item) => {
    if (sinceMs == null) return true;
    const created = Date.parse(item.createdAt);
    return !Number.isNaN(created) && created > sinceMs;
  });
  return {
    now: now.toISOString(),
    items: items.slice(0, clampLimit(input.limit ?? 20)),
  };
}

/** One sample order for `?orderAlertDemo=1` while the live route is missing. */
export function createDemoNewOrder(now = new Date()): NewOrderNotice {
  const suffix = 24000 + Math.floor(Math.random() * 900);
  return {
    id: crypto.randomUUID(),
    number: `IM-${suffix}`,
    customerName: "Nusrat Jahan",
    total: 2450,
    paymentMethod: "cod",
    createdAt: now.toISOString(),
  };
}
