import assert from "node:assert/strict";
import { test } from "node:test";

import {
  blankPromo,
  clampFocal,
  focalPosition,
  isExternalHref,
  promoDraftError,
  renderablePromo,
  safeCtaHref,
  type PromoPublic,
} from "@/lib/promo-view";

const live: PromoPublic = {
  eyebrow: "",
  heading: "Browse",
  body: "",
  ctaLabel: "Shop",
  ctaHref: "/products",
  imageSrc: "/media/promo/a.jpg",
  imageAlt: "Shelves",
  focalX: 30,
  focalY: 70,
  tone: "dark",
};

test("focal values are whole percentages inside 0-100", () => {
  assert.equal(clampFocal(120), 100);
  assert.equal(clampFocal(-5), 0);
  assert.equal(clampFocal(33.6), 34);
  assert.equal(clampFocal("abc"), 50);
  assert.equal(clampFocal(NaN), 50);
  assert.equal(focalPosition(10, 90), "10% 90%");
});

test("only internal paths and http(s) links are usable CTA targets", () => {
  assert.equal(safeCtaHref("/products"), "/products");
  assert.equal(safeCtaHref("https://example.com/x"), "https://example.com/x");
  for (const bad of ["", "javascript:alert(1)", "//evil.example", "data:text/html,x", "/a/../b", "/a b", "mailto:a@b.c", "ftp://x"]) {
    assert.equal(safeCtaHref(bad), "", bad);
  }
  assert.equal(isExternalHref("https://x.y"), true);
  assert.equal(isExternalHref("/x"), false);
});

test("a banner renders only with a usable image and alt text", () => {
  const view = renderablePromo(live);
  assert.ok(view);
  assert.match(view.image, /\/media\/promo\/a\.jpg$/);
  assert.equal(view.position, "30% 70%");
  assert.deepEqual(view.cta, { href: "/products", label: "Shop" });
  assert.equal(renderablePromo(null), null);
  assert.equal(renderablePromo({ ...live, imageAlt: "  " }), null);
  assert.equal(renderablePromo({ ...live, imageSrc: "blob:http://x/y" }), null);
  assert.equal(renderablePromo({ ...live, imageSrc: "" }), null);
});

test("an unusable CTA is dropped but the banner still renders", () => {
  const view = renderablePromo({ ...live, ctaHref: "javascript:alert(1)" });
  assert.ok(view);
  assert.equal(view.cta, null);
  assert.equal(renderablePromo({ ...live, ctaLabel: "" })?.cta, null);
});

test("draft checks mirror the API rules", () => {
  const draft = { ...blankPromo(), imageSrc: "/media/promo/a.jpg", imageAlt: "x" };
  assert.equal(promoDraftError(blankPromo()), "");
  assert.equal(promoDraftError({ ...draft, isActive: true }), "");
  assert.match(promoDraftError({ ...blankPromo(), isActive: true }), /image/i);
  assert.match(promoDraftError({ ...draft, imageAlt: "", isActive: true }), /alt/i);
  assert.match(promoDraftError({ ...draft, ctaLabel: "Go" }), /both/i);
  assert.match(promoDraftError({ ...draft, ctaLabel: "Go", ctaHref: "javascript:1" }), /link/i);
  assert.equal(promoDraftError({ ...draft, ctaLabel: "Go", ctaHref: "/x" }), "");
});
