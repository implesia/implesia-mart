import assert from "node:assert/strict";
import test from "node:test";

import {
  LOW_STOCK_THRESHOLD,
  dhakaMonthRange,
  dhakaWeekRange,
  filterMovements,
  adjustmentBody,
  grandTotal,
  importResultMessage,
  inDhakaDateRange,
  isLowStock,
  lineTotal,
  mapImportPreview,
  previewImportSheet,
  purchaseChoicesFromProduct,
  purchaseItemBody,
  readDuplicateFile,
  sha256Hex,
  validatePurchaseDraft,
  weightedAverageCost,
  type ImportLookups,
  type PurchaseProductSource,
  type StockMovementType,
} from "@/lib/admin/inventory";
import { canWriteInventory } from "@/lib/admin/staff-role";
import { readFirstSheet, workbookBytes } from "@/lib/admin/xlsx-lite";
import {
  MOCK_ACTOR_ID,
  SEED_PRODUCTS,
  confirmWorkbook,
  createPurchase,
  previewWorkbook,
  recordOpeningStock,
  seedInventory,
} from "@/lib/mart-mock/inventory";

const NOW = new Date("2026-11-09T06:00:00.000Z");

const PURCHASE_HEADERS = [
  "supplier_name",
  "supplier_phone",
  "supplier_address",
  "supplier_note",
  "invoice_no",
  "purchased_on",
  "product_id",
  "sku",
  "variant_id",
  "quantity",
  "unit_cost",
];

test("purchase line totals and grand total use two decimal places", () => {
  assert.equal(lineTotal(3, 10.5), 31.5);
  assert.equal(lineTotal(2, 10.005), 20.01);
  assert.equal(
    grandTotal([
      { quantity: 2, unitCost: 450 },
      { quantity: 1, unitCost: 10.5 },
    ]),
    910.5,
  );
});

test("weighted average cost follows the server formula used only by the mock", () => {
  assert.equal(weightedAverageCost(8, 450, 2, 500), 460);
  assert.equal(weightedAverageCost(0, 450, 4, 125.5), 125.5);
  assert.equal(weightedAverageCost(6, null, 2, 80), 80);
  assert.equal(weightedAverageCost(4, 10, 0, 99), 10);
});

test("Asia/Dhaka week and month ranges, including the UTC date boundary", () => {
  assert.deepEqual(dhakaWeekRange(NOW), { from: "2026-11-09", to: "2026-11-15" });
  assert.deepEqual(dhakaMonthRange(NOW), { from: "2026-11-01", to: "2026-11-30" });
  assert.equal(inDhakaDateRange("2026-11-08T20:00:00.000Z", "2026-11-09", "2026-11-15"), true);
  assert.equal(inDhakaDateRange("2026-11-08T17:00:00.000Z", "2026-11-09", "2026-11-15"), false);
  assert.equal(inDhakaDateRange("2026-10-31T18:30:00.000Z", "2026-11-01", "2026-11-30"), true);
  assert.equal(inDhakaDateRange("2026-10-31T17:00:00.000Z", "2026-11-01", "2026-11-30"), false);
});

test("stock history filters by date, product, and movement type", () => {
  const rows = [
    movement("2026-11-09T04:00:00.000Z", "p1", "sale"),
    movement("2026-11-08T17:00:00.000Z", "p1", "purchase"),
    movement("2026-11-02T06:00:00.000Z", "p2", "adjustment"),
    movement("2026-10-01T06:00:00.000Z", "p1", "opening"),
  ];
  const week = dhakaWeekRange(NOW);
  const thisWeek = filterMovements(rows, {
    from: week.from,
    to: week.to,
    productId: null,
    type: null,
  });
  assert.deepEqual(
    thisWeek.map((row) => row.movementType),
    ["sale"],
  );
  const month = dhakaMonthRange(NOW);
  const adjustments = filterMovements(rows, {
    from: month.from,
    to: month.to,
    productId: "p2",
    type: "adjustment",
  });
  assert.equal(adjustments.length, 1);
  assert.equal(adjustments[0]?.productId, "p2");
});

