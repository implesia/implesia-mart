"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useId, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import { products } from "@/app/(client)/_data/products/products";
import {
  blankBlogBlock,
  blankBlogPost,
  categoryLabel,
  isBlogSlug,
  moveList,
  readBlogSections,
  saveBlogSections,
  type BlogBlock,
  type BlogPostRecord,
} from "@/lib/mart-mock/blog-sections";
import { useBlogSections } from "@/lib/mart-mock/hooks";
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
  const sections = useBlogSections();
  const { posts, categories } = sections;
  const params = useSearchParams();
  const { pathname, router } = useBlogNav();
  const postParam = params.get("post");
  const editing = postParam !== null;
  const [notice, setNotice] = useState("");
  const { focusEdit, markReturn } = useReturnFocus(editing);
  const existing = posts.find((post) => post.id === postParam) ?? null;

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

  function save(draft: Draft) {
    const doc = readBlogSections();
    const next = cleanPost(draft);
    const postsNext = doc.posts.some((post) => post.id === next.id)
      ? doc.posts.map((post) => (post.id === next.id ? next : post))
      : [...doc.posts, next];
    saveBlogSections({ ...doc, posts: postsNext });
    setNotice("Saved.");
    window.setTimeout(() => setNotice(""), 1600);
    close();
  }

  function remove(id: string) {
    const doc = readBlogSections();
    saveBlogSections({ ...doc, posts: doc.posts.filter((post) => post.id !== id) });
    setNotice("Removed.");
    window.setTimeout(() => setNotice(""), 1600);
    close();
  }

  function move(index: number, direction: -1 | 1) {
    const doc = readBlogSections();
    saveBlogSections({ ...doc, posts: moveList(doc.posts, index, direction) });
  }

  const formPost =
    postParam === "new"
      ? blankBlogPost(categories.items[0]?.id ?? "")
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
      {posts.length === 0 ? (
        <div className="rounded-2xl bg-white px-4 py-12 text-center ring-1 ring-neutral-200/90">
          <p className="text-sm font-semibold text-neutral-950">No articles yet</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-neutral-500">
            Add the first guide. It shows on the blog list when it is active.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {posts.map((post, index) => {
            const label = categoryLabel(sections, post.categoryId);
            return (
              <li
                key={post.id}
                className={cn(
                  "flex flex-col gap-3 rounded-2xl bg-white p-3 ring-1 ring-neutral-200/90 sm:flex-row sm:items-center",
                  post.isActive === false && "opacity-60",
                )}
              >
                <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-lg bg-admin-canvas sm:w-28">
                  {post.coverImage ? (
                    <Image
                      src={post.coverImage}
                      alt=""
                      fill
                      sizes="112px"
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-neutral-950">
                      {post.title || "Untitled"}
                    </p>
                    <VisibilityBadge active={post.isActive !== false} />
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
          isNew={postParam === "new"}
          onClose={close}
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
  isNew,
  onClose,
  onSave,
  onRemove,
}: {
  post: BlogPostRecord;
  isNew: boolean;
  onClose: () => void;
  onSave: (draft: Draft) => void;
  onRemove?: () => void;
}) {
  const { categories, posts } = useBlogSections();
  const initial = draftFrom(post);
  const [draft, setDraft] = useState(initial);
  const [baseline] = useState(initial);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const formId = useId();

  function save() {
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
    if (!draft.coverImage.trim()) {
      setError("Cover photo is required.");
      return;
    }
    if (draft.content.some((block) => !blockFilled(block))) {
      setError("Fill in every block, or remove the empty ones.");
      return;
    }
    setSaving(true);
    onSave(draft);
  }

  function patchBlock(id: string, next: BlogBlock) {
    setDraft((current) => ({
      ...current,
      content: current.content.map((block) => (block.id === id ? next : block)),
    }));
    setError("");
  }

  const categoryOptions = categories.items.slice();
  if (draft.categoryId && !categoryOptions.some((item) => item.id === draft.categoryId)) {
    categoryOptions.unshift({ id: draft.categoryId, label: "Unknown category" });
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
            placeholder="sothik-power-bank-bachai-korar-upay"
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
        <ImageField
          label="Cover photo"
          variant="thumb"
          value={draft.coverImage}
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
            placeholder="১৮ জুলাই, ২০২৬"
            onChange={(publishedAt) => setDraft({ ...draft, publishedAt })}
          />
          <Labeled
            id={`${formId}-read`}
            label="Read time"
            value={draft.readTime}
            placeholder="৬ মিনিট"
            onChange={(readTime) => setDraft({ ...draft, readTime })}
          />
        </div>
        <Labeled
          id={`${formId}-tags`}
          label="Tags"
          value={draft.tagsText}
          placeholder="পাওয়ার ব্যাংক, গ্যাজেট"
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
            onClick={onRemove}
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
