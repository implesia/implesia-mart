"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useId, useState } from "react";

import { BlogImage } from "@/app/(client)/blogs/_components/blog-image";
import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import { products } from "@/app/(client)/_data/products/products";
import { adminCoverSrc } from "@/lib/blog-view";
import {
  blockFilled,
  errorCount,
  errorsFromApi,
  firstInvalid,
  NO_ERRORS,
  POST_LIMITS,
  validatePost,
  type InvalidTarget,
  type PostErrors,
  type PostFieldKey,
} from "@/lib/blog-post-validation";
import {
  blogCategoryLabel,
  getBlogCategories,
  type BlogCategories,
} from "@/lib/mart-api/blog-categories";
import {
  BlogApiError,
  createBlogPost,
  deleteBlogPost,
  listAdminBlogPosts,
  reorderBlogPosts,
  updateBlogPost,
  uploadBlogCover,
} from "@/lib/mart-api/blog-posts";
import { MartApiError } from "@/lib/mart-api/products";
import {
  blankBlogBlock,
  blankBlogPost,
  moveList,
  type BlogBlock,
  type BlogPostRecord,
} from "@/lib/mart-mock/blog-sections";
import { cn } from "@/lib/utils";

import { ImageField } from "../../../_components/image-field";
import {
  ActiveStatusField,
  adminButtonClass,
  adminFieldClass,
  FieldLabel,
  VisibilityBadge,
} from "../../../_components/admin-ui";
import { FormCloseGuard } from "../../../_components/form-close-guard";
import {
  BlogHeader,
  BlogModal,
  InlineError,
  ItemToolbar,
  Labeled,
  setBlogQuery,
  useBlogNav,
  useReturnFocus,
  VisibilitySwitch,
} from "./blog-shared";

type Draft = {
  id: string;
  isActive: boolean;
  slug: string;
  title: string;
  excerpt: string;
  categoryId: string;
  coverImage: string;
  coverAlt: string;
  coverNeedsUpload: boolean;
  seoTitle: string;
  seoDescription: string;
  author: string;
  authorRole: string;
  publishedAt: string;
  readTime: string;
  tagsText: string;
  relatedProductSlugs: string[];
  content: BlogBlock[];
};

function draftFrom(post: BlogPostRecord): Draft {
  return {
    id: post.id,
    isActive: post.isActive !== false,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    categoryId: post.categoryId,
    coverImage: post.coverImage,
    coverAlt: post.coverAlt,
    coverNeedsUpload: post.coverNeedsUpload === true,
    seoTitle: post.seoTitle,
    seoDescription: post.seoDescription,
    author: post.author,
    authorRole: post.authorRole,
    publishedAt: post.publishedAt,
    readTime: post.readTime,
    tagsText: post.tags.join(", "),
    relatedProductSlugs: [...post.relatedProductSlugs],
    content: post.content.map((block) => ({ ...block, isActive: block.isActive !== false })),
  };
}

