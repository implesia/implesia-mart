/**
 * Admin sales reports. Field names follow implesia-mart-backend PR #10
 * (`app/schemas/report.py`, `admin_reports.py`, `report_service.py`).
 * Dates are inclusive Asia/Dhaka calendar days. Nothing here is imported
 * by the storefront.
 */

import { dhakaParts, formatDhakaDate, parseIsoDate } from "@/lib/admin/inventory";

export const REPORT_PRESETS = ["this_week", "this_month", "last_month"] as const;
export type ReportPreset = (typeof REPORT_PRESETS)[number];

export const REPORT_GRAINS = ["day", "week", "month"] as const;
export type ReportGrain = (typeof REPORT_GRAINS)[number];

export const REPORT_CHANNELS = ["website"] as const;

export const REPORT_PAGE_SIZE_MAX = 100;
export const REPORT_RANGE_MAX_DAYS = 366;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class ReportQueryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReportQueryError";
  }
}

export type ReportFilters = {
  timezone: "Asia/Dhaka";
  preset: string | null;
  from: string;
  to: string;
  productId: string | null;
  categoryId: string | null;
  channel: string | null;
  /** False on stock and movements: those totals ignore `channel`. */
  channelApplies: boolean;
};

export type SalesSummary = {
  filters: ReportFilters;
  orderCount: number;
  unitsSold: number;
  grossSales: number;
  discount: number;
  /** Coupon taka already included in `discount`. Missing on older payloads counts as 0. */
  couponDiscount: number;
  deliveryCharge: number;
  netSales: number;
};

export type ProfitReport = {
  filters: ReportFilters;
  revenue: number;
  cost: number | null;
  profit: number | null;
  marginPercent: number | null;
  unknownCostLines: number;
  unknownCostUnits: number;
  unknownCostRevenue: number;
};

export type ProductReportRow = {
  productId: string | null;
  title: string;
  unitsSold: number;
  revenue: number;
  cost: number | null;
  profit: number | null;
  marginPercent: number | null;
  returnCount: number;
  unknownCostUnits: number;
};

export type ProductReport = {
  filters: ReportFilters;
  items: ProductReportRow[];
  total: number;
  page: number;
  pageSize: number;
  pages: number;
};

export type StockSummary = {
  productCount: number;
  unitsOnHand: number;
  stockValue: number;
  unknownCostUnits: number;
  lowStockCount: number;
  lowStockAt: number;
  noSale30dCount: number;
};

export type StockRow = {
  productId: string;
  title: string;
  quantity: number | null;
  costPrice: number | null;
  stockValue: number | null;
  lowStock: boolean;
  noSale30d: boolean;
};

export type StockReport = {
  filters: ReportFilters;
  periodApplies: boolean;
  asOf: string;
  noSaleSince: string;
  summary: StockSummary;
  items: StockRow[];
  total: number;
  page: number;
  pageSize: number;
  pages: number;
};

export type MovementReport = {
  filters: ReportFilters;
  openingBalance: number;
  opening: number;
  purchase: number;
  sale: number;
  /** JSON key is `return`. A sale quantity is negative. */
  returnTotal: number;
  cancel: number;
  adjustment: number;
  closing: number;
};

export type DeliveryReport = {
  filters: ReportFilters;
  delivered: number;
  returned: number;
  cancelled: number;
  returnRatePercent: number | null;
};

export type TrendPoint = {
  start: string;
  netSales: number;
  profit: number | null;
  unknownCostRevenue: number;
};

export type TrendReport = {
  filters: ReportFilters;
  grain: ReportGrain;
  points: TrendPoint[];
};

export type ReportCall = {
  preset?: string | null;
  from?: string | null;
  to?: string | null;
  productId?: string | null;
  categoryId?: string | null;
  channel?: string | null;
  grain?: string | null;
  page?: number;
  pageSize?: number;
};

export type ResolvedWindow = {
  preset: ReportPreset | null;
  from: string;
  to: string;
  productId: string | null;
  categoryId: string | null;
  channel: string | null;
  grain: ReportGrain | null;
  page: number;
  pageSize: number;
};

