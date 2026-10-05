import assert from "node:assert/strict";
import test from "node:test";

import {
  catalogResponseKind,
  directCheckoutHref,
  galleryControlName,
  normalizeProductDetail,
  normalizeProductSlug,
  purchaseQuantity,
} from "../lib/mart-api/product-page.ts";

const published = {
  id: "11111111-1111-4111-8111-111111111111",
  slug: "night-upload-check",
  title: "Night upload check",
  subtitle: "",
  category: "gadgets",
  price: 500,
  compare_at_price: 700,
  unit_label: "",
  image_src: "/media/night.jpg",
  image_alt: "Night upload check",
  badge: null,
  status: "available",
  featured: false,
  description: "A real product",
  gallery: [
    { src: "/media/night.jpg", alt: "" },
    { src: "", alt: "empty" },
  ],
  options: [
    {
      id: "size",
      name: "সাইজ",
      kind: "size",
      values: [{ id: "m", label: "M", swatch: "" }],
    },
  ],
};

test("only a safe slug is looked up", () => {
  assert.equal(
    normalizeProductSlug("Night-Upload-Check"),
    "night-upload-check",
  );
  assert.equal(normalizeProductSlug("../admin"), null);
  assert.equal(normalizeProductSlug("not a slug"), null);
  assert.equal(normalizeProductSlug(""), null);
});

test("a missing or unpublished product is not an outage", () => {
  assert.equal(catalogResponseKind(404), "missing");
  assert.equal(catalogResponseKind(200), "ok");
  assert.equal(catalogResponseKind(500), "down");
  assert.equal(catalogResponseKind(401), "down");
});

test("a published detail is kept and a seed id is dropped", () => {
  const detail = normalizeProductDetail(published);
  assert.equal(detail?.title, "Night upload check");
  assert.equal(detail?.price, 500);
  assert.equal(detail?.gallery.length, 1);
  assert.equal(detail?.options[0]?.values[0]?.label, "M");
  assert.equal(
    normalizeProductDetail({ ...published, id: "sunset-lamp" }),
    null,
  );
  assert.equal(normalizeProductDetail({ ...published, status: "draft" }), null);
  assert.equal(normalizeProductDetail(null), null);
});

test("missing optional fields do not reject a real product", () => {
  const detail = normalizeProductDetail({
    ...published,
    gallery: null,
    highlights: "nope",
    faqs: {},
  });
  assert.equal(detail?.gallery.length, 0);
  assert.deepEqual(detail?.highlights, []);
  assert.deepEqual(detail?.faqs, []);
});

test("gallery names include the product and the image number", () => {
  assert.equal(
    galleryControlName("Night upload check", 0, "image"),
    "Night upload check — ছবি ১",
  );
  assert.equal(
    galleryControlName("Night upload check", 1, "video"),
    "Night upload check — ভিডিও ২",
  );
});

test("purchase quantity and buy-now stay inside the public contract", () => {
  assert.equal(purchaseQuantity(0), 1);
  assert.equal(purchaseQuantity(-3), 1);
  assert.equal(purchaseQuantity(Number.NaN), 1);
  assert.equal(purchaseQuantity(9), 5);
  const href = directCheckoutHref(
    { slug: "night-upload-check", id: published.id },
    2,
  );
  assert.match(href, /product=night-upload-check/);
  assert.match(href, new RegExp(`id=${published.id}`));
  assert.match(href, /qty=2/);
  assert.equal(
    directCheckoutHref(
      { slug: "night-upload-check", id: "sunset-lamp" },
      2,
    ).includes("id="),
    false,
  );
});