export function BlogPostsEditor() {
  const [posts, setPosts] = useState<BlogPostRecord[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [categories, setCategories] = useState<BlogCategories | null>(null);
  const params = useSearchParams();
  const { pathname, router } = useBlogNav();
  const postParam = params.get("post");
  const editing = postParam !== null;
  const [notice, setNotice] = useState("");
  const { focusEdit, markReturn } = useReturnFocus(editing);
  const existing = posts?.find((post) => post.id === postParam) ?? null;

  function reloadCategories(isCurrent: () => boolean = () => true) {
    getBlogCategories()
      .then((next) => {
        if (isCurrent()) setCategories(next);
      })
      .catch(() => {
        if (isCurrent()) setCategories({ isActive: true, items: [] });
      });
  }

  useEffect(() => {
    let active = true;
    listAdminBlogPosts()
      .then((next) => {
        if (active) setPosts(next);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setPosts([]);
        setLoadError(error instanceof Error ? error.message : "Could not load the articles.");
      });
    reloadCategories(() => active);
    return () => {
      active = false;
    };
  }, []);

  function close() {
    markReturn();
    setBlogQuery(router, pathname, "post", null);
  }

  function openNew() {
    setBlogQuery(router, pathname, "post", "new");
  }

  function openPost(id: string) {
    setBlogQuery(router, pathname, "post", id);
  }

  async function save(draft: Draft) {
    const next = cleanPost(draft);
    const saved =
      postParam === "new" ? await createBlogPost(next) : await updateBlogPost(next.id, next);
    setPosts((current) => {
      const list = current ?? [];
      return list.some((post) => post.id === saved.id)
        ? list.map((post) => (post.id === saved.id ? saved : post))
        : [...list, saved];
    });
    setNotice("Saved.");
    window.setTimeout(() => setNotice(""), 1600);
    close();
  }

  async function remove(id: string) {
    await deleteBlogPost(id);
    setPosts((current) => (current ?? []).filter((post) => post.id !== id));
    setNotice("Removed.");
    window.setTimeout(() => setNotice(""), 1600);
    close();
  }

  async function move(index: number, direction: -1 | 1) {
    const current = posts ?? [];
    const next = moveList(current, index, direction);
    if (next === current) return;
    setPosts(next);
    try {
      setPosts(await reorderBlogPosts(next.map((post) => post.id)));
    } catch (error) {
      setPosts(current);
      setLoadError(error instanceof Error ? error.message : "Could not reorder the articles.");
    }
  }

  const formPost =
    postParam === "new"
      ? { ...blankBlogPost(categories?.items[0]?.id ?? ""), author: "" }
      : existing;

  return (
    <div className="min-w-0 space-y-4">
      <BlogHeader
        sectionId="posts"
        title="Posts"
        description="Articles, covers, and body."
        editLabel="Add post"
        onEdit={openNew}
        editRef={focusEdit}
      />
      {notice ? (
        <p role="status" className="text-sm font-medium text-emerald-800">
          {notice} The article list is up to date.
        </p>
      ) : null}
      {loadError ? <p className="text-sm text-red-700">{loadError}</p> : null}
      {posts === null ? (
        <p className="text-sm text-neutral-500">Loading the articles…</p>
      ) : posts.length === 0 ? (
        <div className="rounded-2xl bg-white px-4 py-12 text-center ring-1 ring-neutral-200/90">
          <p className="text-sm font-semibold text-neutral-950">No articles yet</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-neutral-500">
            Add the first guide. It shows on the blog list when it is active.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {posts.map((post, index) => {
            const label = blogCategoryLabel(categories, post.categoryId);
            return (
              <li
                key={post.id}
                className={cn(
                  "flex flex-col gap-3 rounded-2xl bg-white p-3 ring-1 ring-neutral-200/90 sm:flex-row sm:items-center",
                  post.isActive === false && "opacity-60",
                )}
              >
                <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-lg bg-admin-canvas sm:w-28">
                  <BlogImage src={post.coverImage} alt="" sizes="112px" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-neutral-950">
                      {post.title || "Untitled"}
                    </p>
                    <VisibilityBadge active={post.isActive !== false} />
                    {post.coverNeedsUpload ? (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 ring-1 ring-amber-200">
                        Cover needs re-upload
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-neutral-500">
                    {[label, post.publishedAt].filter(Boolean).join(" · ") || "No category"}
                    {post.isActive === false ? " · Hidden" : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <IconButton
                    label={`Move ${post.title || "article"} earlier`}
                    icon="arrow_upward"
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                  />
                  <IconButton
                    label={`Move ${post.title || "article"} later`}
                    icon="arrow_downward"
                    disabled={index === posts.length - 1}
                    onClick={() => move(index, 1)}
                  />
                  {post.slug ? (
                    <a
                      href={`/blogs/${post.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className={adminButtonClass.quiet}
                    >
                      View
                    </a>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => openPost(post.id)}
                    className={adminButtonClass.secondary}
                  >
                    Edit
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {formPost ? (
        <PostForm
          key={postParam ?? formPost.id}
          post={formPost}
          categories={categories}
          isNew={postParam === "new"}
          onClose={close}
          posts={posts ?? []}
          onSave={save}
          onReloadCategories={() => reloadCategories()}
          onRemove={postParam === "new" ? undefined : () => remove(formPost.id)}
        />
      ) : null}
    </div>
  );
}

function cleanPost(draft: Draft): BlogPostRecord {
  return {
    id: draft.id,
    isActive: draft.isActive,
    slug: draft.slug.trim().toLowerCase(),
    title: draft.title.trim(),
    excerpt: draft.excerpt.trim(),
    categoryId: draft.categoryId,
    coverImage: draft.coverImage.trim(),
    coverAlt: draft.coverAlt.trim(),
    seoTitle: draft.seoTitle.trim(),
    seoDescription: draft.seoDescription.trim(),
    author: draft.author.trim(),
    authorRole: draft.authorRole.trim(),
    publishedAt: draft.publishedAt.trim(),
    readTime: draft.readTime.trim(),
    tags: draft.tagsText
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    relatedProductSlugs: draft.relatedProductSlugs.filter((slug) =>
      products.some((product) => product.slug === slug),
    ),
    content: draft.content
      .filter(blockFilled)
      .map((block) => {
        if (block.type === "list") {
          return {
            ...block,
            items: block.items.map((item) => item.trim()).filter(Boolean),
            isActive: block.isActive !== false,
          };
        }
        if (block.type === "callout") {
          return {
            ...block,
            title: block.title.trim(),
            text: block.text.trim(),
            isActive: block.isActive !== false,
          };
        }
        return { ...block, text: block.text.trim(), isActive: block.isActive !== false };
      }),
  };
}

const FIELD_ID: Record<PostFieldKey, string> = {
  title: "title",
  slug: "slug",
  category: "category",
  excerpt: "excerpt",
  cover: "cover",
  coverAlt: "alt",
  seoTitle: "seo-title",
  seoDescription: "seo-description",
  author: "author",
  authorRole: "role",
  publishedAt: "date",
  readTime: "read",
  tags: "tags",
  related: "related",
  body: "body",
};

/** The control a block's message is tied to (and where focus goes when it is the first invalid). */
function blockInputId(formId: string, block: BlogBlock) {
  if (block.type === "list") return `${formId}-list-${block.id}`;
  if (block.type === "callout") {
    return block.text.trim().length > POST_LIMITS.blockText
      ? `${formId}-callout-text-${block.id}`
      : `${formId}-callout-title-${block.id}`;
  }
  return `${formId}-text-${block.id}`;
}

function PostForm({
  post,
  posts,
  categories,
  isNew,
  onClose,
  onSave,
  onRemove,
  onReloadCategories,
}: {
  post: BlogPostRecord;
  posts: BlogPostRecord[];
  categories: BlogCategories | null;
  isNew: boolean;
  onClose: () => void;
  onSave: (draft: Draft) => Promise<void>;
  onRemove?: () => Promise<void>;
  onReloadCategories: () => void;
}) {
  const initial = draftFrom(post);
  const [rawDraft, setDraft] = useState(initial);
  const [baseline] = useState(initial);
  const [errors, setErrors] = useState<PostErrors>(NO_ERRORS);
  const [announce, setAnnounce] = useState("");
  const [focusRequest, setFocusRequest] = useState<{ target: InvalidTarget; n: number } | null>(
    null,
  );
  const [saving, setSaving] = useState(false);
  const formId = useId();

  // A new post defaults to the first category until the editor picks one.
  const firstCategory = isNew ? categories?.items[0]?.id : undefined;
  const draft =
    firstCategory && !rawDraft.categoryId ? { ...rawDraft, categoryId: firstCategory } : rawDraft;

  // After a failed save, move to the first invalid control once its error has rendered.
  useEffect(() => {
    if (!focusRequest) return;
    const { target } = focusRequest;
    const block = "block" in target ? draft.content.find((item) => item.id === target.block) : null;
    const id =
      "field" in target
        ? `${formId}-${FIELD_ID[target.field]}`
        : block
          ? blockInputId(formId, block)
          : "";
    const element = id ? document.getElementById(id) : null;
    element?.focus({ preventScroll: true });
    element?.scrollIntoView({ block: "center" });
    // Only a new request moves focus, not every keystroke after it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusRequest]);

  function fail(next: PostErrors) {
    setErrors(next);
    const target = firstInvalid(
      next,
      draft.content.map((block) => block.id),
    );
    const count = errorCount(next);
    setAnnounce(
      count > 0
        ? `The article was not saved. ${count} ${count === 1 ? "field needs" : "fields need"} attention.`
        : "",
    );
    if (target) setFocusRequest((current) => ({ target, n: (current?.n ?? 0) + 1 }));
  }

  /** An edit to one field clears that field's message (and any form-level one), nothing else. */
  function edit(key: PostFieldKey | null, next: Partial<Draft>) {
    setDraft((current) => ({ ...current, ...next }));
    setErrors((current) => {
      if (!current.form && !(key && current.fields[key])) return current;
      const fields = { ...current.fields };
      if (key) delete fields[key];
      return { ...current, fields, form: "" };
    });
    setAnnounce("");
  }

  async function save() {
    if (saving) return;
    const found = validatePost(
      { ...draft, relatedCount: draft.relatedProductSlugs.length },
      {
        takenSlugs: posts.filter((item) => item.id !== draft.id).map((item) => item.slug),
        hasCategories: (categories?.items.length ?? 0) > 0,
      },
    );
    if (errorCount(found) > 0) {
      fail(found);
      return;
    }
    setErrors(NO_ERRORS);
    setAnnounce("");
    setSaving(true);
    let uploading = false;
    try {
      let ready = draft;
      // A chosen file is only a browser preview (blob:). Upload it first, then keep the stored
      // path in the draft so a failed save does not upload the same file again.
      if (draft.coverImage.trim().startsWith("blob:")) {
        uploading = true;
        const url = await uploadBlogCover(draft.coverImage.trim());
        uploading = false;
        ready = { ...draft, coverImage: url, coverNeedsUpload: false };
        setDraft((current) => ({ ...current, coverImage: url, coverNeedsUpload: false }));
      }
      await onSave(ready);
    } catch (caught) {
      setSaving(false);
      fail(describeFailure(caught, uploading, draft.content));
    }
  }

  function patchBlock(id: string, next: BlogBlock) {
    setDraft((current) => ({
      ...current,
      content: current.content.map((block) => (block.id === id ? next : block)),
    }));
    setErrors((current) => {
      if (!current.form && !current.blocks[id]) return current;
      const blocks = { ...current.blocks };
      delete blocks[id];
      return { ...current, blocks, form: "" };
    });
    setAnnounce("");
  }

  function dropBlockError(id: string) {
    setErrors((current) => {
      const blocks = { ...current.blocks };
      delete blocks[id];
      const fields = { ...current.fields };
      delete fields.body;
      return { ...current, blocks, fields };
    });
  }

  const categoryOptions = categories?.items.slice() ?? [];
  if (draft.categoryId && !categoryOptions.some((item) => item.id === draft.categoryId)) {
    categoryOptions.unshift({
      id: draft.categoryId,
      label: "Unknown category",
      isActive: true,
    });
  }
  const f = (key: PostFieldKey) => `${formId}-${FIELD_ID[key]}`;
  const field = errors.fields;

  return (
    <FormCloseGuard baseline={baseline} value={draft} onClose={onClose}>
      <BlogModal
        titleId="blog-post-modal-title"
        title={isNew ? "Add post" : "Edit post"}
        description="Cover, details, and the article body."
        size="lg"
        saving={saving}
        saveLabel={isNew ? "Add post" : "Save changes"}
        formError={errors.form}
        announce={announce}
        onClose={onClose}
        onSave={save}
      >
        <ActiveStatusField
          checked={draft.isActive}
          onChange={(isActive) => edit("cover", { isActive })}
        />
        <Labeled
          id={f("title")}
          label="Title"
          required
          value={draft.title}
          error={field.title}
          onChange={(title) => edit("title", { title })}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Labeled
            id={f("slug")}
            label="Slug"
            required
            value={draft.slug}
            placeholder="power-bank-guide"
            error={field.slug}
            onChange={(slug) => edit("slug", { slug })}
          />
          <div>
            <FieldLabel htmlFor={f("category")}>Category *</FieldLabel>
            <select
              id={f("category")}
              value={draft.categoryId}
              aria-invalid={field.category ? true : undefined}
              aria-describedby={field.category ? `${f("category")}-error` : undefined}
              onChange={(event) => edit("category", { categoryId: event.target.value })}
              className={cn(adminFieldClass, field.category && "border-red-600")}
            >
              {categoryOptions.length === 0 ? (
                <option value="">
                  {categories === null ? "Loading categories…" : "Add a category first"}
                </option>
              ) : (
                categoryOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label || "Untitled"}
                  </option>
                ))
              )}
            </select>
            <InlineError id={`${f("category")}-error`} message={field.category} />
            {categories !== null && categoryOptions.length === 0 ? (
              <p className="mt-1.5 flex flex-wrap items-center gap-x-3 text-xs text-neutral-600">
                <a
                  href="/admin/pages/blogs/categories"
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-primary underline"
                >
                  Add a category (opens in a new tab)
                </a>
                <button
                  type="button"
                  onClick={onReloadCategories}
                  className="font-medium text-neutral-800 underline"
                >
                  Reload categories
                </button>
              </p>
            ) : null}
          </div>
        </div>
        <Labeled
          id={f("excerpt")}
          label="Excerpt"
          value={draft.excerpt}
          multiline
          error={field.excerpt}
          onChange={(excerpt) => edit("excerpt", { excerpt })}
        />
        {draft.coverNeedsUpload && !draft.coverImage ? (
          <p
            data-testid="cover-legacy-warning"
            className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900 ring-1 ring-amber-200"
          >
            This article&apos;s saved cover can no longer be shown (it was never uploaded). Choose
            the photo again, or save the article hidden and add it later.
          </p>
        ) : null}
        <ImageField
          label="Cover photo"
          variant="thumb"
          inputId={f("cover")}
          error={field.cover}
          value={adminCoverSrc(draft.coverImage)}
          onChange={(coverImage) => edit("cover", { coverImage })}
        />
        <Labeled
          id={f("coverAlt")}
          label="Cover description"
          value={draft.coverAlt}
          error={field.coverAlt}
          onChange={(coverAlt) => edit("coverAlt", { coverAlt })}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Labeled
            id={f("seoTitle")}
            label="SEO title (optional, max 70)"
            value={draft.seoTitle}
            maxLength={70}
            placeholder={draft.title}
            error={field.seoTitle}
            onChange={(seoTitle) => edit("seoTitle", { seoTitle })}
          />
          <Labeled
            id={f("seoDescription")}
            label="SEO description (optional, max 200)"
            value={draft.seoDescription}
            maxLength={200}
            placeholder={draft.excerpt}
            error={field.seoDescription}
            onChange={(seoDescription) => edit("seoDescription", { seoDescription })}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Labeled
            id={f("author")}
            label="Author"
            value={draft.author}
            error={field.author}
            onChange={(author) => edit("author", { author })}
          />
          <Labeled
            id={f("authorRole")}
            label="Author role"
            value={draft.authorRole}
            error={field.authorRole}
            onChange={(authorRole) => edit("authorRole", { authorRole })}
          />
          <Labeled
            id={f("publishedAt")}
            label="Date"
            value={draft.publishedAt}
            placeholder="3 Oct 2026"
            error={field.publishedAt}
            onChange={(publishedAt) => edit("publishedAt", { publishedAt })}
          />
          <Labeled
            id={f("readTime")}
            label="Read time"
            value={draft.readTime}
            placeholder="4 min"
            error={field.readTime}
            onChange={(readTime) => edit("readTime", { readTime })}
          />
        </div>
        <div>
          <Labeled
            id={f("tags")}
            label="Tags"
            value={draft.tagsText}
            placeholder="guide, gadget"
            error={field.tags}
            onChange={(tagsText) => edit("tags", { tagsText })}
          />
          <p className="mt-1.5 text-sm text-neutral-500">Separate tags with commas.</p>
        </div>
        <section className="border-t border-neutral-100 pt-5">
          <h3 id={`${f("related")}-heading`} className="text-sm font-semibold text-neutral-950">
            Mentioned products
          </h3>
          <ul
            id={f("related")}
            tabIndex={-1}
            aria-labelledby={`${f("related")}-heading`}
            aria-describedby={field.related ? `${f("related")}-error` : undefined}
            className="mt-3 max-h-48 space-y-1 overflow-y-auto rounded-2xl bg-admin-canvas p-2"
          >
            {products.map((product) => {
              const checked = draft.relatedProductSlugs.includes(product.slug);
              return (
                <li key={product.slug}>
                  <label className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm text-neutral-800 hover:bg-white">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        edit("related", {
                          relatedProductSlugs: checked
                            ? draft.relatedProductSlugs.filter((slug) => slug !== product.slug)
                            : [...draft.relatedProductSlugs, product.slug],
                        })
                      }
                    />
                    <span className="min-w-0 truncate">{product.title}</span>
                  </label>
                </li>
              );
            })}
          </ul>
          <InlineError id={`${f("related")}-error`} message={field.related} />
        </section>
        <section className="space-y-3 border-t border-neutral-100 pt-5">
          <h3 className="text-sm font-semibold text-neutral-950">Body</h3>
          {draft.content.length === 0 ? (
            <p className="rounded-2xl bg-admin-canvas px-4 py-8 text-center text-sm text-neutral-500">
              No blocks yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {draft.content.map((block, index) => (
                <li key={block.id} className="rounded-2xl bg-admin-canvas p-3">
                  <ItemToolbar
                    index={index}
                    total={draft.content.length}
                    noun="Block"
                    onMove={(direction) =>
                      setDraft((current) => ({
                        ...current,
                        content: moveList(current.content, index, direction),
                      }))
                    }
                    onRemove={() => {
                      setDraft((current) => ({
                        ...current,
                        content: current.content.filter((item) => item.id !== block.id),
                      }));
                      dropBlockError(block.id);
                    }}
                  />
                  <FieldLabel htmlFor={`${formId}-type-${block.id}`}>Type</FieldLabel>
                  <select
                    id={`${formId}-type-${block.id}`}
                    value={block.type === "callout" ? block.variant : block.type}
                    onChange={(event) =>
                      patchBlock(
                        block.id,
                        retarget(block, event.target.value as BlockKind),
                      )
                    }
                    className={adminFieldClass}
                  >
                    <option value="paragraph">Paragraph</option>
                    <option value="heading">Heading</option>
                    <option value="list">List</option>
                    <option value="tip">Tip</option>
                    <option value="note">Note</option>
                  </select>
                  <div className="mt-3">
                    <BlockFields
                      formId={formId}
                      block={block}
                      error={errors.blocks[block.id]}
                      onChange={(next) => patchBlock(block.id, next)}
                    />
                  </div>
                  <VisibilitySwitch
                    checked={block.isActive !== false}
                    label={
                      block.isActive !== false
                        ? `Hide block ${index + 1}`
                        : `Show block ${index + 1}`
                    }
                    onChange={(isActive) => patchBlock(block.id, { ...block, isActive })}
                  />
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            id={f("body")}
            aria-describedby={field.body ? `${f("body")}-error` : undefined}
            onClick={() => {
              edit("body", { content: [...draft.content, blankBlogBlock()] });
            }}
            className={adminButtonClass.secondary}
          >
            <MaterialIcon name="add" className="text-[18px]" />
            Add block
          </button>
          <InlineError id={`${f("body")}-error`} message={field.body} />
        </section>
        {onRemove ? (
          <button
            type="button"
            onClick={() => {
              void onRemove?.().catch((error: unknown) => {
                setErrors({
                  ...NO_ERRORS,
                  form: error instanceof Error ? error.message : "Could not remove the article.",
                });
              });
            }}
            className="text-sm font-medium text-red-600 hover:underline"
          >
            Remove post
          </button>
        ) : null}
      </BlogModal>
    </FormCloseGuard>
  );
}

/** Turns whatever a failed save threw into messages on the right fields. */
function describeFailure(caught: unknown, uploading: boolean, content: BlogBlock[]): PostErrors {
  if (caught instanceof BlogApiError) {
    // status 0: never reached the API. 401/5xx: nothing to do with a single field.
    if (caught.status === 0 || caught.status === 401 || caught.status >= 500) {
      return { ...NO_ERRORS, form: caught.message };
    }
    if (uploading) return { ...NO_ERRORS, fields: { cover: caught.message } };
    return errorsFromApi(
      caught.status,
      caught.message,
      caught.details,
      content.map((block) => block.id),
    );
  }
  if (caught instanceof MartApiError) {
    return uploading
      ? { ...NO_ERRORS, fields: { cover: caught.message } }
      : { ...NO_ERRORS, form: caught.message };
  }
  return {
    ...NO_ERRORS,
    form: uploading
      ? "Could not upload the cover photo. Check your connection and try again."
      : "Could not save the article. Check your connection and try again.",
  };
}

type BlockKind = "paragraph" | "heading" | "list" | "tip" | "note";

function retarget(block: BlogBlock, kind: BlockKind): BlogBlock {
  const text =
    block.type === "list"
      ? block.items.join("\n")
      : block.type === "callout"
        ? block.text
        : block.text;
  const active = block.isActive !== false;
  if (kind === "list") {
    return { id: block.id, type: "list", items: text ? text.split("\n") : [""], isActive: active };
  }
  if (kind === "tip" || kind === "note") {
    return {
      id: block.id,
      type: "callout",
      title: block.type === "callout" ? block.title : "",
      text,
      variant: kind === "note" ? "note" : "tip",
      isActive: active,
    };
  }
  return { id: block.id, type: kind, text, isActive: active };
}

function BlockFields({
  formId,
  block,
  error,
  onChange,
}: {
  formId: string;
  block: BlogBlock;
  error?: string;
  onChange: (block: BlogBlock) => void;
}) {
  if (block.type === "list") {
    return (
      <Labeled
        id={`${formId}-list-${block.id}`}
        label="Items"
        required
        value={block.items.join("\n")}
        placeholder="One item on each line"
        multiline
        error={error}
        onChange={(value) => onChange({ ...block, items: value.split("\n") })}
      />
    );
  }
  if (block.type === "callout") {
    const onText = block.text.trim().length > POST_LIMITS.blockText;
    return (
      <div className="space-y-3">
        <Labeled
          id={`${formId}-callout-title-${block.id}`}
          label="Title"
          required
          value={block.title}
          error={onText ? undefined : error}
          onChange={(title) => onChange({ ...block, title })}
        />
        <Labeled
          id={`${formId}-callout-text-${block.id}`}
          label="Text"
          value={block.text}
          multiline
          error={onText ? error : undefined}
          onChange={(text) => onChange({ ...block, text })}
        />
      </div>
    );
  }
  return (
    <Labeled
      id={`${formId}-text-${block.id}`}
      label={block.type === "heading" ? "Heading" : "Paragraph"}
      required
      value={block.text}
      multiline={block.type === "paragraph"}
      error={error}
      onChange={(text) => onChange({ ...block, text })}
    />
  );
}

function IconButton({
  label,
  icon,
  onClick,
  disabled,
}: {
  label: string;
  icon: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-9 place-items-center rounded-full text-neutral-500 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-30"
    >
      <MaterialIcon name={icon} className="text-[18px]" />
    </button>
  );
}
