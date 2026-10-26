import assert from "node:assert/strict";
import test from "node:test";

import {
  blogHref,
  cleanSearchQuery,
  fetchSearch,
  normalizeSearchResults,
  searchHref,
} from "../lib/mart-api/search.ts";
import { buildSearchOptions } from "../lib/mart-api/search-options.ts";

const ID = "11111111-1111-4111-8111-111111111111";

const card = {
  id: ID,
  slug: "red-lamp",
  title: "Red lamp",
  subtitle: "Warm",
  category: "gadgets",
  price: 1200,
  compare_at_price: null,
  unit_label: "",
  image_src: "/media/red.jpg",
  image_alt: "",
  badge: null,
  status: "available",
  featured: false,
};

const post = {
  id: "22222222-2222-4222-8222-222222222222",
  slug: "lamp guide",
  title: "Lamp guide",
  excerpt: "How to choose",
  cover_image: "/uploads/cover.webp",
  cover_alt: "",
  author: "Mart",
  published_at: "3 Oct 2026",
  read_time: "4 min",
  tags: ["guide", 7],
};

function body(overrides: Record<string, unknown> = {}) {
  return {
    query: "lamp",
    type: "all",
    page_size: 5,
    products: { items: [card], total: 1, page: 1, pages: 1 },
    blogs: { items: [post], total: 1, page: 1, pages: 1 },
    ...overrides,
  };
}

test("the typed query is cleaned to one trimmed line and capped", () => {
  assert.equal(cleanSearchQuery("  লাল \n\t শার্ট\u0000 "), "লাল শার্ট");
  assert.equal(cleanSearchQuery(undefined), "");
  assert.equal(cleanSearchQuery("   "), "");
  assert.equal(cleanSearchQuery("a".repeat(500)).length, 80);
});

test("result links encode the query and only add a page after the first", () => {
  assert.equal(searchHref("red lamp"), "/search?q=red+lamp");
  assert.equal(searchHref("লাল"), "/search?q=%E0%A6%B2%E0%A6%BE%E0%A6%B2");
  assert.equal(searchHref("a&b=c#x"), "/search?q=a%26b%3Dc%23x");
  assert.equal(searchHref("lamp", 3), "/search?q=lamp&page=3");
  assert.equal(searchHref("   "), "/search");
  assert.equal(blogHref("a/b c"), "/blogs/a%2Fb%20c");
});

test("a search answer is read into cards and posts", () => {
  const parsed = normalizeSearchResults(body());
  assert.ok(parsed);
  assert.equal(parsed.products.items[0]?.title, "Red lamp");
  assert.equal(parsed.products.total, 1);
  assert.equal(parsed.blogs.items[0]?.slug, "lamp guide");
  assert.deepEqual(parsed.blogs.items[0]?.tags, ["guide"]);
  assert.equal(parsed.blogs.items[0]?.coverAlt, "Lamp guide");
});

test("rows that cannot be shown are dropped and anything else is not an answer", () => {
  const parsed = normalizeSearchResults(
    body({
      products: { items: [card, { id: "seed", title: "Seed row" }, null], total: 3, page: 1, pages: 1 },
      blogs: { items: [{ slug: "", title: "No slug" }], total: 0, page: 1, pages: 0 },
    }),
  );
  assert.ok(parsed);
  assert.equal(parsed.products.items.length, 1);
  assert.equal(parsed.blogs.items.length, 0);
  assert.equal(normalizeSearchResults(null), null);
  assert.equal(normalizeSearchResults("<html>"), null);
  assert.equal(normalizeSearchResults({ products: {}, blogs: {} }), null);
  assert.equal(normalizeSearchResults({ query: "x" }), null);
});