type DateParts = { year: number; month: number; day: number };

function isoDate(parts: DateParts) {
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

export function addIsoDays(iso: string, days: number) {
  const parts = parseIsoDate(iso);
  if (!parts) return null;
  const next = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));
  return isoDate({
    year: next.getUTCFullYear(),
    month: next.getUTCMonth() + 1,
    day: next.getUTCDate(),
  });
}

export function inclusiveDays(from: string, to: string) {
  const start = parseIsoDate(from);
  const end = parseIsoDate(to);
  if (!start || !end) return null;
  const span =
    (Date.UTC(end.year, end.month - 1, end.day) - Date.UTC(start.year, start.month - 1, start.day)) /
    86_400_000;
  return span + 1;
}

/** Monday through today, the 1st through today, or the whole previous month. */
export function presetBounds(preset: ReportPreset, now: Date) {
  const parts = dhakaParts(now);
  const today = isoDate(parts);
  if (preset === "this_week") {
    const sinceMonday = (parts.weekday + 6) % 7;
    return { from: addIsoDays(today, -sinceMonday) ?? today, to: today };
  }
  if (preset === "this_month") {
    return { from: isoDate({ ...parts, day: 1 }), to: today };
  }
  const firstThis = isoDate({ year: parts.year, month: parts.month, day: 1 });
  const lastPrevious = addIsoDays(firstThis, -1) ?? firstThis;
  const previousParts = parseIsoDate(lastPrevious);
  return {
    from: previousParts ? isoDate({ ...previousParts, day: 1 }) : lastPrevious,
    to: lastPrevious,
  };
}

/** The immediately previous inclusive range of the same length. */
export function previousRange(from: string, to: string) {
  const days = inclusiveDays(from, to);
  if (days == null || days < 1) return null;
  const toDate = addIsoDays(from, -1);
  if (!toDate) return null;
  const fromDate = addIsoDays(toDate, -(days - 1));
  if (!fromDate) return null;
  return { from: fromDate, to: toDate };
}

export function defaultGrain(from: string, to: string): ReportGrain {
  const days = inclusiveDays(from, to) ?? 1;
  if (days <= 31) return "day";
  if (days <= 92) return "week";
  return "month";
}

function isPreset(value: string | null | undefined): value is ReportPreset {
  return value === "this_week" || value === "this_month" || value === "last_month";
}

function isGrain(value: string | null | undefined): value is ReportGrain {
  return value === "day" || value === "week" || value === "month";
}

export function resolveReportCall(call: ReportCall, now: Date): ResolvedWindow {
  const preset = call.preset?.trim() || null;
  const from = call.from?.trim() || null;
  const to = call.to?.trim() || null;
  if (preset && (from || to)) {
    throw new ReportQueryError("Choose a preset or a from and to date, not both");
  }
  if (!preset && !from && !to) {
    throw new ReportQueryError("Choose a preset or a from and to date");
  }
  let windowFrom: string;
  let windowTo: string;
  let presetId: ReportPreset | null = null;
  if (preset) {
    if (!isPreset(preset)) {
      throw new ReportQueryError("preset must be this_week, this_month, or last_month");
    }
    presetId = preset;
    const bounds = presetBounds(preset, now);
    windowFrom = bounds.from;
    windowTo = bounds.to;
  } else {
    if (!from || !to) throw new ReportQueryError("Choose both a from and a to date");
    if (!parseIsoDate(from) || !parseIsoDate(to)) {
      throw new ReportQueryError("Use dates as YYYY-MM-DD");
    }
    if (from > to) throw new ReportQueryError("from is after to");
    windowFrom = from;
    windowTo = to;
  }
  const days = inclusiveDays(windowFrom, windowTo);
  if (days == null || days > REPORT_RANGE_MAX_DAYS) {
    throw new ReportQueryError("Choose a range of 366 days or less");
  }

  const channel = call.channel?.trim() || null;
  if (channel && channel.length > 32) {
    throw new ReportQueryError("channel must be 32 characters or fewer");
  }
  const productId = call.productId?.trim() || null;
  const categoryId = call.categoryId?.trim() || null;
  if (productId && !UUID_RE.test(productId)) throw new ReportQueryError("Product not found");
  if (categoryId && !UUID_RE.test(categoryId)) throw new ReportQueryError("Category not found");

  const grainRaw = call.grain?.trim() || null;
  if (grainRaw && !isGrain(grainRaw)) {
    throw new ReportQueryError("grain must be day, week, or month");
  }

  const page = call.page ?? 1;
  const pageSize = call.pageSize ?? 20;
  if (!Number.isInteger(page) || page < 1 || page > 10_000) {
    throw new ReportQueryError("page must be from 1 to 10000");
  }
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > REPORT_PAGE_SIZE_MAX) {
    throw new ReportQueryError("page_size must be from 1 to 100");
  }

  return {
    preset: presetId,
    from: windowFrom,
    to: windowTo,
    productId,
    categoryId,
    channel,
    grain: grainRaw && isGrain(grainRaw) ? grainRaw : null,
    page,
    pageSize,
  };
}

