/**
 * Stand-in for the orders desk until `GET /api/v1/admin/orders/overview` answers.
 * Used only when `mockFallbackAllowed()` is true. Totals here are a local
 * estimate; the live API remains the source of money, stock, and status.
 */

import {
  ORDER_TRANSITIONS,
  normalizeBdPhone,
  paymentStatusOf,
  type AnyPaymentMethod,
  type CallStatus,
  type OfflineOrderInput,
  type OrderListQuery,
  type OrderOrigin,
  type PaymentStatus,
} from "@/lib/admin/orders-desk";
import type { MartOrder, MartOrderItem, OrderActivity, OrderDirectory } from "@/lib/mart-api/orders";
import type { OrderStatus } from "@/lib/mart-mock/store";

const STORAGE_KEY = "implesia.admin.orders-desk.v1";

type DeskState = {
  orders: MartOrder[];
  keys: Record<string, string>;
};

function emptyState(): DeskState {
  const now = new Date().toISOString();
  const sample = orderRecord({
    number: "IM-DEMO0001",
    origin: "online",
    status: "new",
    customerName: "Demo Customer",
    phone: "01700000000",
    district: "Dhaka",
    area: "Gulshan",
    address: "House 1, Road 2, Gulshan",
    items: [line("Desk lamp", 1, 1200)],
    shipping: 80,
    paymentMethod: "cod",
    paidAmount: 0,
    createdAt: now,
  });
  return { orders: [sample], keys: {} };
}

function line(title: string, quantity: number, unitPrice: number): MartOrderItem {
  return {
    id: crypto.randomUUID(),
    productId: null,
    variantId: null,
    sku: "",
    title,
    slug: "",
    imageSrc: "",
    unitPrice,
    quantity,
    lineTotal: unitPrice * quantity,
    selection: [],
    regularPrice: unitPrice,
    basePercent: null,
    quantityPercent: null,
    totalPercent: null,
  };
}

function orderRecord(input: {
  number: string;
  origin: OrderOrigin;
  status: OrderStatus;
  customerName: string;
  phone: string;
  district: string;
  area: string;
  address: string;
  items: MartOrderItem[];
  shipping: number;
  paymentMethod: AnyPaymentMethod;
  paidAmount: number;
  createdAt: string;
  notes?: string;
  manualDiscount?: number;
  orderedAt?: string | null;
}): MartOrder {
  const subtotal = input.items.reduce((sum, item) => sum + item.lineTotal, 0);
  const manualDiscount = input.manualDiscount ?? 0;
  const total = Math.max(0, subtotal - manualDiscount) + input.shipping;
  const paidAmount = input.paidAmount;
  return {
    id: crypto.randomUUID(),
    number: input.number,
    source: input.origin === "offline" ? "direct" : "cart",
    origin: input.origin,
    status: input.status,
    callStatus: "not_called",
    paymentMethod: input.paymentMethod,
    paymentStatus: paymentStatusOf(paidAmount, total),
    advancePercent: null,
    advanceAmount: paidAmount,
    dueAmount: Math.max(0, total - paidAmount),
    paymentReference: "",
    anonymous: true,
    customerName: input.customerName,
    phone: input.phone,
    email: "",
    district: input.district,
    area: input.area,
    address: input.address,
    notes: input.notes ?? "",
    deliveryZone: "inside",
    subtotal,
    shipping: input.shipping,
    total,
    couponCode: null,
    couponDiscount: null,
    manualDiscount,
    paidAmount,
    courierName: "",
    trackingNumber: "",
    printedAt: null,
    orderedAt: input.orderedAt ?? null,
    items: input.items,
    createdAt: input.createdAt,
    customerHistory: null,
    duplicateWarning: false,
    activity: [],
    deliveredAt: null,
    returnedAt: null,
    analyticsEventId: null,
    nextStatuses: [...ORDER_TRANSITIONS[input.status]],
  };
}

function readState(): DeskState {
  if (typeof window === "undefined") return emptyState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = emptyState();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw) as DeskState;
    if (!Array.isArray(parsed.orders)) return emptyState();
    return parsed;
  } catch {
    return emptyState();
  }
}

