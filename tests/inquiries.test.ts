import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import {
  InquirySubmitError,
  SUBMIT_ERRORS,
  hasInquiryContent,
  inquiryBody,
  inquirySearch,
  newIdempotencyKey,
  phoneLinks,
  submitInquiry,
} from "@/lib/mart-api/inquiry-public";

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

test("inquiryBody trims text, keeps optional fields blank and rounds elapsed time", () => {
  assert.deepEqual(inquiryBody({ type: "contact", name: "  Rahim ", message: " hi \n", elapsedMs: 2400.6 }), {
    type: "contact",
    name: "Rahim",
    email: "",
    phone: "",
    subject: "",
    message: "hi",
    meta: {},
    website: "",
    elapsed_ms: 2401,
  });
  assert.equal("elapsed_ms" in inquiryBody({ type: "newsletter", email: "a@b.co" }), false);
  assert.equal(inquiryBody({ type: "other", elapsedMs: -5 }).elapsed_ms, 0);
});

test("hasInquiryContent needs an email, a phone or a message", () => {
  assert.equal(hasInquiryContent({}), false);
  assert.equal(hasInquiryContent({ email: "  ", message: "\n" }), false);
  assert.equal(hasInquiryContent({ phone: "01712345678" }), true);
  assert.equal(hasInquiryContent({ message: "hello" }), true);
});

test("newIdempotencyKey is unique per call", () => {
  const keys = new Set(Array.from({ length: 50 }, newIdempotencyKey));
  assert.equal(keys.size, 50);
});

test("inquirySearch only sends meaningful filters", () => {
  assert.equal(inquirySearch({}), "page_size=20");
  assert.equal(
    inquirySearch({ q: " rahim ", type: "contact", status: "new", sort: "oldest", page: 2, pageSize: 50 }),
    "q=rahim&type=contact&status=new&sort=oldest&page=2&page_size=50",
  );
  assert.equal(inquirySearch({ sort: "newest", page: 1, type: null }), "page_size=20");
});

test("phoneLinks builds tel and WhatsApp links from a stored number", () => {
  assert.deepEqual(phoneLinks("01712345678"), { tel: "tel:+8801712345678", whatsapp: "https://wa.me/8801712345678" });
  assert.equal(phoneLinks(""), null);
});

function stubFetch(status: number, body: unknown, seen?: RequestInit[]) {
  globalThis.fetch = (async (_url: string, init?: RequestInit) => {
    seen?.push(init ?? {});
    return new Response(typeof body === "string" ? body : JSON.stringify(body), { status });
  }) as unknown as typeof fetch;
}

test("submitInquiry sends the idempotency key and returns the receipt", async () => {
  const seen: RequestInit[] = [];
  stubFetch(201, { id: "abc", status: "received" }, seen);
  const receipt = await submitInquiry({ type: "newsletter", email: "a@b.co" }, "key-1");
  assert.equal(receipt.id, "abc");
  assert.equal((seen[0].headers as Record<string, string>)["Idempotency-Key"], "key-1");
  assert.equal(JSON.parse(String(seen[0].body)).email, "a@b.co");
});

test("submitInquiry maps failures to friendly Bengali errors", async () => {
  const cases: [number, unknown, keyof typeof SUBMIT_ERRORS][] = [
    [429, { error: { message: "slow down" } }, "rateLimited"],
    [422, { error: { message: "Add an email, a phone number or a message so we can get back to you." } }, "empty"],
    [422, { error: { message: "Enter a valid email address." } }, "invalid"],
    [500, "boom", "server"],
  ];
  for (const [status, body, kind] of cases) {
    stubFetch(status, body);
    await assert.rejects(submitInquiry({ type: "contact", message: "x" }, "k"), (error: unknown) => {
      assert.ok(error instanceof InquirySubmitError);
      assert.equal(error.kind, kind);
      assert.equal(error.message, SUBMIT_ERRORS[kind]);
      return true;
    });
  }
  globalThis.fetch = (async () => {
    throw new TypeError("Failed to fetch");
  }) as unknown as typeof fetch;
  await assert.rejects(submitInquiry({ type: "contact", message: "x" }, "k"), { kind: "network" });
});
