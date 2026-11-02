import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  BADGE_TONE_CLASS,
  BADGE_TONES,
  badgeNameError,
  badgeToneClass,
  readAdminBadge,
  readStoreBadges,
  visibleBadges,
} from "../lib/mart-api/badge-rules.ts";
import { interpretPublicCatalog } from "../lib/mart-api/catalog-query.ts";
import { normalizeProductDetail } from "../lib/mart-api/product-page.ts";

const card = {
  id: "11111111-1111-4111-8111-111111111111",
  slug: "night-upload-check",
  title: "Night upload check",
  subtitle: "",
  category: "gadgets",
  price: 500,
  compare_at_price: null,
  unit_label: "",
  image_src: "/media/night.jpg",
  image_alt: "Night upload check",
  badge: "Best Seller",
  status: "available",
  featured: false,
};

test("badges from the API are validated, de-duplicated and kept in order", () => {
  const badges = readStoreBadges([
    { name: "Eid Special", slug: "eid-special", tone: "soft" },
    { name: "Eid again", slug: "eid-special", tone: "gold" },
    { name: "Bad slug", slug: "Bad Slug", tone: "gold" },
    { name: "", slug: "empty", tone: "gold" },
    { name: "Unknown tone", slug: "unknown-tone", tone: "#ff0000" },
    "not an object",
  ]);
  assert.deepEqual(badges, [
    { name: "Eid Special", slug: "eid-special", tone: "soft" },
    { name: "Unknown tone", slug: "unknown-tone", tone: "primary" },
  ]);
  assert.equal(readStoreBadges(undefined), undefined);
  assert.deepEqual(readStoreBadges([]), []);
});

test("the API's list wins; the legacy badge is only a fallback for missing data", () => {
  assert.deepEqual(visibleBadges([], "New"), []);
  assert.deepEqual(visibleBadges(undefined, "Best Seller"), [
    { name: "Best Seller", slug: "best-seller", tone: "gold" },
  ]);
  assert.deepEqual(visibleBadges(undefined, null), []);
  assert.deepEqual(visibleBadges(undefined, "Something else"), []);
});

test("every tone maps to existing design-system classes only", () => {
  assert.deepEqual(Object.keys(BADGE_TONE_CLASS).sort(), [...BADGE_TONES].sort());
  for (const tone of BADGE_TONES) {
    assert.doesNotMatch(badgeToneClass(tone), /#|\[/, `${tone} uses an arbitrary colour`);
  }
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  for (const token of ["primary", "on-primary", "warm-gold", "on-surface", "error", "on-error"]) {
    assert.match(css, new RegExp(`--color-${token}:`), `token ${token} is defined`);
  }
});

test("admin badge rows read the counts and flags", () => {
  assert.deepEqual(
    readAdminBadge({
      id: "b1",
      name: "New",
      slug: "new",
      tone: "primary",
      is_active: false,
      is_system: true,
      product_count: 3,
    }),
    { id: "b1", name: "New", slug: "new", tone: "primary", isActive: false, isSystem: true, productCount: 3 },
  );
  assert.equal(readAdminBadge({ name: "x", slug: "x" }), null);
});

test("badge names follow the API's rules", () => {
  assert.equal(badgeNameError("  "), "Enter a badge name.");
  assert.match(badgeNameError("x".repeat(33)), /32 characters/);
  assert.match(badgeNameError(" eid  special ", ["Eid Special"]), /already exists/);
  assert.equal(badgeNameError("Eid Special"), "");
});

test("catalog cards and the product detail carry their badges", () => {
  const badges = [{ name: "Eid Special", slug: "eid-special", tone: "soft" }];
  const parsed = interpretPublicCatalog({
    items: [{ ...card, badges }],
    total: 1,
    page: 1,
    pages: 1,
    category_counts: { gadgets: 1, fashion: 0 },
    availability_counts: { available: 1, sold_out: 0, coming_soon: 0 },
  });
  assert.deepEqual(parsed?.items[0]?.badges, badges);
  const older = interpretPublicCatalog({ items: [card], total: 1, page: 1, pages: 1 });
  assert.equal(older?.items[0]?.badges, undefined);
  assert.equal(older?.items[0]?.badge, "Best Seller");

  const detail = normalizeProductDetail({ ...card, badges, related: [{ ...card, badges: [] }] });
  assert.deepEqual(detail?.badges, badges);
  assert.deepEqual(detail?.related[0]?.badges, []);
});
