/**
 * Inventory rules for the admin UI. The Mart API is the source of truth once
 * the inventory endpoints exist. These helpers check the same limits early and
 * drive the local mock until that API is mounted.
 *
 * Nothing in this module is imported by the storefront. Cost and stock
 * adjustments stay on admin pages.
 */

import { parseCostPriceInput } from "@/lib/admin/cost-price";

/** On-hand at or below this count shows a low-stock warning. There is no store setting for it yet. */
export const LOW_STOCK_THRESHOLD = 5;

export const STOCK_MOVEMENT_TYPES = [
  "opening",
  "purchase",
  "sale",
  "return",
  "cancel",
  "adjustment",
] as const;

export type StockMovementType = (typeof STOCK_MOVEMENT_TYPES)[number];

/** Form field `import_type` and the template path kind. From `ImportKind` on the ledger branch. */
export const IMPORT_KINDS = ["purchases", "opening", "stock_count", "cost_price"] as const;
export type ImportKind = (typeof IMPORT_KINDS)[number];

/** `GET /exports/{kind}`. There is no supplier export. */
export const EXPORT_KINDS = ["products", "purchases", "movements"] as const;
export type ExportKind = (typeof EXPORT_KINDS)[number];

/** Monday is the first day. Weeks are counted in Asia/Dhaka. */
export const WEEK_STARTS_ON = 1;

const DHAKA_OFFSET_MS = 6 * 60 * 60 * 1000;

export type DhakaParts = {
  year: number;
  month: number;
  day: number;
  /** 0 Sunday … 6 Saturday, in Asia/Dhaka. */
  weekday: number;
};

export function dhakaParts(instant: Date): DhakaParts {
  const shifted = new Date(instant.getTime() + DHAKA_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    weekday: shifted.getUTCDay(),
  };
}

export function dhakaDateString(instant: Date) {
  const parts = dhakaParts(instant);
  return isoDate(parts.year, parts.month, parts.day);
}

function isoDate(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function parseIsoDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() !== month - 1 ||
    probe.getUTCDate() !== day
  ) {
    return null;
  }
  return { year, month, day };
}

function addDays(year: number, month: number, day: number, days: number) {
  const probe = new Date(Date.UTC(year, month - 1, day + days));
  return {
    year: probe.getUTCFullYear(),
    month: probe.getUTCMonth() + 1,
    day: probe.getUTCDate(),
  };
}

/** Inclusive calendar range for the current Monday–Sunday week in Asia/Dhaka. */
export function dhakaWeekRange(now: Date) {
  const parts = dhakaParts(now);
  const sinceMonday = (parts.weekday - WEEK_STARTS_ON + 7) % 7;
  const start = addDays(parts.year, parts.month, parts.day, -sinceMonday);
  const end = addDays(start.year, start.month, start.day, 6);
  return { from: isoDate(start.year, start.month, start.day), to: isoDate(end.year, end.month, end.day) };
}

/** Inclusive calendar range for the current month in Asia/Dhaka. */
export function dhakaMonthRange(now: Date) {
  const parts = dhakaParts(now);
  const last = new Date(Date.UTC(parts.year, parts.month, 0)).getUTCDate();
  return {
    from: isoDate(parts.year, parts.month, 1),
    to: isoDate(parts.year, parts.month, last),
  };
}

export type DatePreset = "week" | "month" | "custom";

export function presetRange(preset: Exclude<DatePreset, "custom">, now: Date) {
  return preset === "week" ? dhakaWeekRange(now) : dhakaMonthRange(now);
}

/**
 * True when `iso` falls on a Dhaka calendar date inside the inclusive range.
 * A missing bound is open. An unreadable instant is outside every range.
 */
export function inDhakaDateRange(iso: string, from: string | null, to: string | null) {
  const instant = new Date(iso);
  if (Number.isNaN(instant.getTime())) return false;
  const day = dhakaDateString(instant);
  if (from && day < from) return false;
  if (to && day > to) return false;
  return true;
}

export function formatDhakaDate(isoDateValue: string) {
  const parts = parseIsoDate(isoDateValue);
  if (!parts) return "—";
  const instant = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 6, 0, 0));
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Dhaka",
  }).format(instant);
}

export function formatDhakaDateTime(iso: string) {
  const instant = new Date(iso);
  if (Number.isNaN(instant.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Dhaka",
  }).format(instant);
}

