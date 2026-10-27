import assert from "node:assert/strict";
import test from "node:test";

import {
  BLOG_PAGE_SIZE,
  adminCoverSrc,
  articleSeo,
  canOptimize,
  coverSrc,
  filterPosts,
  nextVisibleCount,
} from "@/lib/blog-view";

const post = (over: Partial<Parameters<typeof filterPosts>[0][number]> = {}) => ({
  title: "পাওয়ার ব্যাংক গাইড",
  excerpt: "কোনটি কিনবেন",
  tags: ["charger", "battery"],
  categoryId: "c1",
  ...over,
});

test("coverSrc only returns URLs a visitor's browser can load", () => {
  assert.equal(coverSrc("/media/blogs/a.jpg"), "http://127.0.0.1:8001/media/blogs/a.jpg");
  assert.equal(coverSrc("/images/blog/a.webp"), "/images/blog/a.webp");
  assert.equal(coverSrc("https://cdn.example.com/a.jpg"), "https://cdn.example.com/a.jpg");
  for (const bad of [
    "",
    "   ",
    "blob:http://localhost:3000/abc",
    "data:image/png;base64,AAAA",
    "javascript:alert(1)",
    "//evil.example/a.jpg",
    "/media/../etc/passwd",
    "relative/a.jpg",
    "ftp://host/a.jpg",
  ]) {
    assert.equal(coverSrc(bad), "", bad);
  }
  assert.equal(coverSrc(undefined), "");
  assert.equal(coverSrc(null), "");
});

test("adminCoverSrc keeps a fresh blob: preview but hides other unusable values", () => {
  assert.equal(adminCoverSrc("blob:http://localhost:3000/x"), "blob:http://localhost:3000/x");
  assert.equal(adminCoverSrc("javascript:alert(1)"), "");
  assert.equal(adminCoverSrc("/media/blogs/a.jpg"), "http://127.0.0.1:8001/media/blogs/a.jpg");
});

test("canOptimize is false for hosts next.config does not list", () => {
  assert.equal(canOptimize("/images/a.jpg"), true);
  assert.equal(canOptimize("http://127.0.0.1:8001/media/blogs/a.jpg"), true);
  assert.equal(canOptimize("https://cdn.example.com/a.jpg"), false);
});

test("filterPosts matches title, excerpt and tags, all terms, case-insensitively", () => {
  const posts = [post(), post({ title: "Laptop stand", excerpt: "", tags: [], categoryId: "c2" })];
  assert.equal(filterPosts(posts, {}).length, 2);
  assert.equal(filterPosts(posts, { query: "  " }).length, 2);
  assert.equal(filterPosts(posts, { query: "পাওয়ার" }).length, 1);
  assert.equal(filterPosts(posts, { query: "BATTERY" }).length, 1);
  assert.equal(filterPosts(posts, { query: "কিনবেন গাইড" }).length, 1);
  assert.equal(filterPosts(posts, { query: "কিনবেন stand" }).length, 0);
  assert.equal(filterPosts(posts, { query: "zzz" }).length, 0);
});

test("filterPosts combines the category with the search", () => {
  const posts = [post(), post({ title: "Laptop stand", tags: [], categoryId: "c2" })];
  assert.equal(filterPosts(posts, { categoryId: "c2" }).length, 1);
  assert.equal(filterPosts(posts, { categoryId: "c2", query: "পাওয়ার" }).length, 0);
  assert.equal(filterPosts(posts, { categoryId: "all", query: "laptop" }).length, 1);
});

test("nextVisibleCount grows by one page and never past the total", () => {
  assert.equal(nextVisibleCount(BLOG_PAGE_SIZE, 100), BLOG_PAGE_SIZE * 2);
  assert.equal(nextVisibleCount(BLOG_PAGE_SIZE, 11), 11);
  assert.equal(nextVisibleCount(0, 0), 0);
});

const article = {
  slug: "power-bank",
  title: "Power bank guide",
  excerpt: "How to choose.",
  coverImage: "/media/blogs/a.jpg",
  coverAlt: "",
  author: " Mart team ",
  publishedAt: "",
  tags: ["guide"],
};

test("articleSeo prefers the SEO fields and falls back to title and excerpt", () => {
  const fallback = articleSeo(article);
  assert.equal(fallback.title, "Power bank guide");
  assert.equal(fallback.description, "How to choose.");
  assert.equal(fallback.url, "https://mart.implesia.com/blogs/power-bank");
  assert.equal(fallback.image, "http://127.0.0.1:8001/media/blogs/a.jpg");
  assert.equal(fallback.imageAlt, "Power bank guide");
  assert.deepEqual(fallback.authors, ["Mart team"]);

  const custom = articleSeo({ ...article, seoTitle: " Best banks ", seoDescription: "Pick one." });
  assert.equal(custom.title, "Best banks");
  assert.equal(custom.description, "Pick one.");
});

test("articleSeo has no image for an unusable cover and makes site paths absolute", () => {
  assert.equal(articleSeo({ ...article, coverImage: "blob:http://x/1" }).image, "");
  assert.equal(articleSeo({ ...article, coverImage: "" }).image, "");
  assert.equal(
    articleSeo({ ...article, coverImage: "/images/blog/a.webp" }).image,
    "https://mart.implesia.com/images/blog/a.webp",
  );
});
