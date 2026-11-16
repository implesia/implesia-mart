/**
 * Admin new-order alerts. Pure helpers (no fetch, no DOM) so tests can run
 * them under node:test. The signed-in shell polls
 * `GET /api/v1/admin/orders/new` and keeps read state in localStorage.
 *
 * One tab is the leader (localStorage lock + heartbeat). A visible tab takes
 * the lock from a hidden leader so the open tab polls about every 25s. Hidden
 * tabs wait 3 minutes. `now` from the response is the next `since` cursor.
 * Orders with `created_at` equal to `since` are not new (`created_at > since`).
 */

export const ORDER_ALERTS_CHANNEL = "implesia-admin-order-alerts";
export const ORDER_ALERTS_STATE_KEY = "implesia.admin.order-alerts.v1";
export const ORDER_ALERTS_SETTINGS_KEY = "implesia.admin.order-alerts.settings.v1";
export const ORDER_ALERTS_LEADER_KEY = "implesia.admin.order-alerts.leader.v1";
export const ORDER_ALERTS_CLAIMS_KEY = "implesia.admin.order-alerts.claims.v1";

/** Synthesized two-tone chime. See public/sounds/new-order.mp3. */
export const NEW_ORDER_SOUND_SRC = "/sounds/new-order.mp3";

export const VISIBLE_POLL_MS = 25_000;
export const HIDDEN_POLL_MS = 3 * 60_000;
export const MAX_POLL_MS = 5 * 60_000;
export const LEADER_STALE_MS = 10_000;
export const HEARTBEAT_MS = 3_000;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 50;
export const RECENT_CAP = 20;
export const ALERTED_CAP = 200;

const DHAKA = "Asia/Dhaka";
const TITLE_PREFIX = /^\(\d+\+?\)\s+/;

export type NotificationPermissionState = "granted" | "denied" | "default" | "unsupported";

/** `OrderRead` id. Backend PR #14: a UUID string. */
export type OrderId = string;

/** Backend PR #14: only these two values. */
export type OrderPaymentMethod = "cod" | "bangla_qr";

const ORDER_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isOrderId(value: string): value is OrderId {
  return ORDER_ID_PATTERN.test(value);
}

export function isOrderPaymentMethod(value: unknown): value is OrderPaymentMethod {
  return value === "cod" || value === "bangla_qr";
}

export type NewOrderNotice = {
  id: OrderId;
  number: string;
  customerName: string;
  total: number;
  paymentMethod: OrderPaymentMethod;
  createdAt: string;
};

export type NewOrdersPage = {
  now: string;
  items: NewOrderNotice[];
};

export type AlertSettings = {
  soundEnabled: boolean;
  /** 0 to 1. */
  volume: number;
};

export type AlertSnapshot = {
  /** ISO `now` from the last successful poll. Null until the first response. */
  cursor: string | null;
  recent: NewOrderNotice[];
  unreadIds: string[];
  alertedIds: string[];
};

export type LeaderLock = {
  id: string;
  beat: number;
  hidden: boolean;
};

export type KeyValueStore = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export const DEFAULT_ALERT_SETTINGS: AlertSettings = {
  soundEnabled: true,
  volume: 0.8,
};

export function emptyAlertSnapshot(): AlertSnapshot {
  return { cursor: null, recent: [], unreadIds: [], alertedIds: [] };
}

export function shouldWatchOrders(pathname: string) {
  return pathname.startsWith("/admin") && pathname !== "/admin/login";
}

/** Same path the orders list uses: `/admin/orders/<uuid>`. */
export function orderAlertHref(orderId: OrderId) {
  return `/admin/orders/${encodeURIComponent(orderId)}`;
}

export function clampLimit(limit: number) {
  if (!Number.isFinite(limit)) return DEFAULT_LIMIT;
  return Math.min(MAX_LIMIT, Math.max(1, Math.round(limit)));
}

export function clampVolume(value: number) {
  if (!Number.isFinite(value)) return DEFAULT_ALERT_SETTINGS.volume;
  return Math.min(1, Math.max(0, Math.round(value * 100) / 100));
}

/** `GET /api/v1/admin/orders/new?since=&limit=`. `since` is omitted on the first poll. */
export function newOrdersPath(since: string | null, limit = DEFAULT_LIMIT) {
  const params = new URLSearchParams();
  if (since && !Number.isNaN(Date.parse(since))) params.set("since", since);
  params.set("limit", String(clampLimit(limit)));
  return `/api/v1/admin/orders/new?${params.toString()}`;
}

/**
 * 404/501, or a 5xx/network failure before any live response, means the route
 * is not mounted yet. A later 5xx on a live route stays an error (backoff).
 * 401 (anonymous or not staff) and 422 (limit outside 1..50) are never a mock.
 */
