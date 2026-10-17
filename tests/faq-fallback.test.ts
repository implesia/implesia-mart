import assert from "node:assert/strict";
import { test } from "node:test";

import { deliveryChargeAnswer, faqsCopy } from "@/app/(client)/_data/faqs/faqs";
import { fallbackFaqPage, resolveFaqPage, type FaqPageContent } from "@/lib/mart-api/faq-fallback";

const rates = {
  insideDhaka: 70,
  dhakaSuburban: 100,
  outsideDhaka: 130,
  insideEnabled: true,
  suburbanEnabled: true,
  outsideEnabled: true,
};

const emptyCms: FaqPageContent = { hero: null, categories: null, listing: null, callout: null, items: [], help: null };

test("an empty CMS (or unreachable API) shows the bundled page", () => {
  const page = resolveFaqPage(emptyCms, rates);
  assert.equal(page.hero?.isActive, true);
  assert.equal(page.items.length, faqsCopy.items.length);
  assert.equal(page.help?.primaryHref, "/contact-us");
});

test("blank or hidden CMS questions still count as empty", () => {
  const cms = {
    ...emptyCms,
    items: [
      { id: "a", categoryId: "", question: "  ", answer: "x", isActive: true },
      { id: "b", categoryId: "", question: "Q", answer: "A", isActive: false },
    ],
  };
  assert.equal(resolveFaqPage(cms, null).items.length, faqsCopy.items.length);
});

test("published CMS questions win over the bundled copy", () => {
  const cms = { ...emptyCms, items: [{ id: "a", categoryId: "", question: "Q", answer: "A", isActive: true }] };
  assert.equal(resolveFaqPage(cms, rates), cms);
});

test("every bundled question belongs to a bundled category", () => {
  const ids = new Set(faqsCopy.categories.map((category) => category.id));
  for (const item of faqsCopy.items) assert.ok(ids.has(item.categoryId), item.id);
  assert.equal(new Set(faqsCopy.items.map((item) => item.id)).size, faqsCopy.items.length);
});

test("bundled copy sticks to cash on delivery and never mentions the hourly order limit", () => {
  const text = JSON.stringify(faqsCopy);
  assert.match(text, /ক্যাশ অন ডেলিভারি/);
  assert.doesNotMatch(text, /বিকাশ|নগদ পেমেন্ট|bKash|কার্ডে পেমেন্ট করুন/);
  assert.doesNotMatch(text, /ঘণ্টায় ৫|৫টি অর্ডার|5 orders/i);
});

test("delivery charge answer uses live rates and skips disabled zones", () => {
  assert.match(deliveryChargeAnswer(rates), /ঢাকার ভেতরে ৳৭০, ঢাকার শহরতলি ৳১০০, ঢাকার বাইরে ৳১৩০/);
  const partial = deliveryChargeAnswer({ ...rates, suburbanEnabled: false });
  assert.doesNotMatch(partial, /শহরতলি/);
  const generic = faqsCopy.items.find((item) => item.id === "delivery-charge")?.answer;
  assert.equal(deliveryChargeAnswer(null), generic);
  assert.equal(deliveryChargeAnswer({ ...rates, insideEnabled: false, suburbanEnabled: false, outsideEnabled: false }), generic);
  const page = fallbackFaqPage(rates);
  assert.match(page.items.find((item) => item.id === "delivery-charge")?.answer ?? "", /৳১৩০/);
});

test("bundled links point at existing storefront routes", () => {
  const routes = new Set(["/products", "/order-status", "/shipping-returns", "/contact-us"]);
  for (const item of fallbackFaqPage(null).items) {
    if (item.link) assert.ok(routes.has(item.link.href), `${item.id} → ${item.link.href}`);
  }
});
