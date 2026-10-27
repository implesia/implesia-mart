import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  DEFAULT_HEADER_ITEMS,
  HEADER_LIMITS,
  defaultHeaderAdmin,
  headerDraftError,
  navItemsToShow,
} from "@/lib/header-view";

const link = (label: string, href: string, enabled = true) => ({ label, href, enabled });

describe("default header menu", () => {
  it("mirrors the storefront menu that existed before it was editable", () => {
    assert.deepEqual(
      DEFAULT_HEADER_ITEMS.map((item) => item.href),
      ["/", "/products", "/about-us", "/sustainability", "/contact-us", "/blogs"],
    );
    assert.equal(defaultHeaderAdmin().isDefault, true);
    assert.equal(headerDraftError(DEFAULT_HEADER_ITEMS), "");
  });
});

describe("navItemsToShow", () => {
  it("keeps order and drops hidden, blank and unsafe links", () => {
    const shown = navItemsToShow([
      link("B", "/b"),
      link("Hidden", "/h", false),
      link("Bad", "javascript:alert(1)"),
      link("  ", "/blank"),
      link("A", "https://example.com/a"),
      link("Mail", "mailto:hi@example.com"),
    ]);
    assert.deepEqual(shown.map((i) => i.label), ["B", "A", "Mail"]);
  });

  it("falls back to the built-in menu rather than render an empty navbar", () => {
    assert.deepEqual(navItemsToShow([]).length, DEFAULT_HEADER_ITEMS.length);
    assert.deepEqual(navItemsToShow([link("X", "data:text/html,x")]).length, DEFAULT_HEADER_ITEMS.length);
    assert.deepEqual(navItemsToShow([link("Off", "/x", false)]).length, DEFAULT_HEADER_ITEMS.length);
  });
});

describe("headerDraftError", () => {
  it("accepts a valid menu", () => {
    assert.equal(headerDraftError([link("Home", "/"), link("Shop", "/products?x=1"), link("T", "tel:+8801700000000")]), "");
  });

  it("requires a link and one shown link", () => {
    assert.match(headerDraftError([]), /at least one/i);
    assert.match(headerDraftError([link("Off", "/x", false)]), /at least one menu link shown/i);
  });

  it("limits the number of links", () => {
    const many = Array.from({ length: HEADER_LIMITS.items + 1 }, (_, i) => link(`L${i}`, "/x"));
    assert.match(headerDraftError(many), /at most/);
  });

  it("names the first bad link", () => {
    assert.match(headerDraftError([link("A", "/a"), link("", "/b")]), /Menu link 2 needs a label/);
    assert.match(headerDraftError([link("<b>", "/a")]), /Menu link 1 label must be plain text/);
    assert.match(headerDraftError([link("A", "//evil.example")]), /Menu link 1 link must start with/);
    assert.match(headerDraftError([link("A", "javascript:alert(1)")]), /must start with/);
    assert.match(headerDraftError([link("A", "evil.example")]), /must start with/);
    assert.match(headerDraftError([link("x".repeat(HEADER_LIMITS.label + 1), "/a")]), /at most/);
  });
});
