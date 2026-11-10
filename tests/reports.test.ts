import assert from "node:assert/strict";
import test from "node:test";

import {
  dashboardReportCall,
  inclusiveDays,
  parseDeliveryReport,
  parseMovementReport,
  parseProfitReport,
  parseSalesSummary,
  parseTrendReport,
  periodChange,
  presetBounds,
  previousRange,
  reportSearchParams,
  resolveReportCall,
  ReportQueryError,
} from "@/lib/admin/reports";
import { readFirstSheet } from "@/lib/admin/xlsx-lite";
import {
  mockDelivery,
  mockMovements,
  mockProducts,
  mockProfit,
  mockReportWorkbook,
  mockSales,
  mockStock,
  mockTrend,
} from "@/lib/mart-mock/reports";

const NOW = new Date("2026-11-10T06:00:00.000Z");

test("report presets are Monday-to-today, month-to-date, and the previous calendar month", () => {
  assert.deepEqual(presetBounds("this_week", NOW), { from: "2026-11-09", to: "2026-11-10" });
  assert.deepEqual(presetBounds("this_month", NOW), { from: "2026-11-01", to: "2026-11-10" });
  assert.deepEqual(presetBounds("last_month", NOW), { from: "2026-10-01", to: "2026-10-31" });
  assert.deepEqual(previousRange("2026-11-09", "2026-11-10"), { from: "2026-11-07", to: "2026-11-08" });
  assert.equal(inclusiveDays("2026-01-01", "2027-01-01"), 366);
  assert.equal(inclusiveDays("2026-01-01", "2027-01-02"), 367);
});

test("a preset plus dates, from after to, or more than 366 days is refused", () => {
  assert.throws(
    () => resolveReportCall({ preset: "this_week", from: "2026-11-01", to: "2026-11-02" }, NOW),
    (error: unknown) => error instanceof ReportQueryError && /not both/.test(error.message),
  );
  assert.throws(
    () => resolveReportCall({ from: "2026-11-10", to: "2026-11-01" }, NOW),
    (error: unknown) => error instanceof ReportQueryError && error.message === "from is after to",
  );
  assert.throws(
    () => resolveReportCall({ from: "2026-01-01", to: "2027-01-02" }, NOW),
    (error: unknown) => error instanceof ReportQueryError && /366/.test(error.message),
  );
  assert.throws(
    () => resolveReportCall({ preset: "this_month", pageSize: 101 }, NOW),
    /page_size/,
  );
  const params = reportSearchParams({ preset: "this_month", productId: "11111111-1111-4111-8111-111111111111" });
  assert.equal(params.get("preset"), "this_month");
  assert.equal(params.has("from"), false);
  assert.equal(params.get("product_id"), "11111111-1111-4111-8111-111111111111");
});

test("comparison is a dash when the previous value is 0 or null", () => {
  assert.equal(periodChange(10, 0).text, "—");
  assert.equal(periodChange(10, null).text, "—");
  assert.equal(periodChange(null, 10).text, "—");
  assert.equal(periodChange(15, 10).direction, "up");
  assert.equal(periodChange(15, 10).text, "50%");
  assert.equal(periodChange(5, 10).direction, "down");
});

test("parsers read the backend JSON names, including from, to, and return", () => {
  const filters = {
    timezone: "Asia/Dhaka",
    preset: "this_month",
    from: "2026-11-01",
    to: "2026-11-10",
    product_id: null,
    category_id: null,
    channel: null,
    channel_applies: true,
  };
  const sales = parseSalesSummary({
    filters,
    order_count: 2,
    units_sold: 3,
    gross_sales: 100,
    discount: 10,
    delivery_charge: 60,
    net_sales: 150,
  });
  assert.equal(sales?.filters.from, "2026-11-01");
  assert.equal(sales?.netSales, 150);
  const profit = parseProfitReport({
    filters,
    revenue: 80,
    cost: 30.5,
    profit: 49.5,
    margin_percent: 61.88,
    unknown_cost_lines: 1,
    unknown_cost_units: 1,
    unknown_cost_revenue: 20,
  });
  assert.equal(profit?.cost, 30.5);
  assert.equal(profit?.marginPercent, 61.88);
  const movements = parseMovementReport({
    filters: { ...filters, channel_applies: false },
    opening_balance: 10,
    opening: 0,
    purchase: 4,
    sale: -3,
    return: 1,
    cancel: 0,
    adjustment: -1,
    closing: 11,
  });
  assert.equal(movements?.returnTotal, 1);
  assert.equal(movements?.sale, -3);
  const delivery = parseDeliveryReport({
    filters,
    delivered: 4,
    returned: 1,
    cancelled: 0,
    return_rate_percent: null,
  });
  assert.equal(delivery?.returnRatePercent, null);
  const trend = parseTrendReport({
    filters,
    grain: "day",
    points: [{ start: "2026-11-10", net_sales: 0, profit: 0, unknown_cost_revenue: 0 }],
  });
  assert.equal(trend?.points[0]?.profit, 0);
});

