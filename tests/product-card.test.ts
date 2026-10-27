import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { cardAction } from "../lib/mart-api/card-action.ts";

test("cardAction: a single / default-variant product adds directly", () => {
  assert.equal(cardAction({ status: "available", hasVariants: false }), "add");
  assert.equal(cardAction({ status: "available" }), "add");
});

test("cardAction: a multi-variant product routes to the product page (no Option button)", () => {
  assert.equal(cardAction({ status: "available", hasVariants: true }), "choose-on-page");
});

test("cardAction: sold-out and coming-soon win over variants", () => {
  assert.equal(cardAction({ status: "sold-out", hasVariants: true }), "sold-out");
  assert.equal(cardAction({ status: "sold-out", hasVariants: false }), "sold-out");
  assert.equal(cardAction({ status: "coming-soon", hasVariants: true }), "coming-soon");
});

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const contrastWithWhite = (hex: string) => 1.05 / (luminance(hex) + 0.05);

test("white Add to Cart text needs the dark teal tokens: brand teal fails WCAG AA", () => {
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  const token = (name: string) => {
    const m = css.match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`));
    assert.ok(m, `missing --color-${name}`);
    return m[1];
  };
  assert.ok(contrastWithWhite(token("primary")) < 4.5, "brand teal + white is below AA");
  assert.ok(contrastWithWhite(token("primary-ink")) >= 4.5, "button background passes AA");
  assert.ok(contrastWithWhite(token("on-primary-fixed-variant")) >= 4.5, "hover background passes AA");
});

test("the card has no Option label and uses white text on the dark token", () => {
  const src = readFileSync(
    new URL("../app/(client)/products/_components/product-card.tsx", import.meta.url),
    "utf8",
  );
  assert.ok(!src.includes("Choose option"), "no 'Choose option' label");
  assert.ok(!src.includes(">Option<"), "no 'Option' label");
  assert.ok(src.includes("text-white") && src.includes("bg-primary-ink"));
});

test("the card CTA labels are English", () => {
  const src = readFileSync(
    new URL("../app/(client)/products/_components/product-card.tsx", import.meta.url),
    "utf8",
  );
  for (const label of ["Add to Cart", "Out of stock", "Coming soon", "View details"]) {
    assert.ok(src.includes(label), `missing label: ${label}`);
  }
});

test("blog pages and the product card carry no Bengali UI labels (the taka sign is a currency)", () => {
  const files = [
    "../app/(client)/products/_components/product-card.tsx",
    "../app/(client)/blogs/(list)/page.tsx",
    "../app/(client)/blogs/(list)/loading.tsx",
    "../app/(client)/blogs/[slug]/page.tsx",
    "../app/(client)/blogs/_components/blog-article.tsx",
    "../app/(client)/blogs/_components/blog-card.tsx",
    "../app/(client)/blogs/_components/blog-related.tsx",
    "../app/(client)/blogs/_components/blogs-grid.tsx",
    "../app/(client)/blogs/_components/blogs-hero.tsx",
  ];
  for (const file of files) {
    const src = readFileSync(new URL(file, import.meta.url), "utf8");
    assert.equal(/[\u0980-\u09F2\u09F4-\u09FF]/.test(src), false, `${file} has Bengali text`);
  }
});
