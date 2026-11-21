import {
  ReportQueryError,
  parseChannelBreakdownReport,
  parseDeliveryReport,
  parseMovementReport,
  parseProductAnalyticsReport,
  parseProductReport,
  parseProfitLossReport,
  parseProfitReport,
  parseSalesSummary,
  parseStockReport,
  parseSupplierPerformanceReport,
  parseTrendReport,
  previousRange,
  reportSearchParams,
  type ChannelBreakdownReport,
  type DeliveryReport,
  type MovementReport,
  type ProductAnalyticsReport,
  type ProductReport,
  type ProfitLossReport,
  type ProfitReport,
  type ReportCall,
  type SalesSummary,
  type StockReport,
  type SupplierPerformanceReport,
  type TrendReport,
} from "@/lib/admin/reports";
import {
  mockDelivery,
  mockFilterOptions,
  mockMovements,
  mockProducts,
  mockProfit,
  mockReportWorkbook,
  mockSales,
  mockStock,
  mockTrend,
  type ReportExportKind,
} from "@/lib/mart-mock/reports";
import { mockFallbackAllowed } from "@/lib/mock-mode";
import { listAdminCategories } from "@/lib/mart-api/categories";
import { fetchSuppliers } from "@/lib/mart-api/inventory";
import { MartApiError, authorizedFetch, listMartProducts } from "@/lib/mart-api/products";

const REPORTS = "/api/v1/admin/reports";

export type ReportOverview = {
  sales: SalesSummary;
  profit: ProfitReport;
  delivery: DeliveryReport;
  trend: TrendReport;
  previousSales: SalesSummary;
  previousProfit: ProfitReport;
  previousDelivery: DeliveryReport;
  previousFrom: string;
  previousTo: string;
  profitLoss?: ProfitLossReport | null;
  previousProfitLoss?: ProfitLossReport | null;
  channels?: ChannelBreakdownReport | null;
  stock?: StockReport | null;
  topProducts?: ProductReport | null;
};

let mode: "unknown" | "live" | "mock" = "unknown";

/** 404, 501, or 5xx on the sales report means the routes are not mounted yet. */
export async function reportsBackend(): Promise<"live" | "mock"> {
  // Production builds never show stand-in figures; a failed call is an error.
  if (!mockFallbackAllowed()) return "live";
  if (process.env.NEXT_PUBLIC_REPORTS_MOCK === "1") return "mock";
  if (mode !== "unknown") return mode;
  try {
    const response = await authorizedFetch(`${REPORTS}/sales?preset=this_month`);
    mode = response.status === 404 || response.status === 501 || response.status >= 500 ? "mock" : "live";
  } catch {
    mode = "mock";
  }
  return mode;
}

function callOf(call: ReportCall, window: { from: string; to: string }): ReportCall {
  return {
    ...call,
    preset: null,
    from: window.from,
    to: window.to,
  };
}

async function readReportError(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as { error?: { message?: string }; detail?: unknown };
    if (body.error?.message) return body.error.message;
    if (typeof body.detail === "string") return body.detail;
  } catch {
    /* not JSON */
  }
  if (response.status === 401) return "Sign in again to view reports.";
  if (response.status === 422) return fallback;
  return fallback;
}

async function getJson<T>(path: string, parse: (value: unknown) => T | null, fallback: string): Promise<T> {
  const response = await authorizedFetch(path);
  if (!response.ok) throw new MartApiError(await readReportError(response, fallback));
  const parsed = parse(await response.json());
  if (!parsed) throw new MartApiError(fallback);
  return parsed;
}

export async function fetchSales(call: ReportCall, now = new Date()): Promise<SalesSummary> {
  if ((await reportsBackend()) === "mock") {
    try {
      return mockSales(call, now);
    } catch (error) {
      throw new MartApiError(error instanceof ReportQueryError ? error.message : "Could not load sales.");
    }
  }
  return getJson(`${REPORTS}/sales?${reportSearchParams(call)}`, parseSalesSummary, "Could not load sales.");
}

export async function fetchProfit(call: ReportCall, now = new Date()): Promise<ProfitReport> {
  if ((await reportsBackend()) === "mock") {
    try {
      return mockProfit(call, now);
    } catch (error) {
      throw new MartApiError(error instanceof ReportQueryError ? error.message : "Could not load profit.");
    }
  }
  return getJson(`${REPORTS}/profit?${reportSearchParams(call)}`, parseProfitReport, "Could not load profit.");
}

export async function fetchProducts(call: ReportCall, now = new Date()): Promise<ProductReport> {
  if ((await reportsBackend()) === "mock") {
    try {
      return mockProducts(call, now);
    } catch (error) {
      throw new MartApiError(error instanceof ReportQueryError ? error.message : "Could not load the product report.");
    }
  }
  return getJson(
    `${REPORTS}/products?${reportSearchParams(call)}`,
    parseProductReport,
    "Could not load the product report.",
  );
}

