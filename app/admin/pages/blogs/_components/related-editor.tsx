"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useId, useState } from "react";

import {
  blogRelatedHasCopy,
  getBlogRelated,
  saveBlogRelated,
  type BlogRelated,
} from "@/lib/mart-api/blog-related";

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

function draftFrom(related: BlogRelated): Draft {
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
  const [related, setRelated] = useState<BlogRelated | null>(null);
  const [loadError, setLoadError] = useState("");
  const params = useSearchParams();
  const { pathname, router } = useBlogNav();
  const editing = params.get("edit") === "related";
  const [notice, setNotice] = useState("");
  const { focusEdit, markReturn } = useReturnFocus(editing);

  useEffect(() => {
    let active = true;
    getBlogRelated()
      .then((next) => {
        if (active) setRelated(next);
      })
      .catch((error: unknown) => {
        if (active) {
          setLoadError(error instanceof Error ? error.message : "Could not load the related labels.");
        }
      });
    return () => {
      active = false;
    };
  }, []);

  function setEditing(open: boolean) {
    if (!open) markReturn();
    setBlogQuery(router, pathname, "edit", open ? "related" : null);
  }

  async function save(draft: Draft) {
    const saved = await saveBlogRelated({
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
    });
    setRelated(saved);
    setNotice("Saved.");
    window.setTimeout(() => setNotice(""), 1600);
    setEditing(false);
  }

  if (!related) {
    return (
      <div className="min-w-0 space-y-4">
        <BlogHeader
          sectionId="related"
          title="Related"
          description="Contents, mentioned products, and more to read."
          editLabel="Edit related"
          onEdit={() => setEditing(true)}
          editRef={focusEdit}
        />
        <p className="text-sm text-neutral-600">{loadError || "Loading the related labels…"}</p>
      </div>
    );
  }

  const blank = !blogRelatedHasCopy(related);

  return (
    <div className="min-w-0 space-y-4">
      <BlogHeader
        sectionId="related"
        title="Related"
        description="Contents, mentioned products, and more to read."
        editLabel="Edit related"
        onEdit={() => setEditing(true)}
        editRef={focusEdit}
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
            : blank
              ? "No related labels yet."
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
  related: BlogRelated;
  onClose: () => void;
  onSave: (draft: Draft) => void | Promise<void>;
}) {
  const initial = draftFrom(related);
  const [draft, setDraft] = useState(initial);
  const [baseline] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const formId = useId();

  async function save() {
    if (saving) return;
    setSaving(true);
    setSaveError("");
    try {
      await onSave(draft);
    } catch (caught) {
      setSaving(false);
      setSaveError(caught instanceof Error ? caught.message : "Could not save the related labels.");
    }
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
        {saveError ? <p className="text-sm text-red-700">{saveError}</p> : null}
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