test("import preview marks a valid purchase row and an invalid one", () => {
  const preview = previewImportSheet(
    "purchases",
    [
      PURCHASE_HEADERS,
      ["Dhaka Gadgets", "", "", "", "INV-1", "2026-11-09", "", "NV-EAR-01", "", "2", "500"],
      ["Missing Co", "", "", "", "", "09-11-2026", "", "NO-SUCH", "", "x", "-1"],
    ],
    sampleLookups(),
    "hash-1",
  );
  assert.equal(preview.validCount, 1);
  assert.equal(preview.invalidCount, 1);
  assert.equal(preview.rows[0]?.valid, true);
  assert.equal(preview.rows[0]?.action, "purchase");
  assert.match(preview.rows[0]?.summary ?? "", /Receive 2 at 500/);
  assert.equal(preview.rows[1]?.valid, false);
  assert.match(preview.rows[1]?.errors.join(" ") ?? "", /date/i);
  assert.match(preview.rows[1]?.errors.join(" ") ?? "", /SKU/);
});

test("opening stock preview rejects a second opening and a quantity that would change stock", () => {
  const lookups = sampleLookups();
  lookups.openingProductIds.add(SEED_PRODUCTS[0].id);
  const preview = previewImportSheet(
    "opening",
    [
      ["product_id", "sku", "variant_id", "quantity"],
      ["", "NV-EAR-01", "", "4"],
      ["", "LN-DRS-04", "", "0"],
    ],
    lookups,
    "hash-2",
  );
  assert.equal(preview.rows[0]?.valid, false);
  assert.match(preview.rows[0]?.errors.join(" ") ?? "", /already recorded/i);
  assert.equal(preview.rows[1]?.valid, false);
  assert.match(preview.rows[1]?.errors.join(" ") ?? "", /current stock/i);
});

test("cost price preview and API preview mapping", () => {
  const preview = previewImportSheet(
    "cost_price",
    [
      ["product_id", "sku", "variant_id", "unit_cost"],
      ["", "LN-DRS-04", "", "880.5"],
      ["", "MISSING", "", "nope"],
    ],
    sampleLookups(),
    "hash-3",
  );
  assert.equal(preview.rows[0]?.valid, true);
  assert.equal(preview.rows[0]?.action, "cost");
  assert.match(preview.rows[0]?.summary ?? "", /880\.5/);
  assert.equal(preview.rows[1]?.valid, false);

  const mapped = mapImportPreview({
    import_type: "cost_price",
    file_hash: "abc",
    duplicate: false,
    valid_count: 1,
    invalid_count: 1,
    rows: [
      { row: 2, valid: true, action: "cost", errors: [], summary: "Cost price 900 → 880.5 (Linen Dress)" },
      { row: 3, valid: false, action: "none", errors: ["Enter a unit cost."], summary: "" },
    ],
  });
  assert.equal(mapped?.importType, "cost_price");
  assert.equal(mapped?.validCount, 1);
  assert.equal(mapped?.rows[1]?.valid, false);
  assert.equal(mapped?.rows[0]?.summary.includes("880.5"), true);
  assert.equal(
    readDuplicateFile({
      error: {
        code: "conflict",
        message: "This file was already imported. Confirm to import it again.",
        details: { file_hash: "abc" },
      },
    })?.fileHash,
    "abc",
  );
  assert.equal(readDuplicateFile({ error: { code: "duplicate_file", message: "Again", file_hash: "abc" } }), null);
});

test("a repeated file is flagged on preview and rejected on confirm until confirm_duplicate", async () => {
  const state = { ...seedInventory(NOW), importHashes: [] as string[] };
  const bytes = workbookBytes("Cost", [
    ["product_id", "sku", "variant_id", "unit_cost"],
    ["", "NV-EAR-01", "", "410"],
  ]);
  const fileHash = await sha256Hex(bytes);
  const seen = { ...state, importHashes: [fileHash] };
  const preview = await previewWorkbook(seen, "cost_price", bytes, fileHash);
  assert.equal(preview.preview?.duplicate, true);
  assert.equal(preview.preview?.rows[0]?.valid, true);
  const blocked = await confirmWorkbook(seen, "cost_price", bytes, fileHash, MOCK_ACTOR_ID, NOW, false);
  assert.match(blocked.error ?? "", /already imported/i);
  assert.equal(blocked.duplicateHash, fileHash);
  const allowed = await confirmWorkbook(seen, "cost_price", bytes, fileHash, MOCK_ACTOR_ID, NOW, true);
  assert.equal(allowed.error, null);
  assert.equal(allowed.saved, 1);
  assert.equal(allowed.state.stock.find((row) => row.sku === "NV-EAR-01")?.costPrice, 410);
});

