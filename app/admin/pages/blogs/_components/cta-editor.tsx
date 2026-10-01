"use client";

import { useSearchParams } from "next/navigation";
import { useId, useState } from "react";

import {
  readBlogSections,
  saveBlogSections,
  type BlogCtaContent,
} from "@/lib/mart-mock/blog-sections";
import { useBlogSections } from "@/lib/mart-mock/hooks";

import { ActiveStatusField } from "../../../_components/admin-ui";
import { FormCloseGuard } from "../../../_components/form-close-guard";
import {
  BlogCard,
  BlogHeader,
  BlogModal,
  FormError,
  Labeled,
  setBlogQuery,
  useBlogNav,
  useReturnFocus,
} from "./blog-shared";

type Draft = {
  isActive: boolean;
  title: string;
  subtitle: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
};

function draftFrom(cta: BlogCtaContent): Draft {
  return {
    isActive: cta.isActive !== false,
    title: cta.title,
    subtitle: cta.subtitle,
    primaryLabel: cta.primaryLabel,
    primaryHref: cta.primaryHref,
    secondaryLabel: cta.secondaryLabel,
    secondaryHref: cta.secondaryHref,
  };
}

export function BlogCtaEditor() {
  const { cta } = useBlogSections();
  const params = useSearchParams();
  const { pathname, router } = useBlogNav();
  const editing = params.get("edit") === "cta";
  const [notice, setNotice] = useState("");
  const { focusEdit, markReturn } = useReturnFocus(editing);
  const empty = !cta.title.trim() && !cta.subtitle.trim();

  function setEditing(open: boolean) {
    if (!open) markReturn();
    setBlogQuery(router, pathname, "edit", open ? "cta" : null);
  }

  function save(draft: Draft) {
    const doc = readBlogSections();
    saveBlogSections({
      ...doc,
      cta: {
        isActive: draft.isActive,
        title: draft.title.trim(),
        subtitle: draft.subtitle.trim(),
        primaryLabel: draft.primaryLabel.trim(),
        primaryHref: draft.primaryHref.trim(),
        secondaryLabel: draft.secondaryLabel.trim(),
        secondaryHref: draft.secondaryHref.trim(),
      },
    });
    setNotice("Saved.");
    window.setTimeout(() => setNotice(""), 1600);
    setEditing(false);
  }

  return (
    <div className="min-w-0 space-y-4">
      <BlogHeader
        sectionId="cta"
        title="CTA"
        description="Closing banner on each article."
        editLabel="Edit CTA"
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
        headingId="blog-cta-card"
        title="CTA"
        description={
          cta.isActive === false
            ? "Hidden at the end of every article."
            : "Shown at the end of every article."
        }
        active={cta.isActive !== false}
        empty={empty}
        emptyTitle="No CTA yet"
        emptyBody="Add the closing banner for the article page."
      >
        <div className="relative overflow-hidden rounded-2xl bg-[linear-gradient(100deg,#071820_0%,#070c14_46%,#05060a_100%)] px-4 py-8 sm:px-8">
          <p className="text-lg font-semibold text-white">{cta.title.trim() || "Title"}</p>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-white/70">
            {cta.subtitle.trim() || "Subtitle"}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {cta.primaryLabel.trim() ? (
              <span className="inline-flex h-10 items-center rounded-full bg-primary px-5 text-sm font-semibold text-on-primary">
                {cta.primaryLabel}
              </span>
            ) : null}
            {cta.secondaryLabel.trim() ? (
              <span className="inline-flex h-10 items-center rounded-full border border-white/20 px-5 text-sm font-semibold text-white">
                {cta.secondaryLabel}
              </span>
            ) : null}
          </div>
        </div>
      </BlogCard>
      {editing ? <CtaForm cta={cta} onClose={() => setEditing(false)} onSave={save} /> : null}
    </div>
  );
}

function CtaForm({
  cta,
  onClose,
  onSave,
}: {
  cta: BlogCtaContent;
  onClose: () => void;
  onSave: (draft: Draft) => void;
}) {
  const initial = draftFrom(cta);
  const [draft, setDraft] = useState(initial);
  const [baseline] = useState(initial);
  const [titleError, setTitleError] = useState("");
  const [saving, setSaving] = useState(false);
  const formId = useId();

  function save() {
    if (saving) return;
    if (!draft.title.trim()) {
      setTitleError("Title is required.");
      return;
    }
    setSaving(true);
    onSave(draft);
  }

  return (
    <FormCloseGuard baseline={baseline} value={draft} onClose={onClose}>
      <BlogModal
        titleId="blog-cta-modal-title"
        title="Edit CTA"
        description="The same banner closes every article."
        saving={saving}
        onClose={onClose}
        onSave={save}
      >
        <ActiveStatusField
          checked={draft.isActive}
          onChange={(isActive) => setDraft({ ...draft, isActive })}
        />
        <div>
          <Labeled
            id={`${formId}-title`}
            label="Title"
            required
            value={draft.title}
            invalid={Boolean(titleError)}
            onChange={(title) => {
              setDraft({ ...draft, title });
              setTitleError("");
            }}
          />
          <FormError message={titleError} />
        </div>
        <Labeled
          id={`${formId}-subtitle`}
          label="Subtitle"
          value={draft.subtitle}
          multiline
          onChange={(subtitle) => setDraft({ ...draft, subtitle })}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Labeled
            id={`${formId}-primary-label`}
            label="Primary button label"
            value={draft.primaryLabel}
            onChange={(primaryLabel) => setDraft({ ...draft, primaryLabel })}
          />
          <Labeled
            id={`${formId}-primary-href`}
            label="Primary button link"
            value={draft.primaryHref}
            placeholder="/products"
            onChange={(primaryHref) => setDraft({ ...draft, primaryHref })}
          />
          <Labeled
            id={`${formId}-secondary-label`}
            label="Secondary button label"
            value={draft.secondaryLabel}
            onChange={(secondaryLabel) => setDraft({ ...draft, secondaryLabel })}
          />
          <Labeled
            id={`${formId}-secondary-href`}
            label="Secondary button link"
            value={draft.secondaryHref}
            placeholder="https://wa.me/..."
            onChange={(secondaryHref) => setDraft({ ...draft, secondaryHref })}
          />
        </div>
        <p className="text-sm text-neutral-500">Leave a label empty to hide that button.</p>
      </BlogModal>
    </FormCloseGuard>
  );
}
