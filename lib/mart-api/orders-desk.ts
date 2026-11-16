/**
 * Admin orders desk. Paths match implesia-mart-backend PR #18, branch
 * `cursor/admin-orders-management-aaf2`.
 *
 * Until `GET /api/v1/admin/orders/overview` answers, and only when the mock
 * gate is on, calls use `lib/mart-mock/orders-desk`. A 401, 403, or 422 is
 * shown and is not replaced by the mock. This module does not send analytics.
 */

import {
  offlineCreateBody,
  orderItemsBody,
  readRatePercent,
  type OfflineLineInput,
  type OfflineOrderInput,
  type OrderListQuery,
  type OrderOrigin,
  type StatusCountMap,
} from "@/lib/admin/orders-desk";
import type { OrderStatus } from "@/lib/mart-mock/store";
import { mockFallbackAllowed } from "@/lib/mock-mode";
import {
  mockBulkStatus,
  mockCreateOffline,
  mockGetOrder,
  mockListOrders,
  mockMarkPrinted,
  mockOrdersOverview,
  mockPatchOrder,
  mockPrintData,
  mockReadyToPack,
  mockReplaceItems,
  mockSearchCustomers,
} from "@/lib/mart-mock/orders-desk";
import { printOrderFromApi, type PrintOrder } from "@/lib/admin/print-sheet";
import { MartApiError, authorizedFetch, getMartProduct, listMartProducts, readError } from "@/lib/mart-api/products";
import type { AdminProduct } from "@/lib/mart-mock/store";
import type { AdminVariant } from "@/lib/mart-api/admin-variants";

import { getOrder, listOrders, mapOrder, patchOrder, type MartOrder } from "@/lib/mart-api/orders";

export const ORDERS_DESK_PATHS = {
  overview: "/api/v1/admin/orders/overview",
  customers: "/api/v1/admin/orders/customers",
  offline: "/api/v1/admin/orders/offline",
  ready: "/api/v1/admin/orders/ready-to-pack",
  bulkStatus: "/api/v1/admin/orders/bulk-status",
  printed: "/api/v1/admin/orders/printed",
  printData: "/api/v1/admin/orders/print-data",
  items: (id: string) => `/api/v1/admin/orders/${encodeURIComponent(id)}/items`,
} as const;

export type OrderOverview = {
  timezone: "Asia/Dhaka";
  today: { orders: number; revenue: number };
  week: { orders: number; revenue: number };
  month: { orders: number; revenue: number };
  pendingConfirm: number;
  readyToPack: number;
  shipped: number;
  returnRatePercent: string | null;
  cancelRatePercent: string | null;
  origins: { origin: OrderOrigin; orders: number; revenue: number }[];
  statusCounts: StatusCountMap;
  recent: {
    id: string;
    number: string;
    status: OrderStatus;
    origin: OrderOrigin;
    total: number;
    customerName: string;
    phone: string;
    createdAt: string;
    orderedAt: string | null;
  }[];
};

export type CustomerMatch = {
  phone: string;
  customerName: string;
  email: string;
  district: string;
  area: string;
  address: string;
  orders: number;
  lastOrderedAt: string;
};

export type OrderProductChoice = {
  productId: string;
  variantId: string | null;
  title: string;
  optionLabel: string;
  sku: string;
  imageSrc: string;
  unitPrice: number;
  /** Null when the product is made to order. */
  quantity: number | null;
};

export type BulkStatusResult = {
  id: string;
  ok: boolean;
  status: string | null;
  error: string | null;
};

export type { PrintLine, PrintOrder } from "@/lib/admin/print-sheet";

let mode: "unknown" | "live" | "mock" = "unknown";

export function resetOrdersDeskMode() {
  mode = "unknown";
}

function mockError(error: unknown): never {
  if (error instanceof Error && error.name === "OrdersDeskMockError") {
    throw new MartApiError(error.message);
  }
  throw error;
}

async function deskMode() {
  if (!mockFallbackAllowed()) return "live" as const;
  if (process.env.NEXT_PUBLIC_ORDERS_DESK_MOCK === "1") return "mock" as const;
  if (mode !== "unknown") return mode;
  try {
    const response = await authorizedFetch(ORDERS_DESK_PATHS.overview);
    mode = response.status === 404 || response.status === 501 || response.status >= 500 ? "mock" : "live";
  } catch {
    mode = "mock";
  }
  return mode;
}

function period(body: { orders?: unknown; revenue?: unknown }) {
  return {
    orders: typeof body.orders === "number" ? body.orders : 0,
    revenue: typeof body.revenue === "number" ? body.revenue : 0,
  };
}

