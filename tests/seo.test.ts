import assert from "node:assert/strict";
import { test } from "node:test";

import {
  DEFAULT_SHARE_IMAGE,
  pageMetadata,
  productSeo,
  trimDescription,
  withoutBrandSuffix,
} from "@/lib/seo";

test("withoutBrandSuffix drops a trailing site name so the template adds it once", () => {
  assert.equal(withoutBrandSuffix("Desk Lamp | Implesia Mart"), "Desk Lamp");
  assert.equal(withoutBrandSuffix("Desk Lamp - implesia mart | Implesia Mart"), "Desk Lamp");
  assert.equal(withoutBrandSuffix("Implesia Mart Gift Card"), "Implesia Mart Gift Card");
  assert.equal(withoutBrandSuffix(" | Implesia Mart"), "| Implesia Mart");
});

test("trimDescription keeps short text and cuts long text at a word", () => {
  assert.equal(trimDescription("  short\n text "), "short text");
  const long = "word ".repeat(60);
  const cut = trimDescription(long);
  assert.ok(cut.length <= 160);
  assert.ok(cut.endsWith("word…"));
});

test("productSeo uses the SEO fields, else the title and a trimmed description", () => {
  const base = {
    title: "Desk Lamp | Implesia Mart",
    description: "A ".repeat(200),
    subtitle: "Warm light",
    tagline: "",
  };
  const fallback = productSeo(base);
  assert.equal(fallback.title, "Desk Lamp");
  assert.equal(fallback.name, "Desk Lamp");
  assert.ok(fallback.description.length <= 160);
  assert.deepEqual(fallback.keywords, ["Desk Lamp", "Warm light"]);

  const custom = productSeo({
    ...base,
    seo: { title: "Best desk lamp | Implesia Mart", description: "Bright.", keywords: ["lamp"] },
  });
  assert.equal(custom.title, "Best desk lamp");
  assert.equal(custom.description, "Bright.");
  assert.deepEqual(custom.keywords, ["lamp"]);
});

test("pageMetadata gives each page its own canonical and share card", () => {
  const meta = pageMetadata({ title: "FAQ", description: "Answers", path: "/faqs" });
  assert.deepEqual(meta.alternates, { canonical: "/faqs" });
  const og = meta.openGraph as Record<string, unknown>;
  assert.equal(og.url, "/faqs");
  assert.equal(og.title, "FAQ | Implesia Mart");
  assert.equal(og.siteName, "Implesia Mart");
  assert.equal(og.locale, "bn_BD");
  assert.deepEqual(og.images, [DEFAULT_SHARE_IMAGE]);
  assert.equal((meta.twitter as Record<string, unknown>).title, "FAQ | Implesia Mart");
  assert.equal(meta.robots, undefined);
});

test("noindex pages get robots and no canonical", () => {
  const meta = pageMetadata({
    title: "Checkout",
    description: "x",
    path: "/checkout",
    noindex: { follow: false },
  });
  assert.equal(meta.alternates, undefined);
  assert.deepEqual(meta.robots, { index: false, follow: false });
});
