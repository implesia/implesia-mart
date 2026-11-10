/**
 * Stand-in sales reports used until `GET /api/v1/admin/reports/sales` answers.
 * Totals follow the same rules as implesia-mart-backend PR #10: sales on
 * `delivered_at`, profit only from lines with a cost, stock as it is now,
 * and a negative sale quantity. The ledger is generated so the screens have
 * numbers; the live API is the source of truth.
 */

import { LOW_STOCK_THRESHOLD, dhakaDateString, parseIsoDate } from "@/lib/admin/inventory";
import {
  ReportQueryError,
  addIsoDays,
  defaultGrain,
  filtersOf,
  pageCount,
  previousRange,
  resolveReportCall,
  roundHalfUp,
  type DeliveryReport,
  type MovementReport,
  type ProductReport,
  type ProductReportRow,
  type ProfitReport,
  type ReportCall,
  type ReportGrain,
  type ResolvedWindow,
  type SalesSummary,
  type StockReport,
  type StockRow,
  type TrendPoint,
  type TrendReport,
} from "@/lib/admin/reports";
import { workbookBytes } from "@/lib/admin/xlsx-lite";

const GADGETS = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1";
const DRESSES = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2";

export const MOCK_REPORT_CATEGORIES = [
  { id: GADGETS, label: "Gadgets" },
  { id: DRESSES, label: "Dresses" },
] as const;

type MockProduct = {
  id: string;
  title: string;
  categoryId: string;
  costCents: number | null;
  price: number;
  regular: number;
  quantity: number | null;
};

export const MOCK_REPORT_PRODUCTS: MockProduct[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    title: "USB-C hub",
    categoryId: GADGETS,
    costCents: 45000,
    price: 1200,
    regular: 1400,
    quantity: 18,
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    title: "Linen dress",
    categoryId: DRESSES,
    costCents: 80000,
    price: 2200,
    regular: 2600,
    quantity: 7,
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    title: "LED desk lamp",
    categoryId: GADGETS,
    costCents: null,
    price: 900,
    regular: 900,
    quantity: 12,
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    title: "Cotton saree",
    categoryId: DRESSES,
    costCents: 150000,
    price: 3500,
    regular: 4000,
    quantity: 4,
  },
  {
    id: "55555555-5555-4555-8555-555555555555",
    title: "Phone stand",
    categoryId: GADGETS,
    costCents: 8000,
    price: 350,
    regular: 400,
    quantity: 0,
  },
  {
    id: "66666666-6666-4666-8666-666666666666",
    title: "Silk scarf",
    categoryId: DRESSES,
    costCents: 22000,
    price: 650,
    regular: 800,
    quantity: null,
  },
];

const HUB = MOCK_REPORT_PRODUCTS[0];
const DRESS = MOCK_REPORT_PRODUCTS[1];
const LAMP = MOCK_REPORT_PRODUCTS[2];
const STAND = MOCK_REPORT_PRODUCTS[4];

type MockLine = {
  productId: string;
  units: number;
  lineTotal: number;
  gross: number;
  unitCostCents: number | null;
};

type MockOrder = {
  id: string;
  deliveredOn: string | null;
  returnedOn: string | null;
  cancelledOn: string | null;
  channel: "website" | null;
  shipping: number;
  lines: MockLine[];
};

type MovementEvent = {
  date: string;
  type: "opening" | "purchase" | "sale" | "return" | "cancel" | "adjustment";
  quantity: number;
  productId: string;
};

const books = new Map<string, { orders: MockOrder[]; movements: MovementEvent[] }>();

function productById(id: string) {
  return MOCK_REPORT_PRODUCTS.find((item) => item.id === id) ?? null;
}

function lineFor(product: MockProduct, units: number): MockLine {
  return {
    productId: product.id,
    units,
    lineTotal: product.price * units,
    gross: product.regular * units,
    unitCostCents: product.costCents,
  };
}

