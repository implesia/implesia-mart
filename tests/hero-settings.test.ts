import assert from "node:assert/strict";
import test from "node:test";

import { DEFAULT_HERO_SETTINGS, mapHeroSettings } from "../lib/mart-api/hero-settings.ts";

test("banner text from the CMS is used as plain trimmed text", () => {
  const settings = mapHeroSettings({
    brand_name: "  <b>Shop</b> ",
    trust_line: "COD everywhere",
    previous_label: "Prev",
    next_label: "Next",
    cross_fade: false,
  });
  assert.equal(settings.brandName, "<b>Shop</b>");
  assert.equal(settings.trustLine, "COD everywhere");
  assert.equal(settings.previousLabel, "Prev");
  assert.equal(settings.nextLabel, "Next");
  assert.equal(settings.crossFade, false);
});

test("empty or missing banner text falls back to defaults", () => {
  const settings = mapHeroSettings({ brand_name: "   ", trust_line: "" });
  assert.equal(settings.brandName, DEFAULT_HERO_SETTINGS.brandName);
  assert.equal(settings.trustLine, DEFAULT_HERO_SETTINGS.trustLine);
  assert.equal(settings.previousLabel, DEFAULT_HERO_SETTINGS.previousLabel);
  assert.equal(settings.crossFade, DEFAULT_HERO_SETTINGS.crossFade);
});
