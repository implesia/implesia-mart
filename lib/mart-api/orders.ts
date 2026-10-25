import { guestCartHeaders } from "@/lib/mart-api/cart";
import type { DeliveryZone } from "@/lib/mart-api/delivery";
import { buildQuotePayload, type QuotePayloadInput } from "@/lib/mart-api/order-payload";
import { MartApiError, authorizedFetch, mediaUrl, publicFetch } from "@/lib/mart-api/products";
import type { OrderStatus } from "@/lib/mart-mock/store";

export type QuoteLine = {
  productId: string;
  variantId: string | null;
  cartItemId: string | null;
  title: string;
  slug: string;
  imageSrc: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  available: boolean;
  maxQuantity: number;
  selection: { name: string; label: string; swatch: string }[];
};

export type OrderQuote = {
  items: QuoteLine[];
  itemCount: number;
  subtotal: number;
  shipping: number;
  total: number;
  deliveryZone: DeliveryZone;
  deliveryAvailable: boolean;
};

export type MartOrderItem = {
  id: string;
  productId: string | null;
  variantId: string | null;
  sku: string;
  title: string;
  slug: string;
  imageSrc: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  selection: { name: string; label: string; swatch: string }[];
};

export type MartOrder = {
  id: string;
  number: string;
  source: "cart" | "direct";
  status: OrderStatus;
  paymentMethod: "cod";
  anonymous: boolean;
  customerName: string;
  phone: string;
  email: string;
  district: string;
  area: string;
  address: string;
  notes: string;
  deliveryZone: DeliveryZone;
  subtotal: number;
  shipping: number;
  total: number;
  courierName: string;
  trackingNumber: string;
  items: MartOrderItem[];
  createdAt: string;
  /** Statuses the backend will accept next; empty once the order is final. */
  nextStatuses: OrderStatus[];
};

export type OrderDirectory = {
  items: MartOrder[];
  total: number;
  page: number;
  pages: number;
  metrics: {
    orders: number;
    new: number;
    confirmed: number;
    shipped: number;
    delivered: number;
    cancelled: number;
    returned: number;
    inTransit: number;
    revenue: number;
  };
};

type ApiQuoteLine = {
  product_id: string;
  variant_id?: string | null;
  cart_item_id: string | null;
  title: string;
  slug: string;
  image_src: string;
  unit_price: number;
  quantity: number;
  line_total: number;
  available: boolean;
  max_quantity: number;
  selection?: { name: string; label: string; swatch?: string }[];
};

type ApiQuote = {
  items: ApiQuoteLine[];
  item_count: number;
  subtotal: number;
  shipping: number;
  total: number;
  delivery_zone: DeliveryZone;
  delivery_available?: boolean;
};

type ApiOrderItem = {
  id: string;
  product_id: string | null;
  variant_id?: string | null;
  sku?: string;
  title: string;
  slug: string;
  image_src: string;
  unit_price: number;
  quantity: number;
  line_total: number;
  selection?: { name: string; label: string; swatch?: string }[];
};

type ApiOrder = {
  id: string;
  number: string;
  source: "cart" | "direct";
  status: OrderStatus;
  payment_method: "cod";
  anonymous: boolean;
  customer_name: string;
  phone: string;
  email: string;
  district: string;
  area: string;
  address: string;
  notes: string;
  delivery_zone: DeliveryZone;
  subtotal: number;
  shipping: number;
  total: number;
  courier_name: string;
  tracking_number: string;
  items: ApiOrderItem[];
  created_at: string;
  next_statuses?: OrderStatus[];
};

function mapSelection(selection: { name: string; label: string; swatch?: string }[] | undefined) {
  return (selection ?? []).map((choice) => ({
    name: choice.name,
    label: choice.label,
    swatch: choice.swatch ?? "",
  }));
}

