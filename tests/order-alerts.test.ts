import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_ALERT_SETTINGS,
  HIDDEN_POLL_MS,
  LEADER_STALE_MS,
  VISIBLE_POLL_MS,
  alertPlan,
  applyPoll,
  badgeLabel,
  claimOrders,
  electLeader,
  emptyAlertSnapshot,
  formatAlertTaka,
  formatTabTitle,
  loadAlertSettings,
  loadAlertSnapshot,
  markAllRead,
  newOrdersPath,
  orderAlertHref,
  parseNewOrdersPage,
  pollDelayMs,
  relativeTimeDhaka,
  releaseLeader,
  saveAlertSettings,
  saveAlertSnapshot,
  shouldUseOrderAlertsMock,
  shouldWatchOrders,
  unreadCount,
  type KeyValueStore,
  type NewOrderNotice,
  type NewOrdersPage,
} from "@/lib/admin/order-alerts";
import { mockNewOrders, pushMockNewOrder, resetMockNewOrders } from "@/lib/mart-mock/order-alerts";

function memoryStore(): KeyValueStore {
  const data = new Map<string, string>();
  return {
    getItem: (key) => (data.has(key) ? data.get(key)! : null),
    setItem: (key, value) => {
      data.set(key, value);
    },
    removeItem: (key) => {
      data.delete(key);
    },
  };
}

const ID = {
  old: "11111111-1111-4111-8111-111111111111",
  edge: "22222222-2222-4222-8222-222222222222",
  fresh: "33333333-3333-4333-8333-333333333333",
  newer: "44444444-4444-4444-8444-444444444444",
  early: "55555555-5555-4555-8555-555555555555",
  late: "66666666-6666-4666-8666-666666666666",
  later: "77777777-7777-4777-8777-777777777777",
} as const;

function order(overrides: Partial<NewOrderNotice> = {}): NewOrderNotice {
  return {
    id: ID.fresh,
    number: "IM-1001",
    customerName: "Nusrat Jahan",
    total: 2450,
    paymentMethod: "cod",
    createdAt: "2026-11-10T06:00:00.000Z",
    ...overrides,
  };
}

function page(now: string, items: NewOrderNotice[]): NewOrdersPage {
  return { now, items };
}

test("polling keeps only orders created after the cursor and advances to now", () => {
  const older = order({ id: ID.old, number: "IM-1000", createdAt: "2026-11-10T05:00:00.000Z", total: 500 });
  const atCursor = order({ id: ID.edge, number: "IM-1001", createdAt: "2026-11-10T06:00:00.000Z", total: 800 });
  const newer = order({ id: ID.fresh, number: "IM-1002", createdAt: "2026-11-10T06:30:00.000Z", total: 2450 });
  const newest = order({
    id: ID.newer,
    number: "IM-1003",
    createdAt: "2026-11-10T06:40:00.000Z",
    total: 1250000,
    paymentMethod: "bangla_qr",
  });

  const baseline = applyPoll(emptyAlertSnapshot(), page("2026-11-10T06:00:00.000Z", [older]));
  assert.equal(baseline.fresh.length, 0);
  assert.equal(baseline.snapshot.cursor, "2026-11-10T06:00:00.000Z");
  assert.equal(unreadCount(baseline.snapshot), 0);

  const next = applyPoll(
    baseline.snapshot,
    page("2026-11-10T06:45:00.000Z", [older, atCursor, newer, newest]),
  );
  assert.deepEqual(
    next.fresh.map((item) => item.id),
    [ID.newer, ID.fresh],
  );
  assert.deepEqual(
    next.snapshot.recent.map((item) => item.id),
    [ID.newer, ID.fresh, ID.old],
  );
  assert.equal(next.snapshot.cursor, "2026-11-10T06:45:00.000Z");
  assert.equal(unreadCount(next.snapshot), 2);
  assert.equal(badgeLabel(unreadCount(next.snapshot)), "2");
  assert.equal(formatTabTitle("Dashboard | Implesia Mart", unreadCount(next.snapshot)), "(2) Dashboard | Implesia Mart");

  const again = applyPoll(next.snapshot, page("2026-11-10T06:50:00.000Z", [newest, newer]));
  assert.equal(again.fresh.length, 0);
  assert.equal(again.snapshot.cursor, "2026-11-10T06:50:00.000Z");
  assert.equal(unreadCount(again.snapshot), 2);
});

