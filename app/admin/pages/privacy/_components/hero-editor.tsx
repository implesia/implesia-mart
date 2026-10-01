"use client";

import { useSearchParams } from "next/navigation";
import { useId, useState } from "react";

import {
  readPrivacySections,
  savePrivacySections,
  type PrivacyHeroContent,
} from "@/lib/mart-mock/privacy-sections";
import { usePrivacySections } from "@/lib/mart-mock/hooks";

import { ActiveStatusField } from "../../../_components/admin-ui";
import { FormCloseGuard } from "../../../_components/form-close-guard";
import {
  FormError,
  Labeled,
  PrivacyHeader,
  PrivacyModal,
  PrivacyPanel,
  setPrivacyQuery,
  usePrivacyNav,
  useReturnFocus,
} from "./privacy-shared";

type Draft = {
  isActive: boolean;
  eyebrow: string;
  title: string;
  subtitle: string;
  updatedLabel: string;
  lastUpdated: string;
};

function draftFrom(hero: PrivacyHeroContent): Draft {
  return {
    isActive: hero.isActive !== false,
    eyebrow: hero.eyebrow,
    title: hero.title,
    subtitle: hero.subtitle,
    updatedLabel: hero.updatedLabel,
    lastUpdated: hero.lastUpdated,
  };
}

export function PrivacyHeroEditor() {
  const { hero } = usePrivacySections();
  const params = useSearchParams();
  const { pathname, router } = usePrivacyNav();
  const editing = params.get("edit") === "hero";
  const [notice, setNotice] = useState("");
  const { focusEdit, markReturn } = useReturnFocus(editing);
  const updated = [hero.updatedLabel.trim(), hero.lastUpdated.trim()]
    .filter(Boolean)
    .join(" ");

  function setEditing(open: boolean) {
    if (!open) markReturn();
    setPrivacyQuery(router, pathname, open, "hero");
  }

  function save(draft: Draft) {
    const doc = readPrivacySections();
    savePrivacySections({
      ...doc,
      hero: {
        isActive: draft.isActive,
        eyebrow: draft.eyebrow.trim(),
        title: draft.title.trim(),
        subtitle: draft.subtitle.trim(),
        updatedLabel: draft.updatedLabel.trim(),
        lastUpdated: draft.lastUpdated.trim(),
      },
    });
    setNotice("Saved.");
    window.setTimeout(() => setNotice(""), 1600);
    setEditing(false);
  }

  return (
    <div className="min-w-0 space-y-4">
      <PrivacyHeader
        sectionId="hero"
        title="Hero"
        description="Opening copy and last-updated date."
        editLabel="Edit hero"
        onEdit={() => setEditing(true)}
        editRef={focusEdit}
      />
      {notice ? (
        <p role="status" className="text-sm font-medium text-emerald-800">
          {notice} This section is up to date.
        </p>
      ) : null}
      <PrivacyPanel
        headingId="privacy-hero-card"
        title="Hero"
        description={
          hero.isActive === false
            ? "Hidden on the privacy page."
            : "Shown at the top of the privacy page."
        }
        active={hero.isActive !== false}
      >
        <div className="relative overflow-hidden rounded-2xl bg-[linear-gradient(100deg,#071820_0%,#070c14_46%,#05060a_100%)] px-4 py-8 text-center sm:px-8">
          <p className="text-xs font-medium tracking-wide text-primary uppercase">
            {hero.eyebrow.trim() || "Eyebrow"}
          </p>
          <p className="mt-2 text-xl font-semibold text-white">
            {hero.title.trim() || "Title"}
          </p>
          <p className="mx-auto mt-2 max-w-lg text-sm text-white/70">
            {hero.subtitle.trim() || "Subtitle"}
          </p>
          {updated ? (
            <p className="mt-3 text-xs text-white/50">{updated}</p>
          ) : null}
        </div>
      </PrivacyPanel>
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
  hero: PrivacyHeroContent;
  onClose: () => void;
  onSave: (draft: Draft) => void;
}) {
  const initial = draftFrom(hero);
  const [draft, setDraft] = useState(initial);
  const [baseline] = useState(initial);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const formId = useId();

  function save() {
    if (saving) return;
    if (!draft.title.trim()) {
      setError("Title is required.");
      return;
    }
    setSaving(true);
    onSave(draft);
  }

  return (
    <FormCloseGuard baseline={baseline} value={draft} onClose={onClose}>
      <PrivacyModal
        titleId="privacy-hero-modal"
        title="Edit hero"
        description="Leave the date empty to hide the update line."
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
          onChange={(eyebrow) => setDraft({ ...draft, eyebrow })}
        />
        <Labeled
          id={`${formId}-title`}
          label="Title"
          required
          value={draft.title}
          invalid={Boolean(error)}
          onChange={(title) => {
            setDraft({ ...draft, title });
            setError("");
          }}
        />
        <Labeled
          id={`${formId}-subtitle`}
          label="Subtitle"
          value={draft.subtitle}
          multiline
          onChange={(subtitle) => setDraft({ ...draft, subtitle })}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Labeled
            id={`${formId}-label`}
            label="Update label"
            value={draft.updatedLabel}
            onChange={(updatedLabel) => setDraft({ ...draft, updatedLabel })}
          />
          <Labeled
            id={`${formId}-date`}
            label="Last updated"
            value={draft.lastUpdated}
            onChange={(lastUpdated) => setDraft({ ...draft, lastUpdated })}
          />
        </div>
        <FormError message={error} />
      </PrivacyModal>
    </FormCloseGuard>
  );
}
