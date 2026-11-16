/**
 * Print-sheet fields from `POST /api/v1/admin/orders/print-data`
 * (implesia-mart-backend PR #18). The invoice and the 4×6 label both read
 * this shape. The label model leaves out email, SKU, product id, and item lines.
 */

import { formatDhakaDateTime } from "@/lib/admin/order-timestamps";
import { SITE_URL } from "@/lib/seo";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const SHOP_QR_CAPTION = "আমাদের shop দেখুন";

export type PrintLine = {
  title: string;
  variantLabel: string;
  sku: string;
  productIdShort: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  selection: { name: string; label: string }[];
};

export type PrintOrder = {
  id: string;
  invoiceId: string;
  number: string;
  orderNumber: string;
  status: string;
  origin: "online" | "offline";
  orderedAt: string | null;
  createdAt: string;
  estimatedDeliveryDate: string;
  customerName: string;
  phone: string;
  email: string;
  district: string;
  area: string;
  address: string;
  fullAddress: string;
  notes: string;
  courierName: string;
  trackingNumber: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  manualDiscount: number;
  couponDiscount: number | null;
  shipping: number;
  total: number;
  paidAmount: number;
  dueAmount: number;
  items: PrintLine[];
};

export function storefrontOrigin(siteUrl = SITE_URL) {
  const trimmed = siteUrl.trim().replace(/\/+$/, "");
  try {
    return new URL(trimmed).origin;
  } catch {
    return trimmed;
  }
}

/** QR target on the invoice: the storefront origin, no path. */
export function shopVisitUrl(siteUrl = SITE_URL) {
  return storefrontOrigin(siteUrl);
}

/** QR target on the packet label. The phone is not in the URL. */
export function orderStatusUrl(orderNumber: string, siteUrl = SITE_URL) {
  const number = orderNumber.trim();
  return `${storefrontOrigin(siteUrl)}/order-status?number=${encodeURIComponent(number)}`;
}

/** `IM-AB12CD34` → `INV-AB12CD34`. Empty when the number is not that shape. */
export function invoiceIdFromNumber(number: string) {
  const match = /^IM-([0-9A-Fa-f]{8})$/.exec(number.trim());
  return match ? `INV-${match[1].toUpperCase()}` : "";
}

export function joinFullAddress(address: string, area: string, district: string) {
  return [address, area, district].map((part) => part.trim()).filter(Boolean).join(", ");
}

/** `YYYY-MM-DD` as `18 Nov 2026`. Empty when the value is not that shape. */
export function formatCalendarDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return "";
  const month = MONTHS[Number(match[2]) - 1];
  if (!month) return "";
  return `${match[3]} ${month} ${match[1]}`;
}

/** Calendar date of an instant in Asia/Dhaka, or "" when it is not a date. */
export function formatDhakaDate(iso: string) {
  const date = new Date(iso);
  if (!iso.trim() || Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Dhaka",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).formatToParts(date);
  const day = parts.find((part) => part.type === "day")?.value ?? "";
  const month = (parts.find((part) => part.type === "month")?.value ?? "").replace(/\./g, "");
  const year = parts.find((part) => part.type === "year")?.value ?? "";
  if (!day || !month || !year) return "";
  return `${day} ${month} ${year}`;
}

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

function readProductIdShort(value: unknown) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (/^[0-9a-f]{8}$/i.test(trimmed)) return trimmed.toLowerCase();
  const hex = trimmed.replace(/-/g, "");
  if (/^[0-9a-f]{32}$/i.test(hex)) return hex.slice(0, 8).toLowerCase();
  return "";
}

function readSelection(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((choice) => {
    const option = choice as { name?: string; label?: string };
    return { name: option.name ?? "", label: option.label ?? "" };
  });
}

function readVariantLabel(row: Record<string, unknown>, selection: { label: string }[]) {
  if (typeof row.variant_label === "string") return row.variant_label;
  return selection.map((choice) => choice.label.trim()).filter(Boolean).join(" / ");
}

export function printOrderFromApi(body: Record<string, unknown>): PrintOrder {
  const number = text(body.number);
  const orderNumber = text(body.order_number).trim() || number;
  const invoiceId = text(body.invoice_id).trim() || invoiceIdFromNumber(orderNumber || number);
  const address = text(body.address);
  const area = text(body.area);
  const district = text(body.district);
  const items = Array.isArray(body.items) ? body.items : [];
  return {
    id: text(body.id),
    invoiceId,
    number,
    orderNumber,
    status: text(body.status),
    origin: body.origin === "offline" ? "offline" : "online",
    orderedAt: typeof body.ordered_at === "string" ? body.ordered_at : null,
    createdAt: text(body.created_at),
    estimatedDeliveryDate: /^\d{4}-\d{2}-\d{2}$/.test(text(body.estimated_delivery_date).trim())
      ? text(body.estimated_delivery_date).trim()
      : "",
    customerName: text(body.customer_name),
    phone: text(body.phone),
    email: text(body.email).trim(),
    district,
    area,
    address,
    fullAddress:
      typeof body.full_address === "string"
        ? body.full_address.trim()
        : joinFullAddress(address, area, district),
    notes: text(body.notes),
    courierName: text(body.courier_name),
    trackingNumber: text(body.tracking_number),
    paymentMethod: text(body.payment_method),
    paymentStatus: text(body.payment_status),
    subtotal: Number(body.subtotal ?? 0),
    manualDiscount: Number(body.manual_discount ?? 0),
    couponDiscount: typeof body.coupon_discount === "number" ? body.coupon_discount : null,
    shipping: Number(body.shipping ?? 0),
    total: Number(body.total ?? 0),
    paidAmount: Number(body.paid_amount ?? 0),
    dueAmount: Number(body.due_amount ?? 0),
    items: items.map((item) => {
      const row = item as Record<string, unknown>;
      const selection = readSelection(row.selection);
      return {
        title: text(row.title),
        variantLabel: readVariantLabel(row, selection),
        sku: text(row.sku),
        productIdShort: readProductIdShort(row.product_id_short),
        quantity: Number(row.quantity ?? 0),
        unitPrice: Number(row.unit_price ?? 0),
        lineTotal: Number(row.line_total ?? 0),
        selection,
      };
    }),
  };
}

export function invoiceHeading(order: PrintOrder, siteUrl = SITE_URL) {
  return {
    invoiceId: order.invoiceId,
    orderNumber: order.orderNumber || order.number,
    created: formatDhakaDateTime(order.createdAt),
    estimatedDelivery: formatCalendarDate(order.estimatedDeliveryDate),
    email: order.email.trim(),
    address: order.fullAddress.trim(),
    shopUrl: shopVisitUrl(siteUrl),
    shopCaption: SHOP_QR_CAPTION,
  };
}

/** What the 4×6 label is allowed to show. Email, SKU, product id, and item lines are absent. */
export function packetLabelModel(order: PrintOrder, siteUrl = SITE_URL) {
  const number = order.orderNumber || order.number;
  const courier = [order.courierName.trim(), order.trackingNumber.trim()].filter(Boolean).join(" · ");
  return {
    number,
    invoiceId: order.invoiceId,
    customerName: order.customerName,
    phone: order.phone,
    address: order.fullAddress.trim(),
    dueAmount: order.dueAmount,
    itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
    courier,
    orderDate: formatDhakaDate(order.createdAt),
    statusUrl: orderStatusUrl(number, siteUrl),
  };
}