export function formatTakaAmount(value: number) {
  const rounded = Math.round(value * 100) / 100;
  const hasFraction = Math.round(Math.abs(rounded) * 100) % 100 !== 0;
  return `৳${rounded.toLocaleString("en-US", {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: hasFraction ? 2 : 0,
  })}`;
}

export function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export function lineTotal(quantity: number, unitCost: number) {
  return roundMoney(quantity * unitCost);
}

export function grandTotal(lines: Array<{ quantity: number; unitCost: number }>) {
  return roundMoney(lines.reduce((sum, line) => sum + line.quantity * line.unitCost, 0));
}

/**
 * The server's weighted-average formula (`inventory_service.weighted_average_cost`).
 * The live UI never calls this. The mock uses it so a later product refetch shows
 * the cost the server would have stored. Half-up to 2 decimals for positive money.
 */
export function weightedAverageCost(
  oldQuantity: number,
  oldCost: number | null,
  addQuantity: number,
  unitCost: number,
) {
  const incoming = Math.max(0, addQuantity);
  if (incoming === 0) return oldCost == null ? null : roundMoney(oldCost);
  const held = Math.max(0, oldQuantity);
  if (held === 0 || oldCost == null) return roundMoney(unitCost);
  return roundMoney((held * oldCost + incoming * unitCost) / (held + incoming));
}

export function isLowStock(quantity: number | null) {
  return quantity != null && quantity <= LOW_STOCK_THRESHOLD;
}

export function isStockMovementType(value: string): value is StockMovementType {
  return (STOCK_MOVEMENT_TYPES as readonly string[]).includes(value);
}

const MOVEMENT_LABEL: Record<StockMovementType, string> = {
  opening: "Opening",
  purchase: "Purchase",
  sale: "Sale",
  return: "Return",
  cancel: "Cancel",
  adjustment: "Adjustment",
};

export function movementLabel(type: StockMovementType) {
  return MOVEMENT_LABEL[type];
}

export type MovementFilter = {
  from: string | null;
  to: string | null;
  productId: string | null;
  type: StockMovementType | null;
};

export type MovementRow = {
  createdAt: string;
  productId: string | null;
  movementType: StockMovementType;
};

export function filterMovements<T extends MovementRow>(items: T[], filter: MovementFilter) {
  return items.filter((item) => {
    if (filter.productId && item.productId !== filter.productId) return false;
    if (filter.type && item.movementType !== filter.type) return false;
    return inDhakaDateRange(item.createdAt, filter.from, filter.to);
  });
}

export function parsePositiveQuantity(raw: string) {
  const text = canonicalizeInteger(raw);
  if (!/^[1-9]\d*$/.test(text)) {
    return { ok: false as const, message: "Enter a whole quantity of 1 or more." };
  }
  const value = Number(text);
  if (!Number.isSafeInteger(value) || value > 1_000_000) {
    return { ok: false as const, message: "Quantity cannot be more than 1,000,000." };
  }
  return { ok: true as const, value };
}

/** A stock adjustment delta: a non-zero whole number. Negative removes stock. */
export function parseAdjustmentQuantity(raw: string) {
  const text = canonicalizeInteger(raw);
  if (!/^-?[1-9]\d*$/.test(text)) {
    return { ok: false as const, message: "Enter a whole number other than 0. Use a minus to remove stock." };
  }
  const value = Number(text);
  if (!Number.isSafeInteger(value) || Math.abs(value) > 1_000_000) {
    return { ok: false as const, message: "Quantity cannot be more than 1,000,000." };
  }
  return { ok: true as const, value };
}

function canonicalizeInteger(raw: string) {
  return raw
    .trim()
    .replace(/[০-৯]/g, (digit) => String("০১২৩৪৫৬৭৮৯".indexOf(digit)))
    .replace(/^\+/, "");
}

export function parseUnitCost(raw: string) {
  const parsed = parseCostPriceInput(raw);
  if (!parsed.ok) return { ok: false as const, message: "Enter a unit cost of 0 or more, with up to 2 decimal places." };
  if (parsed.value == null) return { ok: false as const, message: "Enter a unit cost." };
  return { ok: true as const, value: parsed.value };
}

export function parseOptionalUnitCost(raw: string) {
  if (!raw.trim()) return { ok: true as const, value: null };
  return parseUnitCost(raw);
}

