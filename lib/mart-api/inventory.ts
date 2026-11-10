/**
 * Admin inventory client.
 *
 * Paths and JSON names match implesia-mart-backend PR #9, branch
 * `cursor/inventory-ledger-2808` (`app/schemas/inventory.py`,
 * `app/api/v1/endpoints/admin_inventory.py`, `docs/API.md`).
 * Until `GET /api/v1/admin/inventory/suppliers` answers, calls use
 * `lib/mart-mock/inventory`.
 *
 * Viewer can read, preview, and download. Editor and superadmin may write.
 * A purchase's new `cost_price` is computed on the server. This client does
 * not. After a purchase or adjustment, callers refetch the product.
 */

import {
  mapImportPreview,
  readDuplicateFile,
  sha256Hex,
  type ExportKind,
  type ImportKind,
  type ImportPreview,
  type StockMovementType,
} from "@/lib/admin/inventory";
import { canWriteInventory } from "@/lib/admin/staff-role";
import { MartApiError, authorizedFetch, getMartProduct, listMartProducts } from "@/lib/mart-api/products";
import {
  MOCK_ACTOR_ID,
  adjustStock,
  confirmWorkbook,
  createPurchase,
  createSupplier,
  listMovements,
  listPurchases,
  listSuppliers,
  loadInventory,
  movementsSheet,
  previewWorkbook,
  productsSheet,
  purchasesSheet,
  recordOpeningStock as recordOpeningInMock,
  saveInventory,
  searchStock,
  templateBytes,
  updateSupplier,
  type MockMovement,
  type MockPurchase,
  type MockSupplier,
} from "@/lib/mart-mock/inventory";
import { readSession } from "@/lib/mart-mock/store";

export const INVENTORY_PATHS = {
  suppliers: "/api/v1/admin/inventory/suppliers",
  supplier: (id: string) => `/api/v1/admin/inventory/suppliers/${encodeURIComponent(id)}`,
  purchases: "/api/v1/admin/inventory/purchases",
  purchase: (id: string) => `/api/v1/admin/inventory/purchases/${encodeURIComponent(id)}`,
  movements: "/api/v1/admin/inventory/movements",
  adjustments: "/api/v1/admin/inventory/adjustments",
  openingStock: "/api/v1/admin/inventory/opening-stock",
  template: (kind: ImportKind) => `/api/v1/admin/inventory/imports/templates/${kind}`,
  preview: "/api/v1/admin/inventory/imports/preview",
  confirm: "/api/v1/admin/inventory/imports/confirm",
  export: (kind: ExportKind) => `/api/v1/admin/inventory/exports/${kind}`,
} as const;

export type Supplier = {
  id: string;
  name: string;
  phone: string;
  address: string;
  note: string;
  createdAt: string;
  updatedAt: string;
};

export type SupplierInput = {
  name: string;
  phone: string;
  address: string;
  note: string;
};

export type PurchaseItem = {
  id: string;
  productId: string | null;
  variantId: string | null;
  quantity: number;
  unitCost: number;
};

export type Purchase = {
  id: string;
  supplierId: string;
  supplierName: string;
  purchasedOn: string;
  invoiceNo: string;
  note: string;
  items: PurchaseItem[];
  createdAt: string;
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

export type StockMovement = {
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

export type ProductStock = {
  productId: string;
  quantity: number | null;
  costPrice: number | null;
  sku: string;
  name: string;
};

export type OpeningStockResult = {
  created: number;
  alreadyRecorded: number;
  untracked: number;
};

export type Page<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  pages: number;
};

export type ProductChoice = {
  id: string;
  variantId: string | null;
  name: string;
  sku: string;
  quantity: number | null;
  costPrice: number | null;
};

export class DuplicateFileError extends Error {
  readonly fileHash: string;

  constructor(message: string, fileHash: string) {
    super(message);
    this.name = "DuplicateFileError";
    this.fileHash = fileHash;
  }
}

let mode: "unknown" | "live" | "mock" = "unknown";

export async function inventoryBackend(): Promise<"live" | "mock"> {
  if (process.env.NEXT_PUBLIC_INVENTORY_MOCK === "1") return "mock";
  if (mode !== "unknown") return mode;
  try {
    const response = await authorizedFetch(`${INVENTORY_PATHS.suppliers}?page=1&page_size=1`);
    mode = response.status === 404 || response.status === 501 || response.status >= 500 ? "mock" : "live";
  } catch {
    mode = "mock";
  }
  return mode;
}

function requireWriter() {
  const role = readSession()?.role;
  if (!canWriteInventory(role)) {
    throw new MartApiError("Your role cannot change inventory.");
  }
}

async function readError(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as { error?: { message?: string } };
    if (body.error?.message) return body.error.message;
  } catch {
    /* not JSON */
  }
  if (response.status === 401) return "Sign in again to manage inventory.";
  if (response.status === 403) return "Your role cannot change inventory.";
  return fallback;
}