function mapQuote(body: ApiQuote): OrderQuote {
  return {
    items: body.items.map((item) => ({
      productId: item.product_id,
      variantId: item.variant_id ?? null,
      cartItemId: item.cart_item_id,
      title: item.title,
      slug: item.slug,
      imageSrc: mediaUrl(item.image_src),
      unitPrice: item.unit_price,
      quantity: item.quantity,
      lineTotal: item.line_total,
      available: item.available,
      maxQuantity: item.max_quantity,
      selection: mapSelection(item.selection),
    })),
    itemCount: body.item_count,
    subtotal: body.subtotal,
    shipping: body.shipping,
    total: body.total,
    deliveryZone: body.delivery_zone,
    deliveryAvailable: body.delivery_available !== false,
  };
}

function mapOrder(body: ApiOrder): MartOrder {
  return {
    id: body.id,
    number: body.number,
    source: body.source,
    status: body.status,
    paymentMethod: body.payment_method,
    anonymous: body.anonymous,
    customerName: body.customer_name,
    phone: body.phone,
    email: body.email,
    district: body.district,
    area: body.area,
    address: body.address,
    notes: body.notes,
    deliveryZone: body.delivery_zone,
    subtotal: body.subtotal,
    shipping: body.shipping,
    total: body.total,
    courierName: body.courier_name,
    trackingNumber: body.tracking_number,
    createdAt: body.created_at,
    nextStatuses: body.next_statuses ?? [],
    items: body.items.map((item) => ({
      id: item.id,
      productId: item.product_id,
      variantId: item.variant_id ?? null,
      sku: item.sku ?? "",
      title: item.title,
      slug: item.slug,
      imageSrc: mediaUrl(item.image_src),
      unitPrice: item.unit_price,
      quantity: item.quantity,
      lineTotal: item.line_total,
      selection: mapSelection(item.selection),
    })),
  };
}

async function readError(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as { error?: { message?: string } };
    if (body.error?.message) return body.error.message;
  } catch {
    /* not the API envelope */
  }
  return fallback;
}

type QuoteInput = QuotePayloadInput;

function quoteBody(input: QuoteInput) {
  return buildQuotePayload(input);
}

export async function quoteOrder(input: QuoteInput) {
  const response = await publicFetch("/api/v1/orders/quote", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...guestCartHeaders(),
    },
    body: JSON.stringify(quoteBody(input)),
  });
  if (!response.ok) throw new MartApiError(await readError(response, "Could not price this order."));
  return mapQuote((await response.json()) as ApiQuote);
}

export async function placeOrder(
  input: QuoteInput & {
    idempotencyKey: string;
    customerName: string;
    phone: string;
    email: string;
    area: string;
    address: string;
    notes: string;
  },
) {
  const response = await publicFetch("/api/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": input.idempotencyKey,
      ...guestCartHeaders(),
    },
    body: JSON.stringify({
      ...quoteBody(input),
      customer_name: input.customerName.trim(),
      phone: input.phone.trim(),
      email: input.email.trim(),
      area: input.area.trim(),
      address: input.address.trim(),
      notes: input.notes.trim(),
    }),
  });
  if (!response.ok) throw new MartApiError(await readError(response, "Could not place the order."));
  return mapOrder((await response.json()) as ApiOrder);
}