export function shouldUseOrderAlertsMock(status: number, mode: "unknown" | "live" | "mock") {
  if (status === 401 || status === 422) return false;
  if (mode === "mock") return true;
  if (status === 404 || status === 501) return true;
  return mode === "unknown" && status >= 500;
}

export function formatAlertTaka(value: number) {
  if (!Number.isFinite(value)) return "৳0";
  return `৳${Math.round(value).toLocaleString("en-US")}`;
}

export function paymentLabel(method: OrderPaymentMethod) {
  return method === "bangla_qr" ? "Bangla QR" : "Cash on delivery";
}

export function permissionLabel(permission: NotificationPermissionState) {
  return permission;
}

export function badgeLabel(count: number) {
  if (count <= 0) return "";
  return count > 99 ? "99+" : String(count);
}

export function unreadCount(snapshot: AlertSnapshot) {
  return snapshot.unreadIds.length;
}

/** `(3) Dashboard | Implesia Mart`. A count of 0 removes a previous prefix. */
export function formatTabTitle(baseTitle: string, count: number) {
  const base = baseTitle.replace(TITLE_PREFIX, "");
  if (count <= 0) return base;
  return `(${badgeLabel(count)}) ${base}`;
}

export function announceNewOrders(orders: NewOrderNotice[]) {
  if (orders.length === 0) return "";
  const parts = orders.map((order) => `${order.number}, ${formatAlertTaka(order.total)}`);
  if (orders.length === 1) return `New order ${parts[0]}`;
  return `${orders.length} new orders. ${parts.join(". ")}`;
}

export function pollDelayMs(input: { hidden: boolean; failures: number }) {
  const base = input.hidden ? HIDDEN_POLL_MS : VISIBLE_POLL_MS;
  const failures = Number.isFinite(input.failures) ? Math.max(0, Math.floor(input.failures)) : 0;
  if (failures <= 0) return base;
  const delay = base * 2 ** failures;
  return Math.min(delay, MAX_POLL_MS);
}

export function shouldPlaySound(settings: Pick<AlertSettings, "soundEnabled">, claimedCount: number) {
  return settings.soundEnabled && claimedCount > 0;
}

export function shouldShowNotification(permission: NotificationPermissionState, claimedCount: number) {
  return permission === "granted" && claimedCount > 0;
}

