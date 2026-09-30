import type { ProductCategoryId } from "@/app/(client)/_data/products/products";

import {
  formatTaka,
  orderGrandTotal,
  phoneDigits,
  type AdminProduct,
  type MockOrder,
  type OrderStatus,
  ORDER_STATUSES,
} from "./store";

export const DASHBOARD_RANGE_OPTIONS = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
  { id: "this-month", label: "This month" },
  { id: "last-month", label: "Last month" },
  { id: "custom", label: "Custom range" },
] as const;

export type DashboardRangeId = (typeof DASHBOARD_RANGE_OPTIONS)[number]["id"];

export type DashboardTrend = {
  direction: "up" | "down" | "flat" | "new";
  text: string;
};

export type DashboardPoint = {
  label: string;
  revenue: number;
  orders: number;
  previousRevenue: number;
};

export type DashboardStatusSlice = {
  status: OrderStatus;
  count: number;
  share: number;
};

export type DashboardSeller = {
  slug: string;
  title: string;
  imageSrc: string;
  category: string;
  units: number;
  revenue: number;
  stockLabel: string;
};

export type DashboardArea = {
  name: string;
  orders: number;
  revenue: number;
  share: number;
};

export type DashboardCategory = {
  id: ProductCategoryId;
  label: string;
  revenue: number;
  units: number;
  share: number;
};

export type DashboardSnapshot = {
  periodLabel: string;
  comparisonLabel: string;
  grainLabel: string;
  revenue: Metric;
  orders: Metric;
  customers: Metric;
  averageOrderValue: Metric;
  pending: Metric;
  delivered: Metric;
  series: DashboardPoint[];
  statuses: DashboardStatusSlice[];
  orderCount: number;
  bestSellers: DashboardSeller[];
  recent: MockOrder[];
  areas: DashboardArea[];
  categories: DashboardCategory[];
};

type Metric = {
  value: number;
  display: string;
  trend: DashboardTrend;
  sparkline: number[];
};

type Window = { from: Date; to: Date };

const CATEGORY_LABEL: Record<ProductCategoryId, string> = {
  gadgets: "Trending gadgets",
  fashion: "Gorgeous dresses",
};

const AREAS: { name: string; keys: string[] }[] = [
  { name: "Dhaka", keys: ["ঢাকা", "dhaka"] },
  { name: "Chattogram", keys: ["চট্টগ্রাম", "chattogram", "chittagong"] },
  { name: "Rajshahi", keys: ["রাজশাহী", "rajshahi"] },
  { name: "Khulna", keys: ["খুলনা", "khulna"] },
  { name: "Sylhet", keys: ["সিলেট", "sylhet"] },
  { name: "Barishal", keys: ["বরিশাল", "barishal", "barisal"] },
  { name: "Rangpur", keys: ["রংপুর", "rangpur"] },
  { name: "Mymensingh", keys: ["ময়মনসিংহ", "mymensingh"] },
  { name: "Gazipur", keys: ["গাজীপুর", "gazipur"] },
  { name: "Narayanganj", keys: ["নারায়ণগঞ্জ", "narayanganj"] },
  { name: "Cumilla", keys: ["কুমিল্লা", "cumilla", "comilla"] },
];

