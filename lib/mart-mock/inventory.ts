/**
 * Local inventory stand-in used when `GET /api/v1/admin/inventory/suppliers`
 * is not mounted. JSON field names follow the ledger branch
 * `cursor/inventory-ledger-2808`. The live client does not compute weighted
 * average cost; this stand-in does, so a product refetch shows the new cost.
 */

import {
  classifyImportSheet,
  filterMovements,
  parseIsoDate,
  previewFromClassified,
  roundMoney,
  templateSheet,
  weightedAverageCost,
  type ClassifiedImportRow,
  type ImportKind,
  type ImportLookups,
  type MovementFilter,
  type StockMovementType,
} from "@/lib/admin/inventory";
import { readFirstSheet, workbookBytes } from "@/lib/admin/xlsx-lite";

export const SEED_PRODUCTS = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Nova Earbuds",
    sku: "NV-EAR-01",
    quantity: 8,
    costPrice: 450,
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Linen Dress",
    sku: "LN-DRS-04",
    quantity: 2,
    costPrice: 900,
  },
] as const;

/** Stand-in staff id. The API returns `actor_id`, not an email. */
export const MOCK_ACTOR_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1";

export type MockSupplier = {
  id: string;
  name: string;
  phone: string;
  address: string;
  note: string;
  createdAt: string;
  updatedAt: string;
};

export type MockPurchaseItem = {
  id: string;
  productId: string | null;
  variantId: string | null;
  quantity: number;
  unitCost: number;
};

export type MockPurchase = {
  id: string;
  supplierId: string;
  supplierName: string;
  purchasedOn: string;
  invoiceNo: string;
  note: string;
  items: MockPurchaseItem[];
  createdAt: string;
};

export type MockMovement = {
  id: string;
  productId: string | null;
  variantId: string | null;
  productTitle: string;
  sku: string;
  movementType: StockMovementType;
  quantity: number;
  unitCost: number | null;
  orderId: string | null;
  purchaseId: string | null;
  importBatchId: string | null;
  actorId: string | null;
  note: string;
  createdAt: string;
};

export type MockStock = {
  productId: string;
  name: string;
  sku: string;
  quantity: number | null;
  costPrice: number | null;
  status: string;
  updatedAt: string;
};

export type InventoryState = {
  suppliers: MockSupplier[];
  purchases: MockPurchase[];
  movements: MockMovement[];
  stock: MockStock[];
  importHashes: string[];
};

export type SupplierInput = {
  name: string;
  phone: string;
  address: string;
  note: string;
};

export type PurchaseInput = {
  supplierId: string;
  purchasedOn: string;
  invoiceNo: string;
  note: string;
  items: Array<{
    productId: string;
    variantId?: string | null;
    quantity: number;
    unitCost: number;
  }>;
};

const STORAGE_KEY = "implesia.admin.inventory.v2";

