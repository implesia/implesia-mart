/**
 * Admin coupon routes. Only when stand-ins are allowed (`mockFallbackAllowed`,
 * never in production builds) and `GET /api/v1/admin/coupons` does not answer
 * (404, 501, 5xx, or the API cannot be reached), the screens use
 * `lib/mart-mock/coupons.ts`. Otherwise every failure is shown as an error.
 * A 401 or 422 is always shown and does not fall back.
 */

import {
  parseCoupon,
  parseCouponList,
  parseCouponReport,
  parseRedemptions,
  type Coupon,
  type CouponList,
  type CouponListQuery,
  type CouponReport,
  type CouponStatus,
  type CouponWrite,
} from "@/lib/admin/coupons";
import { ReportQueryError, reportSearchParams, resolveReportCall, type ReportCall } from "@/lib/admin/reports";
import { listAdminCategories } from "@/lib/mart-api/categories";
import {
  mockCouponCatalog,
  mockCouponReportApi,
  mockCouponWorkbook,
  mockCreateCoupon,
  mockGetCoupon,
  mockListCoupons,
  mockRedemptions,
  mockSetCouponActive,
  mockUpdateCoupon,
} from "@/lib/mart-mock/coupons";
import { MartApiError, authorizedFetch, listMartProducts } from "@/lib/mart-api/products";
import { mockFallbackAllowed } from "@/lib/mock-mode";

const COUPONS = "/api/v1/admin/coupons";

let mode: "unknown" | "live" | "mock" = "unknown";

export function couponsBackendMode() {
  return mode;
}

export function resetCouponsBackendMode() {
  mode = "unknown";
}

function forceMock() {
  return mockFallbackAllowed() && process.env.NEXT_PUBLIC_COUPONS_MOCK === "1";
}

async function readFailure(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as {
      message?: string;
      error_code?: string;
      error?: { message?: string; code?: string; error_code?: string };
    };
    const message = body.error?.message || (typeof body.message === "string" ? body.message : "") || fallback;
    const code = body.error?.error_code || body.error?.code || body.error_code || null;
    return { message, code: typeof code === "string" && code.trim() ? code : null };
  } catch {
    return { message: fallback, code: null };
  }
}

function mockOnStatus(status: number) {
  return mockFallbackAllowed() && (status === 404 || status === 501 || status >= 500);
}

/** Probe the list once. Later calls reuse the result. */
export async function couponsBackend(): Promise<"live" | "mock"> {
  if (forceMock() || (mode === "mock" && mockFallbackAllowed())) {
    mode = "mock";
    return "mock";
  }
  if (mode === "live") return "live";
  try {
    const response = await authorizedFetch(`${COUPONS}?page=1&page_size=1`);
    if (mockOnStatus(response.status)) {
      mode = "mock";
      return "mock";
    }
    if (response.status === 401 || response.status === 403 || response.status === 422) {
      mode = "live";
      return "live";
    }
    mode = response.ok ? "live" : "live";
    return "live";
  } catch {
    if (!mockFallbackAllowed()) return "live";
    mode = "mock";
    return "mock";
  }
}

export async function listCoupons(query: CouponListQuery): Promise<CouponList> {
  if ((await couponsBackend()) === "mock") {
    const parsed = parseCouponList(mockListCoupons(query));
    if (!parsed) throw new MartApiError("Could not load coupons.");
    return parsed;
  }
  const search = new URLSearchParams();
  if (query.q?.trim()) search.set("q", query.q.trim());
  if (query.status) search.set("status", query.status);
  search.set("page", String(query.page));
  search.set("page_size", String(query.pageSize));
  const response = await authorizedFetch(`${COUPONS}?${search}`);
  if (mockOnStatus(response.status) && mode !== "live") {
    mode = "mock";
    const parsed = parseCouponList(mockListCoupons(query));
    if (!parsed) throw new MartApiError("Could not load coupons.");
    return parsed;
  }
  if (!response.ok) throw new MartApiError((await readFailure(response, "Could not load coupons.")).message);
  const parsed = parseCouponList(await response.json(), query.page, query.pageSize);
  if (!parsed) throw new MartApiError("Could not load coupons.");
  mode = "live";
  return parsed;
}

export async function getCoupon(id: string): Promise<Coupon> {
  if ((await couponsBackend()) === "mock") {
    const body = mockGetCoupon(id);
    const coupon = body ? parseCoupon(body) : null;
    if (!coupon) throw new MartApiError("Coupon not found.");
    return coupon;
  }
  const response = await authorizedFetch(`${COUPONS}/${id}`);
  if (!response.ok) throw new MartApiError((await readFailure(response, "Could not load this coupon.")).message);
  const coupon = parseCoupon(await response.json());
  if (!coupon) throw new MartApiError("Could not load this coupon.");
  mode = "live";
  return coupon;
}

