/**
 * Field-level validation for the blog post form, and the mapping of the API's error answer onto
 * the same fields. Pure, so both are unit tested. The limits mirror `PostWrite` in the backend
 * (app/schemas/blogs/posts.py); the backend stays the source of truth and answers with
 * `error.details[].loc` for anything this misses.
 */

export const POST_LIMITS = {
  title: 200,
  slug: 160,
  excerpt: 500,
  coverAlt: 200,
  seoTitle: 70,
  seoDescription: 200,
  author: 80,
  authorRole: 80,
  publishedAt: 40,
  readTime: 40,
  tags: 12,
  related: 8,
  blocks: 40,
  blockText: 4000,
  blockTitle: 200,
  listItems: 20,
} as const;

export type PostFieldKey =
  | "title"
  | "slug"
  | "category"
  | "excerpt"
  | "cover"
  | "coverAlt"
  | "seoTitle"
  | "seoDescription"
  | "author"
  | "authorRole"
  | "publishedAt"
  | "readTime"
  | "tags"
  | "related"
  | "body";

/** The order the fields appear in the form, so "first invalid" is the first one on screen. */
export const POST_FIELD_ORDER: PostFieldKey[] = [
  "title",
  "slug",
  "category",
  "excerpt",
  "cover",
  "coverAlt",
  "seoTitle",
  "seoDescription",
  "author",
  "authorRole",
  "publishedAt",
  "readTime",
  "tags",
  "related",
  "body",
];

const FIELD_NAMES: Record<PostFieldKey, string> = {
  title: "Title",
  slug: "Slug",
  category: "Category",
  excerpt: "Excerpt",
  cover: "Cover photo",
  coverAlt: "Cover description",
  seoTitle: "SEO title",
  seoDescription: "SEO description",
  author: "Author",
  authorRole: "Author role",
  publishedAt: "Date",
  readTime: "Read time",
  tags: "Tags",
  related: "Mentioned products",
  body: "Body",
};

/** Backend field name (the last part of a `loc` path) to the form field. */
const API_FIELDS: Record<string, PostFieldKey> = {
  title: "title",
  slug: "slug",
  category_id: "category",
  excerpt: "excerpt",
  cover_image: "cover",
  cover_alt: "coverAlt",
  seo_title: "seoTitle",
  seo_description: "seoDescription",
  author: "author",
  author_role: "authorRole",
  published_at: "publishedAt",
  read_time: "readTime",
  tags: "tags",
  related_product_slugs: "related",
  blocks: "body",
};

export type PostErrors = {
  fields: Partial<Record<PostFieldKey, string>>;
  /** Block id to the message shown under that block's main input. */
  blocks: Record<string, string>;
  /** A problem that belongs to no field: network, sign-in, server. */
  form: string;
};

export const NO_ERRORS: PostErrors = { fields: {}, blocks: {}, form: "" };

export type BlockInput = {
  id: string;
  type: string;
  text?: string;
  title?: string;
  items?: string[];
};

export type PostInput = {
  isActive: boolean;
  slug: string;
  title: string;
  excerpt: string;
  categoryId: string;
  coverImage: string;
  coverAlt: string;
  seoTitle: string;
  seoDescription: string;
  author: string;
  authorRole: string;
  publishedAt: string;
  readTime: string;
  tagsText: string;
  relatedCount: number;
  content: BlockInput[];
};

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function tooLong(name: string, max: number, now: number, unit = "characters") {
  return `${name} must be ${max} ${unit} or fewer (now ${now}).`;
}

export function blockFilled(block: BlockInput) {
  if (block.type === "list") return (block.items ?? []).some((item) => item.trim());
  if (block.type === "callout") return Boolean((block.title ?? "").trim() || (block.text ?? "").trim());
  return Boolean((block.text ?? "").trim());
}

function blockProblem(block: BlockInput): string {
  if (!blockFilled(block)) {
    if (block.type === "list") return "Add at least one item, or remove this block.";
    if (block.type === "callout") return "Add a title or text, or remove this block.";
    if (block.type === "heading") return "Write the heading, or remove this block.";
    return "Write the paragraph, or remove this block.";
  }
  const text = (block.text ?? "").trim();
  if (text.length > POST_LIMITS.blockText) {
    return tooLong("This block", POST_LIMITS.blockText, text.length);
  }
  const title = (block.title ?? "").trim();
  if (title.length > POST_LIMITS.blockTitle) {
    return tooLong("The title", POST_LIMITS.blockTitle, title.length);
  }
  const items = (block.items ?? []).filter((item) => item.trim());
  if (items.length > POST_LIMITS.listItems) {
    return tooLong("This list", POST_LIMITS.listItems, items.length, "items");
  }
  return "";
}

export type PostContext = {
  /** Slugs of the other articles. */
  takenSlugs: string[];
  /** False when the category list is loaded and empty. */
  hasCategories: boolean;
};

