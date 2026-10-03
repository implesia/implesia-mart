"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useId, useState } from "react";

import { getFaqHelp, saveFaqHelp, type FaqHelp } from "@/lib/mart-api/faq-help";

import { ActiveStatusField } from "../../../_components/admin-ui";
import { FormCloseGuard } from "../../../_components/form-close-guard";
import {
  FaqCard,
  FaqHeader,
  FaqModal,
  FormError,
  Labeled,
  setFaqQuery,
  useFaqNav,
  useReturnFocus,
} from "./faq-shared";

type Draft = {
  isActive: boolean;
  title: string;
  subtitle: string;
  email: string;
  phone: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
};

function draftFrom(help: FaqHelp): Draft {
  return {
    isActive: help.isActive !== false,
    title: help.title,
    subtitle: help.subtitle,
    email: help.email,
    phone: help.phone,
    primaryLabel: help.primaryLabel,
    primaryHref: help.primaryHref,
    secondaryLabel: help.secondaryLabel,
    secondaryHref: help.secondaryHref,
  };
}

export function FaqHelpEditor() {
  const [help, setHelp] = useState<FaqHelp | null>(null);
  const [loadError, setLoadError] = useState("");
  const params = useSearchParams();
  const { pathname, router } = useFaqNav();
  const editing = params.get("edit") === "help";
  const [notice, setNotice] = useState("");
  const { focusEdit, markReturn } = useReturnFocus(editing);

  useEffect(() => {
    let active = true;
    getFaqHelp()
      .then((next) => {
        if (active) setHelp(next);
      })
      .catch((error: unknown) => {
        if (active) {
          setLoadError(error instanceof Error ? error.message : "Could not load the help banner.");
        }
      });
    return () => {
      active = false;
    };
  }, []);

  function setEditing(open: boolean) {
    if (!open) markReturn();
    setFaqQuery(router, pathname, "edit", open ? "help" : null);
  }

  async function save(draft: Draft) {
    const saved = await saveFaqHelp({
      isActive: draft.isActive,
      title: draft.title.trim(),
      subtitle: draft.subtitle.trim(),
      email: draft.email.trim(),
      phone: draft.phone.trim(),
      primaryLabel: draft.primaryLabel.trim(),
      primaryHref: draft.primaryHref.trim(),
      secondaryLabel: draft.secondaryLabel.trim(),
      secondaryHref: draft.secondaryHref.trim(),
    });
    setHelp(saved);
    setNotice("Saved.");
    window.setTimeout(() => setNotice(""), 1600);
    setEditing(false);
  }

  if (!help) {
    return (
      <div className="min-w-0 space-y-4">
        <FaqHeader
          sectionId="help"
          title="Help"
          description="Closing contact banner."
          editLabel="Edit help"
          onEdit={() => setEditing(true)}
          editRef={focusEdit}
        />
        <p className="text-sm text-neutral-600">{loadError || "Loading the help banner…"}</p>
      </div>
    );
  }

  const empty = !help.title.trim() && !help.subtitle.trim();

  return (
    <div className="min-w-0 space-y-4">
      <FaqHeader
        sectionId="help"
        title="Help"
        description="Closing contact banner."
        editLabel="Edit help"
        onEdit={() => setEditing(true)}
        editRef={focusEdit}
      />
      {notice ? (
        <p role="status" className="text-sm font-medium text-emerald-800">
          {notice} This section is up to date.
        </p>
      ) : null}
      <FaqCard
        headingId="faq-help-card"
        title="Help"
        description={
          help.isActive === false
            ? "Hidden at the bottom of the FAQ page."
            : "Shown under the questions."
        }
        active={help.isActive !== false}
        empty={empty}
        emptyTitle="No help banner yet"
        emptyBody="Add the closing contact banner."
      >
        <div className="relative overflow-hidden rounded-2xl bg-[linear-gradient(100deg,#071820_0%,#070c14_46%,#05060a_100%)] px-4 py-8 sm:px-8">
          <p className="text-lg font-semibold text-white">{help.title.trim() || "Title"}</p>
          <p className="mt-2 max-w-lg text-sm text-white/70">{help.subtitle}</p>
          <p className="mt-3 text-sm text-white/60">
            {[help.email, help.phone].filter(Boolean).join(" · ")}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {help.primaryLabel.trim() ? (
              <span className="inline-flex h-10 items-center rounded-full bg-primary px-5 text-sm font-semibold text-on-primary">
                {help.primaryLabel}
              </span>
            ) : null}
            {help.secondaryLabel.trim() ? (
              <span className="inline-flex h-10 items-center rounded-full border border-white/20 px-5 text-sm font-semibold text-white">
                {help.secondaryLabel}
              </span>
            ) : null}
          </div>
        </div>
      </FaqCard>
      {editing ? <HelpForm help={help} onClose={() => setEditing(false)} onSave={save} /> : null}
    </div>
  );
}

function HelpForm({
  help,
  onClose,
  onSave,
}: {
  help: FaqHelp;
  onClose: () => void;
  onSave: (draft: Draft) => void | Promise<void>;
}) {
  const initial = draftFrom(help);
  const [draft, setDraft] = useState(initial);
  const [baseline] = useState(initial);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const formId = useId();

  async function save() {
    if (saving) return;
    if (!draft.title.trim()) {
      setError("Title is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave(draft);
    } catch (caught) {
      setSaving(false);
      setError(caught instanceof Error ? caught.message : "Could not save the help banner.");
    }
  }

  return (
    <FormCloseGuard baseline={baseline} value={draft} onClose={onClose}>
      <FaqModal
        titleId="faq-help-modal-title"
        title="Edit help"
        description="The banner under the questions. Leave a button label empty to hide that button."
        saving={saving}
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
            id={`${formId}-email`}
            label="Email"
            value={draft.email}
            onChange={(email) => setDraft({ ...draft, email })}
          />
          <Labeled
            id={`${formId}-phone`}
            label="Phone"
            value={draft.phone}
            onChange={(phone) => setDraft({ ...draft, phone })}
          />
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
            placeholder="/contact-us"
            onChange={(primaryHref) => setDraft({ ...draft, primaryHref })}
          />
          <Labeled
            id={`${formId}-secondary-label`}
            label="WhatsApp label"
            value={draft.secondaryLabel}
            onChange={(secondaryLabel) => setDraft({ ...draft, secondaryLabel })}
          />
          <Labeled
            id={`${formId}-secondary-href`}
            label="WhatsApp link"
            value={draft.secondaryHref}
            placeholder="https://wa.me/..."
            onChange={(secondaryHref) => setDraft({ ...draft, secondaryHref })}
          />
        </div>
        <FormError message={error} />
      </FaqModal>
    </FormCloseGuard>
  );
}