test("the wire payload is newest-first and drops a row that is not an order", () => {
  const parsed = parseNewOrdersPage({
    now: "2026-11-10T07:00:00.000Z",
    items: [
      {
        id: ID.old,
        number: "IM-1",
        customer_name: "A",
        total: 100,
        payment_method: "cod",
        created_at: "2026-11-10T06:00:00.000Z",
      },
      { id: "not-a-uuid", number: "IM-0", customer_name: "Z", total: 1, payment_method: "cod", created_at: "2026-11-10T06:10:00.000Z" },
      {
        id: ID.fresh,
        number: "IM-9",
        customer_name: "C",
        total: 10,
        payment_method: "card",
        created_at: "2026-11-10T06:20:00.000Z",
      },
      {
        id: ID.newer,
        number: "IM-2",
        customer_name: "B",
        total: 2400,
        payment_method: "bangla_qr",
        created_at: "2026-11-10T06:30:00.000Z",
      },
    ],
  });
  assert.ok(parsed);
  assert.deepEqual(
    parsed.items.map((item) => item.id),
    [ID.newer, ID.old],
  );
  assert.equal(parsed.items[0]?.paymentMethod, "bangla_qr");
  assert.equal(parsed.items[0]?.total, 2400);
  assert.equal(newOrdersPath(null, 20), "/api/v1/admin/orders/new?limit=20");
  assert.equal(newOrdersPath(null, 0), "/api/v1/admin/orders/new?limit=1");
  assert.equal(
    newOrdersPath("2026-11-10T06:00:00.000Z", 80),
    "/api/v1/admin/orders/new?since=2026-11-10T06%3A00%3A00.000Z&limit=50",
  );
  assert.equal(orderAlertHref(ID.fresh), `/admin/orders/${ID.fresh}`);
  assert.equal(shouldWatchOrders("/admin/login"), false);
  assert.equal(shouldWatchOrders("/admin/orders"), true);
  assert.equal(shouldWatchOrders("/checkout"), false);
});

test("a hidden tab waits minutes and errors back off; a visible tab stays near 25s", () => {
  const visible = pollDelayMs({ hidden: false, failures: 0 });
  const hidden = pollDelayMs({ hidden: true, failures: 0 });
  assert.equal(visible, VISIBLE_POLL_MS);
  assert.ok(visible >= 20_000 && visible <= 30_000);
  assert.equal(hidden, HIDDEN_POLL_MS);
  assert.ok(hidden >= 2 * 60_000 && hidden <= 5 * 60_000);
  assert.ok(pollDelayMs({ hidden: false, failures: 1 }) > visible);
  assert.ok(pollDelayMs({ hidden: false, failures: 8 }) <= 5 * 60_000);
  assert.equal(shouldUseOrderAlertsMock(404, "unknown"), true);
  assert.equal(shouldUseOrderAlertsMock(500, "unknown"), true);
  assert.equal(shouldUseOrderAlertsMock(500, "live"), false);
  assert.equal(shouldUseOrderAlertsMock(401, "unknown"), false);
  assert.equal(shouldUseOrderAlertsMock(401, "live"), false);
  assert.equal(shouldUseOrderAlertsMock(422, "unknown"), false);
  assert.equal(shouldUseOrderAlertsMock(422, "mock"), false);
});

test("only one tab is the leader, and a visible tab takes over from a hidden one", () => {
  const store = memoryStore();
  assert.equal(electLeader(store, "tab-a", 1_000, false), true);
  assert.equal(electLeader(store, "tab-b", 2_000, false), false);
  assert.equal(electLeader(store, "tab-a", 3_000, true), true);
  assert.equal(electLeader(store, "tab-b", 4_000, false), true);
  assert.equal(electLeader(store, "tab-a", 5_000, true), false);
  releaseLeader(store, "tab-b");
  assert.equal(electLeader(store, "tab-a", 6_000, false), true);
  assert.equal(electLeader(store, "tab-b", 6_000 + LEADER_STALE_MS + 1, false), true);
  assert.equal(electLeader(store, "tab-a", 6_000 + LEADER_STALE_MS + 2, false), false);
});

test("unread badge and title clear on mark all read, and the list stays", () => {
  const first = applyPoll(emptyAlertSnapshot(), page("2026-11-10T06:00:00.000Z", []));
  const withOrder = applyPoll(
    first.snapshot,
    page("2026-11-10T06:05:00.000Z", [order({ total: 2450, createdAt: "2026-11-10T06:04:00.000Z" })]),
  );
  assert.equal(badgeLabel(unreadCount(withOrder.snapshot)), "1");
  assert.equal(formatTabTitle("(1) Orders | Implesia Mart", 4), "(4) Orders | Implesia Mart");
  assert.equal(badgeLabel(100), "99+");
  assert.equal(formatTabTitle("Admin", 100), "(99+) Admin");

  const read = markAllRead(withOrder.snapshot);
  assert.equal(unreadCount(read), 0);
  assert.equal(badgeLabel(unreadCount(read)), "");
  assert.equal(formatTabTitle("(1) Orders | Implesia Mart", 0), "Orders | Implesia Mart");
  assert.equal(read.recent.length, 1);
  assert.equal(read.cursor, withOrder.snapshot.cursor);

  const store = memoryStore();
  saveAlertSnapshot(store, read);
  assert.equal(loadAlertSnapshot(store).recent[0]?.number, "IM-1001");
  assert.equal(formatAlertTaka(2450), "৳2,450");
  assert.equal(formatAlertTaka(1250000), "৳1,250,000");
});