function mapOverview(body: Record<string, unknown>): OrderOverview {
  const origins = Array.isArray(body.origins) ? body.origins : [];
  const recent = Array.isArray(body.recent) ? body.recent : [];
  const counts = (body.status_counts ?? {}) as Partial<Record<OrderStatus, number>>;
  return {
    timezone: "Asia/Dhaka",
    today: period((body.today ?? {}) as { orders?: unknown; revenue?: unknown }),
    week: period((body.week ?? {}) as { orders?: unknown; revenue?: unknown }),
    month: period((body.month ?? {}) as { orders?: unknown; revenue?: unknown }),
    pendingConfirm: typeof body.pending_confirm === "number" ? body.pending_confirm : 0,
    readyToPack: typeof body.ready_to_pack === "number" ? body.ready_to_pack : 0,
    shipped: typeof body.shipped === "number" ? body.shipped : 0,
    returnRatePercent: readRatePercent(body.return_rate_percent),
    cancelRatePercent: readRatePercent(body.cancel_rate_percent),
    origins: (["online", "offline"] as const).map((origin) => {
      const row = origins.find((item) => (item as { origin?: string }).origin === origin) as
        | { orders?: number; revenue?: number }
        | undefined;
      return { origin, orders: row?.orders ?? 0, revenue: row?.revenue ?? 0 };
    }),
    statusCounts: {
      new: counts.new ?? 0,
      confirmed: counts.confirmed ?? 0,
      packed: counts.packed ?? 0,
      shipped: counts.shipped ?? 0,
      delivered: counts.delivered ?? 0,
      cancelled: counts.cancelled ?? 0,
      returned: counts.returned ?? 0,
    },
    recent: recent.flatMap((item) => {
      const row = item as Record<string, unknown>;
      if (typeof row.id !== "string" || typeof row.number !== "string") return [];
      const status = typeof row.status === "string" ? row.status : "new";
      return [
        {
          id: row.id,
          number: row.number,
          status: status as OrderStatus,
          origin: row.origin === "offline" ? "offline" : "online",
          total: typeof row.total === "number" ? row.total : 0,
          customerName: typeof row.customer_name === "string" ? row.customer_name : "",
          phone: typeof row.phone === "string" ? row.phone : "",
          createdAt: typeof row.created_at === "string" ? row.created_at : "",
          orderedAt: typeof row.ordered_at === "string" ? row.ordered_at : null,
        },
      ];
    }),
  };
}

export async function getOrderOverview() {
  if ((await deskMode()) === "mock") return mockOrdersOverview();
  const response = await authorizedFetch(ORDERS_DESK_PATHS.overview);
  if (!response.ok) throw new MartApiError(await readError(response, "Could not load the orders overview."));
  return mapOverview((await response.json()) as Record<string, unknown>);
}

export async function listDeskOrders(query: OrderListQuery) {
  if ((await deskMode()) === "mock") return mockListOrders(query);
  return listOrders(query);
}

export async function getDeskOrder(orderId: string) {
  if ((await deskMode()) === "mock") {
    try {
      return mockGetOrder(orderId);
    } catch (error) {
      mockError(error);
    }
  }
  return getOrder(orderId);
}

export async function patchDeskOrder(
  orderId: string,
  patch: Parameters<typeof patchOrder>[1],
) {
  if ((await deskMode()) === "mock") {
    try {
      return mockPatchOrder(orderId, patch);
    } catch (error) {
      mockError(error);
    }
  }
  return patchOrder(orderId, patch);
}

export async function searchOrderCustomers(q: string) {
  const term = q.trim();
  if (term.length < 2) return [];
  if ((await deskMode()) === "mock") return mockSearchCustomers(term);
  const response = await authorizedFetch(`${ORDERS_DESK_PATHS.customers}?q=${encodeURIComponent(term)}`);
  if (!response.ok) throw new MartApiError(await readError(response, "Could not search customers."));
  const body = (await response.json()) as { items?: Record<string, unknown>[] };
  return (body.items ?? []).map((item) => ({
    phone: String(item.phone ?? ""),
    customerName: String(item.customer_name ?? ""),
    email: String(item.email ?? ""),
    district: String(item.district ?? ""),
    area: String(item.area ?? ""),
    address: String(item.address ?? ""),
    orders: typeof item.orders === "number" ? item.orders : 0,
    lastOrderedAt: String(item.last_ordered_at ?? ""),
  })) satisfies CustomerMatch[];
}

export async function createOfflineOrder(input: OfflineOrderInput, idempotencyKey: string) {
  if ((await deskMode()) === "mock") {
    try {
      return mockCreateOffline(input, idempotencyKey);
    } catch (error) {
      mockError(error);
    }
  }
  const response = await authorizedFetch(ORDERS_DESK_PATHS.offline, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(offlineCreateBody(input)),
  });
  if (!response.ok) throw new MartApiError(await readError(response, "Could not create this order."));
  return mapOrder((await response.json()) as Parameters<typeof mapOrder>[0]);
}

