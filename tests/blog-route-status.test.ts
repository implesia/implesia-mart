import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

// A loading.tsx in the blog detail segment (or in /blogs itself, which wraps it) makes Next flush
// the shell first, so a missing post can no longer answer 404 and becomes a 200 "soft 404".
// The listing's skeleton lives in the (list) route group instead, like products/(catalog).
const blogs = join(process.cwd(), "app", "(client)", "blogs");

test("blog detail can still answer a real 404 status", () => {
  assert.equal(existsSync(join(blogs, "loading.tsx")), false);
  assert.equal(existsSync(join(blogs, "[slug]", "loading.tsx")), false);
});

test("blog listing keeps its loading skeleton in the (list) group", () => {
  assert.equal(existsSync(join(blogs, "(list)", "loading.tsx")), true);
  assert.equal(existsSync(join(blogs, "(list)", "page.tsx")), true);
  assert.equal(existsSync(join(blogs, "[slug]", "page.tsx")), true);
});