function pageQuery(query: Record<string, string | number | null | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value == null || value === "") continue;
    search.set(key, String(value));
  }
  return search.toString();
}

function toSupplier(body: MockSupplier): Supplier {
  return {
    id: body.id,
    name: body.name,
    phone: body.phone,
    address: body.address,
    note: body.note,
    createdAt: body.createdAt,
    updatedAt: body.updatedAt,
  };
}

function supplierFromApi(body: Record<string, unknown>): Supplier {
  return {
    id: String(body.id ?? ""),
    name: String(body.name ?? ""),
    phone: String(body.phone ?? ""),
    address: String(body.address ?? ""),
    note: String(body.note ?? ""),
    createdAt: String(body.created_at ?? ""),
    updatedAt: String(body.updated_at ?? ""),
  };
}

function toPurchase(body: MockPurchase): Purchase {
  return {
    id: body.id,
    supplierId: body.supplierId,
    supplierName: body.supplierName,
    purchasedOn: body.purchasedOn,
    invoiceNo: body.invoiceNo,
    note: body.note,
    createdAt: body.createdAt,
    items: body.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      unitCost: item.unitCost,
    })),
  };
}

function purchaseFromApi(body: Record<string, unknown>): Purchase {
  const items = Array.isArray(body.items) ? body.items : [];
  return {
    id: String(body.id ?? ""),
    supplierId: String(body.supplier_id ?? ""),
    supplierName: String(body.supplier_name ?? ""),
    purchasedOn: String(body.purchased_on ?? ""),
    invoiceNo: String(body.invoice_no ?? ""),
    note: String(body.note ?? ""),
    createdAt: String(body.created_at ?? ""),
    items: items.map((item) => {
      const row = item as Record<string, unknown>;
      return {
        id: String(row.id ?? ""),
        productId: row.product_id == null ? null : String(row.product_id),
        variantId: row.variant_id == null ? null : String(row.variant_id),
        quantity: Number(row.quantity ?? 0),
        unitCost: Number(row.unit_cost ?? 0),
      };
    }),
  };
}

function toMovement(body: MockMovement): StockMovement {
  return { ...body };
}

function movementFromApi(body: Record<string, unknown>): StockMovement {
  const type = String(body.movement_type ?? "adjustment") as StockMovementType;
  return {
    id: String(body.id ?? ""),
    productId: body.product_id == null ? null : String(body.product_id),
    variantId: body.variant_id == null ? null : String(body.variant_id),
    productTitle: String(body.product_title ?? ""),
    sku: String(body.sku ?? ""),
    movementType: type,
    quantity: Number(body.quantity ?? 0),
    unitCost: body.unit_cost == null ? null : Number(body.unit_cost),
    orderId: body.order_id == null ? null : String(body.order_id),
    purchaseId: body.purchase_id == null ? null : String(body.purchase_id),
    importBatchId: body.import_batch_id == null ? null : String(body.import_batch_id),
    actorId: body.actor_id == null ? null : String(body.actor_id),
    note: String(body.note ?? ""),
    createdAt: String(body.created_at ?? ""),
  };
}

function pageFromApi<T>(body: Record<string, unknown>, map: (item: Record<string, unknown>) => T): Page<T> {
  const items = Array.isArray(body.items) ? body.items.map((item) => map(item as Record<string, unknown>)) : [];
  return {
    items,
    total: Number(body.total ?? items.length),
    page: Number(body.page ?? 1),
    pageSize: Number(body.page_size ?? items.length),
    pages: Number(body.pages ?? 1),
  };
}