function weekday(iso: string) {
  const parts = parseIsoDate(iso);
  if (!parts) return 0;
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay();
}

function datesFrom(start: string, end: string) {
  const days: string[] = [];
  let cursor: string | null = start;
  while (cursor && cursor <= end) {
    days.push(cursor);
    cursor = addIsoDays(cursor, 1);
  }
  return days;
}

function dayIndex(iso: string) {
  const parts = parseIsoDate(iso);
  const origin = parseIsoDate("2026-09-01");
  if (!parts || !origin) return 0;
  return Math.round(
    (Date.UTC(parts.year, parts.month - 1, parts.day) -
      Date.UTC(origin.year, origin.month - 1, origin.day)) /
      86_400_000,
  );
}

function book(today: string) {
  const cached = books.get(today);
  if (cached) return cached;
  const orders: MockOrder[] = [];
  for (const day of datesFrom("2026-09-15", today)) {
    const n = dayIndex(day);
    const channel = n % 6 === 0 ? null : "website";
    if (n % 4 === 0) {
      orders.push({
        id: `cancel-${day}`,
        deliveredOn: null,
        returnedOn: null,
        cancelledOn: day,
        channel,
        shipping: 0,
        lines: [lineFor(HUB, 1)],
      });
      continue;
    }
    const units = 1 + (n % 3);
    const lines = [lineFor(n % 2 === 0 ? HUB : DRESS, units)];
    if (n % 5 === 0) lines.push(lineFor(LAMP, 1));
    let returnedOn = n % 9 === 0 ? addIsoDays(day, 2) : null;
    if (returnedOn && returnedOn > today) returnedOn = null;
    orders.push({
      id: `order-${day}`,
      deliveredOn: day,
      returnedOn,
      cancelledOn: null,
      channel,
      shipping: 60 + (n % 2) * 20,
      lines,
    });
  }

  const movements: MovementEvent[] = [];
  for (const product of MOCK_REPORT_PRODUCTS) {
    if (product.quantity == null) continue;
    const opening = product.id === HUB.id ? 40 : product.id === DRESS.id ? 20 : product.id === LAMP.id ? 15 : product.id === STAND.id ? 6 : 8;
    movements.push({ date: "2026-09-01", type: "opening", quantity: opening, productId: product.id });
  }
  for (const day of datesFrom("2026-09-07", today)) {
    if (weekday(day) === 1) {
      movements.push({ date: day, type: "purchase", quantity: 6, productId: HUB.id });
    }
  }
  if (today >= "2026-10-20") {
    movements.push({ date: "2026-10-20", type: "adjustment", quantity: -1, productId: STAND.id });
  }
  for (const order of orders) {
    if (order.cancelledOn) {
      for (const line of order.lines) {
        movements.push({
          date: order.cancelledOn,
          type: "cancel",
          quantity: line.units,
          productId: line.productId,
        });
      }
    }
    if (order.deliveredOn) {
      for (const line of order.lines) {
        movements.push({
          date: order.deliveredOn,
          type: "sale",
          quantity: -line.units,
          productId: line.productId,
        });
      }
    }
    if (order.returnedOn) {
      for (const line of order.lines) {
        movements.push({
          date: order.returnedOn,
          type: "return",
          quantity: line.units,
          productId: line.productId,
        });
      }
    }
  }
  const built = { orders, movements };
  books.set(today, built);
  return built;
}

function dhakaToday(now: Date) {
  return dhakaDateString(now);
}

function categoryIds(categoryId: string) {
  if (!MOCK_REPORT_CATEGORIES.some((item) => item.id === categoryId)) {
    throw new ReportQueryError("Category not found");
  }
  return [categoryId];
}

function assertKnownProduct(productId: string | null) {
  if (productId && !productById(productId)) throw new ReportQueryError("Product not found");
}

function windowOf(call: ReportCall, now: Date) {
  const resolved = resolveReportCall(call, now);
  assertKnownProduct(resolved.productId);
  if (resolved.categoryId) categoryIds(resolved.categoryId);
  return resolved;
}