test("a purchase updates mock stock with the server weighted average; the response has no total", () => {
  const state = seedInventory(NOW);
  const result = createPurchase(
    state,
    {
      supplierId: state.suppliers[0]!.id,
      purchasedOn: "2026-11-09",
      invoiceNo: "INV-9",
      note: "",
      items: [{ productId: SEED_PRODUCTS[0].id, quantity: 2, unitCost: 500 }],
    },
    MOCK_ACTOR_ID,
    NOW,
  );
  assert.equal(result.error, null);
  assert.equal(result.purchase && "totalAmount" in result.purchase, false);
  assert.equal(
    grandTotal((result.purchase?.items ?? []).map((item) => ({ quantity: item.quantity, unitCost: item.unitCost }))),
    1000,
  );
  const stock = result.state.stock.find((row) => row.productId === SEED_PRODUCTS[0].id);
  assert.equal(stock?.quantity, 10);
  assert.equal(stock?.costPrice, 460);
  assert.equal(result.state.movements.at(-1)?.movementType, "purchase");
});

test("opening stock is recorded once and does not change the count", () => {
  const seeded = seedInventory(NOW);
  const state = {
    ...seeded,
    movements: seeded.movements.filter((movement) => movement.movementType !== "opening"),
  };
  const first = recordOpeningStock(state, MOCK_ACTOR_ID, NOW);
  assert.equal(first.created, 2);
  assert.equal(first.state.stock.find((row) => row.productId === SEED_PRODUCTS[0].id)?.quantity, 8);
  const second = recordOpeningStock(first.state, MOCK_ACTOR_ID, NOW);
  assert.equal(second.created, 0);
  assert.equal(second.alreadyRecorded, 2);
  assert.equal(second.state.stock.find((row) => row.productId === SEED_PRODUCTS[0].id)?.quantity, 8);
});

test("confirming an import saves valid rows and skips invalid ones", async () => {
  const state = seedInventory(NOW);
  const bytes = workbookBytes("Cost", [
    ["product_id", "sku", "variant_id", "unit_cost"],
    ["", "NV-EAR-01", "", "410"],
    ["", "MISSING", "", "10"],
  ]);
  const fileHash = await sha256Hex(bytes);
  const saved = await confirmWorkbook(state, "cost_price", bytes, fileHash, MOCK_ACTOR_ID, NOW, false);
  assert.equal(saved.error, null);
  assert.equal(saved.saved, 1);
  assert.equal(saved.skipped, 1);
  assert.equal(saved.state.stock.find((row) => row.sku === "NV-EAR-01")?.costPrice, 410);
  assert.equal(importResultMessage(saved.saved, saved.skipped), "1 row saved. 1 skipped.");
});

test("viewer cannot write inventory; editor and superadmin can", () => {
  assert.equal(canWriteInventory("viewer"), false);
  assert.equal(canWriteInventory("editor"), true);
  assert.equal(canWriteInventory("superadmin"), true);
  assert.equal(canWriteInventory(null), true);
  assert.equal(LOW_STOCK_THRESHOLD, 5);
  assert.equal(isLowStock(5), true);
  assert.equal(isLowStock(0), true);
  assert.equal(isLowStock(6), false);
  assert.equal(isLowStock(null), false);
});

test("xlsx round trip keeps header and values", async () => {
  const bytes = workbookBytes("Purchases", [
    ["sku", "quantity", "unit_cost"],
    ["NV-EAR-01", "2", "500"],
    ["Name, with comma", "1", "10.5"],
  ]);
  const rows = await readFirstSheet(bytes);
  assert.equal(rows[0]?.[0], "sku");
  assert.equal(rows[1]?.[1], "2");
  assert.equal(rows[2]?.[0], "Name, with comma");
  assert.equal(rows[2]?.[2], "10.5");
});

const SIMPLE: PurchaseProductSource = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Plain earbuds",
  sku: "NV-EAR-01",
  quantity: 8,
  costPrice: 450,
  hasVariants: false,
  variants: [],
};

