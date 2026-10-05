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