export function validatePost(input: PostInput, context: PostContext): PostErrors {
  const fields: PostErrors["fields"] = {};
  const blocks: PostErrors["blocks"] = {};
  const title = input.title.trim();
  const slug = input.slug.trim().toLowerCase();

  if (!title) fields.title = "Enter a title for the article.";
  else if (title.length > POST_LIMITS.title) {
    fields.title = tooLong("Title", POST_LIMITS.title, title.length);
  }

  if (!slug) fields.slug = "Enter a slug, for example power-bank-guide.";
  else if (!SLUG_PATTERN.test(slug)) {
    fields.slug =
      "Use only lowercase English letters, numbers and single hyphens, for example power-bank-guide.";
  } else if (slug.length > POST_LIMITS.slug) {
    fields.slug = tooLong("Slug", POST_LIMITS.slug, slug.length);
  } else if (context.takenSlugs.includes(slug)) {
    fields.slug = "Another article already uses this slug. Change it to something unique.";
  }

  if (!input.categoryId) {
    fields.category = context.hasCategories
      ? "Choose a category for this article."
      : "There are no categories yet. Add one under Categories, then choose it here.";
  }

  if (input.isActive && !input.coverImage.trim()) {
    fields.cover =
      "Add a cover photo to publish this article, or switch it to Inactive to save it as a draft.";
  }

  const lengths: [PostFieldKey, string, number][] = [
    ["excerpt", input.excerpt, POST_LIMITS.excerpt],
    ["coverAlt", input.coverAlt, POST_LIMITS.coverAlt],
    ["seoTitle", input.seoTitle, POST_LIMITS.seoTitle],
    ["seoDescription", input.seoDescription, POST_LIMITS.seoDescription],
    ["author", input.author, POST_LIMITS.author],
    ["authorRole", input.authorRole, POST_LIMITS.authorRole],
    ["publishedAt", input.publishedAt, POST_LIMITS.publishedAt],
    ["readTime", input.readTime, POST_LIMITS.readTime],
  ];
  for (const [key, value, max] of lengths) {
    const length = value.trim().length;
    if (length > max) fields[key] = tooLong(FIELD_NAMES[key], max, length);
  }

  const tagCount = input.tagsText.split(",").filter((tag) => tag.trim()).length;
  if (tagCount > POST_LIMITS.tags) {
    fields.tags = `Use ${POST_LIMITS.tags} tags or fewer (now ${tagCount}).`;
  }
  if (input.relatedCount > POST_LIMITS.related) {
    fields.related = `Select ${POST_LIMITS.related} products or fewer (now ${input.relatedCount}).`;
  }
  if (input.content.length > POST_LIMITS.blocks) {
    fields.body = `An article can have up to ${POST_LIMITS.blocks} blocks (now ${input.content.length}). Remove some.`;
  }
  for (const block of input.content) {
    const problem = blockProblem(block);
    if (problem) blocks[block.id] = problem;
  }
  return { fields, blocks, form: "" };
}

export function errorCount(errors: PostErrors) {
  return Object.keys(errors.fields).length + Object.keys(errors.blocks).length;
}

export type InvalidTarget = { field: PostFieldKey } | { block: string };

/** The first invalid control in on-screen order, or null. */
export function firstInvalid(errors: PostErrors, blockOrder: string[]): InvalidTarget | null {
  for (const field of POST_FIELD_ORDER) {
    if (errors.fields[field]) return { field };
  }
  for (const id of blockOrder) {
    if (errors.blocks[id]) return { block: id };
  }
  return null;
}

/** One entry of the API's `error.details` (FastAPI's own shape, which the blog service reuses). */
export type ApiProblem = {
  loc: (string | number)[];
  msg: string;
  type?: string;
  ctx?: Record<string, unknown>;
};

export function isApiProblem(value: unknown): value is ApiProblem {
  if (typeof value !== "object" || value === null) return false;
  const item = value as { loc?: unknown; msg?: unknown };
  return Array.isArray(item.loc) && typeof item.msg === "string";
}

function plain(problem: ApiProblem, name: string): string {
  const max = typeof problem.ctx?.max_length === "number" ? problem.ctx.max_length : null;
  switch (problem.type) {
    case "missing":
      return `${name} is required.`;
    case "string_too_long":
      return max ? `${name} must be ${max} characters or fewer.` : `${name} is too long.`;
    case "too_long":
      return max ? `${name} allows at most ${max} entries.` : `${name} has too many entries.`;
    case "string_type":
    case "string_pattern_mismatch":
      return `${name} is not valid.`;
    default:
      return problem.msg.replace(/^Value error,\s*/i, "");
  }
}

/** Maps a failed save's answer onto the form. Anything with no field becomes `form`. */
export function errorsFromApi(
  status: number,
  fallback: string,
  details: unknown,
  blockIds: string[],
): PostErrors {
  const fields: PostErrors["fields"] = {};
  const blocks: PostErrors["blocks"] = {};
  let form = "";
  const problems = Array.isArray(details) ? details.filter(isApiProblem) : [];
  for (const problem of problems) {
    const path = problem.loc[0] === "body" ? problem.loc.slice(1) : problem.loc;
    const key = typeof path[0] === "string" ? API_FIELDS[path[0]] : undefined;
    if (!key) {
      form ||= plain(problem, "The request");
      continue;
    }
    if (key === "body" && typeof path[1] === "number") {
      const id = blockIds[path[1]];
      if (id) {
        blocks[id] ||= plain(problem, "This block");
        continue;
      }
    }
    fields[key] ||= plain(problem, FIELD_NAMES[key]);
  }
  if (problems.length === 0) {
    // A 409 on this form can only be the slug. Older answers carry no details.
    if (status === 409) fields.slug = fallback || "Another article already uses this slug.";
    else form = fallback;
  }
  return { fields, blocks, form };
}