test("dropdown rows: products, posts, then always one see-all row", () => {
  const parsed = normalizeSearchResults(body());
  const options = buildSearchOptions(parsed, "lamp", "s1");
  assert.deepEqual(
    options.map((option) => option.kind),
    ["product", "blog", "all"],
  );
  assert.equal(options[0]?.href, `/products/${ID}`);
  assert.equal(options[0]?.detail, "৳1,200");
  assert.equal(options[1]?.href, "/blogs/lamp%20guide");
  assert.equal(options[2]?.href, "/search?q=lamp");
  assert.equal(new Set(options.map((option) => option.id)).size, 3);
  assert.deepEqual(buildSearchOptions(null, "lamp", "s1"), []);
});

test("dropdown rows are capped at five products and three posts", () => {
  const many = (n: number, make: (i: number) => unknown) => Array.from({ length: n }, (_, i) => make(i));
  const parsed = normalizeSearchResults(
    body({
      products: {
        items: many(9, (i) => ({ ...card, id: `11111111-1111-4111-8111-11111111111${i}`, title: `P${i}` })),
        total: 9,
        page: 1,
        pages: 2,
      },
      blogs: { items: many(6, (i) => ({ ...post, slug: `b${i}`, title: `B${i}` })), total: 6, page: 1, pages: 1 },
    }),
  );
  const options = buildSearchOptions(parsed, "p", "x");
  assert.equal(options.filter((option) => option.kind === "product").length, 5);
  assert.equal(options.filter((option) => option.kind === "blog").length, 3);
  assert.equal(options.length, 9);
});

type Seen = { url: string; init?: RequestInit };

async function withFetch<T>(
  answer: (seen: Seen) => Response | Promise<Response>,
  run: (seen: Seen[]) => Promise<T>,
) {
  const original = globalThis.fetch;
  const seen: Seen[] = [];
  globalThis.fetch = (async (input: unknown, init?: RequestInit) => {
    const entry = { url: String(input), init };
    seen.push(entry);
    return answer(entry);
  }) as typeof fetch;
  try {
    return await run(seen);
  } finally {
    globalThis.fetch = original;
  }
}

test("fetchSearch asks the API anonymously with the cleaned query", async () => {
  await withFetch(
    () => Response.json(body()),
    async (seen) => {
      const results = await fetchSearch({ q: "  red   lamp ", pageSize: 5 });
      assert.equal(results.products.items.length, 1);
      assert.equal(seen.length, 1);
      const url = new URL(seen[0].url);
      assert.equal(url.pathname, "/api/v1/search");
      assert.equal(url.searchParams.get("q"), "red lamp");
      assert.equal(url.searchParams.get("page_size"), "5");
      assert.equal(url.searchParams.has("type"), false);
      assert.equal(new Headers(seen[0].init?.headers).has("Authorization"), false);
      assert.equal(seen[0].init?.credentials, "omit");
      assert.equal(seen[0].init?.cache, "no-store");
    },
  );
});

test("fetchSearch sends type and page only when they differ from the defaults", async () => {
  await withFetch(
    () => Response.json(body({ type: "products" })),
    async (seen) => {
      await fetchSearch({ q: "lamp", type: "products", page: 3, pageSize: 12 });
      const url = new URL(seen[0].url);
      assert.equal(url.searchParams.get("type"), "products");
      assert.equal(url.searchParams.get("page"), "3");
    },
  );
});

test("fetchSearch fails loudly on an error status, a bad body, and a network failure", async () => {
  await withFetch(
    () => new Response("{}", { status: 500 }),
    async () => assert.rejects(fetchSearch({ q: "x" }), /unavailable/),
  );
  await withFetch(
    () => new Response("<html>oops</html>", { status: 200 }),
    async () => assert.rejects(fetchSearch({ q: "x" }), /unreadable/),
  );
  await withFetch(
    () => Response.json({ hello: "world" }),
    async () => assert.rejects(fetchSearch({ q: "x" }), /unexpected/),
  );
  await withFetch(
    () => {
      throw new TypeError("fetch failed");
    },
    async () => assert.rejects(fetchSearch({ q: "x" }), /Could not reach/),
  );
});
