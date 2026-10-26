"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useId, useState } from "react";

import { BlogImage } from "@/app/(client)/blogs/_components/blog-image";
import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import { products } from "@/app/(client)/_data/products/products";
import { adminCoverSrc } from "@/lib/blog-view";
import {
  blogCategoryLabel,
  getBlogCategories,
  type BlogCategories,
} from "@/lib/mart-api/blog-categories";
import {
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
  isBlogSlug,
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
  FormError,
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

function blockFilled(block: BlogBlock) {
  if (block.type === "list") return block.items.some((item) => item.trim());
  if (block.type === "callout") return Boolean(block.title.trim() || block.text.trim());
  return Boolean(block.text.trim());
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
    getBlogCategories()
      .then((next) => {
        if (active) setCategories(next);
      })
      .catch(() => {
        if (active) setCategories({ isActive: true, items: [] });
      });
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

function PostForm({
  post,
  posts,
  categories,
  isNew,
  onClose,
  onSave,
  onRemove,
}: {
  post: BlogPostRecord;
  posts: BlogPostRecord[];
  categories: BlogCategories | null;
  isNew: boolean;
  onClose: () => void;
  onSave: (draft: Draft) => Promise<void>;
  onRemove?: () => Promise<void>;
}) {
  const initial = draftFrom(post);
  const [rawDraft, setDraft] = useState(initial);
  const [baseline] = useState(initial);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const formId = useId();

  // A new post defaults to the first category until the editor picks one.
  const firstCategory = isNew ? categories?.items[0]?.id : undefined;
  const draft =
    firstCategory && !rawDraft.categoryId ? { ...rawDraft, categoryId: firstCategory } : rawDraft;

  async function save() {
    if (saving) return;
    const slug = draft.slug.trim().toLowerCase();
    if (!draft.title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!slug || !isBlogSlug(slug)) {
      setError("Slug needs lowercase English letters, numbers, and hyphens.");
      return;
    }
    if (posts.some((item) => item.id !== draft.id && item.slug === slug)) {
      setError("Another article already uses this slug.");
      return;
    }
    if (!draft.categoryId) {
      setError("Choose a category.");
      return;
    }
    if (draft.isActive && !draft.coverImage.trim()) {
      setError("Add a cover photo before publishing, or switch this article to hidden.");
      return;
    }
    if (draft.content.some((block) => !blockFilled(block))) {
      setError("Fill in every block, or remove the empty ones.");
      return;
    }
    setSaving(true);
    try {
      let ready = draft;
      // A chosen file is only a browser preview (blob:). Upload it first, then keep the stored
      // path in the draft so a failed save does not upload the same file again.
      if (draft.coverImage.trim().startsWith("blob:")) {
        const url = await uploadBlogCover(draft.coverImage.trim());
        ready = { ...draft, coverImage: url, coverNeedsUpload: false };
        setDraft((current) => ({ ...current, coverImage: url, coverNeedsUpload: false }));
      }
      await onSave(ready);
    } catch (error) {
      setSaving(false);
      setError(error instanceof MartApiError ? error.message : "Could not save the article.");
    }
  }

  function patchBlock(id: string, next: BlogBlock) {
    setDraft((current) => ({
      ...current,
      content: current.content.map((block) => (block.id === id ? next : block)),
    }));
    setError("");
  }

  const categoryOptions = categories?.items.slice() ?? [];
  if (draft.categoryId && !categoryOptions.some((item) => item.id === draft.categoryId)) {
    categoryOptions.unshift({
      id: draft.categoryId,
      label: "Unknown category",
      isActive: true,
    });
  }

  return (
    <FormCloseGuard baseline={baseline} value={draft} onClose={onClose}>
      <BlogModal
        titleId="blog-post-modal-title"
        title={isNew ? "Add post" : "Edit post"}
        description="Cover, details, and the article body."
        size="lg"
        saving={saving}
        saveLabel={isNew ? "Add post" : "Save changes"}
        onClose={onClose}
        onSave={save}
      >
        <ActiveStatusField
          checked={draft.isActive}
          onChange={(isActive) => setDraft({ ...draft, isActive })}
        />
        <Labeled
          id={`${formId}-title`}
          label="Title"
          required
          value={draft.title}
          onChange={(title) => {
            setDraft({ ...draft, title });
            setError("");
          }}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Labeled
            id={`${formId}-slug`}
            label="Slug"
            required
            value={draft.slug}
            placeholder="power-bank-guide"
            onChange={(slug) => {
              setDraft({ ...draft, slug });
              setError("");
            }}
          />
          <div>
            <FieldLabel htmlFor={`${formId}-category`}>Category *</FieldLabel>
            <select
              id={`${formId}-category`}
              value={draft.categoryId}
              onChange={(event) => setDraft({ ...draft, categoryId: event.target.value })}
              className={adminFieldClass}
            >
              {categoryOptions.length === 0 ? (
                <option value="">Add a category first</option>
              ) : (
                categoryOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label || "Untitled"}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
        <Labeled
          id={`${formId}-excerpt`}
          label="Excerpt"
          value={draft.excerpt}
          multiline
          onChange={(excerpt) => setDraft({ ...draft, excerpt })}
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
          value={adminCoverSrc(draft.coverImage)}
          onChange={(coverImage) => {
            setDraft({ ...draft, coverImage });
            setError("");
          }}
        />
        <Labeled
          id={`${formId}-alt`}
          label="Cover description"
          value={draft.coverAlt}
          onChange={(coverAlt) => setDraft({ ...draft, coverAlt })}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Labeled
            id={`${formId}-seo-title`}
            label="SEO title (optional, max 70)"
            value={draft.seoTitle}
            maxLength={70}
            placeholder={draft.title}
            onChange={(seoTitle) => setDraft({ ...draft, seoTitle })}
          />
          <Labeled
            id={`${formId}-seo-description`}
            label="SEO description (optional, max 200)"
            value={draft.seoDescription}
            maxLength={200}
            placeholder={draft.excerpt}
            onChange={(seoDescription) => setDraft({ ...draft, seoDescription })}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Labeled
            id={`${formId}-author`}
            label="Author"
            value={draft.author}
            onChange={(author) => setDraft({ ...draft, author })}
          />
          <Labeled
            id={`${formId}-role`}
            label="Author role"
            value={draft.authorRole}
            onChange={(authorRole) => setDraft({ ...draft, authorRole })}
          />
          <Labeled
            id={`${formId}-date`}
            label="Date"
            value={draft.publishedAt}
            placeholder="3 Oct 2026"
            onChange={(publishedAt) => setDraft({ ...draft, publishedAt })}
          />
          <Labeled
            id={`${formId}-read`}
            label="Read time"
            value={draft.readTime}
            placeholder="4 min"
            onChange={(readTime) => setDraft({ ...draft, readTime })}
          />
        </div>
        <Labeled
          id={`${formId}-tags`}
          label="Tags"
          value={draft.tagsText}
          placeholder="guide, gadget"
          onChange={(tagsText) => setDraft({ ...draft, tagsText })}
        />
        <p className="-mt-4 text-sm text-neutral-500">Separate tags with commas.</p>
        <section className="border-t border-neutral-100 pt-5">
          <h3 className="text-sm font-semibold text-neutral-950">Mentioned products</h3>
          <ul className="mt-3 max-h-48 space-y-1 overflow-y-auto rounded-2xl bg-admin-canvas p-2">
            {products.map((product) => {
              const checked = draft.relatedProductSlugs.includes(product.slug);
              return (
                <li key={product.slug}>
                  <label className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm text-neutral-800 hover:bg-white">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setDraft((current) => ({
                          ...current,
                          relatedProductSlugs: checked
                            ? current.relatedProductSlugs.filter((slug) => slug !== product.slug)
                            : [...current.relatedProductSlugs, product.slug],
                        }))
                      }
                    />
                    <span className="min-w-0 truncate">{product.title}</span>
                  </label>
                </li>
              );
            })}
          </ul>
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
                    onRemove={() =>
                      setDraft((current) => ({
                        ...current,
                        content: current.content.filter((item) => item.id !== block.id),
                      }))
                    }
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
            onClick={() =>
              setDraft((current) => ({
                ...current,
                content: [...current.content, blankBlogBlock()],
              }))
            }
            className={adminButtonClass.secondary}
          >
            <MaterialIcon name="add" className="text-[18px]" />
            Add block
          </button>
        </section>
        <FormError message={error} />
        {onRemove ? (
          <button
            type="button"
            onClick={() => {
              void onRemove?.().catch((error: unknown) => {
                setError(error instanceof Error ? error.message : "Could not remove the article.");
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
  onChange,
}: {
  formId: string;
  block: BlogBlock;
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
        onChange={(value) => onChange({ ...block, items: value.split("\n") })}
      />
    );
  }
  if (block.type === "callout") {
    return (
      <div className="space-y-3">
        <Labeled
          id={`${formId}-callout-title-${block.id}`}
          label="Title"
          required
          value={block.title}
          onChange={(title) => onChange({ ...block, title })}
        />
        <Labeled
          id={`${formId}-callout-text-${block.id}`}
          label="Text"
          value={block.text}
          multiline
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