export function reportSearchParams(call: ReportCall) {
  const search = new URLSearchParams();
  const preset = call.preset?.trim() || "";
  const from = call.from?.trim() || "";
  const to = call.to?.trim() || "";
  if (preset) search.set("preset", preset);
  else {
    if (from) search.set("from", from);
    if (to) search.set("to", to);
  }
  if (call.productId) search.set("product_id", call.productId);
  if (call.categoryId) search.set("category_id", call.categoryId);
  if (call.channel) search.set("channel", call.channel);
  if (call.grain) search.set("grain", call.grain);
  if (call.page && call.page !== 1) search.set("page", String(call.page));
  if (call.pageSize && call.pageSize !== 20) search.set("page_size", String(call.pageSize));
  return search;
}

export function filtersOf(
  window: ResolvedWindow,
  channelApplies: boolean,
): ReportFilters {
  return {
    timezone: "Asia/Dhaka",
    preset: window.preset,
    from: window.from,
    to: window.to,
    productId: window.productId,
    categoryId: window.categoryId,
    channel: window.channel,
    channelApplies,
  };
}

export type ChangeTone = "up" | "down" | "flat";

export type PeriodChange = {
  direction: ChangeTone | null;
  /** Null when the previous value is 0 or null, or the current value is null. */
  text: string;
};

/** Percent versus the previous period. "—" when the previous value is 0 or null. */
export function periodChange(current: number | null, previous: number | null): PeriodChange {
  if (previous == null || previous === 0 || current == null || !Number.isFinite(current) || !Number.isFinite(previous)) {
    return { direction: null, text: "—" };
  }
  const rounded = Math.round((((current - previous) / Math.abs(previous)) * 100) * 10) / 10;
  if (Math.abs(rounded) < 0.05) return { direction: "flat", text: "0%" };
  const text = `${Math.abs(rounded).toLocaleString("en-US", { maximumFractionDigits: 1 })}%`;
  return { direction: rounded > 0 ? "up" : "down", text };
}

export function formatReportMoney(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "—";
  const negative = value < 0;
  const cents = Math.round(Math.abs(value) * 100);
  const hasFraction = cents % 100 !== 0;
  const formatted = (cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  });
  return `${negative ? "-" : ""}৳${formatted}`;
}

