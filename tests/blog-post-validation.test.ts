import assert from "node:assert/strict";
import test from "node:test";

import {
  errorCount,
  errorsFromApi,
  firstInvalid,
  NO_ERRORS,
  POST_LIMITS,
  validatePost,
  type PostInput,
} from "../lib/blog-post-validation.ts";

const valid: PostInput = {
  isActive: true,
  slug: "power-bank-guide",
  title: "Power bank guide",
  excerpt: "",
  categoryId: "c1",
  coverImage: "blob:abc",
  coverAlt: "",
  seoTitle: "",
  seoDescription: "",
  author: "",
  authorRole: "",
  publishedAt: "",
  readTime: "",
  tagsText: "",
  relatedCount: 0,
  content: [{ id: "b1", type: "paragraph", text: "Hello" }],
};
const context = { takenSlugs: ["taken"], hasCategories: true };

test("a complete post has no errors", () => {
  assert.equal(errorCount(validatePost(valid, context)), 0);
});

test("missing required fields are all reported at once, with a message each", () => {
  const found = validatePost(
    { ...valid, title: "  ", slug: "", categoryId: "", coverImage: "", content: [] },
    context,
  );
  assert.deepEqual(Object.keys(found.fields).sort(), ["category", "cover", "slug", "title"]);
  assert.match(found.fields.title ?? "", /title/i);
  assert.match(found.fields.slug ?? "", /slug/i);
  assert.match(found.fields.category ?? "", /category/i);
  assert.match(found.fields.cover ?? "", /cover/i);
});

test("a hidden article does not need a cover", () => {
  const found = validatePost({ ...valid, isActive: false, coverImage: "" }, context);
  assert.equal(found.fields.cover, undefined);
});

test("slug: bad characters, and a slug another article already uses", () => {
  assert.match(validatePost({ ...valid, slug: "Not A Slug" }, context).fields.slug ?? "", /lowercase/);
  assert.match(validatePost({ ...valid, slug: "a--b" }, context).fields.slug ?? "", /lowercase/);
  assert.match(validatePost({ ...valid, slug: " TAKEN " }, context).fields.slug ?? "", /already uses/);
  assert.equal(validatePost({ ...valid, slug: "  Mixed-Case " }, context).fields.slug, undefined);
});

test("no categories at all points to the Categories page", () => {
  const found = validatePost({ ...valid, categoryId: "" }, { ...context, hasCategories: false });
  assert.match(found.fields.category ?? "", /no categories yet/i);
});

test("lengths match the backend limits and say how far over", () => {
  const found = validatePost(
    {
      ...valid,
      title: "x".repeat(POST_LIMITS.title + 1),
      seoTitle: "y".repeat(71),
      tagsText: Array.from({ length: 13 }, (_, n) => `t${n}`).join(","),
      relatedCount: 9,
    },
    context,
  );
  assert.match(found.fields.title ?? "", /200 characters or fewer \(now 201\)/);
  assert.match(found.fields.seoTitle ?? "", /70 characters/);
  assert.match(found.fields.tags ?? "", /12 tags or fewer \(now 13\)/);
  assert.match(found.fields.related ?? "", /8 products or fewer \(now 9\)/);
});

test("empty blocks are flagged on the block, per type; a hidden block still counts", () => {
  const found = validatePost(
    {
      ...valid,
      content: [
        { id: "p", type: "paragraph", text: " " },
        { id: "h", type: "heading", text: "" },
        { id: "l", type: "list", items: ["", " "] },
        { id: "c", type: "callout", title: "", text: "" },
        { id: "ok", type: "callout", title: "", text: "text only" },
      ],
    },
    context,
  );
  assert.deepEqual(Object.keys(found.blocks).sort(), ["c", "h", "l", "p"]);
  assert.match(found.blocks.l, /item/);
  assert.match(found.blocks.c, /title or text/);
});

test("firstInvalid follows the order on screen: fields, then blocks in order", () => {
  const errors = {
    ...NO_ERRORS,
    fields: { author: "x", slug: "y" },
    blocks: { b2: "m", b1: "m" },
  };
  assert.deepEqual(firstInvalid(errors, ["b1", "b2"]), { field: "slug" });
  assert.deepEqual(firstInvalid({ ...errors, fields: {} }, ["b1", "b2"]), { block: "b1" });
  assert.equal(firstInvalid(NO_ERRORS, ["b1"]), null);
});

test("API 422 details land on their fields, blocks by index", () => {
  const found = errorsFromApi(
    422,
    "Title is required.",
    [
      { type: "value_error", loc: ["body", "title"], msg: "Title is required." },
      { type: "value_error", loc: ["body", "category_id"], msg: "Choose a category." },
      { type: "value_error", loc: ["body", "cover_image"], msg: "Add a cover photo." },
      { type: "value_error", loc: ["body", "blocks", 1, "items"], msg: "Fill in every block." },
      { type: "value_error", loc: ["body", "title"], msg: "A second title message" },
    ],
    ["b0", "b1"],
  );
  assert.deepEqual(found.fields, {
    title: "Title is required.",
    category: "Choose a category.",
    cover: "Add a cover photo.",
  });
  assert.deepEqual(found.blocks, { b1: "Fill in every block." });
  assert.equal(found.form, "");
});

test("API schema errors are made readable", () => {
  const found = errorsFromApi(
    422,
    "Request payload is invalid",
    [
      {
        type: "string_too_long",
        loc: ["body", "seo_title"],
        msg: "String should have at most 70 characters",
        ctx: { max_length: 70 },
      },
      { type: "missing", loc: ["body", "slug"], msg: "Field required" },
      {
        type: "value_error",
        loc: ["body", "cover_image"],
        msg: "Value error, Cover photo must be uploaded, or be a site path.",
      },
    ],
    [],
  );
  assert.equal(found.fields.seoTitle, "SEO title must be 70 characters or fewer.");
  assert.equal(found.fields.slug, "Slug is required.");
  assert.equal(found.fields.cover, "Cover photo must be uploaded, or be a site path.");
});

test("a 409 is the slug; an answer with no field details is a form-level message", () => {
  assert.equal(
    errorsFromApi(409, "Another article already uses this slug.", null, []).fields.slug,
    "Another article already uses this slug.",
  );
  const server = errorsFromApi(500, "An unexpected error occurred", null, []);
  assert.equal(server.form, "An unexpected error occurred");
  assert.equal(errorCount(server), 0);
  const unknown = errorsFromApi(
    422,
    "Request payload is invalid",
    [{ type: "extra_forbidden", loc: ["body", "nope"], msg: "Extra inputs are not permitted" }],
    [],
  );
  assert.equal(errorCount(unknown), 0);
  assert.match(unknown.form, /Extra inputs/);
});