export async function replaceOrderItems(
  orderId: string,
  input: { items: OfflineLineInput[]; manualDiscount: number | null; deliveryCharge: number | null },
) {
  if ((await deskMode()) === "mock") {
    try {
      return mockReplaceItems(orderId, input);
    } catch (error) {
      mockError(error);
    }
  }
  const response = await authorizedFetch(ORDERS_DESK_PATHS.items(orderId), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(orderItemsBody(input)),
  });
  if (!response.ok) throw new MartApiError(await readError(response, "Could not update the items."));
  return mapOrder((await response.json()) as Parameters<typeof mapOrder>[0]);
}

export async function listReadyToPack(query: OrderListQuery) {
  if ((await deskMode()) === "mock") return mockReadyToPack(query);
  const search = new URLSearchParams();
  if (query.q?.trim()) search.set("q", query.q.trim());
  if (query.origin) search.set("origin", query.origin);
  if (query.courier?.trim()) search.set("courier", query.courier.trim());
  search.set("page", String(query.page));
  search.set("page_size", String(query.pageSize ?? 50));
  const response = await authorizedFetch(`${ORDERS_DESK_PATHS.ready}?${search}`);
  if (!response.ok) throw new MartApiError(await readError(response, "Could not load orders ready to pack."));
  const body = (await response.json()) as { items: Parameters<typeof mapOrder>[0][]; total: number; page: number; pages: number };
  return {
    items: body.items.map((item) => mapOrder(item)),
    total: body.total,
    page: body.page,
    pages: body.pages,
  };
}

export async function bulkOrderStatus(status: OrderStatus, ids: string[]) {
  if ((await deskMode()) === "mock") return mockBulkStatus(status, ids);
  const response = await authorizedFetch(ORDERS_DESK_PATHS.bulkStatus, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, ids }),
  });
  if (!response.ok) throw new MartApiError(await readError(response, "Could not update these orders."));
  const body = (await response.json()) as { results?: { id: string; ok: boolean; status?: string | null; error?: string | null }[] };
  return (body.results ?? []).map((row) => ({
    id: row.id,
    ok: row.ok,
    status: row.status ?? null,
    error: row.error ?? null,
  })) satisfies BulkStatusResult[];
}

export async function markOrdersPrinted(ids: string[]) {
  if ((await deskMode()) === "mock") return mockMarkPrinted(ids);
  const response = await authorizedFetch(ORDERS_DESK_PATHS.printed, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  if (!response.ok) throw new MartApiError(await readError(response, "Could not record the print."));
  const body = (await response.json()) as { printed?: string[]; missing?: string[] };
  return { printed: body.printed ?? [], missing: body.missing ?? [] };
}

function mapPrint(body: Record<string, unknown>): PrintOrder {
  return printOrderFromApi(body);
}

export async function getPrintData(ids: string[]) {
  if ((await deskMode()) === "mock") return mockPrintData(ids);
  const response = await authorizedFetch(ORDERS_DESK_PATHS.printData, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  if (!response.ok) throw new MartApiError(await readError(response, "Could not load print data."));
  const body = (await response.json()) as { orders?: Record<string, unknown>[]; missing?: string[] };
  return {
    orders: (body.orders ?? []).map(mapPrint),
    missing: body.missing ?? [],
  };
}

function optionText(variant: AdminVariant) {
  if (variant.label?.trim()) return variant.label.trim();
  return Object.values(variant.options).filter(Boolean).join(" / ");
}

function choicesFrom(product: AdminProduct): OrderProductChoice[] {
  if (!product.id) return [];
  if (product.hasVariants) {
    return (product.variants ?? []).flatMap((variant) => {
      if (!variant.id || variant.isActive === false) return [];
      return [
        {
          productId: product.id!,
          variantId: variant.id,
          title: product.title,
          optionLabel: optionText(variant),
          sku: variant.sku,
          imageSrc: product.imageSrc,
          unitPrice: variant.price,
          quantity: variant.quantity,
        },
      ];
    });
  }
  return [
    {
      productId: product.id,
      variantId: null,
      title: product.title,
      optionLabel: "",
      sku: "",
      imageSrc: product.imageSrc,
      unitPrice: product.price,
      quantity: product.quantity,
    },
  ];
}

/** Live products, one row per option when the product tracks stock per option. */
export async function searchProductsForOrder(q: string) {
  const term = q.trim();
  if (term.length < 2) return [];
  const page = await listMartProducts({ q: term, page: 1, pageSize: 8, visibility: "live" });
  const detailed = await Promise.all(
    page.items.map(async (item) => {
      if (!item.hasVariants || !item.id) return item;
      try {
        return await getMartProduct(item.id);
      } catch {
        return item;
      }
    }),
  );
  return detailed.flatMap(choicesFrom);
}

export type { MartOrder };
