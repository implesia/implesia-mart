"use client";

import { useSearchParams } from "next/navigation";
import { useId, useState } from "react";

import {
  readBlogSections,
  saveBlogSections,
  type BlogHeroContent,
} from "@/lib/mart-mock/blog-sections";
import { useBlogSections } from "@/lib/mart-mock/hooks";
import { isContentActive } from "@/lib/mart-mock/visibility";

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
  eyebrow: string;
  title: string;
  subtitle: string;
  countLabel: string;
};

function draftFrom(hero: BlogHeroContent): Draft {
  return {
    isActive: hero.isActive !== false,
    eyebrow: hero.eyebrow,
    title: hero.title,
    subtitle: hero.subtitle,
    countLabel: hero.countLabel,
  };
}

export function BlogHeroEditor() {
  const { hero, posts } = useBlogSections();
  const params = useSearchParams();
  const { pathname, router } = useBlogNav();
  const editing = params.get("edit") === "hero";
  const [notice, setNotice] = useState("");
  const { focusEdit, markReturn } = useReturnFocus(editing);
  const count = posts.filter(isContentActive).length;
  const empty = !hero.eyebrow.trim() && !hero.title.trim() && !hero.subtitle.trim();

  function setEditing(open: boolean) {
    if (!open) markReturn();
    setBlogQuery(router, pathname, "edit", open ? "hero" : null);
  }

  function save(draft: Draft) {
    const doc = readBlogSections();
    saveBlogSections({
      ...doc,
      hero: {
        isActive: draft.isActive,
        eyebrow: draft.eyebrow.trim(),
        title: draft.title.trim(),
        subtitle: draft.subtitle.trim(),
        countLabel: draft.countLabel.trim(),
      },
    });
    setNotice("Saved.");
    window.setTimeout(() => setNotice(""), 1600);
    setEditing(false);
  }

  return (
    <div className="min-w-0 space-y-4">
      <BlogHeader
        sectionId="hero"
        title="Hero"
        description="Opening copy and article count."
        editLabel="Edit hero"
        onEdit={() => setEditing(true)}
        editRef={focusEdit}
      />
      {notice ? (
        <p role="status" className="text-sm font-medium text-emerald-800">
          {notice} This section is up to date.
        </p>
      ) : null}
      <BlogCard
        headingId="blog-hero-card"
        title="Hero"
        description={
          hero.isActive === false
            ? "Hidden on the blog list."
            : "Shown at the top of the blog list."
        }
        active={hero.isActive !== false}
        empty={empty}
        emptyTitle="No hero content yet"
        emptyBody="Add the heading for the top of the blog list."
      >
        <div className="relative overflow-hidden rounded-2xl bg-[linear-gradient(100deg,#071820_0%,#070c14_46%,#05060a_100%)] px-4 py-8 text-center sm:px-8">
          <p className="text-xs font-medium tracking-wide text-primary uppercase">
            {hero.eyebrow.trim() || "Eyebrow"}
          </p>
          <p className="mt-2 text-xl font-semibold text-white">
            {hero.title.trim() || "Title"}
          </p>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-white/70">
            {hero.subtitle.trim() || "Subtitle"}
          </p>
          <p className="mt-4 text-sm text-white/80">
            <span className="text-2xl font-semibold text-white">{count}</span>{" "}
            {hero.countLabel.trim() || "Articles"}
          </p>
        </div>
      </BlogCard>
      {editing ? (
        <HeroForm hero={hero} onClose={() => setEditing(false)} onSave={save} />
      ) : null}
    </div>
  );
}

function HeroForm({
  hero,
  onClose,
  onSave,
}: {
  hero: BlogHeroContent;
  onClose: () => void;
  onSave: (draft: Draft) => void;
}) {
  const initial = draftFrom(hero);
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
        titleId="blog-hero-modal-title"
        title="Edit hero"
        description="Update the banner at the top of the blog list."
        saving={saving}
        onClose={onClose}
        onSave={save}
      >
        <ActiveStatusField
          checked={draft.isActive}
          onChange={(isActive) => setDraft({ ...draft, isActive })}
        />
        <Labeled
          id={`${formId}-eyebrow`}
          label="Eyebrow"
          value={draft.eyebrow}
          placeholder="Short line above the title"
          onChange={(eyebrow) => setDraft({ ...draft, eyebrow })}
        />
        <div>
          <Labeled
            id={`${formId}-title`}
            label="Title"
            required
            value={draft.title}
            placeholder="The main line on the blog list"
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
          placeholder="A short line under the title"
          multiline
          onChange={(subtitle) => setDraft({ ...draft, subtitle })}
        />
        <Labeled
          id={`${formId}-count`}
          label="Count label"
          value={draft.countLabel}
          placeholder="আর্টিকেল"
          onChange={(countLabel) => setDraft({ ...draft, countLabel })}
        />
        <p className="text-sm text-neutral-500">
          The number is the count of active articles. Leave the label empty to show only the number.
        </p>
      </BlogModal>
    </FormCloseGuard>
  );
}