export async function fetchStock(call: ReportCall, now = new Date()): Promise<StockReport> {
  if ((await reportsBackend()) === "mock") {
    try {
      return mockStock(call, now);
    } catch (error) {
      throw new MartApiError(error instanceof ReportQueryError ? error.message : "Could not load the stock report.");
    }
  }
  return getJson(`${REPORTS}/stock?${reportSearchParams(call)}`, parseStockReport, "Could not load the stock report.");
}

export async function fetchMovements(call: ReportCall, now = new Date()): Promise<MovementReport> {
  if ((await reportsBackend()) === "mock") {
    try {
      return mockMovements(call, now);
    } catch (error) {
      throw new MartApiError(error instanceof ReportQueryError ? error.message : "Could not load stock movement.");
    }
  }
  return getJson(
    `${REPORTS}/movements?${reportSearchParams(call)}`,
    parseMovementReport,
    "Could not load stock movement.",
  );
}

export async function fetchDelivery(call: ReportCall, now = new Date()): Promise<DeliveryReport> {
  if ((await reportsBackend()) === "mock") {
    try {
      return mockDelivery(call, now);
    } catch (error) {
      throw new MartApiError(error instanceof ReportQueryError ? error.message : "Could not load delivery.");
    }
  }
  return getJson(`${REPORTS}/delivery?${reportSearchParams(call)}`, parseDeliveryReport, "Could not load delivery.");
}

export async function fetchTrend(call: ReportCall, now = new Date()): Promise<TrendReport> {
  if ((await reportsBackend()) === "mock") {
    try {
      return mockTrend(call, now);
    } catch (error) {
      throw new MartApiError(error instanceof ReportQueryError ? error.message : "Could not load the trend.");
    }
  }
  return getJson(`${REPORTS}/trend?${reportSearchParams(call)}`, parseTrendReport, "Could not load the trend.");
}

export async function fetchProfitLoss(call: ReportCall, now = new Date()): Promise<ProfitLossReport> {
  if ((await reportsBackend()) === "mock") {
    const [sales, profit] = [mockSales(call, now), mockProfit(call, now)];
    return {
      filters: sales.filters,
      grossSales: sales.grossSales,
      productDiscount: Math.max(sales.discount - sales.couponDiscount, 0),
      couponDiscount: sales.couponDiscount,
      manualDiscount: 0,
      deliveryCharge: sales.deliveryCharge,
      returnedOrderValue: 0,
      netRealizedSales: sales.netSales,
      totalCost: profit.cost,
      grossProfit: profit.profit,
      lossAmount: 0,
      netProfit: profit.profit,
      marginPercent: profit.marginPercent,
      collectedAmount: sales.netSales,
      dueAmount: 0,
      unknownCostLines: profit.unknownCostLines,
      unknownCostUnits: profit.unknownCostUnits,
      unknownCostRevenue: profit.unknownCostRevenue,
    };
  }
  return getJson(
    `${REPORTS}/profit-loss?${reportSearchParams(call)}`,
    parseProfitLossReport,
    "Could not load profit & loss.",
  );
}

export async function fetchChannels(call: ReportCall, now = new Date()): Promise<ChannelBreakdownReport> {
  if ((await reportsBackend()) === "mock") {
    const [sales, profit] = [mockSales(call, now), mockProfit(call, now)];
    return {
      filters: sales.filters,
      channels: [
        {
          origin: "online",
          channel: "website",
          orderCount: sales.orderCount,
          units: sales.unitsSold,
          netSales: sales.netSales,
          cogs: profit.cost,
          profit: profit.profit,
          marginPercent: profit.marginPercent,
          collected: sales.netSales,
          due: 0,
          unknownCostUnits: profit.unknownCostUnits,
        },
        {
          origin: "offline",
          channel: "offline",
          orderCount: 0,
          units: 0,
          netSales: 0,
          cogs: 0,
          profit: 0,
          marginPercent: null,
          collected: 0,
          due: 0,
          unknownCostUnits: 0,
        },
      ],
      paymentMethods: [],
    };
  }
  return getJson(
    `${REPORTS}/channels?${reportSearchParams(call)}`,
    parseChannelBreakdownReport,
    "Could not load channel breakdown.",
  );
}

export async function fetchSuppliersReport(
  call: ReportCall,
  now = new Date(),
): Promise<SupplierPerformanceReport> {
  if ((await reportsBackend()) === "mock") {
    const sales = mockSales(call, now);
    return {
      filters: sales.filters,
      items: [],
      totalPurchaseSpend: 0,
      totalSalesRevenue: 0,
      totalCogs: 0,
      totalNetProfit: 0,
    };
  }
  return getJson(
    `${REPORTS}/suppliers?${reportSearchParams(call)}`,
    parseSupplierPerformanceReport,
    "Could not load supplier performance.",
  );
}