function newId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  const bytes = Array.from({ length: 16 }, () => Math.floor(Math.random() * 256));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function seedInventory(now: Date): InventoryState {
  const monthStart = new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000).toISOString();
  const recent = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
  const lastMonth = new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000).toISOString();
  const suppliers: MockSupplier[] = [
    {
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
      name: "Dhaka Gadgets",
      phone: "01711000001",
      address: "Gulshan, Dhaka",
      note: "",
      createdAt: monthStart,
      updatedAt: monthStart,
    },
    {
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2",
      name: "Heritage Looms",
      phone: "01811000002",
      address: "Narayanganj",
      note: "Handmade dresses",
      createdAt: monthStart,
      updatedAt: monthStart,
    },
  ];
  const stock: MockStock[] = SEED_PRODUCTS.map((product) => ({
    productId: product.id,
    name: product.name,
    sku: product.sku,
    quantity: product.quantity,
    costPrice: product.costPrice,
    status: "active",
    updatedAt: monthStart,
  }));
  const openingQuantity = [9, 3];
  const movements: MockMovement[] = SEED_PRODUCTS.map((product, index) => ({
    id: `opening-${product.id}`,
    productId: product.id,
    variantId: null,
    productTitle: product.name,
    sku: "",
    movementType: "opening" as const,
    quantity: openingQuantity[index] ?? product.quantity,
    unitCost: product.costPrice,
    orderId: null,
    purchaseId: null,
    importBatchId: null,
    actorId: MOCK_ACTOR_ID,
    note: "Opening stock",
    createdAt: monthStart,
  }));
  movements.push({
    id: "movement-sale-recent",
    productId: SEED_PRODUCTS[0].id,
    variantId: null,
    productTitle: SEED_PRODUCTS[0].name,
    sku: "",
    movementType: "sale",
    quantity: -1,
    unitCost: SEED_PRODUCTS[0].costPrice,
    orderId: "cccccccc-cccc-4ccc-8ccc-ccccccccccc1",
    purchaseId: null,
    importBatchId: null,
    actorId: MOCK_ACTOR_ID,
    note: "",
    createdAt: recent,
  });
  movements.push({
    id: "movement-adjust-old",
    productId: SEED_PRODUCTS[1].id,
    variantId: null,
    productTitle: SEED_PRODUCTS[1].name,
    sku: "",
    movementType: "adjustment",
    quantity: -1,
    unitCost: SEED_PRODUCTS[1].costPrice,
    orderId: null,
    purchaseId: null,
    importBatchId: null,
    actorId: MOCK_ACTOR_ID,
    note: "Damaged sample",
    createdAt: lastMonth,
  });
  return { suppliers, purchases: [], movements, stock, importHashes: [] };
}

let memory: InventoryState | null = null;

export function loadInventory(now = new Date()) {
  if (typeof window === "undefined") {
    memory ??= seedInventory(now);
    return memory;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as InventoryState;
      if (parsed && Array.isArray(parsed.suppliers) && Array.isArray(parsed.stock) && Array.isArray(parsed.movements)) {
        return parsed;
      }
    }
  } catch {
    /* Seed a fresh book. */
  }
  const seeded = seedInventory(now);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  return seeded;
}