export type PurchaseLineInput = {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitCost: number;
};

export type PurchaseDraft = {
  supplierId: string;
  purchasedOn: string;
  invoiceNo: string;
  note: string;
  lines: PurchaseLineInput[];
};

export type FieldIssue = { field: string; message: string };

export function validatePurchaseDraft(draft: {
  supplierId: string;
  purchasedOn: string;
  invoiceNo: string;
  note?: string;
  lines: Array<{ productId: string; quantity: string; unitCost: string }>;
}): FieldIssue[] {
  const issues: FieldIssue[] = [];
  if (!draft.supplierId.trim()) issues.push({ field: "supplierId", message: "Choose a supplier." });
  if (!parseIsoDate(draft.purchasedOn)) {
    issues.push({ field: "purchasedOn", message: "Choose a purchase date." });
  }
  const invoice = draft.invoiceNo.trim();
  if (invoice.length > 64) issues.push({ field: "invoiceNo", message: "Invoice number must be 64 characters or fewer." });
  const note = (draft.note ?? "").trim();
  if (note.length > 500) issues.push({ field: "note", message: "Note must be 500 characters or fewer." });
  if (draft.lines.length === 0) issues.push({ field: "lines", message: "Add at least one product." });
  if (draft.lines.length > 100) issues.push({ field: "lines", message: "A purchase can have at most 100 lines." });
  draft.lines.forEach((line, index) => {
    if (!line.productId.trim()) {
      issues.push({ field: `lines.${index}.productId`, message: "Choose a product." });
    }
    const quantity = parsePositiveQuantity(line.quantity);
    if (!quantity.ok) issues.push({ field: `lines.${index}.quantity`, message: quantity.message });
    const cost = parseUnitCost(line.unitCost);
    if (!cost.ok) issues.push({ field: `lines.${index}.unitCost`, message: cost.message });
  });
  return issues;
}

export function issueFor(issues: FieldIssue[], field: string) {
  return issues.find((issue) => issue.field === field)?.message;
}

export type SheetRow = {
  /** 1-based worksheet row, including the header row. */
  row: number;
  cells: Record<string, string>;
};

/** `ImportPreviewRow` from the ledger schema. `summary` is the human line; there is no `data` object. */
export type ImportPreviewRow = {
  row: number;
  valid: boolean;
  action: string;
  errors: string[];
  summary: string;
};

export type ImportPreview = {
  importType: ImportKind | "";
  fileHash: string;
  duplicate: boolean;
  rows: ImportPreviewRow[];
  validCount: number;
  invalidCount: number;
};

/** Fields the mock needs to apply a preview. Not part of the API response. */
export type ClassifiedImportRow = ImportPreviewRow & {
  productId: string | null;
  variantId: string | null;
  sku: string;
  quantity: number | null;
  unitCost: number | null;
  supplierName: string;
  supplierPhone: string;
  supplierAddress: string;
  supplierNote: string;
  purchasedOn: string;
  invoiceNo: string;
  purchaseNote: string;
  counted: number | null;
  reason: string;
  title: string;
};

export type CatalogProduct = {
  id: string;
  name: string;
  sku: string;
  quantity: number | null;
  costPrice: number | null;
};

export type ImportLookups = {
  /** Lower-case supplier name → how many suppliers share it, and the first id. */
  suppliersByName: Map<string, { id: string; count: number }>;
  productsBySku: Map<string, CatalogProduct>;
  productsById: Map<string, CatalogProduct>;
  /** Product ids that already have an opening movement (product-level, no variant). */
  openingProductIds: Set<string>;
};

const TEMPLATE_HEADERS: Record<ImportKind, string[]> = {
  purchases: [
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
  ],
  opening: ["product_id", "sku", "variant_id", "quantity"],
  stock_count: ["product_id", "sku", "variant_id", "counted_qty", "reason"],
  cost_price: ["product_id", "sku", "variant_id", "unit_cost"],
};

export function templateHeaders(kind: ImportKind) {
  return TEMPLATE_HEADERS[kind];
}

export function templateSheet(kind: ImportKind): string[][] {
  return [templateHeaders(kind)];
}