test("mock sales follow the delivered-order rules and an empty range stays empty", () => {
  const sales = mockSales({ preset: "this_week" }, NOW);
  assert.equal(sales.filters.from, "2026-11-09");
  assert.equal(sales.filters.to, "2026-11-10");
  assert.equal(sales.netSales, sales.grossSales - sales.discount + sales.deliveryCharge);
  assert.ok(sales.orderCount > 0);

  const profit = mockProfit({ preset: "this_week" }, NOW);
  assert.ok((profit.unknownCostLines ?? 0) > 0);
  assert.ok(profit.profit != null);
  if (profit.profit != null && profit.cost != null) {
    assert.equal(Math.round((profit.revenue - profit.cost) * 100), Math.round(profit.profit * 100));
  }

  const empty = mockSales({ from: "2020-01-01", to: "2020-01-07" }, NOW);
  assert.equal(empty.orderCount, 0);
  assert.equal(empty.netSales, 0);
  const emptyProfit = mockProfit({ from: "2020-01-01", to: "2020-01-07" }, NOW);
  assert.equal(emptyProfit.profit, null);
  assert.equal(emptyProfit.cost, null);
  const emptyDelivery = mockDelivery({ from: "2020-01-01", to: "2020-01-07" }, NOW);
  assert.equal(emptyDelivery.delivered, 0);
  assert.equal(emptyDelivery.returnRatePercent, null);
  const emptyProducts = mockProducts({ from: "2020-01-01", to: "2020-01-07" }, NOW);
  assert.equal(emptyProducts.total, 0);
  assert.equal(emptyProducts.pages, 0);
});

test("channel website excludes orders with no channel, and an unknown product is refused", () => {
  const all = mockSales({ preset: "last_month" }, NOW);
  const website = mockSales({ preset: "last_month", channel: "website" }, NOW);
  assert.ok(website.orderCount < all.orderCount);
  assert.throws(
    () => mockSales({ preset: "this_month", productId: "99999999-9999-4999-8999-999999999999" }, NOW),
    /Product not found/,
  );
});

test("stock ignores the date window, and movement closing matches the ledger identity", () => {
  const stock = mockStock({ from: "2020-01-01", to: "2020-01-07" }, NOW);
  assert.equal(stock.periodApplies, false);
  assert.equal(stock.filters.channelApplies, false);
  assert.equal(stock.summary.lowStockAt, 5);
  assert.equal(stock.summary.stockValue, 19700);
  assert.equal(stock.summary.unknownCostUnits, 12);
  assert.ok(stock.summary.lowStockCount >= 2);
  assert.equal(stock.asOf, "2026-11-10");

  const movements = mockMovements({ preset: "this_month" }, NOW);
  assert.equal(movements.filters.channelApplies, false);
  assert.ok(movements.sale < 0);
  assert.equal(
    movements.closing,
    movements.openingBalance +
      movements.opening +
      movements.purchase +
      movements.sale +
      movements.returnTotal +
      movements.cancel +
      movements.adjustment,
  );
});

test("trend uses day buckets up to 31 days and an empty day has profit 0", () => {
  const week = mockTrend({ preset: "this_week" }, NOW);
  assert.equal(week.grain, "day");
  assert.equal(week.points.length, 2);
  const empty = mockTrend({ from: "2020-01-01", to: "2020-01-03" }, NOW);
  assert.deepEqual(
    empty.points.map((point) => point.profit),
    [0, 0, 0],
  );
  const quarter = mockTrend({ from: "2026-08-01", to: "2026-11-01" }, NOW);
  assert.equal(quarter.grain, "month");
});

test("the mock workbook states the report, timezone, and dates", async () => {
  const bytes = mockReportWorkbook("sales", { preset: "this_month" }, NOW);
  const rows = await readFirstSheet(bytes);
  assert.equal(rows[0]?.[1], "Sales");
  assert.equal(rows[1]?.[1], "Asia/Dhaka");
  assert.equal(rows[2]?.[1], "2026-11-01");
  assert.equal(rows[3]?.[1], "2026-11-10");
});

test("dashboard ranges map onto report presets or an equal Dhaka window", () => {
  assert.deepEqual(dashboardReportCall("this-month", "", "", NOW), { preset: "this_month" });
  assert.deepEqual(dashboardReportCall("last-month", "", "", NOW), { preset: "last_month" });
  assert.deepEqual(dashboardReportCall("today", "", "", NOW), { from: "2026-11-10", to: "2026-11-10" });
  assert.deepEqual(dashboardReportCall("7d", "", "", NOW), { from: "2026-11-04", to: "2026-11-10" });
});