export function buildDashboard(input: {
  orders: MockOrder[];
  products: AdminProduct[];
  rangeId: DashboardRangeId;
  customFrom: string;
  customTo: string;
  now?: Date;
}): DashboardSnapshot {
  const now = input.now ?? new Date();
  const current = resolveWindow(input.rangeId, input.customFrom, input.customTo, now);
  const previous = previousWindow(current, input.rangeId, now);
  const grain = grainFor(current);
  const currentOrders = input.orders.filter((order) => inWindow(order, current));
  const previousOrders = input.orders.filter((order) => inWindow(order, previous));
  const series = buildSeries(input.orders, current, previous, grain, now);
  const sales = currentOrders.filter((order) => countsAsSale(order.status));
  const previousSales = previousOrders.filter((order) => countsAsSale(order.status));
  const revenue = sum(sales, orderGrandTotal);
  const previousRevenue = sum(previousSales, orderGrandTotal);
  const customers = uniqueCustomers(currentOrders);
  const previousCustomers = uniqueCustomers(previousOrders);
  const pending = currentOrders.filter((order) => order.status === "new").length;
  const previousPending = previousOrders.filter((order) => order.status === "new").length;
  const delivered = currentOrders.filter((order) => order.status === "delivered").length;
  const previousDelivered = previousOrders.filter((order) => order.status === "delivered").length;
  const average = sales.length === 0 ? 0 : Math.round(revenue / sales.length);
  const previousAverage = previousSales.length === 0 ? 0 : Math.round(previousRevenue / previousSales.length);

  return {
    periodLabel: formatSpan(current.from, current.to),
    comparisonLabel: `vs ${formatSpan(previous.from, previous.to)}`,
    grainLabel: grain === "hour" ? "Hourly" : grain === "week" ? "Weekly" : grain === "month" ? "Monthly" : "Daily",
    revenue: metric(revenue, formatTaka(revenue), previousRevenue, series.map((point) => point.revenue)),
    orders: metric(
      currentOrders.length,
      String(currentOrders.length),
      previousOrders.length,
      series.map((point) => point.orders),
    ),
    customers: metric(customers, String(customers), previousCustomers, []),
    averageOrderValue: metric(average, formatTaka(average), previousAverage, []),
    pending: metric(pending, String(pending), previousPending, []),
    delivered: metric(delivered, String(delivered), previousDelivered, []),
    series,
    statuses: statusSlices(currentOrders),
    orderCount: currentOrders.length,
    bestSellers: bestSellers(sales, input.products),
    recent: [...currentOrders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6),
    areas: areas(currentOrders),
    categories: categories(sales, input.products),
  };
}