function writeState(state: DeskState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function refuse(message: string): never {
  const error = new Error(message);
  error.name = "OrdersDeskMockError";
  throw error;
}

function decorate(state: DeskState, order: MartOrder): MartOrder {
  const same = state.orders.filter((item) => item.phone === order.phone);
  const created = new Date(order.createdAt).getTime();
  const duplicateWarning = same.some((item) => {
    if (item.id === order.id) return false;
    const other = new Date(item.createdAt).getTime();
    return Math.abs(created - other) <= 24 * 60 * 60 * 1000;
  });
  return {
    ...order,
    nextStatuses: [...ORDER_TRANSITIONS[order.status]],
    duplicateWarning,
    customerHistory: {
      phone: order.phone,
      totalOrders: same.length,
      delivered: same.filter((item) => item.status === "delivered").length,
      returnedCancelled: same.filter((item) => item.status === "returned" || item.status === "cancelled").length,
    },
  };
}

function log(order: MartOrder, action: string, summary: string): MartOrder {
  const entry: OrderActivity = {
    id: crypto.randomUUID(),
    actorUserId: null,
    actorName: "Staff",
    action,
    summary,
    detail: {},
    createdAt: new Date().toISOString(),
  };
  return { ...order, activity: [entry, ...order.activity].slice(0, 100) };
}

function save(state: DeskState, order: MartOrder) {
  state.orders = state.orders.map((item) => (item.id === order.id ? order : item));
  writeState(state);
  return decorate(state, order);
}

export function mockOrdersOverview() {
  const state = readState();
  const orders = state.orders.map((order) => decorate(state, order));
  const counts = {
    new: 0,
    confirmed: 0,
    packed: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    returned: 0,
  };
  for (const order of orders) counts[order.status] += 1;
  const revenueOf = (rows: MartOrder[]) =>
    rows.reduce((sum, order) => sum + (order.status === "cancelled" || order.status === "returned" ? 0 : order.total), 0);
  const period = (rows: MartOrder[]) => ({ orders: rows.length, revenue: revenueOf(rows) });
  const online = orders.filter((order) => order.origin === "online");
  const offline = orders.filter((order) => order.origin === "offline");
  const decided = counts.delivered + counts.returned;
  return {
    timezone: "Asia/Dhaka" as const,
    today: period(orders),
    week: period(orders),
    month: period(orders),
    pendingConfirm: counts.new,
    readyToPack: counts.confirmed,
    shipped: counts.shipped,
    returnRatePercent: decided === 0 ? null : ((counts.returned / decided) * 100).toFixed(2),
    cancelRatePercent: orders.length === 0 ? null : ((counts.cancelled / orders.length) * 100).toFixed(2),
    origins: [
      { origin: "online" as const, orders: online.length, revenue: revenueOf(online) },
      { origin: "offline" as const, orders: offline.length, revenue: revenueOf(offline) },
    ],
    statusCounts: counts,
    recent: orders.slice(0, 8).map((order) => ({
      id: order.id,
      number: order.number,
      status: order.status,
      origin: order.origin,
      total: order.total,
      customerName: order.customerName,
      phone: order.phone,
      createdAt: order.createdAt,
      orderedAt: order.orderedAt,
    })),
  };
}

function matches(order: MartOrder, query: OrderListQuery) {
  if (query.status && order.status !== query.status) return false;
  if (query.origin && order.origin !== query.origin) return false;
  if (query.paymentMethod && order.paymentMethod !== query.paymentMethod) return false;
  if (query.paymentStatus && order.paymentStatus !== query.paymentStatus) return false;
  if (query.callStatus && order.callStatus !== query.callStatus) return false;
  if (query.courier?.trim() && !order.courierName.toLowerCase().includes(query.courier.trim().toLowerCase())) return false;
  if (query.scope === "transit" && !["confirmed", "packed", "shipped"].includes(order.status)) return false;
  const placed = (order.orderedAt ?? order.createdAt).slice(0, 10);
  if (query.dateFrom && placed < query.dateFrom) return false;
  if (query.dateTo && placed > query.dateTo) return false;
  const q = query.q?.trim().toLowerCase();
  if (q) {
    const haystack = [order.number, order.customerName, order.phone, order.address, ...order.items.map((item) => item.title)]
      .join(" ")
      .toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  return true;
}

export function mockListOrders(query: OrderListQuery): OrderDirectory {
  const state = readState();
  const decorated = state.orders.map((order) => decorate(state, order));
  const filtered = decorated.filter((order) => matches(order, { ...query, status: null, scope: "all" }));
  const statusCounts = {
    new: 0,
    confirmed: 0,
    packed: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    returned: 0,
  };
  for (const order of filtered) statusCounts[order.status] += 1;
  let rows = decorated.filter((order) => matches(order, query));
  rows = [...rows].sort((a, b) => {
    if (query.sort === "oldest") return a.createdAt.localeCompare(b.createdAt);
    if (query.sort === "high") return b.total - a.total;
    if (query.sort === "low") return a.total - b.total;
    return b.createdAt.localeCompare(a.createdAt);
  });
  const pageSize = query.pageSize ?? 20;
  const pages = Math.ceil(rows.length / pageSize);
  const page = query.page;
  const items = rows.slice((page - 1) * pageSize, page * pageSize).map((order) => ({ ...order, activity: [] }));
  const revenue = decorated.reduce(
    (sum, order) => sum + (order.status === "cancelled" || order.status === "returned" ? 0 : order.total),
    0,
  );
  return {
    items,
    total: rows.length,
    page,
    pages,
    pageSize,
    statusCounts,
    metrics: {
      orders: decorated.length,
      new: decorated.filter((order) => order.status === "new").length,
      confirmed: decorated.filter((order) => order.status === "confirmed").length,
      packed: decorated.filter((order) => order.status === "packed").length,
      shipped: decorated.filter((order) => order.status === "shipped").length,
      delivered: decorated.filter((order) => order.status === "delivered").length,
      cancelled: decorated.filter((order) => order.status === "cancelled").length,
      returned: decorated.filter((order) => order.status === "returned").length,
      inTransit: decorated.filter((order) => ["confirmed", "packed", "shipped"].includes(order.status)).length,
      revenue,
    },
  };
}

export function mockGetOrder(orderId: string) {
  const state = readState();
  const order = state.orders.find((item) => item.id === orderId);
  if (!order) refuse("Order not found");
  return decorate(state, order);
}

export function mockPatchOrder(
  orderId: string,
  patch: { status?: OrderStatus; callStatus?: CallStatus; courierName?: string; trackingNumber?: string; notes?: string },
) {
  const state = readState();
  const current = state.orders.find((item) => item.id === orderId);
  if (!current) refuse("Order not found");
  let next = current;
  if (patch.status && patch.status !== current.status) {
    const allowed = ORDER_TRANSITIONS[current.status];
    if (!allowed.includes(patch.status)) {
      refuse(`Cannot change an order from ${current.status} to ${patch.status}. Allowed: ${allowed.join(", ") || "none"}`);
    }
    next = {
      ...next,
      status: patch.status,
      deliveredAt: patch.status === "delivered" && !next.deliveredAt ? new Date().toISOString() : next.deliveredAt,
      returnedAt: patch.status === "returned" && !next.returnedAt ? new Date().toISOString() : next.returnedAt,
    };
    next = log(next, "status_changed", `Status ${current.status} to ${patch.status}`);
  }
  if (patch.callStatus && patch.callStatus !== current.callStatus) {
    next = log({ ...next, callStatus: patch.callStatus }, "call_status", `Call status ${patch.callStatus}`);
  }
  if (patch.courierName !== undefined || patch.trackingNumber !== undefined) {
    next = log(
      {
        ...next,
        courierName: patch.courierName ?? next.courierName,
        trackingNumber: patch.trackingNumber ?? next.trackingNumber,
      },
      "courier",
      "Courier updated",
    );
  }
  if (patch.notes !== undefined) next = log({ ...next, notes: patch.notes }, "note", "Note updated");
  return save(state, next);
}

export function mockCreateOffline(input: OfflineOrderInput, idempotencyKey: string) {
  const state = readState();
  const existing = state.keys[idempotencyKey];
  if (existing) {
    const found = state.orders.find((order) => order.id === existing);
    if (found) return decorate(state, found);
  }
  const phone = normalizeBdPhone(input.phone);
  if (!phone) refuse("Phone must be an 11-digit Bangladesh mobile number");
  const items = input.items.map((item) => line("Product", item.quantity, item.priceEdited ? item.unitPrice : item.unitPrice));
  const shipping = input.deliveryCharge ?? 80;
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const total = Math.max(0, subtotal - input.manualDiscount) + shipping;
  if (input.manualDiscount > subtotal) refuse("Discount is larger than the merchandise total");
  if (input.paidAmount > total) refuse("Paid amount cannot be larger than the order total");
  const order = log(
    orderRecord({
      number: `IM-${crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`,
      origin: "offline",
      status: "new",
      customerName: input.customerName.trim(),
      phone,
      district: input.district.trim(),
      area: input.area.trim(),
      address: input.address.trim(),
      notes: input.notes,
      items,
      shipping,
      manualDiscount: input.manualDiscount,
      paymentMethod: input.paymentMethod,
      paidAmount: input.paidAmount,
      createdAt: new Date().toISOString(),
      orderedAt: input.orderDate ? `${input.orderDate}T00:00:00+06:00` : new Date().toISOString(),
    }),
    "created",
    "Offline order entered",
  );
  state.orders = [order, ...state.orders];
  state.keys[idempotencyKey] = order.id;
  writeState(state);
  return decorate(state, order);
}

export function mockReplaceItems(
  orderId: string,
  input: { items: OfflineOrderInput["items"]; manualDiscount: number | null; deliveryCharge: number | null },
) {
  const state = readState();
  const current = state.orders.find((item) => item.id === orderId);
  if (!current) refuse("Order not found");
  if (current.status !== "new") refuse("Items can be edited only while the order is new");
  const items = input.items.map((item) =>
    line(current.items.find((row) => row.productId === item.productId)?.title || "Product", item.quantity, item.unitPrice),
  );
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const manualDiscount = input.manualDiscount ?? current.manualDiscount;
  const shipping = input.deliveryCharge ?? current.shipping;
  if (manualDiscount > subtotal) refuse("Discount is larger than the merchandise total");
  const total = Math.max(0, subtotal - manualDiscount) + shipping;
  if (current.paidAmount > total) refuse("Paid amount is larger than the new total");
  const next = log(
    {
      ...current,
      items,
      subtotal,
      manualDiscount,
      shipping,
      total,
      dueAmount: Math.max(0, total - current.paidAmount),
      paymentStatus: paymentStatusOf(current.paidAmount, total),
    },
    "items",
    "Items updated",
  );
  return save(state, next);
}

export function mockSearchCustomers(q: string) {
  const state = readState();
  const needle = q.trim().toLowerCase();
  const byPhone = new Map<string, MartOrder>();
  for (const order of state.orders) {
    const current = byPhone.get(order.phone);
    if (!current || order.createdAt > current.createdAt) byPhone.set(order.phone, order);
  }
  return [...byPhone.values()]
    .filter((order) => order.customerName.toLowerCase().includes(needle) || order.phone.includes(needle.replace(/\D/g, "") || needle))
    .slice(0, 20)
    .map((order) => ({
      phone: order.phone,
      customerName: order.customerName,
      email: order.email,
      district: order.district,
      area: order.area,
      address: order.address,
      orders: state.orders.filter((item) => item.phone === order.phone).length,
      lastOrderedAt: order.createdAt,
    }));
}

export function mockBulkStatus(status: OrderStatus, ids: string[]) {
  return ids.map((id) => {
    try {
      const saved = mockPatchOrder(id, { status });
      return { id, ok: true, status: saved.status, error: null as string | null };
    } catch (error) {
      return { id, ok: false, status: null, error: error instanceof Error ? error.message : "Could not update" };
    }
  });
}

export function mockMarkPrinted(ids: string[]) {
  const state = readState();
  const printed: string[] = [];
  const missing: string[] = [];
  for (const id of ids) {
    const order = state.orders.find((item) => item.id === id);
    if (!order) {
      missing.push(id);
      continue;
    }
    save(state, log({ ...order, printedAt: new Date().toISOString() }, "printed", "Printed"));
    printed.push(id);
  }
  return { printed, missing };
}

export function mockPrintData(ids: string[]) {
  const state = readState();
  const missing: string[] = [];
  const orders = [];
  for (const id of ids) {
    const order = state.orders.find((item) => item.id === id);
    if (!order) {
      missing.push(id);
      continue;
    }
    orders.push(toPrint(order));
  }
  return { orders, missing };
}

function toPrint(order: MartOrder) {
  return {
    id: order.id,
    number: order.number,
    status: order.status,
    origin: order.origin,
    orderedAt: order.orderedAt,
    createdAt: order.createdAt,
    customerName: order.customerName,
    phone: order.phone,
    district: order.district,
    area: order.area,
    address: order.address,
    notes: order.notes,
    courierName: order.courierName,
    trackingNumber: order.trackingNumber,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus as PaymentStatus,
    subtotal: order.subtotal,
    manualDiscount: order.manualDiscount,
    couponDiscount: order.couponDiscount,
    shipping: order.shipping,
    total: order.total,
    paidAmount: order.paidAmount,
    dueAmount: order.dueAmount,
    items: order.items.map((item) => ({
      title: item.title,
      sku: item.sku,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
      selection: item.selection.map((choice) => ({ name: choice.name, label: choice.label })),
    })),
  };
}

export function mockReadyToPack(query: OrderListQuery) {
  return mockListOrders({ ...query, status: "confirmed", scope: "all" });
}