export function alertPlan(input: {
  claimedIds: string[];
  soundEnabled: boolean;
  permission: NotificationPermissionState;
}) {
  return {
    sound: shouldPlaySound({ soundEnabled: input.soundEnabled }, input.claimedIds.length),
    notification: shouldShowNotification(input.permission, input.claimedIds.length),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function readTotal(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return null;
}

export function parseNewOrderNotice(value: unknown): NewOrderNotice | null {
  if (!isRecord(value)) return null;
  const id = readString(value.id);
  const number = readString(value.number);
  const createdAt = readString(value.created_at);
  const total = readTotal(value.total);
  if (!isOrderId(id) || !number || !createdAt || Number.isNaN(Date.parse(createdAt)) || total == null) return null;
  if (!isOrderPaymentMethod(value.payment_method)) return null;
  const customerName = readString(value.customer_name) || "Customer";
  return { id, number, customerName, total, paymentMethod: value.payment_method, createdAt };
}

export function parseNewOrdersPage(value: unknown): NewOrdersPage | null {
  if (!isRecord(value)) return null;
  const now = readString(value.now);
  if (!now || Number.isNaN(Date.parse(now)) || !Array.isArray(value.items)) return null;
  const items: NewOrderNotice[] = [];
  for (const raw of value.items) {
    const item = parseNewOrderNotice(raw);
    if (item) items.push(item);
  }
  return { now, items: sortNewest(items) };
}

export function sortNewest(items: NewOrderNotice[]) {
  return [...items].sort((a, b) => {
    const delta = Date.parse(b.createdAt) - Date.parse(a.createdAt);
    if (delta !== 0 && !Number.isNaN(delta)) return delta;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
}

function mergeRecent(incoming: NewOrderNotice[], existing: NewOrderNotice[]) {
  const map = new Map<string, NewOrderNotice>();
  for (const item of [...incoming, ...existing]) {
    if (!map.has(item.id)) map.set(item.id, item);
  }
  return sortNewest([...map.values()]).slice(0, RECENT_CAP);
}

export function rememberAlerted(existing: string[], extra: string[], cap = ALERTED_CAP) {
  const seen = new Set<string>();
  const merged: string[] = [];
  for (const id of [...extra, ...existing]) {
    if (!id || seen.has(id)) continue;
    seen.add(id);
    merged.push(id);
  }
  return merged.slice(0, cap);
}

/**
 * Fold one poll into the snapshot.
 * The first response (no cursor yet) is a baseline: those orders are stored
 * and not marked unread, so opening the admin does not toast the history.
 * Later responses keep items with `created_at` > cursor. The cursor becomes
 * `page.now`.
 */
export function applyPoll(snapshot: AlertSnapshot, page: NewOrdersPage): {
  snapshot: AlertSnapshot;
  fresh: NewOrderNotice[];
} {
  const cursorMs = snapshot.cursor == null ? null : Date.parse(snapshot.cursor);
  const known = new Set([...snapshot.recent.map((item) => item.id), ...snapshot.alertedIds]);
  const eligible = sortNewest(
    page.items.filter((item) => {
      const created = Date.parse(item.createdAt);
      if (Number.isNaN(created)) return false;
      if (cursorMs != null && !(created > cursorMs)) return false;
      return true;
    }),
  );

  if (cursorMs == null || Number.isNaN(cursorMs)) {
    const recent = mergeRecent(eligible, snapshot.recent);
    return {
      snapshot: {
        cursor: page.now,
        recent,
        unreadIds: snapshot.unreadIds.filter((id) => recent.some((item) => item.id === id)),
        alertedIds: rememberAlerted(snapshot.alertedIds, eligible.map((item) => item.id)),
      },
      fresh: [],
    };
  }

  const fresh = eligible.filter((item) => !known.has(item.id));
  const recent = mergeRecent(fresh, snapshot.recent);
  const unreadIds = rememberAlerted(
    snapshot.unreadIds,
    fresh.map((item) => item.id),
    RECENT_CAP,
  ).filter((id) => recent.some((item) => item.id === id));

  return {
    snapshot: {
      cursor: page.now,
      recent,
      unreadIds,
      alertedIds: snapshot.alertedIds,
    },
    fresh,
  };
}

export function markAllRead(snapshot: AlertSnapshot): AlertSnapshot {
  return { ...snapshot, unreadIds: [] };
}

function parseOrder(value: unknown): NewOrderNotice | null {
  if (!isRecord(value)) return null;
  const id = readString(value.id);
  const number = readString(value.number);
  const createdAt = readString(value.createdAt);
  const total = readTotal(value.total);
  if (!isOrderId(id) || !number || !createdAt || Number.isNaN(Date.parse(createdAt)) || total == null) return null;
  if (!isOrderPaymentMethod(value.paymentMethod)) return null;
  return {
    id,
    number,
    customerName: readString(value.customerName) || "Customer",
    total,
    paymentMethod: value.paymentMethod,
    createdAt,
  };
}

export function parseAlertSnapshot(raw: string | null): AlertSnapshot {
  if (!raw) return emptyAlertSnapshot();
  try {
    const body = JSON.parse(raw) as unknown;
    if (!isRecord(body)) return emptyAlertSnapshot();
    const recent: NewOrderNotice[] = [];
    if (Array.isArray(body.recent)) {
      for (const item of body.recent) {
        const order = parseOrder(item);
        if (order) recent.push(order);
      }
    }
    const ids = (value: unknown) =>
      Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.length > 0) : [];
    const cursor = readString(body.cursor);
    return {
      cursor: cursor && !Number.isNaN(Date.parse(cursor)) ? cursor : null,
      recent: sortNewest(recent).slice(0, RECENT_CAP),
      unreadIds: ids(body.unreadIds),
      alertedIds: ids(body.alertedIds).slice(0, ALERTED_CAP),
    };
  } catch {
    return emptyAlertSnapshot();
  }
}

export function loadAlertSnapshot(store: KeyValueStore) {
  return parseAlertSnapshot(store.getItem(ORDER_ALERTS_STATE_KEY));
}

export function saveAlertSnapshot(store: KeyValueStore, snapshot: AlertSnapshot) {
  store.setItem(ORDER_ALERTS_STATE_KEY, JSON.stringify(snapshot));
  return snapshot;
}

export function parseAlertSettings(raw: string | null): AlertSettings {
  if (!raw) return { ...DEFAULT_ALERT_SETTINGS };
  try {
    const body = JSON.parse(raw) as unknown;
    if (!isRecord(body)) return { ...DEFAULT_ALERT_SETTINGS };
    return {
      soundEnabled: typeof body.soundEnabled === "boolean" ? body.soundEnabled : DEFAULT_ALERT_SETTINGS.soundEnabled,
      volume: typeof body.volume === "number" ? clampVolume(body.volume) : DEFAULT_ALERT_SETTINGS.volume,
    };
  } catch {
    return { ...DEFAULT_ALERT_SETTINGS };
  }
}

export function loadAlertSettings(store: KeyValueStore) {
  return parseAlertSettings(store.getItem(ORDER_ALERTS_SETTINGS_KEY));
}

export function saveAlertSettings(store: KeyValueStore, settings: AlertSettings) {
  const next = {
    soundEnabled: settings.soundEnabled,
    volume: clampVolume(settings.volume),
  };
  store.setItem(ORDER_ALERTS_SETTINGS_KEY, JSON.stringify(next));
  return next;
}

export function readLeader(store: KeyValueStore): LeaderLock | null {
  const raw = store.getItem(ORDER_ALERTS_LEADER_KEY);
  if (!raw) return null;
  try {
    const body = JSON.parse(raw) as unknown;
    if (!isRecord(body)) return null;
    const id = readString(body.id);
    const beat = body.beat;
    if (!id || typeof beat !== "number" || !Number.isFinite(beat)) return null;
    return { id, beat, hidden: body.hidden === true };
  } catch {
    return null;
  }
}

/**
 * Become the leader when there is no lock, the lock is stale, this tab
 * already holds it (heartbeat), or this tab is visible and the leader is
 * hidden. The read-back means a tab that lost the write does not keep polling.
 */
export function electLeader(store: KeyValueStore, tabId: string, now: number, hidden: boolean) {
  const current = readLeader(store);
  const mine = current?.id === tabId;
  const stale = !current || now - current.beat > LEADER_STALE_MS;
  const takeFromHidden = Boolean(current && current.hidden && !hidden && !mine);
  if (!mine && !stale && !takeFromHidden) return false;
  const next: LeaderLock = { id: tabId, beat: now, hidden };
  store.setItem(ORDER_ALERTS_LEADER_KEY, JSON.stringify(next));
  return readLeader(store)?.id === tabId;
}

export function releaseLeader(store: KeyValueStore, tabId: string) {
  const current = readLeader(store);
  if (current?.id === tabId) store.removeItem(ORDER_ALERTS_LEADER_KEY);
}

function readClaims(store: KeyValueStore): Record<string, string> {
  const raw = store.getItem(ORDER_ALERTS_CLAIMS_KEY);
  if (!raw) return {};
  try {
    const body = JSON.parse(raw) as unknown;
    if (!isRecord(body)) return {};
    const claims: Record<string, string> = {};
    for (const [id, tab] of Object.entries(body)) {
      if (typeof tab === "string" && id) claims[id] = tab;
    }
    return claims;
  } catch {
    return {};
  }
}

/**
 * Claim the sound and the browser notification for these orders.
 * A second tab (or a second poll) gets an empty list for an id already claimed.
 */
export function claimOrders(store: KeyValueStore, orderIds: string[], tabId: string) {
  const claims = readClaims(store);
  const claimed: string[] = [];
  for (const id of orderIds) {
    if (!id || claims[id]) continue;
    claims[id] = tabId;
    claimed.push(id);
  }
  if (claimed.length === 0) return [];
  const keys = Object.keys(claims);
  if (keys.length > ALERTED_CAP) {
    for (const key of keys.slice(0, keys.length - ALERTED_CAP)) {
      if (!claimed.includes(key)) delete claims[key];
    }
  }
  store.setItem(ORDER_ALERTS_CLAIMS_KEY, JSON.stringify(claims));
  const after = readClaims(store);
  return claimed.filter((id) => after[id] === tabId);
}

function dhakaDayParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: DHAKA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return { year: read("year"), month: read("month"), day: read("day") };
}

function dhakaDayKey(date: Date) {
  const parts = dhakaDayParts(date);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Relative time, with the calendar day taken in Asia/Dhaka. */
export function relativeTimeDhaka(iso: string, now: Date) {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return "—";
  const delta = now.getTime() - then.getTime();
  if (delta < 45_000) return "just now";
  const minutes = Math.floor(delta / 60_000);
  if (minutes < 60) {
    const shown = Math.max(1, minutes);
    return shown === 1 ? "1 min ago" : `${shown} min ago`;
  }
  const thenKey = dhakaDayKey(then);
  const nowKey = dhakaDayKey(now);
  if (thenKey === nowKey) {
    const hours = Math.max(1, Math.floor(delta / 3_600_000));
    return hours === 1 ? "1 hr ago" : `${hours} hr ago`;
  }
  const yesterdayKey = dhakaDayKey(new Date(now.getTime() - 24 * 60 * 60 * 1000));
  if (thenKey === yesterdayKey) return "yesterday";
  const thenParts = dhakaDayParts(then);
  const nowParts = dhakaDayParts(now);
  const month = SHORT_MONTHS[Number(thenParts.month) - 1] ?? "";
  const day = String(Number(thenParts.day));
  if (!month || day === "NaN") return "—";
  if (thenParts.year !== nowParts.year) return `${day} ${month} ${thenParts.year}`;
  return `${day} ${month}`;
}
