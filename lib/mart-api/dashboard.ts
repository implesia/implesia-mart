import type { OrderStatus } from "@/lib/mart-mock/store";
import {
  MartApiError,
  authorizedFetch,
  mediaUrl,
} from "@/lib/mart-api/products";

export const DASHBOARD_RANGE_OPTIONS = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
  { id: "this-month", label: "This month" },
  { id: "last-month", label: "Last month" },
  { id: "custom", label: "Custom range" },
] as const;

export type DashboardRangeId = (typeof DASHBOARD_RANGE_OPTIONS)[number]["id"];

export type DashboardTrend = {
  direction: "up" | "down" | "flat" | "new";
  text: string;
};

export type DashboardPoint = {
  label: string;
  revenue: number;
  orders: number;
  previousRevenue: number;
};

export type DashboardStatusSlice = {
  status: OrderStatus;
  count: number;
  share: number;
};

export type DashboardSeller = {
  productId: string | null;
  slug: string;
  title: string;
  imageSrc: string;
  category: string;
  units: number;
  revenue: number;
  stockLabel: string;
};

export type DashboardArea = {
  name: string;
  orders: number;
  revenue: number;
  share: number;
};

export type DashboardCategory = {
  id: string;
  label: string;
  revenue: number;
  units: number;
  share: number;
};

export type DashboardRecentOrder = {
  id: string;
  number: string;
  createdAt: string;
  status: OrderStatus;
  customerName: string;
  itemsLabel: string;
  total: number;
};

export type DashboardSnapshot = {
  periodLabel: string;
  comparisonLabel: string;
  grainLabel: string;
  revenue: DashboardMetric;
  orders: DashboardMetric;
  customers: DashboardMetric;
  averageOrderValue: DashboardMetric;
  pending: DashboardMetric;
  delivered: DashboardMetric;
  series: DashboardPoint[];
  statuses: DashboardStatusSlice[];
  orderCount: number;
  bestSellers: DashboardSeller[];
  recent: DashboardRecentOrder[];
  areas: DashboardArea[];
  categories: DashboardCategory[];
};

type DashboardMetric = {
  value: number;
  display: string;
  trend: DashboardTrend;
  sparkline: number[];
};

type ApiMetric = {
  value: number;
  display: string;
  trend: DashboardTrend;
  sparkline?: number[];
};

type ApiOverview = {
  period_label: string;
  comparison_label: string;
  grain_label: string;
  revenue: ApiMetric;
  orders: ApiMetric;
  customers: ApiMetric;
  average_order: ApiMetric;
  pending: ApiMetric;
  delivered: ApiMetric;
  series: {
    label: string;
    revenue: number;
    orders: number;
    previous_revenue: number;
  }[];
  statuses: { status: OrderStatus; count: number; share: number }[];
  order_count: number;
  best_sellers: {
    product_id: string | null;
    slug: string;
    title: string;
    image_src: string;
    category: string;
    units: number;
    revenue: number;
    stock_label: string;
  }[];
  recent: {
    id: string;
    number: string;
    created_at: string;
    status: OrderStatus;
    customer_name: string;
    items_label: string;
    total: number;
  }[];
  areas: { name: string; orders: number; revenue: number; share: number }[];
  categories: {
    id: string;
    label: string;
    revenue: number;
    units: number;
    share: number;
  }[];
};

function metric(body: ApiMetric): DashboardMetric {
  return {
    value: body.value,
    display: body.display,
    trend: body.trend,
    sparkline: body.sparkline ?? [],
  };
}

export async function getDashboardOverview(input: {
  range: DashboardRangeId;
  from?: string;
  to?: string;
}): Promise<DashboardSnapshot> {
  const params = new URLSearchParams({ range: input.range });
  if (input.range === "custom" && input.from && input.to) {
    params.set("from", input.from);
    params.set("to", input.to);
  }
  const response = await authorizedFetch(`/api/v1/admin/dashboard?${params}`);
  if (!response.ok) {
    throw new MartApiError(
      await readError(response, "Could not load the dashboard."),
    );
  }
  const body = (await response.json()) as ApiOverview;
  return {
    periodLabel: body.period_label,
    comparisonLabel: body.comparison_label,
    grainLabel: body.grain_label,
    revenue: metric(body.revenue),
    orders: metric(body.orders),
    customers: metric(body.customers),
    averageOrderValue: metric(body.average_order),
    pending: metric(body.pending),
    delivered: metric(body.delivered),
    series: body.series.map((point) => ({
      label: point.label,
      revenue: point.revenue,
      orders: point.orders,
      previousRevenue: point.previous_revenue,
    })),
    statuses: body.statuses,
    orderCount: body.order_count,
    bestSellers: body.best_sellers.map((product) => ({
      productId: product.product_id,
      slug: product.slug,
      title: product.title,
      imageSrc: mediaUrl(product.image_src),
      category: product.category,
      units: product.units,
      revenue: product.revenue,
      stockLabel: product.stock_label,
    })),
    recent: body.recent.map((order) => ({
      id: order.id,
      number: order.number,
      createdAt: order.created_at,
      status: order.status,
      customerName: order.customer_name,
      itemsLabel: order.items_label,
      total: order.total,
    })),
    areas: body.areas,
    categories: body.categories,
  };
}

async function readError(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as { error?: { message?: string } };
    if (body.error?.message) return body.error.message;
  } catch {
    /* not the API envelope */
  }
  if (response.status === 401) return "Sign in again to view the dashboard.";
  return fallback;
}