/** Header row plus data rows. Header names are matched case-insensitively. */
export function sheetToRows(matrix: string[][]): { rows: SheetRow[]; missing: string[]; kindHeaders: string[] } {
  const header = (matrix[0] ?? []).map((cell) => cell.trim().toLowerCase());
  const rows: SheetRow[] = [];
  matrix.slice(1).forEach((cells, index) => {
    const record: Record<string, string> = {};
    let blank = true;
    header.forEach((name, column) => {
      if (!name) return;
      const value = (cells[column] ?? "").trim();
      if (value) blank = false;
      record[name] = value;
    });
    if (!blank) rows.push({ row: index + 2, cells: record });
  });
  return { rows, missing: [], kindHeaders: header };
}

function blankClassified(row: number): ClassifiedImportRow {
  return {
    row,
    valid: false,
    action: "none",
    errors: [],
    summary: "",
    productId: null,
    variantId: null,
    sku: "",
    quantity: null,
    unitCost: null,
    supplierName: "",
    supplierPhone: "",
    supplierAddress: "",
    supplierNote: "",
    purchasedOn: "",
    invoiceNo: "",
    purchaseNote: "",
    counted: null,
    reason: "",
    title: "",
  };
}

export function classifyImportSheet(
  kind: ImportKind,
  matrix: string[][],
  lookups: ImportLookups,
): ClassifiedImportRow[] {
  const header = (matrix[0] ?? []).map((cell) => cell.trim().toLowerCase());
  const expected = templateHeaders(kind);
  const missing = expected.filter((name) => !header.includes(name));
  if (missing.length > 0) {
    const row = blankClassified(1);
    row.errors = [`Missing column${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}.`];
    return [row];
  }
  const parsed = sheetToRows(matrix).rows;
  const seen = new Set<string>();
  return parsed.map((sheetRow) => classifyOne(kind, sheetRow, lookups, seen));
}

export function previewImportSheet(
  kind: ImportKind,
  matrix: string[][],
  lookups: ImportLookups,
  fileHash: string,
): ImportPreview {
  const classified = classifyImportSheet(kind, matrix, lookups);
  return previewFromClassified(kind, classified, fileHash, false);
}

export function previewFromClassified(
  kind: ImportKind,
  classified: ClassifiedImportRow[],
  fileHash: string,
  duplicate: boolean,
): ImportPreview {
  const rows = classified.map(toPreviewRow);
  const validCount = rows.filter((row) => row.valid).length;
  return {
    importType: kind,
    fileHash,
    duplicate,
    rows,
    validCount,
    invalidCount: rows.length - validCount,
  };
}

function toPreviewRow(row: ClassifiedImportRow): ImportPreviewRow {
  return {
    row: row.row,
    valid: row.valid,
    action: row.action,
    errors: row.errors,
    summary: row.summary,
  };
}