export async function fetchSuppliers(query: { q?: string; page: number; pageSize?: number }): Promise<Page<Supplier>> {
  const pageSize = query.pageSize ?? 20;
  if ((await inventoryBackend()) === "mock") {
    const page = listSuppliers(loadInventory(), { q: query.q, page: query.page, pageSize });
    return { ...page, items: page.items.map(toSupplier) };
  }
  const response = await authorizedFetch(
    `${INVENTORY_PATHS.suppliers}?${pageQuery({ q: query.q, page: query.page, page_size: pageSize })}`,
  );
  if (!response.ok) throw new MartApiError(await readError(response, "Could not load suppliers."));
  return pageFromApi((await response.json()) as Record<string, unknown>, supplierFromApi);
}

export async function saveSupplier(input: SupplierInput, id?: string): Promise<Supplier> {
  requireWriter();
  if ((await inventoryBackend()) === "mock") {
    const state = loadInventory();
    const result = id ? updateSupplier(state, id, input, new Date()) : createSupplier(state, input, new Date());
    if (result.error || !result.supplier) throw new MartApiError(result.error ?? "Could not save the supplier.");
    saveInventory(result.state);
    return toSupplier(result.supplier);
  }
  const response = await authorizedFetch(id ? INVENTORY_PATHS.supplier(id) : INVENTORY_PATHS.suppliers, {
    method: id ? "PATCH" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: input.name,
      phone: input.phone,
      address: input.address,
      note: input.note,
    }),
  });
  if (!response.ok) throw new MartApiError(await readError(response, "Could not save the supplier."));
  return supplierFromApi((await response.json()) as Record<string, unknown>);
}

export async function fetchPurchases(query: {
  supplierId?: string | null;
  from?: string | null;
  to?: string | null;
  page: number;
  pageSize?: number;
}): Promise<Page<Purchase>> {
  const pageSize = query.pageSize ?? 20;
  if ((await inventoryBackend()) === "mock") {
    const page = listPurchases(loadInventory(), { ...query, page: query.page, pageSize });
    return { ...page, items: page.items.map(toPurchase) };
  }
  const response = await authorizedFetch(
    `${INVENTORY_PATHS.purchases}?${pageQuery({
      supplier_id: query.supplierId,
      date_from: query.from,
      date_to: query.to,
      page: query.page,
      page_size: pageSize,
    })}`,
  );
  if (!response.ok) throw new MartApiError(await readError(response, "Could not load purchases."));
  return pageFromApi((await response.json()) as Record<string, unknown>, purchaseFromApi);
}

export async function savePurchase(input: PurchaseInput): Promise<Purchase> {
  requireWriter();
  if ((await inventoryBackend()) === "mock") {
    const result = createPurchase(loadInventory(), input, MOCK_ACTOR_ID, new Date());
    if (result.error || !result.purchase) throw new MartApiError(result.error ?? "Could not save the purchase.");
    saveInventory(result.state);
    return toPurchase(result.purchase);
  }
  const response = await authorizedFetch(INVENTORY_PATHS.purchases, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      supplier_id: input.supplierId,
      purchased_on: input.purchasedOn,
      invoice_no: input.invoiceNo,
      note: input.note,
      items: input.items.map((item) => ({
        product_id: item.productId,
        ...(item.variantId ? { variant_id: item.variantId } : {}),
        quantity: item.quantity,
        unit_cost: item.unitCost,
      })),
    }),
  });
  if (!response.ok) throw new MartApiError(await readError(response, "Could not save the purchase."));
  return purchaseFromApi((await response.json()) as Record<string, unknown>);
}

export async function fetchStockMovements(query: {
  from?: string | null;
  to?: string | null;
  productId?: string | null;
  type?: StockMovementType | null;
  page: number;
  pageSize?: number;
}): Promise<Page<StockMovement>> {
  const pageSize = query.pageSize ?? 20;
  if ((await inventoryBackend()) === "mock") {
    const page = listMovements(
      loadInventory(),
      {
        from: query.from ?? null,
        to: query.to ?? null,
        productId: query.productId ?? null,
        type: query.type ?? null,
      },
      query.page,
      pageSize,
    );
    return { ...page, items: page.items.map(toMovement) };
  }
  const response = await authorizedFetch(
    `${INVENTORY_PATHS.movements}?${pageQuery({
      date_from: query.from,
      date_to: query.to,
      product_id: query.productId,
      movement_type: query.type,
      page: query.page,
      page_size: pageSize,
    })}`,
  );
  if (!response.ok) throw new MartApiError(await readError(response, "Could not load stock history."));
  return pageFromApi((await response.json()) as Record<string, unknown>, movementFromApi);
}