function lineMatches(line: MockLine, scope: ResolvedWindow) {
  if (scope.productId && line.productId !== scope.productId) return false;
  if (scope.categoryId) {
    const product = productById(line.productId);
    if (!product || !categoryIds(scope.categoryId).includes(product.categoryId)) return false;
  }
  return true;
}

function orderChannelOk(order: MockOrder, scope: ResolvedWindow) {
  if (scope.channel == null) return true;
  return order.channel === scope.channel;
}

function orderInScope(order: MockOrder, scope: ResolvedWindow) {
  if (!orderChannelOk(order, scope)) return false;
  if (!scope.productId && !scope.categoryId) return true;
  return order.lines.some((line) => lineMatches(line, scope));
}

type LineFold = {
  units: number;
  gross: number;
  merchandise: number;
  knownRevenue: number;
  costCents: number;
  hadKnown: boolean;
  unknownLines: number;
  unknownUnits: number;
  unknownRevenue: number;
  shipping: number;
  orders: number;
};

function emptyFold(): LineFold {
  return {
    units: 0,
    gross: 0,
    merchandise: 0,
    knownRevenue: 0,
    costCents: 0,
    hadKnown: false,
    unknownLines: 0,
    unknownUnits: 0,
    unknownRevenue: 0,
    shipping: 0,
    orders: 0,
  };
}

function foldDelivered(orders: MockOrder[], scope: ResolvedWindow, from: string, to: string) {
  const fold = emptyFold();
  for (const order of orders) {
    if (!order.deliveredOn || order.deliveredOn < from || order.deliveredOn > to) continue;
    if (!orderInScope(order, scope)) continue;
    const lines = order.lines.filter((line) => lineMatches(line, scope));
    if (lines.length === 0) continue;
    fold.orders += 1;
    fold.shipping += order.shipping;
    for (const line of lines) {
      fold.units += line.units;
      fold.gross += line.gross;
      fold.merchandise += line.lineTotal;
      if (line.unitCostCents == null) {
        fold.unknownLines += 1;
        fold.unknownUnits += line.units;
        fold.unknownRevenue += line.lineTotal;
      } else {
        fold.hadKnown = true;
        fold.knownRevenue += line.lineTotal;
        fold.costCents += line.unitCostCents * line.units;
      }
    }
  }
  return fold;
}

function profitOf(fold: LineFold) {
  if (!fold.hadKnown) return { cost: null, profit: null, margin: null };
  const profitCents = fold.knownRevenue * 100 - fold.costCents;
  const profit = profitCents / 100;
  const margin =
    fold.knownRevenue === 0 ? null : roundHalfUp((profitCents / fold.knownRevenue));
  return { cost: fold.costCents / 100, profit, margin };
}

export function mockSales(call: ReportCall, now: Date): SalesSummary {
  const scope = windowOf(call, now);
  const fold = foldDelivered(book(dhakaToday(now)).orders, scope, scope.from, scope.to);
  return {
    filters: filtersOf(scope, true),
    orderCount: fold.orders,
    unitsSold: fold.units,
    grossSales: fold.gross,
    discount: fold.gross - fold.merchandise,
    deliveryCharge: fold.shipping,
    netSales: fold.merchandise + fold.shipping,
  };
}

export function mockProfit(call: ReportCall, now: Date): ProfitReport {
  const scope = windowOf(call, now);
  const fold = foldDelivered(book(dhakaToday(now)).orders, scope, scope.from, scope.to);
  const profit = profitOf(fold);
  return {
    filters: filtersOf(scope, true),
    revenue: fold.knownRevenue,
    cost: profit.cost,
    profit: profit.profit,
    marginPercent: profit.margin,
    unknownCostLines: fold.unknownLines,
    unknownCostUnits: fold.unknownUnits,
    unknownCostRevenue: fold.unknownRevenue,
  };
}