export function formatReportPercent(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value.toLocaleString("en-US", { maximumFractionDigits: 2 })}%`;
}

export function formatReportCount(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "—";
  return value.toLocaleString("en-US");
}

export function formatRangeLabel(from: string, to: string) {
  if (from === to) return formatDhakaDate(from);
  return `${formatDhakaDate(from)} – ${formatDhakaDate(to)}`;
}

export function formatBucketLabel(start: string, grain: ReportGrain) {
  const parts = parseIsoDate(start);
  if (!parts) return start;
  const instant = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 6, 0, 0));
  if (grain === "month") {
    return new Intl.DateTimeFormat("en-GB", {
      month: "short",
      year: "numeric",
      timeZone: "Asia/Dhaka",
    }).format(instant);
  }
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "Asia/Dhaka",
  }).format(instant);
}

/** Half up, two decimal places. Used for margin and return rate. */
export function roundHalfUp(value: number, places = 2) {
  const factor = 10 ** places;
  const sign = value < 0 ? -1 : 1;
  const scaled = Math.abs(value) * factor;
  return (sign * Math.floor(scaled + 0.5)) / factor;
}

export function pageCount(total: number, pageSize: number) {
  if (pageSize <= 0) return 0;
  return Math.ceil(total / pageSize);
}

function record(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function num(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return null;
}

function int(value: unknown, fallback = 0) {
  const parsed = num(value);
  if (parsed == null) return fallback;
  return Math.trunc(parsed);
}

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

export function parseReportFilters(value: unknown, channelApplies = true): ReportFilters | null {
  const body = record(value);
  if (!body) return null;
  const from = text(body.from ?? body.date_from);
  const to = text(body.to ?? body.date_to);
  if (!parseIsoDate(from) || !parseIsoDate(to)) return null;
  return {
    timezone: "Asia/Dhaka",
    preset: body.preset == null || body.preset === "" ? null : text(body.preset),
    from,
    to,
    productId: body.product_id == null ? null : text(body.product_id) || null,
    categoryId: body.category_id == null ? null : text(body.category_id) || null,
    channel: body.channel == null || body.channel === "" ? null : text(body.channel),
    channelApplies: typeof body.channel_applies === "boolean" ? body.channel_applies : channelApplies,
  };
}

export function parseSalesSummary(value: unknown): SalesSummary | null {
  const body = record(value);
  const filters = parseReportFilters(body?.filters);
  if (!body || !filters) return null;
  return {
    filters,
    orderCount: int(body.order_count),
    unitsSold: int(body.units_sold),
    grossSales: int(body.gross_sales),
    discount: int(body.discount),
    couponDiscount: int(body.coupon_discount),
    deliveryCharge: int(body.delivery_charge),
    netSales: int(body.net_sales),
  };
}

export function parseProfitReport(value: unknown): ProfitReport | null {
  const body = record(value);
  const filters = parseReportFilters(body?.filters);
  if (!body || !filters) return null;
  return {
    filters,
    revenue: int(body.revenue),
    cost: num(body.cost),
    profit: num(body.profit),
    marginPercent: num(body.margin_percent),
    unknownCostLines: int(body.unknown_cost_lines),
    unknownCostUnits: int(body.unknown_cost_units),
    unknownCostRevenue: int(body.unknown_cost_revenue),
  };
}

function parseProductRow(value: unknown): ProductReportRow | null {
  const body = record(value);
  if (!body) return null;
  return {
    productId: body.product_id == null ? null : text(body.product_id) || null,
    title: text(body.title) || "Removed product",
    unitsSold: int(body.units_sold),
    revenue: int(body.revenue),
    cost: num(body.cost),
    profit: num(body.profit),
    marginPercent: num(body.margin_percent),
    returnCount: int(body.return_count),
    unknownCostUnits: int(body.unknown_cost_units),
  };
}

export function parseProductReport(value: unknown): ProductReport | null {
  const body = record(value);
  const filters = parseReportFilters(body?.filters);
  if (!body || !filters || !Array.isArray(body.items)) return null;
  return {
    filters,
    items: body.items.flatMap((item) => {
      const row = parseProductRow(item);
      return row ? [row] : [];
    }),
    total: int(body.total),
    page: int(body.page, 1),
    pageSize: int(body.page_size, 20),
    pages: int(body.pages),
  };
}

export function parseStockReport(value: unknown): StockReport | null {
  const body = record(value);
  const filters = parseReportFilters(body?.filters, false);
  const summary = record(body?.summary);
  if (!body || !filters || !summary || !Array.isArray(body.items)) return null;
  if (!parseIsoDate(text(body.as_of)) || !parseIsoDate(text(body.no_sale_since))) return null;
  return {
    filters,
    periodApplies: body.period_applies === true,
    asOf: text(body.as_of),
    noSaleSince: text(body.no_sale_since),
    summary: {
      productCount: int(summary.product_count),
      unitsOnHand: int(summary.units_on_hand),
      stockValue: num(summary.stock_value) ?? 0,
      unknownCostUnits: int(summary.unknown_cost_units),
      lowStockCount: int(summary.low_stock_count),
      lowStockAt: int(summary.low_stock_at, 5),
      noSale30dCount: int(summary.no_sale_30d_count),
    },
    items: body.items.flatMap((item) => {
      const row = record(item);
      if (!row || !text(row.product_id)) return [];
      return [
        {
          productId: text(row.product_id),
          title: text(row.title),
          quantity: row.quantity == null ? null : int(row.quantity),
          costPrice: num(row.cost_price),
          stockValue: num(row.stock_value),
          lowStock: row.low_stock === true,
          noSale30d: row.no_sale_30d === true,
        },
      ];
    }),
    total: int(body.total),
    page: int(body.page, 1),
    pageSize: int(body.page_size, 20),
    pages: int(body.pages),
  };
}

export function parseMovementReport(value: unknown): MovementReport | null {
  const body = record(value);
  const filters = parseReportFilters(body?.filters, false);
  if (!body || !filters) return null;
  return {
    filters,
    openingBalance: int(body.opening_balance),
    opening: int(body.opening),
    purchase: int(body.purchase),
    sale: int(body.sale),
    returnTotal: int(body.return),
    cancel: int(body.cancel),
    adjustment: int(body.adjustment),
    closing: int(body.closing),
  };
}

export function parseDeliveryReport(value: unknown): DeliveryReport | null {
  const body = record(value);
  const filters = parseReportFilters(body?.filters);
  if (!body || !filters) return null;
  return {
    filters,
    delivered: int(body.delivered),
    returned: int(body.returned),
    cancelled: int(body.cancelled),
    returnRatePercent: num(body.return_rate_percent),
  };
}

export function parseTrendReport(value: unknown): TrendReport | null {
  const body = record(value);
  const filters = parseReportFilters(body?.filters);
  if (!body || !filters || !Array.isArray(body.points)) return null;
  if (!isGrain(text(body.grain))) return null;
  return {
    filters,
    grain: text(body.grain) as ReportGrain,
    points: body.points.flatMap((item) => {
      const row = record(item);
      if (!row || !parseIsoDate(text(row.start))) return [];
      return [
        {
          start: text(row.start),
          netSales: int(row.net_sales),
          profit: num(row.profit),
          unknownCostRevenue: int(row.unknown_cost_revenue),
        },
      ];
    }),
  };
}

export type DashboardRangeKey =
  | "today"
  | "yesterday"
  | "7d"
  | "30d"
  | "this-month"
  | "last-month"
  | "custom";

/** Map the existing dashboard range control onto the report query. */
export function dashboardReportCall(
  range: DashboardRangeKey,
  customFrom: string,
  customTo: string,
  now: Date,
): ReportCall {
  if (range === "this-month") return { preset: "this_month" };
  if (range === "last-month") return { preset: "last_month" };
  const today = isoDate(dhakaParts(now));
  if (range === "today") return { from: today, to: today };
  if (range === "yesterday") {
    const day = addIsoDays(today, -1) ?? today;
    return { from: day, to: day };
  }
  if (range === "7d") return { from: addIsoDays(today, -6) ?? today, to: today };
  if (range === "30d") return { from: addIsoDays(today, -29) ?? today, to: today };
  return { from: customFrom, to: customTo };
}

export function reportsPageHref(call: ReportCall) {
  const search = reportSearchParams(call);
  const query = search.toString();
  return query ? `/admin/reports?${query}` : "/admin/reports";
}
