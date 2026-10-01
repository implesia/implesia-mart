"use client";

import { useSearchParams } from "next/navigation";
import { useId, useState } from "react";

import {
  readBlogSections,
  saveBlogSections,
  type BlogRelatedContent,
} from "@/lib/mart-mock/blog-sections";
import { useBlogSections } from "@/lib/mart-mock/hooks";

import { ActiveStatusField } from "../../../_components/admin-ui";
import { FormCloseGuard } from "../../../_components/form-close-guard";
import {
  BlogCard,
  BlogHeader,
  BlogModal,
  Labeled,
  setBlogQuery,
  useBlogNav,
  useReturnFocus,
} from "./blog-shared";

type Draft = {
  isActive: boolean;
  tocTitle: string;
  productsTitle: string;
  productsSubtitle: string;
  postsTitle: string;
  postsSubtitle: string;
  postsLinkLabel: string;
  comingSoonLabel: string;
  viewLabel: string;
  detailsLabel: string;
};

function draftFrom(related: BlogRelatedContent): Draft {
  return {
    isActive: related.isActive !== false,
    tocTitle: related.tocTitle,
    productsTitle: related.productsTitle,
    productsSubtitle: related.productsSubtitle,
    postsTitle: related.postsTitle,
    postsSubtitle: related.postsSubtitle,
    postsLinkLabel: related.postsLinkLabel,
    comingSoonLabel: related.comingSoonLabel,
    viewLabel: related.viewLabel,
    detailsLabel: related.detailsLabel,
  };
}

export function BlogRelatedEditor() {
  const { related } = useBlogSections();
  const params = useSearchParams();
  const { pathname, router } = useBlogNav();
  const editing = params.get("edit") === "related";
  const [notice, setNotice] = useState("");
  const { focusEdit, markReturn } = useReturnFocus(editing);

  function setEditing(open: boolean) {
    if (!open) markReturn();
    setBlogQuery(router, pathname, "edit", open ? "related" : null);
  }

  function save(draft: Draft) {
    const doc = readBlogSections();
    saveBlogSections({
      ...doc,
      related: {
        isActive: draft.isActive,
        tocTitle: draft.tocTitle.trim(),
        productsTitle: draft.productsTitle.trim(),
        productsSubtitle: draft.productsSubtitle.trim(),
        postsTitle: draft.postsTitle.trim(),
        postsSubtitle: draft.postsSubtitle.trim(),
        postsLinkLabel: draft.postsLinkLabel.trim(),
        comingSoonLabel: draft.comingSoonLabel.trim(),
        viewLabel: draft.viewLabel.trim(),
        detailsLabel: draft.detailsLabel.trim(),
      },
    });
    setNotice("Saved.");
    window.setTimeout(() => setNotice(""), 1600);
    setEditing(false);
  }

  return (
    <div className="min-w-0 space-y-4">
      <BlogHeader
        sectionId="related"
        title="Related"
        description="Contents, mentioned products, and more to read."
        editLabel="Edit related"
        onEdit={() => setEditing(true)}
        editRef={focusEdit}
        viewHref="/blogs/sothik-power-bank-bachai-korar-upay"
      />
      {notice ? (
        <p role="status" className="text-sm font-medium text-emerald-800">
          {notice} This section is up to date.
        </p>
      ) : null}
      <BlogCard
        headingId="blog-related-card"
        title="Related"
        description={
          related.isActive === false
            ? "Hidden on the article page."
            : "The contents list, mentioned products, and more articles."
        }
        active={related.isActive !== false}
      >
        <div className="space-y-4 rounded-2xl bg-white p-4 ring-1 ring-neutral-200">
          <Block label="Contents" title={related.tocTitle} />
          <Block
            label="Products"
            title={related.productsTitle}
            subtitle={related.productsSubtitle}
            extra={[
              related.comingSoonLabel,
              related.viewLabel,
              related.detailsLabel,
            ]
              .filter(Boolean)
              .join(" · ")}
          />
          <Block
            label="More to read"
            title={related.postsTitle}
            subtitle={related.postsSubtitle}
            extra={related.postsLinkLabel}
          />
        </div>
      </BlogCard>
      {editing ? (
        <RelatedForm
          related={related}
          onClose={() => setEditing(false)}
          onSave={save}
        />
      ) : null}
    </div>
  );
}