function classifyOne(
  kind: ImportKind,
  sheetRow: SheetRow,
  lookups: ImportLookups,
  seen: Set<string>,
): ClassifiedImportRow {
  const row = blankClassified(sheetRow.row);
  const productIdText = sheetRow.cells.product_id ?? "";
  const variantText = sheetRow.cells.variant_id ?? "";
  row.sku = sheetRow.cells.sku ?? "";
  if (productIdText && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productIdText)) {
    row.errors.push("product_id is not a valid id.");
  }
  if (variantText && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(variantText)) {
    row.errors.push("variant_id is not a valid id.");
  } else if (variantText) {
    row.variantId = variantText;
    row.errors.push("No variant matches this variant_id.");
  }
  if (!productIdText && !variantText && !row.sku) {
    row.errors.push("Enter a product_id or a sku. Products are never matched by name.");
  }
  let product: CatalogProduct | undefined;
  const productIdValid = Boolean(productIdText) && !row.errors.some((error) => error.startsWith("product_id"));
  if (productIdValid) {
    product = lookups.productsById.get(productIdText);
    if (!product) row.errors.push("No product matches this product_id.");
  } else if (row.sku && !variantText) {
    product = lookups.productsBySku.get(row.sku.toLowerCase());
    if (!product) row.errors.push(`No product uses SKU ${row.sku}.`);
  } else if (row.sku && variantText && !row.errors.some((error) => error.startsWith("variant_id"))) {
    product = lookups.productsBySku.get(row.sku.toLowerCase());
  }
  if (product) {
    row.productId = product.id;
    row.title = product.name;
    if (!row.sku) row.sku = product.sku;
  }

  if (kind === "purchases") {
    fillPurchase(row, sheetRow);
  } else if (kind === "opening") {
    fillOptionalQuantity(row, sheetRow.cells.quantity ?? "");
  } else if (kind === "stock_count") {
    const counted = parseBoundedInteger(sheetRow.cells.counted_qty ?? "", 0);
    if (!counted.ok) row.errors.push(counted.message.replace("Quantity", "counted_qty"));
    else row.quantity = counted.value;
    row.reason = (sheetRow.cells.reason ?? "").trim();
    if (!row.reason) row.errors.push("Reason is required.");
    else if (row.reason.length > 500) row.errors.push("Reason must be 500 characters or fewer.");
  } else {
    const cost = parseUnitCost(sheetRow.cells.unit_cost ?? "");
    if (!cost.ok) row.errors.push(cost.message);
    else row.unitCost = cost.value;
  }

  if (row.productId && kind !== "purchases") {
    const key = row.productId;
    if (seen.has(key)) row.errors.push("This product or option appears more than once in the file.");
    else seen.add(key);
  }

  if (row.errors.length > 0 || !product) {
    row.valid = false;
    return row;
  }

  if (kind === "purchases") {
    const named = lookups.suppliersByName.get(row.supplierName.toLowerCase());
    if (named && named.count > 1) {
      row.errors.push(`More than one supplier is named '${row.supplierName}'.`);
    }
    if (row.errors.length === 0 && row.quantity != null && row.unitCost != null) {
      row.action = "purchase";
      row.summary = `Receive ${row.quantity} at ${moneyText(row.unitCost)} (${product.name})`;
      row.valid = true;
    }
    return row;
  }

  const current = product.quantity;
  if (current == null) {
    row.errors.push("This product has no stock count.");
    return row;
  }
  if (kind === "opening") {
    if (lookups.openingProductIds.has(product.id)) {
      row.errors.push("Opening stock was already recorded for this product.");
      return row;
    }
    if (row.quantity != null && row.quantity !== current) {
      row.errors.push(
        `Opening quantity must equal the current stock (${current}). This import does not change the stock number.`,
      );
      return row;
    }
    row.quantity = current;
    row.action = "opening";
    row.summary = `Opening stock ${current}`;
    row.valid = true;
    return row;
  }
  if (kind === "stock_count") {
    if (row.quantity == null) return row;
    row.counted = row.quantity;
    const delta = row.counted - current;
    if (delta === 0) {
      row.action = "none";
      row.quantity = 0;
      row.summary = `Stock already matches (${current}). No movement.`;
      row.valid = true;
      return row;
    }
    row.quantity = delta;
    row.action = "adjustment";
    row.summary = `Stock count ${current} → ${row.counted} (${delta > 0 ? `+${delta}` : String(delta)})`;
    row.valid = true;
    return row;
  }
  if (row.unitCost != null) {
    row.action = "cost";
    const previous = product.costPrice == null ? "none" : moneyText(product.costPrice);
    row.summary = `Cost price ${previous} → ${moneyText(row.unitCost)} (${product.name})`;
    row.valid = true;
  }
  return row;
}

function fillPurchase(row: ClassifiedImportRow, sheetRow: SheetRow) {
  row.supplierName = (sheetRow.cells.supplier_name ?? "").trim();
  row.supplierPhone = (sheetRow.cells.supplier_phone ?? "").trim();
  row.supplierAddress = (sheetRow.cells.supplier_address ?? "").trim();
  row.supplierNote = (sheetRow.cells.supplier_note ?? "").trim();
  row.invoiceNo = (sheetRow.cells.invoice_no ?? "").trim();
  row.purchasedOn = (sheetRow.cells.purchased_on ?? "").trim();
  if (!row.supplierName) row.errors.push("Enter the supplier name.");
  else if (row.supplierName.length > 160) row.errors.push("Supplier name must be 160 characters or fewer.");
  if (row.supplierPhone.length > 40) row.errors.push("Supplier phone must be 40 characters or fewer.");
  if (row.supplierAddress.length > 500) row.errors.push("Supplier address must be 500 characters or fewer.");
  if (row.supplierNote.length > 500) row.errors.push("Supplier note must be 500 characters or fewer.");
  if (row.invoiceNo.length > 64) row.errors.push("Invoice number must be 64 characters or fewer.");
  if (!parseIsoDate(row.purchasedOn)) row.errors.push("Enter the purchase date as YYYY-MM-DD.");
  const quantity = parseBoundedInteger(sheetRow.cells.quantity ?? "", 1);
  if (!quantity.ok) row.errors.push(quantity.message.replace("Quantity", "quantity"));
  else row.quantity = quantity.value;
  const cost = parseUnitCost(sheetRow.cells.unit_cost ?? "");
  if (!cost.ok) row.errors.push(cost.message);
  else row.unitCost = cost.value;
}

