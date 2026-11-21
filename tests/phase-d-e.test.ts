import assert from "node:assert/strict";
import test from "node:test";

import {
  ADMIN_NAV,
  adminBackHref,
  currentAdminPage,
  isAdminBranchActive,
  isWideAdminPath,
} from "@/app/admin/_config/nav";
import {
  parseChannelBreakdownReport,
  parseProductAnalyticsReport,
  parseProfitLossReport,
  parseSupplierPerformanceReport,
  presetBounds,
  reportSearchParams,
} from "@/lib/admin/reports";
import {
  rowsFromVariants,
  rowsToVariants,
  validateVariants,
  variantPayload,
  type VariantRow,
} from "@/lib/mart-api/admin-variants";

const NOW = new Date("2026-11-10T06:00:00.000Z");

test("SaaS admin navigation resolves groups, labels, back hrefs, and wide paths", () => {
  assert.deepEqual(currentAdminPage("/admin/reports/profit-loss"), {
    group: "Reports & Analytics",
    label: "Profit & Loss",
  });
  assert.deepEqual(currentAdminPage("/admin/reports/products"), {
    group: "Reports & Analytics",
    label: "Product Analytics",
  });
  assert.deepEqual(
    currentAdminPage("/admin/products/11111111-1111-4111-8111-111111111111/view"),
    {
      group: "Product Management",
      label: "Product details",
    },
  );
  assert.equal(
    adminBackHref("/admin/products/11111111-1111-4111-8111-111111111111/view"),
    "/admin/products",
  );
  assert.equal(isWideAdminPath("/admin/reports/profit-loss"), true);
  assert.equal(isWideAdminPath("/admin/products/11111111-1111-4111-8111-111111111111/view"), true);

  const productGroup = ADMIN_NAV.find((g) => g.title === "Product Management")!.items[0];
  assert.equal(isAdminBranchActive("/admin/badges", productGroup), true);

  const invGroup = ADMIN_NAV.find((g) => g.title === "Inventory Management")!.items[0];
  assert.equal(isAdminBranchActive("/admin/inventory/purchases/new", invGroup), true);
});

