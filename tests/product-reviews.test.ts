import assert from "node:assert/strict";
import test from "node:test";

import {
  buildRatingBreakdown,
  buildReviewLoginHref,
  formatReviewDateBn,
  getCanReviewProduct,
  getProductReviews,
  resolveInitialProductTab,
  submitProductReview,
  validateReviewInput,
} from "../lib/mart-api/product-reviews.ts";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

test("buildRatingBreakdown always returns complete 5-to-1 star rows with percentages", () => {
  const empty = buildRatingBreakdown({
    averageRating: 0,
    totalReviews: 0,
    ratingHistogram: {},
  });
  assert.deepEqual(
    empty.map((r) => r.stars),
    [5, 4, 3, 2, 1],
  );
  assert.ok(empty.every((r) => r.count === 0 && r.percent === 0));

  const populated = buildRatingBreakdown({
    averageRating: 3.9,
    totalReviews: 10,
    ratingHistogram: { "5": 5, "4": 2, "2": 1, "1": 2 },
  });
  assert.deepEqual(populated, [
    { stars: 5, count: 5, percent: 50 },
    { stars: 4, count: 2, percent: 20 },
    { stars: 3, count: 0, percent: 0 },
    { stars: 2, count: 1, percent: 10 },
    { stars: 1, count: 2, percent: 20 },
  ]);
});

test("validateReviewInput enforces rating bounds, required comment, and length caps", () => {
  assert.equal(
    validateReviewInput({ rating: 5, headline: "দারুণ", comment: "খুব ভালো পণ্য" }).ok,
    true,
  );
  assert.equal(
    validateReviewInput({ rating: 0, headline: "", comment: "ভালো" }).ok,
    false,
  );
  assert.equal(
    validateReviewInput({ rating: 6, headline: "", comment: "ভালো" }).ok,
    false,
  );
  assert.equal(
    validateReviewInput({ rating: 4, headline: "শিরোনাম", comment: "   " }).ok,
    false,
  );
  assert.equal(
    validateReviewInput({
      rating: 4,
      headline: "a".repeat(161),
      comment: "ভালো",
    }).ok,
    false,
  );
  assert.equal(
    validateReviewInput({
      rating: 4,
      headline: "",
      comment: "a".repeat(2001),
    }).ok,
    false,
  );
});

test("buildReviewLoginHref encodes product review redirect path cleanly", () => {
  const href = buildReviewLoginHref("cotton-panjabi");
  assert.equal(
    href,
    "/login?next=%2Fproducts%2Fcotton-panjabi%3Ftab%3Dreviews",
  );
  const parsed = new URL(href, "https://mart.implesia.com");
  assert.equal(parsed.pathname, "/login");
  assert.equal(
    parsed.searchParams.get("next"),
    "/products/cotton-panjabi?tab=reviews",
  );
});

test("resolveInitialProductTab opens reviews tab for ?tab=reviews or #reviews", () => {
  assert.equal(resolveInitialProductTab("reviews", null, true), "reviews");
  assert.equal(resolveInitialProductTab("REVIEWS", null, false), "reviews");
  assert.equal(resolveInitialProductTab(null, "#reviews", false), "reviews");
  assert.equal(resolveInitialProductTab("specifications", null, true), "specifications");
  assert.equal(resolveInitialProductTab("faq", null, true), "faq");
  assert.equal(resolveInitialProductTab("faq", null, false), "details");
  assert.equal(resolveInitialProductTab("unknown", null, true), "details");
});

test("formatReviewDateBn formats valid ISO timestamps and ignores invalid input", () => {
  assert.equal(formatReviewDateBn(""), "");
  assert.equal(formatReviewDateBn("not-a-date"), "");
  const formatted = formatReviewDateBn("2026-11-21T10:00:00Z");
  assert.ok(formatted.length > 0);
});

test("product review API wrappers surface backend Bangla error details cleanly", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("/can-review")) {
      return jsonResponse({
        can_review: false,
        reason: "আপনি ইতিমধ্যে এই পণ্যটির রিভিউ প্রদান করেছেন।",
        order_id: null,
      });
    }
    if (url === "/api/customer/products/prod-1/reviews") {
      return jsonResponse(
        {
          detail: "শুধুমাত্র পণ্যটি সফলভাবে অর্ডারকারী গ্রাহকগণ রিভিউ দিতে পারেন।",
        },
        409,
      );
    }
    return jsonResponse({ detail: "রিভিউ লোড করা যায়নি" }, 500);
  }) as unknown as typeof fetch;

  try {
    const check = await getCanReviewProduct("prod-1");
    assert.equal(check.canReview, false);
    assert.equal(check.reason, "আপনি ইতিমধ্যে এই পণ্যটির রিভিউ প্রদান করেছেন।");

    await assert.rejects(
      () =>
        submitProductReview("prod-1", {
          rating: 5,
          headline: "Great",
          comment: "Loved it",
        }),
      (err: Error) =>
        err.message ===
        "শুধুমাত্র পণ্যটি সফলভাবে অর্ডারকারী গ্রাহকগণ রিভিউ দিতে পারেন।",
    );

    await assert.rejects(
      () => getProductReviews("prod-1", { page: 2, pageSize: 10 }),
      (err: Error) => err.message === "রিভিউ লোড করা যায়নি",
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