function fillOptionalQuantity(row: ClassifiedImportRow, raw: string) {
  if (!raw.trim()) return;
  const quantity = parseBoundedInteger(raw, 0);
  if (!quantity.ok) row.errors.push(quantity.message.replace("Quantity", "quantity"));
  else row.quantity = quantity.value;
}

function parseBoundedInteger(raw: string, minimum: number) {
  const text = raw
    .trim()
    .replace(/[০-৯]/g, (digit) => String("০১২৩৪৫৬৭৮৯".indexOf(digit)))
    .replace(/^\+/, "");
  if (!text) return { ok: false as const, message: "Enter Quantity." };
  if (!/^\d+$/.test(text)) {
    return { ok: false as const, message: `Quantity must be a whole number from ${minimum} to 1,000,000.` };
  }
  const value = Number(text);
  if (!Number.isSafeInteger(value) || value < minimum || value > 1_000_000) {
    return { ok: false as const, message: `Quantity must be a whole number from ${minimum} to 1,000,000.` };
  }
  return { ok: true as const, value };
}

function moneyText(value: number) {
  const rounded = roundMoney(value);
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

/** Normalises `POST /imports/preview`. */
export function mapImportPreview(body: unknown): ImportPreview | null {
  if (!body || typeof body !== "object") return null;
  const record = body as Record<string, unknown>;
  const fileHash = typeof record.file_hash === "string" ? record.file_hash : "";
  if (!fileHash || !Array.isArray(record.rows)) return null;
  const importType = typeof record.import_type === "string" ? record.import_type : "";
  const rows = record.rows.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const number = typeof row.row === "number" ? row.row : Number(row.row);
    if (!Number.isInteger(number)) return [];
    const errors = Array.isArray(row.errors)
      ? row.errors.filter((error): error is string => typeof error === "string" && error.trim() !== "")
      : [];
    return [
      {
        row: number,
        valid: row.valid === true && errors.length === 0,
        action: typeof row.action === "string" ? row.action : "",
        errors,
        summary: typeof row.summary === "string" ? row.summary : "",
      },
    ];
  });
  const validCount = rows.filter((row) => row.valid).length;
  return {
    importType: (IMPORT_KINDS as readonly string[]).includes(importType) ? (importType as ImportKind) : "",
    fileHash,
    duplicate: record.duplicate === true,
    rows,
    validCount: typeof record.valid_count === "number" ? record.valid_count : validCount,
    invalidCount:
      typeof record.invalid_count === "number" ? record.invalid_count : rows.length - validCount,
  };
}

/**
 * Confirm of a repeated file is HTTP 409
 * `{ error: { code: "conflict", message, details: { file_hash } } }`.
 */
export function readDuplicateFile(body: unknown) {
  if (!body || typeof body !== "object") return null;
  const error = (body as { error?: unknown }).error;
  if (!error || typeof error !== "object") return null;
  const record = error as Record<string, unknown>;
  if (record.code !== "conflict") return null;
  const details = record.details;
  const fileHash =
    details && typeof details === "object" && typeof (details as { file_hash?: unknown }).file_hash === "string"
      ? (details as { file_hash: string }).file_hash
      : "";
  if (!fileHash) return null;
  return {
    fileHash,
    message:
      typeof record.message === "string" && record.message.trim()
        ? record.message
        : "This file was already imported. Confirm to import it again.",
  };
}

export async function sha256Hex(bytes: Uint8Array) {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const digest = await crypto.subtle.digest("SHA-256", copy);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function importResultMessage(saved: number, skipped: number) {
  const savedLabel = saved === 1 ? "1 row saved" : `${saved} rows saved`;
  const skippedLabel = skipped === 1 ? "1 skipped" : `${skipped} skipped`;
  return `${savedLabel}. ${skippedLabel}.`;
}

export function adjustmentResultQuantity(current: number | null, delta: number) {
  const held = current ?? 0;
  return held + delta;
}