export function mockProducts(call: ReportCall, now: Date): ProductReport {
  const scope = windowOf(call, now);
  const orders = book(dhakaToday(now)).orders;
  const grouped = new Map<string, ProductReportRow & { costCents: number; hadKnown: boolean; knownRevenue: number }>();
  function bucket(productId: string) {
    const product = productById(productId);
    let row = grouped.get(productId);
    if (!row) {
      row = {
        productId,
        title: product?.title ?? "Removed product",
        unitsSold: 0,
        revenue: 0,
        cost: null,
        profit: null,
        marginPercent: null,
        returnCount: 0,
        unknownCostUnits: 0,
        costCents: 0,
        hadKnown: false,
        knownRevenue: 0,
      };
      grouped.set(productId, row);
    }
    return row;
  }
  const returned = new Map<string, Set<string>>();
  for (const order of orders) {
    if (!orderChannelOk(order, scope)) continue;
    if (order.deliveredOn && order.deliveredOn >= scope.from && order.deliveredOn <= scope.to) {
      for (const line of order.lines.filter((item) => lineMatches(item, scope))) {
        const row = bucket(line.productId);
        row.unitsSold += line.units;
        row.revenue += line.lineTotal;
        if (line.unitCostCents == null) row.unknownCostUnits += line.units;
        else {
          row.hadKnown = true;
          row.knownRevenue += line.lineTotal;
          row.costCents += line.unitCostCents * line.units;
        }
      }
    }
    if (order.returnedOn && order.returnedOn >= scope.from && order.returnedOn <= scope.to) {
      for (const line of order.lines.filter((item) => lineMatches(item, scope))) {
        bucket(line.productId);
        const set = returned.get(line.productId) ?? new Set<string>();
        set.add(order.id);
        returned.set(line.productId, set);
      }
    }
  }
  const items = [...grouped.values()]
    .map((row) => {
      const profitCents = row.hadKnown ? row.knownRevenue * 100 - row.costCents : null;
      return {
        productId: row.productId,
        title: row.title,
        unitsSold: row.unitsSold,
        revenue: row.revenue,
        cost: row.hadKnown ? row.costCents / 100 : null,
        profit: profitCents == null ? null : profitCents / 100,
        marginPercent:
          profitCents == null || row.knownRevenue === 0
            ? null
            : roundHalfUp(profitCents / row.knownRevenue),
        returnCount: returned.get(row.productId ?? "")?.size ?? 0,
        unknownCostUnits: row.unknownCostUnits,
      };
    })
    .filter((row) => row.unitsSold > 0 || row.returnCount > 0)
    .sort((a, b) => b.revenue - a.revenue || b.unitsSold - a.unitsSold || a.title.localeCompare(b.title));
  const total = items.length;
  const start = (scope.page - 1) * scope.pageSize;
  return {
    filters: filtersOf(scope, true),
    items: items.slice(start, start + scope.pageSize),
    total,
    page: scope.page,
    pageSize: scope.pageSize,
    pages: pageCount(total, scope.pageSize),
  };
}

function lastSaleOn(orders: MockOrder[], productId: string) {
  let last: string | null = null;
  for (const order of orders) {
    if (!order.deliveredOn) continue;
    if (!order.lines.some((line) => line.productId === productId)) continue;
    if (!last || order.deliveredOn > last) last = order.deliveredOn;
  }
  return last;
}