export async function fetchProductAnalytics(productId: string): Promise<ProductAnalyticsReport> {
  return getJson(
    `/api/v1/admin/products/${encodeURIComponent(productId)}/analytics`,
    parseProductAnalyticsReport,
    "Could not load product analytics.",
  );
}

export async function loadReportOverview(call: ReportCall, now = new Date()): Promise<ReportOverview> {
  const [sales, profit, delivery, trend, profitLoss, channels, stock, topProducts] = await Promise.all([
    fetchSales(call, now),
    fetchProfit(call, now),
    fetchDelivery(call, now),
    fetchTrend(call, now),
    fetchProfitLoss(call, now).catch(() => null),
    fetchChannels(call, now).catch(() => null),
    fetchStock({ ...call, page: 1, pageSize: 1 }, now).catch(() => null),
    fetchProducts({ ...call, sort: "revenue", page: 1, pageSize: 8 }, now).catch(() => null),
  ]);
  const previous = previousRange(sales.filters.from, sales.filters.to);
  if (!previous) throw new MartApiError("Could not compare with the previous period.");
  const previousCall = callOf(call, previous);
  const [previousSales, previousProfit, previousDelivery, previousProfitLoss] = await Promise.all([
    fetchSales(previousCall, now),
    fetchProfit(previousCall, now),
    fetchDelivery(previousCall, now),
    fetchProfitLoss(previousCall, now).catch(() => null),
  ]);
  return {
    sales,
    profit,
    delivery,
    trend,
    previousSales,
    previousProfit,
    previousDelivery,
    previousFrom: previous.from,
    previousTo: previous.to,
    profitLoss,
    previousProfitLoss,
    channels,
    stock,
    topProducts,
  };
}

/** Every product or stock row, up to 1,000, so the table can sort and search. */
export async function fetchProductRows(call: ReportCall, now = new Date()) {
  const first = await fetchProducts({ ...call, page: 1, pageSize: 100 }, now);
  if (first.pages <= 1) return { items: first.items, total: first.total, truncated: false };
  const pages = Math.min(first.pages, 10);
  const rest = await Promise.all(
    Array.from({ length: pages - 1 }, (_, index) =>
      fetchProducts({ ...call, page: index + 2, pageSize: 100 }, now),
    ),
  );
  return {
    items: [first, ...rest].flatMap((page) => page.items),
    total: first.total,
    truncated: first.pages > 10,
  };
}

export async function fetchStockRows(call: ReportCall, now = new Date()) {
  const first = await fetchStock({ ...call, page: 1, pageSize: 100 }, now);
  if (first.pages <= 1) return { report: first, items: first.items, truncated: false };
  const pages = Math.min(first.pages, 10);
  const rest = await Promise.all(
    Array.from({ length: pages - 1 }, (_, index) => fetchStock({ ...call, page: index + 2, pageSize: 100 }, now)),
  );
  return {
    report: first,
    items: [first, ...rest].flatMap((page) => page.items),
    truncated: first.pages > 10,
  };
}

export async function downloadReportExport(kind: ReportExportKind, call: ReportCall, now = new Date()) {
  if ((await reportsBackend()) === "mock") {
    try {
      const bytes = mockReportWorkbook(kind, call, now);
      const copy = new Uint8Array(bytes.byteLength);
      copy.set(bytes);
      return new Blob([copy], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
    } catch (error) {
      throw new MartApiError(error instanceof ReportQueryError ? error.message : "Could not export Excel.");
    }
  }
  const response = await authorizedFetch(`${REPORTS}/${kind}/export?${reportSearchParams(call)}`);
  if (!response.ok) throw new MartApiError(await readReportError(response, "Could not export Excel."));
  return response.blob();
}

export type ReportFilterChoices = {
  products: { id: string; title: string }[];
  categories: { id: string; label: string }[];
  suppliers: { id: string; name: string }[];
};

export async function loadReportFilterChoices(): Promise<ReportFilterChoices> {
  if ((await reportsBackend()) === "mock") {
    const base = mockFilterOptions();
    return { ...base, suppliers: [] };
  }
  try {
    const [products, categories, suppliersPage] = await Promise.all([
      listMartProducts({ page: 1, pageSize: 100 }),
      listAdminCategories(),
      fetchSuppliers({ page: 1, pageSize: 100 }).catch(() => ({ items: [] })),
    ]);
    return {
      products: products.items.flatMap((product) =>
        product.id ? [{ id: product.id, title: product.title }] : [],
      ),
      categories: categories.map((category) => ({ id: category.id, label: category.label })),
      suppliers: suppliersPage.items.map((supplier) => ({
        id: supplier.id,
        name: supplier.name,
      })),
    };
  } catch {
    return { products: [], categories: [], suppliers: [] };
  }
}
