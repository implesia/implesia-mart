import assert from "node:assert/strict";
import test from "node:test";

import { code128Svg, code128Symbols } from "@/lib/admin/barcode";
import {
  dateSpanError,
  historyBadge,
  isIdempotencyKey,
  legacyOrdersRedirect,
  newIdempotencyKey,
  nextOrderStatuses,
  normalizeBdPhone,
  offlineCreateBody,
  offlineFieldErrors,
  offlineMoneyPreview,
  orderItemsBody,
  orderListSearchParams,
  paymentStatusOf,
  readRatePercent,
  stockBlockMessage,
} from "@/lib/admin/orders-desk";
import { currentAdminPage, isAdminBranchActive } from "@/app/admin/_config/nav";
import { ADMIN_NAV } from "@/app/admin/_config/nav";

test("Code 128 set B checksum for A is 34", () => {
  assert.deepEqual(code128Symbols("A"), [104, 33, 34]);
  const svg = code128Svg("IM-AB12CD34");
  assert.match(svg, /^<svg/);
  assert.match(svg, /<rect /);
  assert.equal(svg.includes("IM-AB12CD34"), false);
});

test("order number barcode stays in set B", () => {
  const symbols = code128Symbols("IM-00FF00AA");
  assert.equal(symbols[0], 104);
  assert.ok(symbols.every((symbol) => symbol >= 0 && symbol < 106));
});

test("history badge names total, delivered, and returned plus cancelled", () => {
  const calm = historyBadge({ phone: "01700000000", totalOrders: 1, delivered: 1, returnedCancelled: 0 });
  assert.equal(calm.label, "1 order · 1 delivered · 0 returned/cancelled");
  assert.equal(calm.caution, false);
  const flagged = historyBadge({ phone: "01700000000", totalOrders: 4, delivered: 1, returnedCancelled: 2 });
  assert.equal(flagged.label, "4 orders · 1 delivered · 2 returned/cancelled");
  assert.equal(flagged.caution, true);
});

test("status moves keep confirmed as ready to pack and packed before shipped", () => {
  assert.deepEqual(nextOrderStatuses("new", null), ["confirmed", "cancelled"]);
  assert.deepEqual(nextOrderStatuses("confirmed", null), ["packed", "cancelled"]);
  assert.deepEqual(nextOrderStatuses("packed", null), ["shipped", "cancelled"]);
  assert.deepEqual(nextOrderStatuses("shipped", ["delivered", "returned"]), ["delivered", "returned"]);
  assert.deepEqual(nextOrderStatuses("cancelled", []), []);
});

test("Bangladesh mobiles normalise to 01XXXXXXXXX", () => {
  assert.equal(normalizeBdPhone("01712-345-678"), "01712345678");
  assert.equal(normalizeBdPhone("+8801712345678"), "01712345678");
  assert.equal(normalizeBdPhone("০১৭১২৩৪৫৬৭৮"), "01712345678");
  assert.equal(normalizeBdPhone("01123456789"), null);
  assert.equal(normalizeBdPhone("123"), null);
});

test("date span refuses an inverted range and more than 366 days", () => {
  assert.equal(dateSpanError("", ""), null);
  assert.equal(dateSpanError("2026-01-01", "2026-01-31"), null);
  assert.equal(dateSpanError("2026-02-01", "2026-01-01"), "The start date is after the end date.");
  assert.match(dateSpanError("2024-01-01", "2026-01-02") ?? "", /366/);
});

test("offline preview uses the quote only when every price is untouched", () => {
  const server = offlineMoneyPreview({
    lines: [{ quantity: 2, unitPrice: 500, priceEdited: false }],
    manualDiscount: 0,
    deliveryCharge: null,
    quote: { subtotal: 990, shipping: 70 },
  });
  assert.equal(server.source, "server");
  assert.equal(server.subtotal, 990);
  assert.equal(server.total, 1060);

  const estimate = offlineMoneyPreview({
    lines: [{ quantity: 2, unitPrice: 450, priceEdited: true }],
    manualDiscount: 50,
    deliveryCharge: 0,
    quote: { subtotal: 990, shipping: 70 },
  });
  assert.equal(estimate.source, "estimate");
  assert.equal(estimate.subtotal, 900);
  assert.equal(estimate.shipping, 0);
  assert.equal(estimate.total, 850);
  assert.match(estimate.note, /server/i);

  const freeDelivery = offlineMoneyPreview({
    lines: [{ quantity: 2, unitPrice: 500, priceEdited: false }],
    manualDiscount: 0,
    deliveryCharge: 0,
    quote: { subtotal: 990, shipping: 70 },
  });
  assert.equal(freeDelivery.shipping, 0);
  assert.equal(freeDelivery.total, 990);
});