export function mockStock(call: ReportCall, now: Date): StockReport {
  const scope = windowOf(call, now);
  const today = dhakaToday(now);
  const noSaleSince = addIsoDays(today, -29) ?? today;
  const orders = book(today).orders;
  const rows: StockRow[] = MOCK_REPORT_PRODUCTS.filter((product) => {
    if (scope.productId && product.id !== scope.productId) return false;
    if (scope.categoryId && !categoryIds(scope.categoryId).includes(product.categoryId)) return false;
    return true;
  }).map((product) => {
    const last = lastSaleOn(orders, product.id);
    const lowStock = product.quantity != null && product.quantity <= LOW_STOCK_THRESHOLD;
    const valued = product.quantity != null && product.costCents != null;
    return {
      productId: product.id,
      title: product.title,
      quantity: product.quantity,
      costPrice: product.costCents == null ? null : product.costCents / 100,
      stockValue: valued ? (product.quantity! * product.costCents!) / 100 : null,
      lowStock,
      noSale30d: last == null || last < noSaleSince,
    };
  });
  rows.sort((a, b) => {
    if (a.lowStock !== b.lowStock) return a.lowStock ? -1 : 1;
    if (a.quantity == null) return 1;
    if (b.quantity == null) return -1;
    if (a.quantity !== b.quantity) return a.quantity - b.quantity;
    return a.title.localeCompare(b.title);
  });
  const summary = {
    productCount: rows.length,
    unitsOnHand: rows.reduce((sum, row) => sum + (row.quantity ?? 0), 0),
    stockValue: rows.reduce((sum, row) => sum + (row.stockValue ?? 0), 0),
    unknownCostUnits: rows.reduce(
      (sum, row) => sum + (row.quantity != null && row.costPrice == null ? row.quantity : 0),
      0,
    ),
    lowStockCount: rows.filter((row) => row.lowStock).length,
    lowStockAt: LOW_STOCK_THRESHOLD,
    noSale30dCount: rows.filter((row) => row.noSale30d).length,
  };
  const total = rows.length;
  const start = (scope.page - 1) * scope.pageSize;
  return {
    filters: filtersOf(scope, false),
    periodApplies: false,
    asOf: today,
    noSaleSince,
    summary,
    items: rows.slice(start, start + scope.pageSize),
    total,
    page: scope.page,
    pageSize: scope.pageSize,
    pages: pageCount(total, scope.pageSize),
  };
}

export function mockMovements(call: ReportCall, now: Date): MovementReport {
  const scope = windowOf(call, now);
  const events = book(dhakaToday(now)).movements.filter((event) => {
    if (scope.productId && event.productId !== scope.productId) return false;
    if (scope.categoryId) {
      const product = productById(event.productId);
      if (!product || !categoryIds(scope.categoryId).includes(product.categoryId)) return false;
    }
    return true;
  });
  const totals = {
    openingBalance: 0,
    opening: 0,
    purchase: 0,
    sale: 0,
    returnTotal: 0,
    cancel: 0,
    adjustment: 0,
    closing: 0,
  };
  for (const event of events) {
    if (event.date <= scope.to) totals.closing += event.quantity;
    if (event.date < scope.from) {
      totals.openingBalance += event.quantity;
      continue;
    }
    if (event.date > scope.to) continue;
    totals[event.type === "return" ? "returnTotal" : event.type] += event.quantity;
  }
  return { filters: filtersOf(scope, false), ...totals };
}

export function mockDelivery(call: ReportCall, now: Date): DeliveryReport {
  const scope = windowOf(call, now);
  let delivered = 0;
  let returned = 0;
  let cancelled = 0;
  for (const order of book(dhakaToday(now)).orders) {
    if (!orderInScope(order, scope)) continue;
    if (order.deliveredOn && order.deliveredOn >= scope.from && order.deliveredOn <= scope.to) delivered += 1;
    if (order.returnedOn && order.returnedOn >= scope.from && order.returnedOn <= scope.to) returned += 1;
    if (order.cancelledOn && order.cancelledOn >= scope.from && order.cancelledOn <= scope.to) cancelled += 1;
  }
  return {
    filters: filtersOf(scope, true),
    delivered,
    returned,
    cancelled,
    returnRatePercent: delivered === 0 ? null : roundHalfUp((returned * 100) / delivered),
  };
}

function bucketStart(day: string, grain: ReportGrain) {
  if (grain === "month") return `${day.slice(0, 8)}01`;
  if (grain === "week") {
    const sinceMonday = (weekday(day) + 6) % 7;
    return addIsoDays(day, -sinceMonday) ?? day;
  }
  return day;
}

