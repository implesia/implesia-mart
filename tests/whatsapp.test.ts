import assert from "node:assert/strict";
import test from "node:test";

import {
  configuredProductWhatsappNumber,
  productWhatsappMessage,
  selectionLabels,
  whatsappHref,
  whatsappNumber,
  type WhatsappProduct,
} from "../lib/mart-api/whatsapp.ts";

const base: WhatsappProduct = {
  title: "লিনেন শার্ট",
  id: "3f2a9c1e-5b7d-4e8a-9c01-2d3e4f5a6b7c",
  url: "https://mart.implesia.com/products/3f2a9c1e-5b7d-4e8a-9c01-2d3e4f5a6b7c",
  selection: [
    { name: "সাইজ", label: "M" },
    { name: "রং", label: "নীল" },
  ],
  quantity: 2,
  unitPrice: 1250,
  lineTotal: 2500,
  orderable: true,
  status: "available",
};

test("number normalises to wa.me international digits", () => {
  assert.equal(whatsappNumber("01580569129"), "8801580569129");
  assert.equal(whatsappNumber("+880 1580-569129"), "8801580569129");
  assert.equal(whatsappNumber("8801580569129"), "8801580569129");
  for (const bad of ["", "12345", "0158056912", "01280569129", "abc", "8801580569129x", undefined, null]) {
    assert.equal(whatsappNumber(bad), null, String(bad));
  }
});

test("the configured product number is the business number", () => {
  const saved = process.env.NEXT_PUBLIC_PRODUCT_WHATSAPP_NUMBER;
  delete process.env.NEXT_PUBLIC_PRODUCT_WHATSAPP_NUMBER;
  assert.equal(configuredProductWhatsappNumber(), "8801580569129");
  process.env.NEXT_PUBLIC_PRODUCT_WHATSAPP_NUMBER = "garbage";
  assert.equal(configuredProductWhatsappNumber(), null);
  if (saved === undefined) delete process.env.NEXT_PUBLIC_PRODUCT_WHATSAPP_NUMBER;
  else process.env.NEXT_PUBLIC_PRODUCT_WHATSAPP_NUMBER = saved;
});

test("message carries product, id, url, options, quantity, prices", () => {
  const text = productWhatsappMessage(base);
  for (const part of [
    "লিনেন শার্ট",
    base.id,
    base.url,
    "সাইজ: M",
    "রং: নীল",
    "পরিমাণ: 2",
    "৳1,250",
    "৳2,500",
    "অর্ডার করতে চাই",
  ]) {
    assert.ok(text.includes(part), part);
  }
});

test("message updates when variant or quantity change", () => {
  const a = productWhatsappMessage(base);
  const b = productWhatsappMessage({
    ...base,
    selection: [{ name: "সাইজ", label: "L" }],
    quantity: 3,
    unitPrice: 1400,
    lineTotal: 4200,
  });
  assert.notEqual(a, b);
  assert.ok(b.includes("সাইজ: L") && b.includes("পরিমাণ: 3") && b.includes("৳4,200"));
  assert.ok(!b.includes("নীল"));
});

test("unavailable option or sold-out product never promises an order", () => {
  for (const status of ["available", "sold-out", "coming-soon"] as const) {
    const text = productWhatsappMessage({ ...base, orderable: false, status });
    assert.ok(!text.includes("অর্ডার করতে চাই"), status);
    assert.ok(!text.includes("আনুমানিক মোট"), status);
    assert.ok(text.includes("জানাবেন"), status);
  }
});

test("href is a wa.me link with a fully encoded text and no raw newlines", () => {
  const href = whatsappHref("8801580569129", productWhatsappMessage(base));
  assert.ok(href.startsWith("https://wa.me/8801580569129?text="));
  assert.ok(!/[\s\n]/.test(href));
  const url = new URL(href);
  assert.equal(url.searchParams.get("text"), productWhatsappMessage(base));
  const tricky = whatsappHref("8801580569129", "a&b=c#d?e 100%");
  assert.equal(new URL(tricky).searchParams.get("text"), "a&b=c#d?e 100%");
});

test("message holds no customer data fields", () => {
  const text = productWhatsappMessage(base);
  assert.ok(!/phone|address|email|ফোন|ঠিকানা/i.test(text));
});

test("selectionLabels follows group order and skips unknown picks", () => {
  const groups = [
    { id: "g1", name: "সাইজ", values: [{ id: "v1", label: "M" }, { id: "v2", label: "L" }] },
    { id: "g2", name: "রং", values: [{ id: "v3", label: "নীল" }] },
  ];
  assert.deepEqual(selectionLabels(groups, { g1: "v2", g2: "zzz" }), [{ name: "সাইজ", label: "L" }]);
  assert.deepEqual(selectionLabels(groups, {}), []);
});