test("offline create body omits catalog prices, zone delivery, and client totals", () => {
  const body = offlineCreateBody({
    customerName: " Karim ",
    phone: "01800000000",
    email: "",
    district: "Dhaka",
    area: "Gulshan",
    address: "House 4, Road 12",
    notes: "Counter",
    items: [
      { productId: "p1", variantId: null, quantity: 2, unitPrice: 500, priceEdited: false },
      { productId: "p2", variantId: "v2", quantity: 1, unitPrice: 400, priceEdited: true },
    ],
    manualDiscount: 100,
    deliveryCharge: null,
    paymentMethod: "cash",
    paidAmount: 0,
    paymentReference: "AB 12",
    orderDate: null,
  });
  assert.equal("total" in body, false);
  assert.equal("subtotal" in body, false);
  assert.equal("shipping" in body, false);
  assert.equal("delivery_charge" in body, false);
  assert.equal("order_date" in body, false);
  assert.equal(body.payment_reference, "AB12");
  assert.deepEqual(body.items[0], { product_id: "p1", quantity: 2 });
  assert.deepEqual(body.items[1], { product_id: "p2", variant_id: "v2", quantity: 1, unit_price: 400 });
});

test("offline create body sends delivery_charge 0 when staff leave it blank", () => {
  const body = offlineCreateBody({
    customerName: "Karim",
    phone: "01800000000",
    email: "",
    district: "Dhaka",
    area: "Gulshan",
    address: "House 4, Road 12",
    notes: "",
    items: [{ productId: "p1", variantId: null, quantity: 1, unitPrice: 500, priceEdited: false }],
    manualDiscount: 0,
    deliveryCharge: 0,
    paymentMethod: "cash",
    paidAmount: 0,
    paymentReference: "",
    orderDate: null,
  });
  assert.equal(body.delivery_charge, 0);
});

test("item update can keep the current discount and delivery", () => {
  const body = orderItemsBody({
    items: [{ productId: "p1", variantId: null, quantity: 1, unitPrice: 10, priceEdited: true }],
    manualDiscount: null,
    deliveryCharge: 80,
  });
  assert.equal("manual_discount" in body, false);
  assert.equal(body.delivery_charge, 80);
});

test("offline draft errors block a short address and a bad phone", () => {
  const errors = offlineFieldErrors({
    customerName: "A",
    phone: "123",
    email: "nope",
    district: "D",
    area: "A",
    address: "short",
    items: [],
    manualDiscount: "x",
    deliveryCharge: "",
    paymentMethod: "cod",
    paidAmount: "",
    paymentReference: "!!",
    orderDate: "2019-01-01",
  });
  assert.ok(errors.customerName);
  assert.ok(errors.phone);
  assert.ok(errors.address);
  assert.ok(errors.items);
  assert.ok(errors.paymentMethod);
  assert.equal(Object.keys(offlineFieldErrors({
    customerName: "Karim Uddin",
    phone: "01800000000",
    email: "",
    district: "Dhaka",
    area: "Gulshan",
    address: "House 4, Road 12",
    items: [{ quantity: 1 }],
    manualDiscount: "0",
    deliveryCharge: "",
    paymentMethod: "bkash",
    paidAmount: "0",
    paymentReference: "",
    orderDate: "",
  }, "2026-11-16")).length, 0);
});

test("list query and the old orders URL", () => {
  const search = orderListSearchParams({
    q: " IM-1 ",
    status: "packed",
    origin: "offline",
    paymentMethod: "bkash",
    paymentStatus: "partial",
    callStatus: "no_answer",
    courier: "Pathao",
    dateFrom: "2026-11-01",
    dateTo: "2026-11-16",
    scope: "all",
    sort: "newest",
    page: 2,
    pageSize: 80,
  });
  assert.equal(search.get("q"), "IM-1");
  assert.equal(search.get("status"), "packed");
  assert.equal(search.get("payment_method"), "bkash");
  assert.equal(search.get("call_status"), "no_answer");
  assert.equal(search.get("page_size"), "50");
  assert.equal(search.get("sort"), null);
  assert.equal(legacyOrdersRedirect(new URLSearchParams("status=new&lane=transit")), "/admin/orders/list?status=new&scope=transit");
  assert.equal(legacyOrdersRedirect(new URLSearchParams()), null);
});

test("idempotency keys match the API shape", () => {
  const key = newIdempotencyKey();
  assert.equal(isIdempotencyKey(key), true);
  assert.equal(key.length, 32);
  assert.equal(isIdempotencyKey("short"), false);
});

test("payment status and stock copy", () => {
  assert.equal(paymentStatusOf(0, 100), "unpaid");
  assert.equal(paymentStatusOf(40, 100), "partial");
  assert.equal(paymentStatusOf(100, 100), "paid");
  assert.equal(readRatePercent(null), null);
  assert.equal(readRatePercent(12.5), "12.50");
  assert.equal(stockBlockMessage("স্টকে এতগুলো নেই।"), true);
});

test("orders management is one sidebar group and old list links are not the overview", () => {
  const orders = ADMIN_NAV.flatMap((group) => group.items).find((item) => item.label === "Orders Management");
  assert.ok(orders);
  assert.deepEqual(
    orders?.children?.map((child) => child.label),
    ["Overview", "Create Order", "Order List", "Ready to Pack"],
  );
  assert.equal(isAdminBranchActive("/admin/orders/list", orders!), true);
  assert.equal(isAdminBranchActive("/admin/orders/abc", orders!), true);
  assert.equal(currentAdminPage("/admin/orders/list").label, "Order List");
  assert.equal(currentAdminPage("/admin/orders/ready-to-pack").label, "Ready to Pack");
  assert.equal(currentAdminPage("/admin/orders/00000000-0000-4000-8000-000000000001").label, "Order details");
});
