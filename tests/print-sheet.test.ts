import assert from "node:assert/strict";
import test from "node:test";

import { qrMatrix, qrSvg } from "@/lib/admin/qr";
import { printPdfFilename } from "@/lib/admin/download-print-pdf";
import {
  formatCalendarDate,
  invoiceHeading,
  invoiceIdFromNumber,
  joinFullAddress,
  orderStatusUrl,
  packetLabelModel,
  printOrderFromApi,
  shopVisitUrl,
} from "@/lib/admin/print-sheet";

const SAMPLE = {
  id: "11111111-1111-4111-8111-111111111111",
  invoice_id: "INV-AB12CD34",
  number: "IM-AB12CD34",
  order_number: "IM-AB12CD34",
  status: "confirmed",
  origin: "offline",
  ordered_at: "2026-11-16T00:00:00+06:00",
  created_at: "2026-11-16T09:00:00+00:00",
  estimated_delivery_date: "2026-11-18",
  customer_name: "Karim Uddin",
  phone: "01800000000",
  email: "",
  district: "Dhaka",
  area: "Gulshan",
  address: "House 4, Road 12, Gulshan",
  full_address: "House 4, Road 12, Gulshan, Gulshan, Dhaka",
  notes: "Counter sale",
  courier_name: "Pathao",
  tracking_number: "TRK-1",
  payment_method: "cash",
  payment_status: "partial",
  subtotal: 1000,
  manual_discount: 100,
  coupon_discount: null,
  shipping: 80,
  total: 980,
  paid_amount: 200,
  due_amount: 780,
  items: [
    {
      title: "Counter lamp",
      variant_label: "Red / M",
      sku: "LAMP-1",
      product_id_short: "123e4567",
      quantity: 2,
      unit_price: 500,
      line_total: 1000,
      selection: [],
    },
  ],
};

test("print data keeps invoice id, dates, address, and item codes", () => {
  const order = printOrderFromApi(SAMPLE);
  assert.equal(order.invoiceId, "INV-AB12CD34");
  assert.equal(order.orderNumber, "IM-AB12CD34");
  assert.equal(order.email, "");
  assert.equal(order.fullAddress, "House 4, Road 12, Gulshan, Gulshan, Dhaka");
  assert.equal(order.estimatedDeliveryDate, "2026-11-18");
  assert.equal(order.items[0]?.variantLabel, "Red / M");
  assert.equal(order.items[0]?.sku, "LAMP-1");
  assert.equal(order.items[0]?.productIdShort, "123e4567");
  const heading = invoiceHeading(order, "https://mart.implesia.com");
  assert.equal(heading.created, "16 Nov 2026, 3:00 PM");
  assert.equal(heading.estimatedDelivery, "18 Nov 2026");
  assert.equal(heading.email, "");
  assert.equal(heading.shopUrl, "https://mart.implesia.com");
  assert.equal(heading.shopCaption, "আমাদের shop দেখুন");
});

test("a missing invoice id is derived, and a blank email stays blank", () => {
  const order = printOrderFromApi({
    ...SAMPLE,
    invoice_id: "",
    email: "  ",
    full_address: undefined,
    items: [{ title: "Lamp", sku: "S", quantity: 1, unit_price: 10, line_total: 10, selection: [{ name: "Size", label: "M" }] }],
  });
  assert.equal(order.invoiceId, invoiceIdFromNumber("IM-AB12CD34"));
  assert.equal(order.email, "");
  assert.equal(order.fullAddress, joinFullAddress(SAMPLE.address, SAMPLE.area, SAMPLE.district));
  assert.equal(order.items[0]?.variantLabel, "M");
});

test("the packet label has no email, sku, product id, or item lines", () => {
  const order = printOrderFromApi({
    ...SAMPLE,
    email: "karim@example.com",
  });
  const label = packetLabelModel(order, "https://mart.implesia.com/");
  const dumped = JSON.stringify(label);
  assert.equal(label.invoiceId, "INV-AB12CD34");
  assert.equal(label.number, "IM-AB12CD34");
  assert.equal(label.customerName, "Karim Uddin");
  assert.equal(label.phone, "01800000000");
  assert.equal(label.address, SAMPLE.full_address);
  assert.equal(label.dueAmount, 780);
  assert.equal(label.itemCount, 2);
  assert.equal(label.courier, "Pathao · TRK-1");
  assert.equal(label.orderDate, "16 Nov 2026");
  assert.equal(label.statusUrl, "https://mart.implesia.com/order-status?number=IM-AB12CD34");
  assert.equal(dumped.includes("karim@example.com"), false);
  assert.equal(dumped.includes("LAMP-1"), false);
  assert.equal(dumped.includes("123e4567"), false);
  assert.equal(dumped.includes("Counter lamp"), false);
  assert.equal("email" in label, false);
  assert.equal("items" in label, false);
});

test("shop and status links use the site origin", () => {
  assert.equal(shopVisitUrl("https://shop.example/mart/"), "https://shop.example");
  assert.equal(
    orderStatusUrl("IM-AB12CD34", "https://shop.example/mart"),
    "https://shop.example/order-status?number=IM-AB12CD34",
  );
  assert.equal(formatCalendarDate("2026-11-18"), "18 Nov 2026");
  assert.equal(formatCalendarDate("not-a-date"), "");
});

test("QR svg is deterministic and does not print the payload", () => {
  const url = "https://mart.implesia.com/order-status?number=IM-AB12CD34";
  const matrix = qrMatrix(url);
  assert.equal(matrix.length, matrix[0]?.length);
  assert.ok(matrix.length >= 21 && (matrix.length - 17) % 4 === 0);
  const svg = qrSvg(url, { moduleSize: 2, quiet: 2 });
  assert.equal(svg, qrSvg(url, { moduleSize: 2, quiet: 2 }));
  assert.match(svg, /^<svg/);
  assert.match(svg, /<path /);
  assert.equal(svg.includes(url), false);
  assert.throws(() => qrMatrix(""), /empty/);
});

test("print PDF filename uses the order number, or a plural name", () => {
  assert.equal(printPdfFilename("label", ["IM-28080126"]), "IM-28080126-label.pdf");
  assert.equal(printPdfFilename("invoice", ["IM-28080126"]), "IM-28080126-invoice.pdf");
  assert.equal(printPdfFilename("both", ["IM-1", "IM-2"]), "orders-print.pdf");
});
