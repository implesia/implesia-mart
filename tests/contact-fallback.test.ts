import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { FALLBACK_CONTACT_DETAILS } from "../lib/mart-api/contact-fallback.ts";

describe("fallback contact", () => {
  it("keeps a phone and a chat link when the contact API is down", () => {
    const phone = FALLBACK_CONTACT_DETAILS.channels.find((item) => item.icon === "call");
    const chat = FALLBACK_CONTACT_DETAILS.channels.find((item) => item.icon === "chat");
    assert.ok(phone?.href.startsWith("tel:"));
    assert.ok(chat?.href.startsWith("https://wa.me/"));
    assert.equal(FALLBACK_CONTACT_DETAILS.isActive, true);
  });
});

import {
  FALLBACK_CONTACT_FORM,
  fillContactDetails,
  fillContactFaq,
  fillContactForm,
  fillContactSupport,
} from "../lib/mart-api/contact-fallback.ts";

describe("field-level contact fallbacks", () => {
  it("fills blank form labels but keeps CMS copy", () => {
    const blank = { label: "", placeholder: "" };
    const out = fillContactForm({
      isActive: true, title: "CMS title", subtitle: "", cta: "", hint: "",
      fields: { name: { label: "CMS নাম", placeholder: "" }, phone: blank, subject: blank, message: blank },
    });
    assert.equal(out.title, "CMS title");
    assert.equal(out.fields.name.label, "CMS নাম");
    assert.equal(out.fields.name.placeholder, FALLBACK_CONTACT_FORM.fields.name.placeholder);
    assert.equal(out.cta, FALLBACK_CONTACT_FORM.cta);
  });
  it("fills empty lists in live sections, never revives a hidden one", () => {
    const details = fillContactDetails({ ...FALLBACK_CONTACT_DETAILS, title: "T", channels: [] as typeof FALLBACK_CONTACT_DETAILS.channels });
    assert.ok(details.channels.some((c) => c.href.startsWith("tel:")));
    const hidden = { isActive: false, title: "", subtitle: "", hours: [], quickLinks: [] };
    assert.equal(fillContactSupport(hidden).hours.length, 0);
    assert.ok(fillContactSupport({ ...hidden, isActive: true, title: "T" }).hours.length > 0);
    assert.ok(fillContactFaq({ isActive: true, title: "T", subtitle: "", items: [] }).items.length > 0);
  });
});