/**
 * On-hand quantity and cost live on the admin product (`quantity`, `cost_price`).
 * The ledger has no separate stock read. Mock mode reads the stand-in book.
 */
export async function fetchProductStock(productId: string): Promise<ProductStock | null> {
  if ((await inventoryBackend()) === "mock") {
    const row = loadInventory().stock.find((item) => item.productId === productId);
    if (!row) return null;
    return {
      productId: row.productId,
      quantity: row.quantity,
      costPrice: row.costPrice,
      sku: row.sku,
      name: row.name,
    };
  }
  try {
    const product = await getMartProduct(productId);
    const variant = product.variants?.find((item) => item.sku);
    return {
      productId,
      quantity: product.quantity,
      costPrice: product.costPrice ?? null,
      sku: variant?.sku || product.slug,
      name: product.title,
    };
  } catch (error) {
    if (error instanceof MartApiError && /not found/i.test(error.message)) return null;
    throw error instanceof MartApiError ? error : new MartApiError("Could not load stock.");
  }
}

export async function saveStockAdjustment(input: {
  productId: string;
  variantId?: string | null;
  quantity: number;
  reason: string;
}): Promise<StockMovement> {
  requireWriter();
  if ((await inventoryBackend()) === "mock") {
    const result = adjustStock(loadInventory(), input, MOCK_ACTOR_ID, new Date());
    if (result.error || !result.movement) throw new MartApiError(result.error ?? "Could not adjust stock.");
    saveInventory(result.state);
    return toMovement(result.movement);
  }
  const response = await authorizedFetch(INVENTORY_PATHS.adjustments, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      product_id: input.productId,
      ...(input.variantId ? { variant_id: input.variantId } : {}),
      quantity: input.quantity,
      reason: input.reason,
    }),
  });
  if (!response.ok) throw new MartApiError(await readError(response, "Could not adjust stock."));
  return movementFromApi((await response.json()) as Record<string, unknown>);
}

export async function recordOpeningStock(): Promise<OpeningStockResult> {
  requireWriter();
  if ((await inventoryBackend()) === "mock") {
    const result = recordOpeningInMock(loadInventory(), MOCK_ACTOR_ID, new Date());
    saveInventory(result.state);
    return { created: result.created, alreadyRecorded: result.alreadyRecorded, untracked: result.untracked };
  }
  const response = await authorizedFetch(INVENTORY_PATHS.openingStock, { method: "POST" });
  if (!response.ok) throw new MartApiError(await readError(response, "Could not record opening stock."));
  const body = (await response.json()) as Record<string, unknown>;
  return {
    created: Number(body.created ?? 0),
    alreadyRecorded: Number(body.already_recorded ?? 0),
    untracked: Number(body.untracked ?? 0),
  };
}

type ListedProduct = Awaited<ReturnType<typeof listMartProducts>>["items"][number];

function choicesFromProducts(items: ListedProduct[]): ProductChoice[] {
  const choices: ProductChoice[] = [];
  for (const product of items) {
    const id = product.id ?? "";
    const variants = (product.variants ?? []).filter((variant) => Boolean(variant.id));
    if (variants.length === 0) {
      choices.push({
        id,
        variantId: null,
        name: product.title,
        sku: product.slug,
        quantity: product.quantity,
        costPrice: product.costPrice ?? null,
      });
      continue;
    }
    for (const variant of variants) {
      if (!variant.id) continue;
      choices.push({
        id,
        variantId: variant.id,
        name: product.title,
        sku: variant.sku,
        quantity: variant.quantity,
        costPrice: product.costPrice ?? null,
      });
    }
  }
  return choices;
}

export async function fetchProductChoices(): Promise<ProductChoice[]> {
  try {
    const page = await listMartProducts({ page: 1, pageSize: 100 });
    return choicesFromProducts(page.items);
  } catch (error) {
    if ((await inventoryBackend()) === "mock") {
      return loadInventory().stock.map((row) => ({
        id: row.productId,
        variantId: null,
        name: row.name,
        sku: row.sku,
        quantity: row.quantity,
        costPrice: row.costPrice,
      }));
    }
    throw error instanceof MartApiError ? error : new MartApiError("Could not load products.");
  }
}