function Block({
  label,
  title,
  subtitle,
  extra,
}: {
  label: string;
  title: string;
  subtitle?: string;
  extra?: string;
}) {
  return (
    <div>
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="text-sm font-semibold text-neutral-950">
        {title.trim() || "—"}
      </p>
      {subtitle?.trim() ? (
        <p className="text-sm text-neutral-600">{subtitle}</p>
      ) : null}
      {extra?.trim() ? (
        <p className="mt-1 text-xs text-neutral-500">{extra}</p>
      ) : null}
    </div>
  );
}

function RelatedForm({
  related,
  onClose,
  onSave,
}: {
  related: BlogRelatedContent;
  onClose: () => void;
  onSave: (draft: Draft) => void;
}) {
  const initial = draftFrom(related);
  const [draft, setDraft] = useState(initial);
  const [baseline] = useState(initial);
  const [saving, setSaving] = useState(false);
  const formId = useId();

  function save() {
    if (saving) return;
    setSaving(true);
    onSave(draft);
  }

  return (
    <FormCloseGuard baseline={baseline} value={draft} onClose={onClose}>
      <BlogModal
        titleId="blog-related-modal-title"
        title="Edit related"
        description="Labels around an article. The products and articles themselves come from each post."
        size="lg"
        saving={saving}
        onClose={onClose}
        onSave={save}
      >
        <ActiveStatusField
          checked={draft.isActive}
          onChange={(isActive) => setDraft({ ...draft, isActive })}
        />
        <p className="text-sm text-neutral-500">
          Turning this off hides the contents list, the mentioned products, and
          more articles.
        </p>
        <Labeled
          id={`${formId}-toc`}
          label="Contents title"
          value={draft.tocTitle}
          onChange={(tocTitle) => setDraft({ ...draft, tocTitle })}
        />
        <section className="space-y-3 border-t border-neutral-100 pt-5">
          <h3 className="text-sm font-semibold text-neutral-950">
            Mentioned products
          </h3>
          <Labeled
            id={`${formId}-products-title`}
            label="Title"
            value={draft.productsTitle}
            onChange={(productsTitle) => setDraft({ ...draft, productsTitle })}
          />
          <Labeled
            id={`${formId}-products-subtitle`}
            label="Subtitle"
            value={draft.productsSubtitle}
            multiline
            onChange={(productsSubtitle) =>
              setDraft({ ...draft, productsSubtitle })
            }
          />
          <div className="grid gap-3 sm:grid-cols-3">
            <Labeled
              id={`${formId}-soon`}
              label="Coming soon"
              value={draft.comingSoonLabel}
              onChange={(comingSoonLabel) =>
                setDraft({ ...draft, comingSoonLabel })
              }
            />
            <Labeled
              id={`${formId}-view`}
              label="In stock"
              value={draft.viewLabel}
              onChange={(viewLabel) => setDraft({ ...draft, viewLabel })}
            />
            <Labeled
              id={`${formId}-details`}
              label="Coming soon button"
              value={draft.detailsLabel}
              onChange={(detailsLabel) => setDraft({ ...draft, detailsLabel })}
            />
          </div>
        </section>
        <section className="space-y-3 border-t border-neutral-100 pt-5">
          <h3 className="text-sm font-semibold text-neutral-950">
            More to read
          </h3>
          <Labeled
            id={`${formId}-posts-title`}
            label="Title"
            value={draft.postsTitle}
            onChange={(postsTitle) => setDraft({ ...draft, postsTitle })}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Labeled
              id={`${formId}-posts-subtitle`}
              label="Subtitle"
              value={draft.postsSubtitle}
              onChange={(postsSubtitle) =>
                setDraft({ ...draft, postsSubtitle })
              }
            />
            <Labeled
              id={`${formId}-posts-link`}
              label="All articles link"
              value={draft.postsLinkLabel}
              onChange={(postsLinkLabel) =>
                setDraft({ ...draft, postsLinkLabel })
              }
            />
          </div>
        </section>
      </BlogModal>
    </FormCloseGuard>
  );
}