test("sound and notification settings persist, and a disabled sound or missing permission does not alert", () => {
  const store = memoryStore();
  assert.deepEqual(loadAlertSettings(store), DEFAULT_ALERT_SETTINGS);
  saveAlertSettings(store, { soundEnabled: false, volume: 0.35 });
  assert.deepEqual(loadAlertSettings(store), { soundEnabled: false, volume: 0.35 });
  saveAlertSettings(store, { soundEnabled: true, volume: 9 });
  assert.equal(loadAlertSettings(store).volume, 1);
  store.setItem("implesia.admin.order-alerts.settings.v1", "{");
  assert.deepEqual(loadAlertSettings(store), DEFAULT_ALERT_SETTINGS);

  const claimed = [ID.fresh];
  assert.deepEqual(alertPlan({ claimedIds: claimed, soundEnabled: false, permission: "granted" }), {
    sound: false,
    notification: true,
  });
  for (const permission of ["default", "denied", "unsupported"] as const) {
    assert.equal(alertPlan({ claimedIds: claimed, soundEnabled: true, permission }).notification, false);
  }
  assert.equal(alertPlan({ claimedIds: [], soundEnabled: true, permission: "granted" }).sound, false);
});

test("the same order is not alerted twice across tabs", () => {
  const store = memoryStore();
  const first = claimOrders(store, [ID.fresh, ID.newer], "tab-a");
  const second = claimOrders(store, [ID.fresh, ID.newer], "tab-b");
  const third = claimOrders(store, [ID.late], "tab-b");
  assert.deepEqual(first, [ID.fresh, ID.newer]);
  assert.deepEqual(second, []);
  assert.deepEqual(third, [ID.late]);
  assert.equal(alertPlan({ claimedIds: first, soundEnabled: true, permission: "granted" }).sound, true);
  assert.equal(alertPlan({ claimedIds: second, soundEnabled: true, permission: "granted" }).notification, false);
  assert.equal(alertPlan({ claimedIds: second, soundEnabled: true, permission: "granted" }).sound, false);
});

test("the mock returns only orders newer than since, newest first", () => {
  resetMockNewOrders();
  pushMockNewOrder(order({ id: ID.early, createdAt: "2026-11-10T05:00:00.000Z", number: "IM-1" }));
  const first = mockNewOrders({ since: null, now: new Date("2026-11-10T06:00:00.000Z") });
  assert.equal(first.now, "2026-11-10T06:00:00.000Z");
  assert.equal(first.items.length, 1);
  const second = mockNewOrders({ since: first.now, now: new Date("2026-11-10T06:05:00.000Z") });
  assert.equal(second.items.length, 0);
  pushMockNewOrder(order({ id: ID.late, createdAt: "2026-11-10T06:02:00.000Z", number: "IM-2", total: 900 }));
  pushMockNewOrder(order({ id: ID.later, createdAt: "2026-11-10T06:04:00.000Z", number: "IM-3", total: 1100 }));
  pushMockNewOrder(order({ id: "not-a-uuid", createdAt: "2026-11-10T06:04:30.000Z", number: "IM-X" }));
  const third = mockNewOrders({ since: first.now, limit: 1, now: new Date("2026-11-10T06:05:00.000Z") });
  assert.deepEqual(
    third.items.map((item) => item.id),
    [ID.later],
  );
  assert.equal(third.now, "2026-11-10T06:05:00.000Z");
  resetMockNewOrders();
});

test("relative times use the Asia/Dhaka calendar day", () => {
  const now = new Date("2026-11-10T08:00:00.000Z");
  assert.equal(relativeTimeDhaka("2026-11-10T07:59:30.000Z", now), "just now");
  assert.equal(relativeTimeDhaka("2026-11-10T07:55:00.000Z", now), "5 min ago");
  assert.equal(relativeTimeDhaka("2026-11-10T06:00:00.000Z", now), "2 hr ago");
  assert.equal(relativeTimeDhaka("2026-11-09T10:00:00.000Z", now), "yesterday");
  assert.equal(relativeTimeDhaka("2026-11-08T08:00:00.000Z", now), "8 Nov");
  assert.equal(relativeTimeDhaka("not-a-date", now), "—");
});
