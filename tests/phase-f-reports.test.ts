import assert from "node:assert/strict";
import test from "node:test";

import { ADMIN_NAV, currentAdminPage, isWideAdminPath } from "@/app/admin/_config/nav";
import {
  REPORT_PAGES,
  presetBounds,
  reportSearchParams,
  resolveReportCall,
} from "@/lib/admin/reports";
import { readFirstSheet } from "@/lib/admin/xlsx-lite";
import {
  mockReportWorkbook,
  REPORT_EXPORT_KINDS,
} from "@/lib/mart-mock/reports";

const NOW = new Date("2026-11-21T06:00:00.000Z");

test("Phase F: all 7 SaaS report routes exist in REPORT_PAGES, sidebar nav, and wide-layout rules", () => {
  const expected = [
    "/admin/reports",
    "/admin/reports/profit-loss",
    "/admin/reports/products",
    "/admin/reports/sales",
    "/admin/reports/inventory",
    "/admin/reports/suppliers",
    "/admin/reports/delivery-coupons",
  ];
  assert.deepEqual(
    REPORT_PAGES.map((p) => p.href),
    expected,
  );

  const reportsGroup = ADMIN_NAV.find((g) => g.title === "Reports & Analytics");
  assert.ok(reportsGroup, "Reports & Analytics group missing");
  const branch = reportsGroup.items.find((item) => Array.isArray(item.children));
  assert.ok(branch && branch.children);
  assert.deepEqual(
    branch.children.map((c) => c.href),
    expected,
  );

  for (const href of expected) {
    assert.equal(isWideAdminPath(href), true, `Expected wide layout on ${href}`);
    assert.ok(currentAdminPage(href).label.length > 0, `Missing label for ${href}`);
  }
});

test("Phase F: extended date presets resolve in Asia/Dhaka and reportSearchParams serializes all SaaS filters", () => {
  assert.deepEqual(presetBounds("today", NOW), { from: "2026-11-21", to: "2026-11-21" });
  assert.deepEqual(presetBounds("7d", NOW), { from: "2026-11-15", to: "2026-11-21" });
  assert.deepEqual(presetBounds("this_year", NOW), { from: "2026-01-01", to: "2026-11-21" });

  const resolved = resolveReportCall({ preset: "7d" }, NOW);
  assert.equal(resolved.preset, "7d");
  assert.equal(resolved.from, "2026-11-15");
  assert.equal(resolved.to, "2026-11-21");

  const params = reportSearchParams({
    preset: "this_month",
    origin: "offline",
    supplierId: "11111111-1111-4111-8111-111111111111",
    categoryId: "22222222-2222-4222-8222-222222222222",
    productId: "33333333-3333-4333-8333-333333333333",
    profitFilter: "loss",
    grain: "week",
    sort: "profit",
  });
  assert.equal(params.get("preset"), "this_month");
  assert.equal(params.get("origin"), "offline");
  assert.equal(params.get("supplier_id"), "11111111-1111-4111-8111-111111111111");
  assert.equal(params.get("category_id"), "22222222-2222-4222-8222-222222222222");
  assert.equal(params.get("product_id"), "33333333-3333-4333-8333-333333333333");
  assert.equal(params.get("profit_filter"), "loss");
  assert.equal(params.get("grain"), "week");
  assert.equal(params.get("sort"), "profit");
});

test("Phase F: all 11 SaaS report export kinds produce valid .xlsx workbooks in mock mode", async () => {
  for (const kind of [
    "sales",
    "profit",
    "profit-loss",
    "products",
    "channels",
    "suppliers",
    "stock",
    "movements",
    "delivery",
    "trend",
    "coupons",
  ] as const) {
    assert.ok(
      (REPORT_EXPORT_KINDS as readonly string[]).includes(kind),
      `Missing export kind ${kind}`,
    );
    const bytes = mockReportWorkbook(kind, { preset: "this_month" }, NOW);
    const sheet = await readFirstSheet(bytes);
    assert.ok(sheet.length >= 2, `Empty workbook for ${kind}`);
    assert.equal(sheet[0]?.[0], "Report");
  }
});