const VARIANT: PurchaseProductSource = {
  id: "9c30505f-1111-4111-8111-111111111111",
  name: "Linen dress",
  sku: "linen-dress",
  quantity: 12,
  costPrice: 700,
  hasVariants: true,
  variants: [
    { id: "aaaaaaaa-1111-4111-8111-111111111111", label: "S / Red", sku: "DRS-S-RED", quantity: 5 },
    { id: "bbbbbbbb-1111-4111-8111-111111111111", label: "M / Blue", sku: "DRS-M-BLU", quantity: 7 },
  ],
};

test("purchase search lists a plain product once and each option of a variant product", () => {
  const plain = purchaseChoicesFromProduct(SIMPLE);
  assert.equal(plain.length, 1);
  assert.equal(plain[0]?.variantId, null);
  assert.equal(plain[0]?.needsVariant, false);
  assert.equal(plain[0]?.sku, "NV-EAR-01");

  const options = purchaseChoicesFromProduct(VARIANT);
  assert.deepEqual(
    options.map((row) => [row.id, row.variantId, row.optionLabel, row.sku, row.quantity]),
    [
      [VARIANT.id, "aaaaaaaa-1111-4111-8111-111111111111", "S / Red", "DRS-S-RED", 5],
      [VARIANT.id, "bbbbbbbb-1111-4111-8111-111111111111", "M / Blue", "DRS-M-BLU", 7],
    ],
  );
  assert.equal(options.every((row) => row.needsVariant === false), true);

  const unloaded = purchaseChoicesFromProduct({ ...VARIANT, variants: [] });
  assert.equal(unloaded.length, 1);
  assert.equal(unloaded[0]?.needsVariant, true);
  assert.equal(unloaded[0]?.variantId, null);
});

test("purchase and adjustment payloads send variant_id and never sku", () => {
  const plain = purchaseItemBody({ productId: SIMPLE.id, variantId: null, quantity: 50, unitCost: 700 });
  assert.deepEqual(plain, { product_id: SIMPLE.id, quantity: 50, unit_cost: 700 });
  assert.equal("variant_id" in plain, false);
  assert.equal("sku" in plain, false);

  const option = purchaseItemBody({
    productId: VARIANT.id,
    variantId: VARIANT.variants[1]?.id,
    quantity: 50,
    unitCost: 700,
  });
  assert.deepEqual(option, {
    product_id: VARIANT.id,
    variant_id: "bbbbbbbb-1111-4111-8111-111111111111",
    quantity: 50,
    unit_cost: 700,
  });
  assert.equal("sku" in option, false);

  const adjustment = adjustmentBody({
    productId: VARIANT.id,
    variantId: VARIANT.variants[0]?.id,
    quantity: -2,
    reason: "Count",
  });
  assert.equal(adjustment.variant_id, "aaaaaaaa-1111-4111-8111-111111111111");
  assert.equal("sku" in adjustment, false);
  const plainAdjustment = adjustmentBody({
    productId: SIMPLE.id,
    variantId: null,
    quantity: 3,
    reason: "Found",
  });
  assert.equal("variant_id" in plainAdjustment, false);
});

test("a variant purchase line without an option is refused before save", () => {
  const issues = validatePurchaseDraft({
    supplierId: "c73f0000-1111-4111-8111-111111111111",
    purchasedOn: "2026-11-01",
    invoiceNo: "",
    note: "",
    lines: [
      { productId: SIMPLE.id, quantity: "50", unitCost: "700", variantId: null, tracksVariants: false },
      { productId: VARIANT.id, quantity: "50", unitCost: "700", variantId: null, tracksVariants: true },
    ],
  });
  assert.equal(
    issues.some((issue) => issue.field === "lines.1.variantId"),
    true,
  );
  assert.equal(
    issues.some((issue) => issue.field.startsWith("lines.0")),
    false,
  );
});

function movement(createdAt: string, productId: string, movementType: StockMovementType) {
  return { createdAt, productId, movementType };
}

function sampleLookups(): ImportLookups {
  const products = SEED_PRODUCTS.map((product) => ({
    id: product.id,
    name: product.name,
    sku: product.sku,
    quantity: product.quantity,
    costPrice: product.costPrice,
  }));
  return {
    suppliersByName: new Map([["dhaka gadgets", { id: "sup-1", count: 1 }]]),
    productsBySku: new Map(products.map((product) => [product.sku.toLowerCase(), product])),
    productsById: new Map(products.map((product) => [product.id, product])),
    openingProductIds: new Set(),
  };
}