export async function createCoupon(body: CouponWrite): Promise<Coupon> {
  if ((await couponsBackend()) === "mock") {
    const result = mockCreateCoupon(body);
    if (!result.ok) throw new MartApiError(result.message);
    const coupon = parseCoupon(result.coupon);
    if (!coupon) throw new MartApiError("Could not create the coupon.");
    return coupon;
  }
  const response = await authorizedFetch(COUPONS, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new MartApiError((await readFailure(response, "Could not create the coupon.")).message);
  const coupon = parseCoupon(await response.json());
  if (!coupon) throw new MartApiError("Could not create the coupon.");
  return coupon;
}

export async function updateCoupon(id: string, body: CouponWrite): Promise<Coupon> {
  if ((await couponsBackend()) === "mock") {
    const result = mockUpdateCoupon(id, body);
    if (!result.ok) throw new MartApiError(result.message);
    const coupon = parseCoupon(result.coupon);
    if (!coupon) throw new MartApiError("Could not save the coupon.");
    return coupon;
  }
  const response = await authorizedFetch(`${COUPONS}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new MartApiError((await readFailure(response, "Could not save the coupon.")).message);
  const coupon = parseCoupon(await response.json());
  if (!coupon) throw new MartApiError("Could not save the coupon.");
  return coupon;
}

export async function setCouponActive(id: string, active: boolean): Promise<Coupon> {
  if ((await couponsBackend()) === "mock") {
    const body = mockSetCouponActive(id, active);
    const coupon = body ? parseCoupon(body) : null;
    if (!coupon) throw new MartApiError("Could not update this coupon.");
    return coupon;
  }
  const response = await authorizedFetch(`${COUPONS}/${id}/${active ? "activate" : "deactivate"}`, {
    method: "POST",
  });
  if (!response.ok) throw new MartApiError((await readFailure(response, "Could not update this coupon.")).message);
  const coupon = parseCoupon(await response.json());
  if (!coupon) throw new MartApiError("Could not update this coupon.");
  return coupon;
}

export async function listCouponRedemptions(id: string, page = 1, pageSize = 20) {
  const search = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  if ((await couponsBackend()) === "mock") {
    const parsed = parseRedemptions(mockRedemptions(id, page, pageSize), page, pageSize);
    if (!parsed) throw new MartApiError("Could not load redemptions.");
    return parsed;
  }
  const response = await authorizedFetch(`${COUPONS}/${id}/redemptions?${search}`);
  if (!response.ok) throw new MartApiError((await readFailure(response, "Could not load redemptions.")).message);
  const parsed = parseRedemptions(await response.json(), page, pageSize);
  if (!parsed) throw new MartApiError("Could not load redemptions.");
  return parsed;
}

function couponReportQuery(call: ReportCall, now: Date) {
  const dated: ReportCall = { preset: call.preset, from: call.from, to: call.to };
  try {
    return { window: resolveReportCall(dated, now), search: reportSearchParams(dated) };
  } catch (error) {
    throw new MartApiError(error instanceof ReportQueryError ? error.message : "Could not load the coupon report.");
  }
}

export async function fetchCouponReport(call: ReportCall, now = new Date()): Promise<CouponReport> {
  const { window, search } = couponReportQuery(call, now);
  if ((await couponsBackend()) === "mock") {
    const parsed = parseCouponReport(mockCouponReportApi(window.from, window.to, window.preset));
    if (!parsed) throw new MartApiError("Could not load the coupon report.");
    return parsed;
  }
  const response = await authorizedFetch(`/api/v1/admin/reports/coupons?${search}`);
  if (mockOnStatus(response.status)) {
    const parsed = parseCouponReport(mockCouponReportApi(window.from, window.to, window.preset));
    if (!parsed) throw new MartApiError("Could not load the coupon report.");
    return parsed;
  }
  if (!response.ok) throw new MartApiError((await readFailure(response, "Could not load the coupon report.")).message);
  const parsed = parseCouponReport(await response.json());
  if (!parsed) throw new MartApiError("Could not load the coupon report.");
  return { ...parsed, from: parsed.from || window.from, to: parsed.to || window.to };
}

export async function downloadCouponReport(call: ReportCall, now = new Date()) {
  const { window, search } = couponReportQuery(call, now);
  if ((await couponsBackend()) === "mock") return workbookBlob(window.from, window.to);
  const response = await authorizedFetch(`/api/v1/admin/reports/coupons/export?${search}`);
  if (mockOnStatus(response.status)) return workbookBlob(window.from, window.to);
  if (!response.ok) throw new MartApiError((await readFailure(response, "Could not export Excel.")).message);
  return response.blob();
}

function workbookBlob(from: string, to: string) {
  const bytes = mockCouponWorkbook(from, to);
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return new Blob([copy], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

export async function loadCouponCatalog() {
  if ((await couponsBackend()) === "mock") return mockCouponCatalog();
  try {
    const [products, categories] = await Promise.all([
      listMartProducts({ page: 1, pageSize: 100 }),
      listAdminCategories(),
    ]);
    return {
      products: products.items.flatMap((product) => (product.id ? [{ id: product.id, title: product.title }] : [])),
      categories: categories.map((category) => ({ id: category.id, label: category.label })),
    };
  } catch (error) {
    if (mockFallbackAllowed()) return mockCouponCatalog();
    throw error instanceof MartApiError ? error : new MartApiError("Could not load products and categories.");
  }
}

export function couponListSearch(query: { q?: string; status?: CouponStatus | null; page?: number }) {
  const search = new URLSearchParams();
  if (query.q) search.set("q", query.q);
  if (query.status) search.set("status", query.status);
  if (query.page && query.page > 1) search.set("page", String(query.page));
  return search;
}