export function mockTrend(call: ReportCall, now: Date): TrendReport {
  const scope = windowOf(call, now);
  const grain = scope.grain ?? defaultGrain(scope.from, scope.to);
  const orders = book(dhakaToday(now)).orders;
  const byBucket = new Map<string, LineFold>();
  let cursor: string | null = bucketStart(scope.from, grain);
  const endBucket = bucketStart(scope.to, grain);
  while (cursor && cursor <= endBucket) {
    byBucket.set(cursor, emptyFold());
    if (grain === "month") {
      const parts = parseIsoDate(cursor);
      if (!parts) break;
      const month = parts.month === 12 ? 1 : parts.month + 1;
      const year = parts.month === 12 ? parts.year + 1 : parts.year;
      cursor = `${year}-${String(month).padStart(2, "0")}-01`;
    } else {
      cursor = addIsoDays(cursor, grain === "week" ? 7 : 1);
    }
  }
  for (const day of datesFrom(scope.from, scope.to)) {
    const fold = foldDelivered(orders, scope, day, day);
    const bucket = byBucket.get(bucketStart(day, grain));
    if (!bucket) continue;
    bucket.orders += fold.orders;
    bucket.units += fold.units;
    bucket.gross += fold.gross;
    bucket.merchandise += fold.merchandise;
    bucket.shipping += fold.shipping;
    bucket.knownRevenue += fold.knownRevenue;
    bucket.costCents += fold.costCents;
    bucket.hadKnown = bucket.hadKnown || fold.hadKnown;
    bucket.unknownRevenue += fold.unknownRevenue;
  }
  const points: TrendPoint[] = [...byBucket.entries()].map(([start, fold]) => {
    let profit: number | null;
    if (fold.hadKnown) profit = (fold.knownRevenue * 100 - fold.costCents) / 100;
    else if (fold.unknownRevenue) profit = null;
    else profit = 0;
    return {
      start,
      netSales: fold.merchandise + fold.shipping,
      profit,
      unknownCostRevenue: fold.unknownRevenue,
    };
  });
  return { filters: filtersOf(scope, true), grain, points };
}

export function mockFilterOptions() {
  return {
    products: MOCK_REPORT_PRODUCTS.map((product) => ({ id: product.id, title: product.title })),
    categories: MOCK_REPORT_CATEGORIES.map((category) => ({ id: category.id, label: category.label })),
  };
}

function moneyCell(value: number | null) {
  if (value == null) return "";
  return String(roundHalfUp(value));
}

function preamble(title: string, scope: ResolvedWindow, channelApplies: boolean) {
  return [
    ["Report", title],
    ["Timezone", "Asia/Dhaka"],
    ["From", scope.from],
    ["To", scope.to],
    ["Preset", scope.preset ?? ""],
    ["Product", scope.productId ?? ""],
    ["Category", scope.categoryId ?? ""],
    ["Channel applies", channelApplies ? "yes" : "no"],
    [],
  ];
}

