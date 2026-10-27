import assert from "node:assert/strict";
import { test } from "node:test";

import {
  DEFAULT_FOOTER,
  blankLink,
  blankSection,
  copyrightLine,
  defaultFooterAdmin,
  footerDraftError,
  isExternalFooterHref,
  isSafeFooterHref,
  moveItem,
  previewFooter,
  safeContactHref,
  safeFooterHref,
  type FooterConfig,
} from "@/lib/footer-view";

const clone = (): FooterConfig => structuredClone(DEFAULT_FOOTER);

test("the built-in footer keeps the previous content and is saveable as is", () => {
  assert.equal(DEFAULT_FOOTER.sections.map((s) => s.title).join(","), "Shop,Company,Support");
  assert.deepEqual(
    DEFAULT_FOOTER.sections.map((s) => s.links.length),
    [4, 4, 5],
  );
  assert.equal(DEFAULT_FOOTER.trustPoints.length, 3);
  assert.equal(DEFAULT_FOOTER.legalLinks.length, 4);
  assert.equal(footerDraftError(DEFAULT_FOOTER), "");
  assert.equal(defaultFooterAdmin().isDefault, true);
  // Every shipped link is itself safe.
  for (const link of [...DEFAULT_FOOTER.sections.flatMap((s) => s.links), ...DEFAULT_FOOTER.legalLinks]) {
    assert.ok(isSafeFooterHref(link.href), link.href);
  }
});

test("only site paths, http(s), mailto and tel links are allowed", () => {
  for (const ok of ["/products?category=x", "https://a.example/b", "http://a.example", "mailto:a@b.co", "tel:+8801700000000"]) {
    assert.ok(isSafeFooterHref(ok), ok);
  }
  for (const bad of ["", "javascript:alert(1)", "JaVaScRiPt:1", "data:text/html,x", "blob:x", "file:///x", "//evil.example", "evil.example", "/a b", "/../x", "mailto:nope", "tel:abc", "https://", "/a\nb"]) {
    assert.equal(isSafeFooterHref(bad), false, bad);
    assert.equal(safeFooterHref(bad), "");
  }
  assert.equal(safeFooterHref("  /faqs "), "/faqs");
});

test("contact-sourced hrefs only check the scheme", () => {
  assert.equal(safeContactHref("tel:+880 1580 569129"), "tel:+880 1580 569129");
  assert.equal(safeContactHref("https://wa.me/8801580569129"), "https://wa.me/8801580569129");
  assert.equal(safeContactHref("mailto:hello@example.com"), "mailto:hello@example.com");
  assert.equal(safeContactHref("javascript:alert(1)"), "");
  assert.equal(safeContactHref("data:text/html,x"), "");
  assert.equal(safeContactHref("//evil.example"), "");
  assert.equal(safeContactHref(""), "");
});

test("external links are the http(s) ones", () => {
  assert.equal(isExternalFooterHref("https://x.example"), true);
  assert.equal(isExternalFooterHref("/faqs"), false);
  assert.equal(isExternalFooterHref("mailto:a@b.co"), false);
});

test("the copyright year placeholder is replaced and nothing else is interpreted", () => {
  assert.equal(copyrightLine("© {year} · x", 2026), "© 2026 · x");
  assert.equal(copyrightLine("No year", 2026), "No year");
  assert.equal(copyrightLine("{year}-{year}", 2026), "2026-2026");
});

test("drafts are validated before saving", () => {
  const bad = (change: (d: FooterConfig) => void) => {
    const d = clone();
    change(d);
    return footerDraftError(d);
  };
  assert.match(bad((d) => (d.brandName = " ")), /Brand name is required/);
  assert.match(bad((d) => (d.description = "<b>x</b>")), /plain text/);
  assert.match(bad((d) => (d.copyrightText = "")), /Copyright text is required/);
  assert.match(bad((d) => (d.logoSrc = "/media/footer/a.png")), /Describe the logo/);
  assert.match(bad((d) => (d.sections[0].title = "")), /Column 1 title is required/);
  assert.match(bad((d) => (d.sections[0].links[1].href = "javascript:x")), /Column 1, link 2 link must start/);
  assert.match(bad((d) => (d.sections[1].links[0].label = "<i>")), /plain text/);
  assert.match(bad((d) => (d.trustPoints[0].icon = "Bad Icon")), /icon/);
  assert.match(bad((d) => (d.legalLinks[0].href = "//evil.example")), /Legal link 1/);
  assert.match(bad((d) => (d.sections = Array.from({ length: 9 }, blankSection))), /Too many link columns/);
  assert.match(bad((d) => (d.sections[0].links = Array.from({ length: 13 }, blankLink))), /too many links/);
  assert.equal(bad((d) => (d.address = "")), "");
});

test("the preview shows only enabled items and drops empty columns", () => {
  const d = clone();
  d.sections[0].links[0].enabled = false;
  d.sections[1].enabled = false;
  d.sections[2].links.forEach((l) => (l.enabled = false));
  d.trustPoints[0].enabled = false;
  d.legalLinks[1].href = "javascript:x";
  const p = previewFooter(d);
  assert.deepEqual(p.sections.map((s) => s.title), ["Shop"]);
  assert.equal(p.sections[0].links.length, 3);
  assert.equal(p.trustPoints.length, 2);
  assert.equal(p.legalLinks.length, 3);
  assert.equal(d.sections.length, 3, "the draft itself is not changed");
});

test("moveItem reorders without mutating and clamps", () => {
  const list = ["a", "b", "c"];
  assert.deepEqual(moveItem(list, 0, 2), ["b", "c", "a"]);
  assert.deepEqual(moveItem(list, 2, 0), ["c", "a", "b"]);
  assert.deepEqual(moveItem(list, 1, 9), ["a", "c", "b"]);
  assert.deepEqual(moveItem(list, 1, -4), ["b", "a", "c"]);
  assert.deepEqual(moveItem(list, 7, 0), list);
  assert.deepEqual(list, ["a", "b", "c"]);
});