export function saveInventory(state: InventoryState) {
  if (typeof window === "undefined") {
    memory = state;
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function resetInventory(now = new Date()) {
  const seeded = seedInventory(now);
  saveInventory(seeded);
  return seeded;
}

function cleanText(value: string, max: number) {
  return value.trim().slice(0, max);
}

export function validateSupplier(input: SupplierInput) {
  if (!cleanText(input.name, 160)) return "Enter the supplier name.";
  if (input.name.trim().length > 160) return "Name must be 160 characters or fewer.";
  if (input.phone.trim().length > 40) return "Phone must be 40 characters or fewer.";
  if (input.address.trim().length > 500) return "Address must be 500 characters or fewer.";
  if (input.note.trim().length > 500) return "Note must be 500 characters or fewer.";
  return null;
}

export function createSupplier(state: InventoryState, input: SupplierInput, now: Date) {
  const problem = validateSupplier(input);
  if (problem) return { state, supplier: null, error: problem };
  const supplier: MockSupplier = {
    id: newId(),
    name: cleanText(input.name, 160),
    phone: cleanText(input.phone, 40),
    address: cleanText(input.address, 500),
    note: cleanText(input.note, 500),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
  return { state: { ...state, suppliers: [supplier, ...state.suppliers] }, supplier, error: null };
}

export function updateSupplier(state: InventoryState, id: string, input: SupplierInput, now: Date) {
  const problem = validateSupplier(input);
  if (problem) return { state, supplier: null, error: problem };
  const current = state.suppliers.find((supplier) => supplier.id === id);
  if (!current) return { state, supplier: null, error: "Supplier not found." };
  const supplier: MockSupplier = {
    ...current,
    name: cleanText(input.name, 160),
    phone: cleanText(input.phone, 40),
    address: cleanText(input.address, 500),
    note: cleanText(input.note, 500),
    updatedAt: now.toISOString(),
  };
  return {
    state: {
      ...state,
      suppliers: state.suppliers.map((item) => (item.id === id ? supplier : item)),
      purchases: state.purchases.map((purchase) =>
        purchase.supplierId === id ? { ...purchase, supplierName: supplier.name } : purchase,
      ),
    },
    supplier,
    error: null,
  };
}

function ensureStock(stock: MockStock[], productId: string, now: Date) {
  const found = stock.find((row) => row.productId === productId);
  if (found) return { stock, row: found };
  const row: MockStock = {
    productId,
    name: "Product",
    sku: "",
    quantity: 0,
    costPrice: null,
    status: "active",
    updatedAt: now.toISOString(),
  };
  return { stock: [...stock, row], row };
}

export function createPurchase(state: InventoryState, input: PurchaseInput, actorId: string, now: Date) {
  const supplier = state.suppliers.find((item) => item.id === input.supplierId);
  if (!supplier) return { state, purchase: null, error: "Choose a supplier." };
  if (!parseIsoDate(input.purchasedOn)) return { state, purchase: null, error: "Choose a purchase date." };
  const invoice = input.invoiceNo.trim();
  if (invoice.length > 64) return { state, purchase: null, error: "Invoice number must be 64 characters or fewer." };
  const note = input.note.trim();
  if (note.length > 500) return { state, purchase: null, error: "Note must be 500 characters or fewer." };
  if (input.items.length === 0) return { state, purchase: null, error: "Add at least one product." };
  if (input.items.length > 100) return { state, purchase: null, error: "A purchase can have at most 100 lines." };
  let stock = state.stock.slice();
  const movements = state.movements.slice();
  const purchaseId = newId();
  const items: MockPurchaseItem[] = [];
  for (const item of input.items) {
    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      return { state, purchase: null, error: "Enter a whole quantity of 1 or more." };
    }
    if (!Number.isFinite(item.unitCost) || item.unitCost < 0) {
      return { state, purchase: null, error: "Enter a unit cost of 0 or more." };
    }
    const ensured = ensureStock(stock, item.productId, now);
    stock = ensured.stock;
    const held = ensured.row.quantity ?? 0;
    const nextCost = weightedAverageCost(held, ensured.row.costPrice, item.quantity, item.unitCost);
    const nextQuantity = held + item.quantity;
    stock = stock.map((row) =>
      row.productId === item.productId
        ? { ...row, quantity: nextQuantity, costPrice: nextCost, updatedAt: now.toISOString() }
        : row,
    );
    const line: MockPurchaseItem = {
      id: newId(),
      productId: item.productId,
      variantId: item.variantId ?? null,
      quantity: item.quantity,
      unitCost: roundMoney(item.unitCost),
    };
    items.push(line);
    movements.push({
      id: newId(),
      productId: item.productId,
      variantId: item.variantId ?? null,
      productTitle: ensured.row.name,
      sku: item.variantId ? ensured.row.sku : "",
      movementType: "purchase",
      quantity: item.quantity,
      unitCost: line.unitCost,
      orderId: null,
      purchaseId,
      importBatchId: null,
      actorId,
      note: invoice,
      createdAt: now.toISOString(),
    });
  }
  const purchase: MockPurchase = {
    id: purchaseId,
    supplierId: supplier.id,
    supplierName: supplier.name,
    purchasedOn: input.purchasedOn,
    invoiceNo: invoice,
    note,
    items,
    createdAt: now.toISOString(),
  };
  return {
    state: { ...state, stock, movements, purchases: [purchase, ...state.purchases] },
    purchase,
    error: null,
  };
}

export function adjustStock(
  state: InventoryState,
  input: { productId: string; variantId?: string | null; quantity: number; reason: string },
  actorId: string,
  now: Date,
) {
  const reason = input.reason.trim();
  if (!reason) return { state, movement: null, error: "Enter a reason." };
  if (reason.length > 500) return { state, movement: null, error: "Reason must be 500 characters or fewer." };
  if (!Number.isInteger(input.quantity) || input.quantity === 0) {
    return { state, movement: null, error: "Enter a whole number other than 0." };
  }
  const ensured = ensureStock(state.stock, input.productId, now);
  if (ensured.row.quantity == null) {
    return { state, movement: null, error: "This product has no stock count." };
  }
  const nextQuantity = ensured.row.quantity + input.quantity;
  if (nextQuantity < 0) {
    return { state, movement: null, error: "Not enough stock to remove that many." };
  }
  const movement: MockMovement = {
    id: newId(),
    productId: input.productId,
    variantId: input.variantId ?? null,
    productTitle: ensured.row.name,
    sku: input.variantId ? ensured.row.sku : "",
    movementType: "adjustment",
    quantity: input.quantity,
    unitCost: ensured.row.costPrice,
    orderId: null,
    purchaseId: null,
    importBatchId: null,
    actorId,
    note: reason,
    createdAt: now.toISOString(),
  };
  return {
    state: {
      ...state,
      stock: ensured.stock.map((row) =>
        row.productId === input.productId ? { ...row, quantity: nextQuantity, updatedAt: now.toISOString() } : row,
      ),
      movements: [movement, ...state.movements],
    },
    movement,
    error: null,
  };
}

/** One opening movement per tracked product. Stock is not changed. */
export function recordOpeningStock(state: InventoryState, actorId: string, now: Date) {
  let created = 0;
  let alreadyRecorded = 0;
  let untracked = 0;
  const movements = state.movements.slice();
  for (const row of state.stock) {
    if (row.quantity == null) {
      untracked += 1;
      continue;
    }
    const exists = movements.some(
      (movement) =>
        movement.productId === row.productId && movement.variantId == null && movement.movementType === "opening",
    );
    if (exists) {
      alreadyRecorded += 1;
      continue;
    }
    movements.unshift({
      id: newId(),
      productId: row.productId,
      variantId: null,
      productTitle: row.name,
      sku: "",
      movementType: "opening",
      quantity: row.quantity,
      unitCost: row.costPrice,
      orderId: null,
      purchaseId: null,
      importBatchId: null,
      actorId,
      note: "Opening stock",
      createdAt: now.toISOString(),
    });
    created += 1;
  }
  return { state: { ...state, movements }, created, alreadyRecorded, untracked };
}

export function lookupsFrom(state: InventoryState): ImportLookups {
  const suppliersByName = new Map<string, { id: string; count: number }>();
  for (const supplier of state.suppliers) {
    const key = supplier.name.toLowerCase();
    const current = suppliersByName.get(key);
    if (current) current.count += 1;
    else suppliersByName.set(key, { id: supplier.id, count: 1 });
  }
  const products = state.stock.map((row) => ({
    id: row.productId,
    name: row.name,
    sku: row.sku,
    quantity: row.quantity,
    costPrice: row.costPrice,
  }));
  return {
    suppliersByName,
    productsBySku: new Map(products.filter((row) => row.sku).map((row) => [row.sku.toLowerCase(), row])),
    productsById: new Map(products.map((row) => [row.id, row])),
    openingProductIds: new Set(
      state.movements
        .filter((movement) => movement.movementType === "opening" && movement.productId && !movement.variantId)
        .map((movement) => movement.productId as string),
    ),
  };
}

export async function previewWorkbook(state: InventoryState, kind: ImportKind, bytes: Uint8Array, fileHash: string) {
  let matrix: string[][];
  try {
    matrix = await readFirstSheet(bytes);
  } catch {
    return { preview: null, classified: [] as ClassifiedImportRow[], error: "Could not read this Excel file." };
  }
  const classified = classifyImportSheet(kind, matrix, lookupsFrom(state));
  return {
    preview: previewFromClassified(kind, classified, fileHash, state.importHashes.includes(fileHash)),
    classified,
    error: null,
  };
}

const DUPLICATE_MESSAGE = "This file was already imported. Confirm to import it again.";

export async function confirmWorkbook(
  state: InventoryState,
  kind: ImportKind,
  bytes: Uint8Array,
  fileHash: string,
  actorId: string,
  now: Date,
  confirmDuplicate: boolean,
) {
  const previewed = await previewWorkbook(state, kind, bytes, fileHash);
  if (previewed.error || !previewed.preview) {
    return { state, saved: 0, skipped: 0, batchId: null as string | null, duplicateHash: null as string | null, error: previewed.error ?? "Could not read this Excel file." };
  }
  const rows = previewed.classified;
  if (rows.length > 0 && rows.every((row) => !row.valid)) {
    return { state, saved: 0, skipped: rows.length, batchId: null, duplicateHash: null, error: "Nothing was imported. Every row has an error." };
  }
  if (state.importHashes.includes(fileHash) && !confirmDuplicate) {
    return { state, saved: 0, skipped: 0, batchId: null, duplicateHash: fileHash, error: DUPLICATE_MESSAGE };
  }
  const actionable = rows.filter((row) => row.valid && row.action !== "none");
  if (actionable.length === 0) {
    return {
      state,
      saved: 0,
      skipped: rows.filter((row) => !row.valid).length,
      batchId: null,
      duplicateHash: null,
      error: null,
    };
  }
  const batchId = newId();
  let next = cloneState(state);
  try {
    if (kind === "purchases") next = applyPurchases(next, actionable, actorId, now, batchId);
    else if (kind === "opening") next = applyOpening(next, actionable, actorId, now, batchId);
    else if (kind === "stock_count") next = applyCounts(next, actionable, actorId, now, batchId);
    else next = applyCosts(next, actionable, actorId, now, batchId);
  } catch (error) {
    return {
      state,
      saved: 0,
      skipped: rows.length,
      batchId: null,
      duplicateHash: null,
      error: error instanceof Error ? error.message : "Could not save this import.",
    };
  }
  if (!next.importHashes.includes(fileHash)) next.importHashes.push(fileHash);
  return {
    state: next,
    saved: actionable.length,
    skipped: rows.filter((row) => !row.valid).length,
    batchId,
    duplicateHash: null,
    error: null,
  };
}

function cloneState(state: InventoryState): InventoryState {
  return {
    suppliers: state.suppliers.slice(),
    purchases: state.purchases.slice(),
    movements: state.movements.slice(),
    stock: state.stock.map((row) => ({ ...row })),
    importHashes: state.importHashes.slice(),
  };
}

function applyPurchases(state: InventoryState, rows: ClassifiedImportRow[], actorId: string, now: Date, batchId: string) {
  const groups = new Map<string, ClassifiedImportRow[]>();
  for (const row of rows) {
    const key = `${row.supplierName.toLowerCase()}|${row.purchasedOn}|${row.invoiceNo}`;
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }
  let next = state;
  for (const group of groups.values()) {
    const first = group[0]!;
    let supplier = next.suppliers.find((item) => item.name.toLowerCase() === first.supplierName.toLowerCase());
    if (!supplier) {
      const created = createSupplier(
        next,
        {
          name: first.supplierName,
          phone: first.supplierPhone,
          address: first.supplierAddress,
          note: first.supplierNote,
        },
        now,
      );
      if (created.error || !created.supplier) throw new Error(created.error ?? "Could not save the supplier.");
      next = created.state;
      supplier = created.supplier;
    }
    const result = createPurchase(
      next,
      {
        supplierId: supplier.id,
        purchasedOn: first.purchasedOn,
        invoiceNo: first.invoiceNo,
        note: "",
        items: group.map((row) => ({
          productId: row.productId ?? "",
          variantId: row.variantId,
          quantity: row.quantity ?? 0,
          unitCost: row.unitCost ?? 0,
        })),
      },
      actorId,
      now,
    );
    if (result.error || !result.purchase) throw new Error(result.error ?? "Could not save the purchase.");
    next = result.state;
    next.movements = next.movements.map((movement) =>
      movement.purchaseId === result.purchase?.id ? { ...movement, importBatchId: batchId } : movement,
    );
  }
  return next;
}

function applyOpening(state: InventoryState, rows: ClassifiedImportRow[], actorId: string, now: Date, batchId: string) {
  const movements = state.movements.slice();
  for (const row of rows) {
    if (!row.productId || row.quantity == null) continue;
    const exists = movements.some(
      (movement) => movement.productId === row.productId && movement.variantId == null && movement.movementType === "opening",
    );
    const stock = state.stock.find((item) => item.productId === row.productId);
    if (!stock || stock.quantity == null || stock.quantity !== row.quantity || exists) {
      throw new Error("Stock changed while importing. Nothing was saved. Preview again.");
    }
    movements.unshift({
      id: newId(),
      productId: row.productId,
      variantId: null,
      productTitle: stock.name,
      sku: "",
      movementType: "opening",
      quantity: stock.quantity,
      unitCost: stock.costPrice,
      orderId: null,
      purchaseId: null,
      importBatchId: batchId,
      actorId,
      note: "Opening stock import",
      createdAt: now.toISOString(),
    });
  }
  return { ...state, movements };
}

function applyCounts(state: InventoryState, rows: ClassifiedImportRow[], actorId: string, now: Date, batchId: string) {
  const movements = state.movements.slice();
  const stock = state.stock.map((row) => ({ ...row }));
  for (const row of rows) {
    if (!row.productId || row.counted == null) continue;
    const item = stock.find((entry) => entry.productId === row.productId);
    if (!item || item.quantity == null) throw new Error("This product has no stock count.");
    const delta = row.counted - item.quantity;
    item.quantity = row.counted;
    item.updatedAt = now.toISOString();
    movements.unshift({
      id: newId(),
      productId: row.productId,
      variantId: null,
      productTitle: item.name,
      sku: "",
      movementType: "adjustment",
      quantity: delta,
      unitCost: item.costPrice,
      orderId: null,
      purchaseId: null,
      importBatchId: batchId,
      actorId,
      note: row.reason || "Stock count",
      createdAt: now.toISOString(),
    });
  }
  return { ...state, stock, movements };
}

function applyCosts(state: InventoryState, rows: ClassifiedImportRow[], actorId: string, now: Date, batchId: string) {
  const movements = state.movements.slice();
  const stock = state.stock.map((row) => ({ ...row }));
  for (const row of rows) {
    if (!row.productId || row.unitCost == null) continue;
    const item = stock.find((entry) => entry.productId === row.productId);
    if (!item) throw new Error("Product not found.");
    item.costPrice = row.unitCost;
    item.updatedAt = now.toISOString();
    movements.unshift({
      id: newId(),
      productId: row.productId,
      variantId: row.variantId,
      productTitle: item.name,
      sku: "",
      movementType: "adjustment",
      quantity: 0,
      unitCost: row.unitCost,
      orderId: null,
      purchaseId: null,
      importBatchId: batchId,
      actorId,
      note: "Cost price import",
      createdAt: now.toISOString(),
    });
  }
  return { ...state, stock, movements };
}

export function listSuppliers(state: InventoryState, query: { q?: string; page: number; pageSize: number }) {
  const q = query.q?.trim().toLowerCase() ?? "";
  const filtered = state.suppliers.filter((supplier) => !q || supplier.name.toLowerCase().includes(q));
  return paginate(filtered, query.page, query.pageSize);
}

export function listPurchases(
  state: InventoryState,
  query: { supplierId?: string | null; from?: string | null; to?: string | null; page: number; pageSize: number },
) {
  const filtered = state.purchases.filter((purchase) => {
    if (query.supplierId && purchase.supplierId !== query.supplierId) return false;
    if (query.from && purchase.purchasedOn < query.from) return false;
    if (query.to && purchase.purchasedOn > query.to) return false;
    return true;
  });
  return paginate(filtered, query.page, query.pageSize);
}

export function listMovements(state: InventoryState, filter: MovementFilter, page: number, pageSize: number) {
  const filtered = filterMovements(state.movements, filter)
    .slice()
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
  return paginate(filtered, page, pageSize);
}

export function searchStock(state: InventoryState, q: string) {
  const needle = q.trim().toLowerCase();
  return state.stock
    .filter((row) => !needle || row.name.toLowerCase().includes(needle) || row.sku.toLowerCase().includes(needle))
    .slice(0, 8);
}

function paginate<T>(items: T[], page: number, pageSize: number) {
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const safe = Math.min(Math.max(1, page), pages);
  const start = (safe - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), total, page: safe, pageSize, pages };
}

export function productsSheet(state: InventoryState, query: { from?: string | null; to?: string | null }) {
  const rows = state.stock.filter((row) => {
    if (!query.from && !query.to) return true;
    const day = row.updatedAt.slice(0, 10);
    if (query.from && day < query.from) return false;
    if (query.to && day > query.to) return false;
    return true;
  });
  return workbookBytes("Products", [
    ["product_id", "variant_id", "sku", "title", "quantity", "cost_price", "status", "updated_at"],
    ...rows.map((row) => [
      row.productId,
      "",
      row.sku,
      row.name,
      row.quantity == null ? "" : String(row.quantity),
      row.costPrice == null ? "" : String(row.costPrice),
      row.status,
      row.updatedAt,
    ]),
  ]);
}

export function purchasesSheet(
  state: InventoryState,
  query: { from?: string | null; to?: string | null },
) {
  const rows = listPurchases(state, { ...query, supplierId: null, page: 1, pageSize: 20_000 }).items;
  return workbookBytes("Purchases", [
    ["purchase_id", "purchased_on", "invoice_no", "supplier_name", "product_id", "variant_id", "sku", "quantity", "unit_cost"],
    ...rows.flatMap((purchase) =>
      purchase.items.map((item) => {
        const stock = state.stock.find((row) => row.productId === item.productId);
        return [
          purchase.id,
          purchase.purchasedOn,
          purchase.invoiceNo,
          purchase.supplierName,
          item.productId ?? "",
          item.variantId ?? "",
          item.variantId ? (stock?.sku ?? "") : "",
          String(item.quantity),
          String(item.unitCost),
        ];
      }),
    ),
  ]);
}

export function movementsSheet(state: InventoryState, query: { from?: string | null; to?: string | null }) {
  const rows = listMovements(
    state,
    { from: query.from ?? null, to: query.to ?? null, productId: null, type: null },
    1,
    20_000,
  ).items;
  return workbookBytes("Movements", [
    ["id", "created_at", "movement_type", "product_id", "variant_id", "sku", "quantity", "unit_cost", "order_id", "purchase_id", "import_batch_id", "actor_id", "note"],
    ...rows.map((movement) => [
      movement.id,
      movement.createdAt,
      movement.movementType,
      movement.productId ?? "",
      movement.variantId ?? "",
      movement.sku,
      String(movement.quantity),
      movement.unitCost == null ? "" : String(movement.unitCost),
      movement.orderId ?? "",
      movement.purchaseId ?? "",
      movement.importBatchId ?? "",
      movement.actorId ?? "",
      movement.note,
    ]),
  ]);
}

export function templateBytes(kind: ImportKind) {
  return workbookBytes(kind.replaceAll("_", " "), templateSheet(kind));
}
