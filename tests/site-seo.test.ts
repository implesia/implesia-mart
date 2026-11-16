import assert from "node:assert/strict";
import { test } from "node:test";

import {
  patchMockSiteSettings,
  readMockSiteSettings,
  resetMockSiteSettings,
} from "@/lib/mart-mock/site-settings";
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE } from "@/lib/seo";
import {
  applySiteSettingsPatch,
  applyTitleTemplate,
  DEFAULT_TITLE_TEMPLATE,
  previewStorefrontSeo,
  resolveStorefrontSeo,
  SEO_DESCRIPTION_GUIDE,
  SEO_DESCRIPTION_MAX,
  SEO_TITLE_GUIDE,
  SEO_TITLE_MAX,
  siteSettingsUpdate,
  storefrontSeoFromResponse,
} from "@/lib/site-seo";

test("built-in home title and description stay inside the search-result guides", () => {
  assert.ok(DEFAULT_TITLE.length <= SEO_TITLE_GUIDE);
  assert.ok(DEFAULT_TITLE.length <= SEO_TITLE_MAX);
  assert.ok(DEFAULT_DESCRIPTION.length <= SEO_DESCRIPTION_GUIDE);
  assert.ok(DEFAULT_DESCRIPTION.length <= SEO_DESCRIPTION_MAX);
  assert.ok(DEFAULT_DESCRIPTION.length >= 140);
  assert.match(DEFAULT_TITLE, /ইলেকট্রনিক্স/);
  assert.match(DEFAULT_DESCRIPTION, /গ্যাজেট/);
  assert.match(DEFAULT_DESCRIPTION, /ইলেকট্রনিক্স/);
  assert.match(DEFAULT_DESCRIPTION, /সারাদেশে/);
  assert.match(DEFAULT_DESCRIPTION, /ক্যাশ অন ডেলিভারি/);
  assert.equal(DEFAULT_DESCRIPTION.includes("ড্রেস"), false);
});

test("a failed settings response uses the built-in title, description, and template", () => {
  const resolved = storefrontSeoFromResponse(false, { seo_title: "Ignored" });
  assert.equal(resolved.title, DEFAULT_TITLE);
  assert.equal(resolved.description, DEFAULT_DESCRIPTION);
  assert.equal(resolved.titleTemplate, DEFAULT_TITLE_TEMPLATE);
  assert.deepEqual(resolveStorefrontSeo(null), resolved);
});

test("null fields and a body that is not an object use the built-in copy", () => {
  const fromNulls = storefrontSeoFromResponse(true, {
    seo_title: null,
    seo_description: null,
    seo_title_template: null,
  });
  assert.equal(fromNulls.title, DEFAULT_TITLE);
  assert.equal(fromNulls.description, DEFAULT_DESCRIPTION);
  assert.equal(fromNulls.titleTemplate, DEFAULT_TITLE_TEMPLATE);

  for (const body of [null, [], "nope", 1, { seo_title: 12, seo_description: false }]) {
    const resolved = storefrontSeoFromResponse(true, body);
    assert.equal(resolved.title, DEFAULT_TITLE);
    assert.equal(resolved.description, DEFAULT_DESCRIPTION);
  }
});

test("set fields replace only that part, and blank or over-long text falls back", () => {
  const custom = storefrontSeoFromResponse(true, {
    seo_title: "  Custom title  ",
    seo_description: "",
    seo_title_template: "%s — Shop",
  });
  assert.equal(custom.title, "Custom title");
  assert.equal(custom.description, DEFAULT_DESCRIPTION);
  assert.equal(custom.titleTemplate, "%s — Shop");
  assert.equal(applyTitleTemplate("About", custom.titleTemplate), "About — Shop");

  const tooLong = storefrontSeoFromResponse(true, {
    seo_title: "T".repeat(SEO_TITLE_MAX + 1),
    seo_description: "D".repeat(SEO_DESCRIPTION_MAX + 1),
    seo_title_template: `%s ${"x".repeat(80)}`,
  });
  assert.equal(tooLong.title, DEFAULT_TITLE);
  assert.equal(tooLong.description, DEFAULT_DESCRIPTION);
  assert.equal(tooLong.titleTemplate, DEFAULT_TITLE_TEMPLATE);
});

test("a template without exactly one %s is ignored", () => {
  for (const template of ["About", "%s and %s", "%s 100%", "100% off", "%%s", "%S"]) {
    const resolved = storefrontSeoFromResponse(true, {
      seo_title: "Kept",
      seo_description: null,
      seo_title_template: template,
    });
    assert.equal(resolved.title, "Kept");
    assert.equal(resolved.titleTemplate, DEFAULT_TITLE_TEMPLATE);
  }
});

test("the admin patch omits to keep, and null or blank clears", () => {
  const kept = applySiteSettingsPatch(
    { seo_title: "Old", seo_description: "Desc", seo_title_template: "%s | Shop" },
    { seo_title: "New" },
  );
  assert.equal(kept.ok, true);
  if (!kept.ok) return;
  assert.deepEqual(kept.next, {
    seo_title: "New",
    seo_description: "Desc",
    seo_title_template: "%s | Shop",
  });

  const cleared = applySiteSettingsPatch(kept.next, {
    seo_title: null,
    seo_description: "  ",
    seo_title_template: "",
  });
  assert.equal(cleared.ok, true);
  if (!cleared.ok) return;
  assert.deepEqual(cleared.next, {
    seo_title: null,
    seo_description: null,
    seo_title_template: null,
  });
});

test("the admin form refuses an over-long field or a template that is not exactly one %s", () => {
  const badTemplate = siteSettingsUpdate({
    title: "Title",
    description: "Description",
    template: "No placeholder",
  });
  assert.equal(badTemplate.ok, false);

  const tooLong = siteSettingsUpdate({
    title: "T".repeat(SEO_TITLE_MAX + 1),
    description: "",
    template: "",
  });
  assert.equal(tooLong.ok, false);

  const cleared = siteSettingsUpdate({ title: "  ", description: "", template: "" });
  assert.equal(cleared.ok, true);
  if (cleared.ok) {
    assert.deepEqual(cleared.next, {
      seo_title: null,
      seo_description: null,
      seo_title_template: null,
    });
  }
});

test("an empty admin draft previews the built-in copy", () => {
  const preview = previewStorefrontSeo({ title: "", description: "  ", template: "" });
  assert.equal(preview.title, DEFAULT_TITLE);
  assert.equal(preview.description, DEFAULT_DESCRIPTION);
  assert.equal(preview.titleTemplate, DEFAULT_TITLE_TEMPLATE);
});

test("the settings stand-in keeps omitted fields and clears null or blank", () => {
  resetMockSiteSettings();
  assert.deepEqual(readMockSiteSettings(), {
    seo_title: null,
    seo_description: null,
    seo_title_template: null,
  });
  patchMockSiteSettings({ seo_title: "  Live title  " });
  assert.equal(readMockSiteSettings().seo_title, "Live title");
  assert.equal(readMockSiteSettings().seo_description, null);
  patchMockSiteSettings({ seo_title: "" });
  assert.equal(readMockSiteSettings().seo_title, null);
  assert.throws(() => patchMockSiteSettings({ seo_title_template: "missing" }), /%s/);
  resetMockSiteSettings();
});