export async function listOrders(query: {
  q?: string;
  status?: OrderStatus | null;
  scope?: "all" | "transit";
  sort?: "newest" | "oldest" | "high" | "low";
  page: number;
}) {
  const search = new URLSearchParams();
  if (query.q) search.set("q", query.q);
  if (query.status) search.set("status", query.status);
  if (query.scope && query.scope !== "all") search.set("scope", query.scope);
  if (query.sort) search.set("sort", query.sort);
  search.set("page", String(query.page));
  search.set("page_size", "10");
  const response = await authorizedFetch(`/api/v1/admin/orders?${search}`);
  if (!response.ok) throw new MartApiError(await readError(response, "Could not load orders."));
  const body = (await response.json()) as {
    items: ApiOrder[];
    total: number;
    page: number;
    pages: number;
    metrics: {
      orders: number;
      new: number;
      confirmed: number;
      shipped: number;
      delivered: number;
      cancelled: number;
      returned: number;
      in_transit: number;
      revenue: number;
    };
  };
  return {
    items: body.items.map(mapOrder),
    total: body.total,
    page: body.page,
    pages: body.pages,
    metrics: {
      orders: body.metrics.orders,
      new: body.metrics.new,
      confirmed: body.metrics.confirmed,
      shipped: body.metrics.shipped,
      delivered: body.metrics.delivered,
      cancelled: body.metrics.cancelled,
      returned: body.metrics.returned,
      inTransit: body.metrics.in_transit,
      revenue: body.metrics.revenue,
    },
  } satisfies OrderDirectory;
}

export async function getOrder(orderId: string) {
  const response = await authorizedFetch(`/api/v1/admin/orders/${orderId}`);
  if (!response.ok) throw new MartApiError(await readError(response, "Could not load this order."));
  return mapOrder((await response.json()) as ApiOrder);
}

export type PublicOrderItem = {
  title: string;
  slug: string;
  /** Null once the product is deleted. */
  productId: string | null;
  imageSrc: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  selection: { name: string; label: string; swatch: string }[];
};

export type PublicOrder = {
  number: string;
  status: OrderStatus;
  customerName: string;
  phone: string;
  deliveryZone: DeliveryZone;
  subtotal: number;
  shipping: number;
  total: number;
  courierName: string;
  trackingNumber: string;
  paymentMethod: "cod";
  items: PublicOrderItem[];
  createdAt: string;
};

type ApiPublicOrderItem = {
  title: string;
  slug: string;
  product_id?: string | null;
  image_src: string;
  unit_price: number;
  quantity: number;
  line_total: number;
  selection?: { name: string; label: string; swatch?: string }[];
};

type ApiPublicOrder = {
  number: string;
  status: OrderStatus;
  customer_name: string;
  phone: string;
  delivery_zone: DeliveryZone;
  subtotal: number;
  shipping: number;
  total: number;
  courier_name: string;
  tracking_number: string;
  payment_method: "cod";
  items: ApiPublicOrderItem[];
  created_at: string;
};

function mapPublicOrder(body: ApiPublicOrder): PublicOrder {
  return {
    number: body.number,
    status: body.status,
    customerName: body.customer_name,
    phone: body.phone,
    deliveryZone: body.delivery_zone,
    subtotal: body.subtotal,
    shipping: body.shipping,
    total: body.total,
    courierName: body.courier_name,
    trackingNumber: body.tracking_number,
    paymentMethod: body.payment_method,
    createdAt: body.created_at,
    items: body.items.map((item) => ({
      title: item.title,
      slug: item.slug,
      productId: item.product_id ?? null,
      imageSrc: mediaUrl(item.image_src),
      unitPrice: item.unit_price,
      quantity: item.quantity,
      lineTotal: item.line_total,
      selection: mapSelection(item.selection),
    })),
  };
}

export async function lookupPublicOrder(number: string, phone: string) {
  const response = await publicFetch("/api/v1/orders/lookup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ number: number.trim(), phone: phone.trim() }),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Order not found."));
  }
  return mapPublicOrder((await response.json()) as ApiPublicOrder);
}

export async function patchOrder(
  orderId: string,
  patch: { status?: OrderStatus; courierName?: string; trackingNumber?: string },
) {
  const body: Record<string, string> = {};
  if (patch.status) body.status = patch.status;
  if (patch.courierName !== undefined) body.courier_name = patch.courierName;
  if (patch.trackingNumber !== undefined) body.tracking_number = patch.trackingNumber;
  const response = await authorizedFetch(`/api/v1/admin/orders/${orderId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new MartApiError(await readError(response, "Could not update this order."));
  return mapOrder((await response.json()) as ApiOrder);
}
