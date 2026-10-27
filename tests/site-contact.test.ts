import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import {
  buildSiteContact,
  DEFAULT_SITE_CONTACT,
  internationalDigits,
  normalizePhoneInput,
  siteContactDraftError,
  siteContactFrom,
  SITE_CONTACT_DEFAULTS,
  whatsappMessageHref,
} from "../lib/site-contact.ts";
import { contactCopy, WHATSAPP_HREF } from "../app/(client)/_data/contact/contact.ts";

test("built-in defaults are the official contact", () => {
  assert.deepEqual(SITE_CONTACT_DEFAULTS, {
    phone: "01580569129",
    whatsapp: "01580569129",
    email: "implesiamart@gmail.com",
  });
  assert.equal(DEFAULT_SITE_CONTACT.telHref, "tel:+8801580569129");
  assert.equal(DEFAULT_SITE_CONTACT.whatsappHref, "https://wa.me/8801580569129");
  assert.equal(DEFAULT_SITE_CONTACT.mailtoHref, "mailto:implesiamart@gmail.com");
});

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sources(path);
    return /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

test("the bundled fallback contact copy uses the defaults", () => {
  const everything = JSON.stringify([contactCopy, WHATSAPP_HREF]);
  assert.ok(everything.includes("01580569129"));
  assert.ok(everything.includes("implesiamart@gmail.com"));
  assert.ok(WHATSAPP_HREF.startsWith("https://wa.me/8801580569129?text="));
  assert.ok(!/1516|527932|itltd/i.test(everything));
});

test("no source file still carries the retired phone number or email", () => {
  const retired = /1516[\s-]?527932|\b8801516|01516|itltd/i;
  const offenders = ["app", "lib", "components", "tests"]
    .flatMap((dir) => sources(dir))
    .filter((file) => !file.endsWith("site-contact.test.ts"))
    .filter((file) => retired.test(readFileSync(file, "utf8")));
  assert.deepEqual(offenders, []);
});

test("international digits only for a Bangladesh mobile", () => {
  assert.equal(internationalDigits("01580569129"), "8801580569129");
  for (const bad of ["", "8801580569129", "+8801580569129", "01280569129", "0158056912", undefined, null]) {
    assert.equal(internationalDigits(bad), null);
  }
});

test("the contact is rebuilt from API values and bad payloads fall back", () => {
  const live = siteContactFrom({ phone: "01711223344", whatsapp: "01811223344", email: "help@example.com" });
  assert.equal(live.telHref, "tel:+8801711223344");
  assert.equal(live.whatsappHref, "https://wa.me/8801811223344");
  assert.equal(live.mailtoHref, "mailto:help@example.com");
  for (const bad of [
    null,
    "x",
    {},
    { phone: 1, whatsapp: "01711223344", email: "a@b.com" },
    { phone: "12345", whatsapp: "01711223344", email: "a@b.com" },
    { phone: "01711223344", whatsapp: "01711223344", email: "a@b.com?bcc=x@y.com" },
  ]) {
    assert.deepEqual(siteContactFrom(bad), DEFAULT_SITE_CONTACT);
  }
  assert.throws(() => buildSiteContact({ phone: "1", whatsapp: "1", email: "x" }));
});

test("whatsapp message link keeps the text intact", () => {
  const href = whatsappMessageHref(DEFAULT_SITE_CONTACT, "a&b=c d");
  assert.equal(href, "https://wa.me/8801580569129?text=a%26b%3Dc%20d");
});

test("admin input accepts common phone spellings and rejects the rest", () => {
  for (const ok of ["01580569129", "+880 1580-569129", "8801580569129", "(+880) 1580 569129"]) {
    assert.equal(normalizePhoneInput(ok), "01580569129");
  }
  for (const bad of ["", "12345", "0158056912", "01280569129", "abc"]) {
    assert.equal(normalizePhoneInput(bad), null);
  }
  const good = { phone: "01580569129", whatsapp: "01580569129", email: "implesiamart@gmail.com" };
  assert.equal(siteContactDraftError(good), "");
  assert.match(siteContactDraftError({ ...good, phone: "1" }), /Phone must be/);
  assert.match(siteContactDraftError({ ...good, whatsapp: "x" }), /WhatsApp must be/);
  assert.match(siteContactDraftError({ ...good, email: "nope" }), /valid email/);
  assert.match(siteContactDraftError({ ...good, email: "a@b.com,c@d.com" }), /valid email/);
});