export function mockReportWorkbook(kind: ReportExportKind, call: ReportCall, now: Date) {
  const scope = windowOf(call, now);
  let rows: string[][];
  if (kind === "sales") {
    const report = mockSales(call, now);
    rows = [
      ...preamble("Sales", scope, true),
      ["Orders", "Units", "Gross", "Discount", "Delivery", "Net"],
      [
        String(report.orderCount),
        String(report.unitsSold),
        String(report.grossSales),
        String(report.discount),
        String(report.deliveryCharge),
        String(report.netSales),
      ],
    ];
  } else if (kind === "profit") {
    const report = mockProfit(call, now);
    rows = [
      ...preamble("Profit", scope, true),
      ["Revenue", "Cost", "Profit", "Margin %", "Unknown lines", "Unknown units", "Unknown revenue"],
      [
        String(report.revenue),
        moneyCell(report.cost),
        moneyCell(report.profit),
        moneyCell(report.marginPercent),
        String(report.unknownCostLines),
        String(report.unknownCostUnits),
        String(report.unknownCostRevenue),
      ],
    ];
  } else if (kind === "products") {
    const report = mockProducts({ ...call, page: 1, pageSize: 100 }, now);
    const all = report.pages <= 1 ? report.items : collectProductRows(call, now);
    rows = [
      ...preamble("Products", scope, true),
      ["Product", "Units", "Revenue", "Cost", "Profit", "Margin %", "Returns", "Unknown units"],
      ...all.map((row) => [
        row.title,
        String(row.unitsSold),
        String(row.revenue),
        moneyCell(row.cost),
        moneyCell(row.profit),
        moneyCell(row.marginPercent),
        String(row.returnCount),
        String(row.unknownCostUnits),
      ]),
    ];
  } else if (kind === "stock") {
    const report = mockStock({ ...call, page: 1, pageSize: 100 }, now);
    const all = report.total <= report.items.length ? report.items : collectStockRows(call, now);
    rows = [
      ...preamble("Stock", scope, false),
      ["As of", report.asOf],
      ["No sale since", report.noSaleSince],
      [],
      ["Product", "On hand", "Cost", "Stock value", "Low stock", "No sale in 30 days"],
      ...all.map((row) => [
        row.title,
        row.quantity == null ? "" : String(row.quantity),
        moneyCell(row.costPrice),
        moneyCell(row.stockValue),
        row.lowStock ? "yes" : "no",
        row.noSale30d ? "yes" : "no",
      ]),
    ];
  } else if (kind === "movements") {
    const report = mockMovements(call, now);
    rows = [
      ...preamble("Stock movement", scope, false),
      ["Opening balance", "Opening", "Purchase", "Sale", "Return", "Cancel", "Adjustment", "Closing"],
      [
        String(report.openingBalance),
        String(report.opening),
        String(report.purchase),
        String(report.sale),
        String(report.returnTotal),
        String(report.cancel),
        String(report.adjustment),
        String(report.closing),
      ],
    ];
  } else if (kind === "delivery") {
    const report = mockDelivery(call, now);
    rows = [
      ...preamble("Delivery and return", scope, true),
      ["Delivered", "Returned", "Cancelled", "Return rate %"],
      [
        String(report.delivered),
        String(report.returned),
        String(report.cancelled),
        moneyCell(report.returnRatePercent),
      ],
    ];
  } else {
    const report = mockTrend(call, now);
    rows = [
      ...preamble("Trend", scope, true),
      ["Grain", report.grain],
      [],
      ["Start", "Net sales", "Profit", "Unknown revenue"],
      ...report.points.map((point) => [
        point.start,
        String(point.netSales),
        moneyCell(point.profit),
        String(point.unknownCostRevenue),
      ]),
    ];
  }
  return workbookBytes(kind, rows);
}

function collectProductRows(call: ReportCall, now: Date) {
  const first = mockProducts({ ...call, page: 1, pageSize: 100 }, now);
  const items = [...first.items];
  for (let page = 2; page <= first.pages; page += 1) {
    items.push(...mockProducts({ ...call, page, pageSize: 100 }, now).items);
  }
  return items;
}

function collectStockRows(call: ReportCall, now: Date) {
  const first = mockStock({ ...call, page: 1, pageSize: 100 }, now);
  const items = [...first.items];
  for (let page = 2; page <= first.pages; page += 1) {
    items.push(...mockStock({ ...call, page, pageSize: 100 }, now).items);
  }
  return items;
}

export const REPORT_EXPORT_KINDS = [
  "sales",
  "profit",
  "products",
  "stock",
  "movements",
  "delivery",
  "trend",
] as const;

export type ReportExportKind = (typeof REPORT_EXPORT_KINDS)[number];

export function mockPreviousWindow(from: string, to: string) {
  return previousRange(from, to);
}