export async function searchProductsForPurchase(q: string): Promise<ProductChoice[]> {
  try {
    const page = await listMartProducts({ q, page: 1, pageSize: 8 });
    return choicesFromProducts(page.items);
  } catch (error) {
    if ((await inventoryBackend()) === "mock") {
      return searchStock(loadInventory(), q).map((row) => ({
        id: row.productId,
        variantId: null,
        name: row.name,
        sku: row.sku,
        quantity: row.quantity,
        costPrice: row.costPrice,
      }));
    }
    throw error instanceof MartApiError ? error : new MartApiError("Could not search products.");
  }
}

function bytesToBlob(bytes: Uint8Array) {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return new Blob([copy], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

export async function downloadInventoryExport(kind: ExportKind, query: { from?: string | null; to?: string | null }) {
  if ((await inventoryBackend()) === "mock") {
    const state = loadInventory();
    const bytes =
      kind === "products"
        ? productsSheet(state, query)
        : kind === "purchases"
          ? purchasesSheet(state, query)
          : movementsSheet(state, query);
    return bytesToBlob(bytes);
  }
  const response = await authorizedFetch(
    `${INVENTORY_PATHS.export(kind)}?${pageQuery({ date_from: query.from, date_to: query.to })}`,
  );
  if (!response.ok) throw new MartApiError(await readError(response, "Could not export Excel."));
  return response.blob();
}

export async function downloadImportTemplate(kind: ImportKind) {
  if ((await inventoryBackend()) === "mock") return bytesToBlob(templateBytes(kind));
  const response = await authorizedFetch(INVENTORY_PATHS.template(kind));
  if (!response.ok) throw new MartApiError(await readError(response, "Could not download the template."));
  return response.blob();
}

async function fileBytes(file: Blob) {
  return new Uint8Array(await file.arrayBuffer());
}

/** Dry run. Viewers may call this. Nothing is saved. A repeated file sets `duplicate`. */
export async function previewInventoryImport(kind: ImportKind, file: Blob): Promise<ImportPreview> {
  const bytes = await fileBytes(file);
  const fileHash = await sha256Hex(bytes);
  if ((await inventoryBackend()) === "mock") {
    const result = await previewWorkbook(loadInventory(), kind, bytes, fileHash);
    if (result.error || !result.preview) throw new MartApiError(result.error ?? "Could not read this Excel file.");
    return result.preview;
  }
  const body = new FormData();
  body.set("import_type", kind);
  body.set("file", file);
  const response = await authorizedFetch(INVENTORY_PATHS.preview, { method: "POST", body });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new MartApiError(
      await readError(new Response(JSON.stringify(payload), { status: response.status }), "Could not preview this file."),
    );
  }
  const preview = mapImportPreview(payload);
  if (!preview) throw new MartApiError("Could not read the import preview.");
  return preview;
}

export async function confirmInventoryImport(kind: ImportKind, file: Blob, confirmDuplicate = false) {
  requireWriter();
  const bytes = await fileBytes(file);
  const fileHash = await sha256Hex(bytes);
  if ((await inventoryBackend()) === "mock") {
    const result = await confirmWorkbook(loadInventory(), kind, bytes, fileHash, MOCK_ACTOR_ID, new Date(), confirmDuplicate);
    if (result.duplicateHash) throw new DuplicateFileError(result.error ?? "This file was already imported.", result.duplicateHash);
    if (result.error) throw new MartApiError(result.error);
    saveInventory(result.state);
    return { saved: result.saved, skipped: result.skipped, batchId: result.batchId };
  }
  const body = new FormData();
  body.set("import_type", kind);
  body.set("file", file);
  body.set("confirm_duplicate", confirmDuplicate ? "true" : "false");
  const response = await authorizedFetch(INVENTORY_PATHS.confirm, { method: "POST", body });
  const payload = await response.json().catch(() => null);
  if (response.status === 409) {
    const duplicate = readDuplicateFile(payload);
    if (duplicate) throw new DuplicateFileError(duplicate.message, duplicate.fileHash);
  }
  if (!response.ok) {
    throw new MartApiError(
      await readError(new Response(JSON.stringify(payload), { status: response.status }), "Could not import this file."),
    );
  }
  const record = (payload ?? {}) as { saved?: unknown; skipped?: unknown; batch_id?: unknown };
  return {
    saved: Number(record.saved ?? 0),
    skipped: Number(record.skipped ?? 0),
    batchId: record.batch_id == null ? null : String(record.batch_id),
  };
}

export function saveWorkbook(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