export function formatCompactTaka(value: number) {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}৳${trimNumber(abs / 1_000_000)}M`;
  if (abs >= 10_000) return `${sign}৳${trimNumber(abs / 1_000)}K`;
  return formatTaka(value);
}

function metric(value: number, display: string, previous: number, sparkline: number[]): Metric {
  return { value, display, trend: trend(value, previous), sparkline };
}

function trend(current: number, previous: number): DashboardTrend {
  if (previous === 0 && current === 0) return { direction: "flat", text: "0%" };
  if (previous === 0) return { direction: "new", text: "New" };
  const percent = ((current - previous) / previous) * 100;
  const rounded = Math.round(percent * 10) / 10;
  if (Math.abs(rounded) < 0.05) return { direction: "flat", text: "0%" };
  const text = `${Math.abs(rounded).toLocaleString("en-US")}%`;
  return { direction: rounded > 0 ? "up" : "down", text };
}

function countsAsSale(status: OrderStatus) {
  return status !== "cancelled" && status !== "returned";
}

function inWindow(order: MockOrder, window: Window) {
  const time = new Date(order.createdAt).getTime();
  return time >= window.from.getTime() && time < window.to.getTime();
}

function sum(orders: MockOrder[], value: (order: MockOrder) => number) {
  return orders.reduce((total, order) => total + value(order), 0);
}

function uniqueCustomers(orders: MockOrder[]) {
  const seen = new Set<string>();
  for (const order of orders) {
    const digits = phoneDigits(order.phone);
    seen.add(digits.length >= 11 ? digits.slice(-11) : order.customerName.trim().toLowerCase());
  }
  return seen.size;
}

function resolveWindow(id: DashboardRangeId, customFrom: string, customTo: string, now: Date): Window {
  const today = startOfDay(now);
  if (id === "today") return { from: today, to: addDays(today, 1) };
  if (id === "yesterday") return { from: addDays(today, -1), to: today };
  if (id === "7d") return { from: addDays(today, -6), to: addDays(today, 1) };
  if (id === "30d") return { from: addDays(today, -29), to: addDays(today, 1) };
  if (id === "this-month") return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: addDays(today, 1) };
  if (id === "last-month") {
    return {
      from: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      to: new Date(now.getFullYear(), now.getMonth(), 1),
    };
  }
  const from = parseInputDate(customFrom);
  const to = parseInputDate(customTo);
  if (!from || !to) return { from: addDays(today, -6), to: addDays(today, 1) };
  const start = from <= to ? from : to;
  const end = from <= to ? to : from;
  return { from: start, to: addDays(end, 1) };
}

function previousWindow(current: Window, id: DashboardRangeId, now: Date): Window {
  if (id === "today") {
    const elapsed = Math.max(0, Math.min(now.getTime(), current.to.getTime()) - current.from.getTime());
    const from = addDays(current.from, -1);
    return { from, to: new Date(from.getTime() + elapsed) };
  }
  if (id === "this-month") {
    const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const elapsed = Math.max(0, Math.min(now.getTime(), current.to.getTime()) - current.from.getTime());
    const monthEnd = new Date(now.getFullYear(), now.getMonth(), 1);
    const to = new Date(Math.min(from.getTime() + elapsed, monthEnd.getTime()));
    return { from, to };
  }
  const duration = current.to.getTime() - current.from.getTime();
  return { from: new Date(current.from.getTime() - duration), to: current.from };
}

type Grain = "hour" | "day" | "week" | "month";

function grainFor(window: Window): Grain {
  const days = (window.to.getTime() - window.from.getTime()) / 86_400_000;
  if (days <= 2) return "hour";
  if (days <= 62) return "day";
  if (days <= 180) return "week";
  return "month";
}

function buildSeries(orders: MockOrder[], current: Window, previous: Window, grain: Grain, now: Date): DashboardPoint[] {
  const end = grain === "hour" && now >= current.from && now < current.to ? nextHour(now) : current.to;
  const buckets = bucketsBetween(current.from, end < current.from ? current.to : end, grain);
  return buckets.map((bucket, index) => {
    const currentOrders = orders.filter((order) => inWindow(order, bucket));
    const previousFrom = shiftBucket(previous.from, index, grain);
    const duration = bucket.to.getTime() - bucket.from.getTime();
    const previousOrders = orders.filter((order) =>
      inWindow(order, { from: previousFrom, to: new Date(previousFrom.getTime() + duration) }),
    );
    return {
      label: bucketLabel(bucket.from, grain),
      revenue: sum(currentOrders.filter((order) => countsAsSale(order.status)), orderGrandTotal),
      orders: currentOrders.length,
      previousRevenue: sum(previousOrders.filter((order) => countsAsSale(order.status)), orderGrandTotal),
    };
  });
}

function bucketsBetween(from: Date, to: Date, grain: Grain): Window[] {
  const buckets: Window[] = [];
  let cursor = grain === "hour" ? startOfHour(from) : grain === "month" ? new Date(from.getFullYear(), from.getMonth(), 1) : startOfDay(from);
  const limit = 400;
  while (cursor < to && buckets.length < limit) {
    const next = addStep(cursor, grain);
    buckets.push({ from: cursor < from ? from : cursor, to: next < to ? next : to });
    cursor = next;
  }
  return buckets.length > 0 ? buckets : [{ from, to }];
}

function shiftBucket(from: Date, index: number, grain: Grain) {
  if (grain === "hour") return new Date(from.getTime() + index * 3_600_000);
  if (grain === "week") return addDays(from, index * 7);
  if (grain === "month") return new Date(from.getFullYear(), from.getMonth() + index, 1);
  return addDays(from, index);
}

function addStep(date: Date, grain: Grain) {
  if (grain === "hour") return new Date(date.getTime() + 3_600_000);
  if (grain === "week") return addDays(date, 7);
  if (grain === "month") return new Date(date.getFullYear(), date.getMonth() + 1, 1);
  return addDays(date, 1);
}

function bucketLabel(date: Date, grain: Grain) {
  if (grain === "hour") {
    return new Intl.DateTimeFormat("en-US", { hour: "numeric" }).format(date);
  }
  if (grain === "month") {
    return new Intl.DateTimeFormat("en-US", { month: "short" }).format(date);
  }
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}

function statusSlices(orders: MockOrder[]): DashboardStatusSlice[] {
  const total = orders.length;
  return ORDER_STATUSES.map((status) => {
    const count = orders.filter((order) => order.status === status).length;
    return { status, count, share: total === 0 ? 0 : Math.round((count / total) * 1000) / 10 };
  });
}

function bestSellers(orders: MockOrder[], products: AdminProduct[]): DashboardSeller[] {
  const catalog = new Map(products.map((product) => [product.slug, product]));
  const rows = new Map<string, DashboardSeller>();
  for (const order of orders) {
    for (const item of order.items) {
      const product = catalog.get(item.slug);
      const current = rows.get(item.slug) ?? {
        slug: item.slug,
        title: product?.title || item.title,
        imageSrc: product?.imageSrc || item.imageSrc,
        category: product ? CATEGORY_LABEL[product.categoryId] : "Uncategorized",
        units: 0,
        revenue: 0,
        stockLabel: stockLabel(product),
      };
      current.units += item.quantity;
      current.revenue += item.unitPrice * item.quantity;
      rows.set(item.slug, current);
    }
  }
  return [...rows.values()].sort((a, b) => b.revenue - a.revenue || b.units - a.units).slice(0, 5);
}

function stockLabel(product: AdminProduct | undefined) {
  if (!product || product.status === "available") {
    if (product?.quantity != null) return `${product.quantity} in stock`;
    return "In stock";
  }
  if (product.status === "sold-out") return "Sold out";
  return "Coming soon";
}

function areas(orders: MockOrder[]): DashboardArea[] {
  const rows = new Map<string, DashboardArea>();
  for (const order of orders) {
    const name = areaName(order.address);
    const current = rows.get(name) ?? { name, orders: 0, revenue: 0, share: 0 };
    current.orders += 1;
    if (countsAsSale(order.status)) current.revenue += orderGrandTotal(order);
    rows.set(name, current);
  }
  const total = orders.length;
  return [...rows.values()]
    .map((row) => ({ ...row, share: total === 0 ? 0 : Math.round((row.orders / total) * 1000) / 10 }))
    .sort((a, b) => b.orders - a.orders || b.revenue - a.revenue)
    .slice(0, 6);
}

function categories(orders: MockOrder[], products: AdminProduct[]): DashboardCategory[] {
  const catalog = new Map(products.map((product) => [product.slug, product]));
  const rows = new Map<ProductCategoryId, DashboardCategory>();
  for (const order of orders) {
    for (const item of order.items) {
      const product = catalog.get(item.slug);
      if (!product) continue;
      const current = rows.get(product.categoryId) ?? {
        id: product.categoryId,
        label: CATEGORY_LABEL[product.categoryId],
        revenue: 0,
        units: 0,
        share: 0,
      };
      current.units += item.quantity;
      current.revenue += item.unitPrice * item.quantity;
      rows.set(product.categoryId, current);
    }
  }
  const list = [...rows.values()];
  const total = list.reduce((sumRevenue, row) => sumRevenue + row.revenue, 0);
  return list
    .map((row) => ({ ...row, share: total === 0 ? 0 : Math.round((row.revenue / total) * 1000) / 10 }))
    .sort((a, b) => b.revenue - a.revenue);
}

export function areaName(address: string) {
  const haystack = address.toLowerCase();
  let found: { name: string; index: number } | null = null;
  for (const area of AREAS) {
    for (const key of area.keys) {
      const index = haystack.lastIndexOf(key.toLowerCase());
      if (index >= 0 && (found === null || index >= found.index)) found = { name: area.name, index };
    }
  }
  if (found) return found.name;
  const parts = address.split(",").map((part) => part.trim()).filter(Boolean);
  return parts.at(-1) || "Unknown area";
}

function formatSpan(from: Date, to: Date) {
  const last = new Date(to.getTime() - 1);
  const sameDay = startOfDay(from).getTime() === startOfDay(last).getTime();
  if (sameDay) return formatDay(from);
  return `${formatDay(from)} – ${formatDay(last)}`;
}

function formatDay(date: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}

function parseInputDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfHour(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours());
}

function nextHour(date: Date) {
  return new Date(startOfHour(date).getTime() + 3_600_000);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function trimNumber(value: number) {
  const digits = value >= 10 ? 1 : 2;
  return value.toFixed(digits).replace(/\.0+$/, "").replace(/(\.\d)0$/, "$1");
}