test("Phase B/D report presets, filters, and SaaS parsers work cleanly", () => {
  assert.deepEqual(presetBounds("today", NOW), { from: "2026-11-10", to: "2026-11-10" });
  assert.deepEqual(presetBounds("7d", NOW), { from: "2026-11-04", to: "2026-11-10" });
  assert.deepEqual(presetBounds("this_year", NOW), { from: "2026-01-01", to: "2026-11-10" });

  const sp = reportSearchParams({
    preset: "7d",
    supplierId: "11111111-1111-4111-8111-111111111111",
    origin: "offline",
    profitFilter: "loss",
    sort: "profit",
  });
  assert.equal(sp.get("preset"), "7d");
  assert.equal(sp.get("supplier_id"), "11111111-1111-4111-8111-111111111111");
  assert.equal(sp.get("origin"), "offline");
  assert.equal(sp.get("profit_filter"), "loss");
  assert.equal(sp.get("sort"), "profit");

  const filters = {
    timezone: "Asia/Dhaka",
    preset: "7d",
    from: "2026-11-04",
    to: "2026-11-10",
    product_id: null,
    category_id: null,
    supplier_id: null,
    channel: null,
    origin: null,
    profit_filter: null,
    channel_applies: true,
  };

  const pnl = parseProfitLossReport({
    filters,
    gross_sales: 1000,
    product_discount: 100,
    coupon_discount: 50,
    manual_discount: 25,
    delivery_charge: 60,
    returned_order_value: 200,
    net_realized_sales: 885,
    total_cost: 500,
    gross_profit: 325,
    loss_amount: 40,
    net_profit: 325,
    margin_percent: 39.39,
    collected_amount: 800,
    due_amount: 85,
    unknown_cost_lines: 0,
    unknown_cost_units: 0,
    unknown_cost_revenue: 0,
  });
  assert.equal(pnl?.netRealizedSales, 885);
  assert.equal(pnl?.lossAmount, 40);
  assert.equal(pnl?.dueAmount, 85);

  const ch = parseChannelBreakdownReport({
    filters,
    channels: [
      {
        origin: "online",
        channel: "website",
        order_count: 3,
        units: 5,
        net_sales: 1500,
        cogs: 900,
        profit: 540,
        margin_percent: 37.5,
        collected: 1500,
        due: 0,
        unknown_cost_units: 0,
      },
    ],
    payment_methods: [
      {
        payment_method: "cod",
        order_count: 3,
        units: 5,
        net_sales: 1500,
        cogs: 900,
        profit: 540,
        margin_percent: 37.5,
        collected: 1500,
        due: 0,
        unknown_cost_units: 0,
      },
    ],
  });
  assert.equal(ch?.channels[0]?.origin, "online");
  assert.equal(ch?.paymentMethods[0]?.paymentMethod, "cod");

  const sup = parseSupplierPerformanceReport({
    filters,
    items: [
      {
        supplier_id: "11111111-1111-4111-8111-111111111111",
        supplier_name: "Alpha Vendor",
        linked_products_count: 2,
        purchase_count: 1,
        total_purchased_units: 10,
        total_purchase_spend: 5000,
        units_sold: 4,
        sales_revenue: 3200,
        cogs: 2000,
        net_profit: 1200,
        margin_percent: 37.5,
        current_stock_units: 6,
        current_stock_value: 3000,
        unknown_cost_units: 0,
      },
    ],
    total_purchase_spend: 5000,
    total_sales_revenue: 3200,
    total_cogs: 2000,
    total_net_profit: 1200,
  });
  assert.equal(sup?.items[0]?.supplierName, "Alpha Vendor");
  assert.equal(sup?.totalNetProfit, 1200);

  const analytics = parseProductAnalyticsReport({
    product_id: "22222222-2222-4222-8222-222222222222",
    title: "Smart Lamp",
    slug: "smart-lamp",
    supplier_id: "11111111-1111-4111-8111-111111111111",
    supplier_name: "Alpha Vendor",
    current_stock: 8,
    current_cost_price: 500,
    selling_price: 850,
    current_stock_value: 4000,
    potential_retail_value: 6800,
    lifetime: {
      units_sold: 10,
      revenue: 8500,
      cogs: 5000,
      profit: 3500,
      is_loss: false,
      margin_percent: 41.18,
      return_count: 1,
      returned_units: 1,
      unknown_cost_units: 0,
    },
    last_30_days: {
      units_sold: 3,
      revenue: 2550,
      cogs: 1500,
      profit: 1050,
      is_loss: false,
      margin_percent: 41.18,
      return_count: 0,
      returned_units: 0,
      unknown_cost_units: 0,
    },
    recent_movements: [],
  });
  assert.equal(analytics?.lifetime.profit, 3500);
  assert.equal(analytics?.supplierName, "Alpha Vendor");
});

test("variant cost_price validates, serializes, and round-trips", () => {
  const groups = [
    {
      id: "size",
      name: "Size",
      kind: "size" as const,
      values: [{ id: "m", label: "M", swatch: "" }],
    },
  ];
  const badRow: VariantRow = {
    key: "r1",
    options: { size: "m" },
    sku: "M-1",
    price: "500",
    compareAtPrice: "",
    costPrice: "-10",
    quantity: "5",
    isActive: true,
  };
  const badCheck = validateVariants([badRow], groups);
  assert.equal(badCheck.ok, false);
  assert.ok(badCheck.rows.r1?.costPrice);

  const okRow: VariantRow = { ...badRow, costPrice: "320.5" };
  assert.equal(validateVariants([okRow], groups).ok, true);
  assert.equal(variantPayload(okRow).cost_price, 320.5);

  const roundTripped = rowsToVariants(rowsFromVariants([{ id: "v1", options: { size: "m" }, sku: "M-1", price: 500, compareAtPrice: null, costPrice: 320.5, quantity: 5, isActive: true }]));
  assert.equal(roundTripped[0]?.costPrice, 320.5);
});
