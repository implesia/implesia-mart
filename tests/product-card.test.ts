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
  assert.ok(!src.includes("অপশন বেছে নিন"), "no 'Choose option' label");
  assert.ok(!src.includes(">অপশন<"), "no 'Option' label");
  assert.ok(src.includes("text-white") && src.includes("bg-primary-ink"));
});
