"use client";

import { useSearchParams } from "next/navigation";
import { useId, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import {
  readContactSections,
  saveContactSections,
  type ContactHeroContent,
} from "@/lib/mart-mock/contact-sections";
import { useContactSections } from "@/lib/mart-mock/hooks";
import { cn } from "@/lib/utils";

import {
  ActiveStatusField,
  adminFieldClass,
  FieldError,
  FieldLabel,
} from "../../../_components/admin-ui";
import { FormCloseGuard } from "../../../_components/form-close-guard";
import {
  ContactCard,
  ContactHeader,
  ContactModal,
  setContactQuery,
  useContactNav,
  useReturnFocus,
} from "./contact-shared";

type Draft = {
  isActive: boolean;
  eyebrow: string;
  title: string;
  subtitle: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
};

function draftFrom(hero: ContactHeroContent): Draft {
  return {
    isActive: hero.isActive !== false,
    eyebrow: hero.eyebrow,
    title: hero.title,
    subtitle: hero.subtitle,
    primaryLabel: hero.primaryCta.label,
    primaryHref: hero.primaryCta.href,
    secondaryLabel: hero.secondaryCta.label,
    secondaryHref: hero.secondaryCta.href,
  };
}

export function ContactHeroEditor() {
  const { hero } = useContactSections();
  const params = useSearchParams();
  const { pathname, router } = useContactNav();
  const editing = params.has("edit");
  const [notice, setNotice] = useState("");
  const { focusEdit, markReturn } = useReturnFocus(editing);
  const empty =
    !hero.eyebrow.trim() &&
    !hero.title.trim() &&
    !hero.subtitle.trim() &&
    !hero.primaryCta.label.trim() &&
    !hero.secondaryCta.label.trim();

  function setEditing(open: boolean) {
    if (!open) markReturn();
    setContactQuery(router, pathname, open, "hero");
  }

  function save(draft: Draft) {
    const doc = readContactSections();
    saveContactSections({
      ...doc,
      hero: {
        isActive: draft.isActive,
        eyebrow: draft.eyebrow.trim(),
        title: draft.title.trim(),
        subtitle: draft.subtitle.trim(),
        primaryCta: {
          label: draft.primaryLabel.trim(),
          href: draft.primaryHref.trim(),
        },
        secondaryCta: {
          label: draft.secondaryLabel.trim(),
          href: draft.secondaryHref.trim(),
        },
      },
    });
    setNotice("Saved.");
    window.setTimeout(() => setNotice(""), 1600);
    setEditing(false);
  }

  return (
    <div className="min-w-0 space-y-4">
      <ContactHeader
        sectionId="hero"
        title="Hero"
        description="Opening copy and buttons."
        editLabel="Edit hero"
        onEdit={() => setEditing(true)}
        editRef={focusEdit}
      />
      {notice ? (
        <p role="status" className="text-sm font-medium text-emerald-800">
          {notice} This section is up to date.
        </p>
      ) : null}
      <ContactCard
        headingId="contact-hero-card"
        title="Hero"
        description={
          hero.isActive === false
            ? "Hidden on the contact page."
            : "Shown at the top of the contact page."
        }
        active={hero.isActive !== false}
        empty={empty}
        emptyTitle="No hero content yet"
        emptyBody="Add the heading and buttons for the top of the contact page."
      >
        <HeroPreview hero={hero} />
      </ContactCard>
      {editing ? (
        <HeroForm hero={hero} onClose={() => setEditing(false)} onSave={save} />
      ) : null}
    </div>
  );
}

function HeroPreview({ hero }: { hero: ContactHeroContent }) {
  return (
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
      <div className="mt-5 flex flex-col items-center justify-center gap-2 sm:flex-row">
        {hero.primaryCta.label.trim() ? (
          <span className="inline-flex h-10 items-center gap-1.5 rounded-full bg-primary px-5 text-sm font-semibold text-on-primary">
            {hero.primaryCta.label}
            <MaterialIcon name="chat" className="text-[18px]" />
          </span>
        ) : null}
        {hero.secondaryCta.label.trim() ? (
          <span className="inline-flex h-10 items-center rounded-full border border-white/20 px-5 text-sm font-semibold text-white">
            {hero.secondaryCta.label}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function HeroForm({
  hero,
  onClose,
  onSave,
}: {
  hero: ContactHeroContent;
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
      <ContactModal
        titleId="contact-hero-drawer-title"
        title="Edit hero"
        description="Update the banner at the top of the contact page."
        saving={saving}
        onClose={onClose}
        onSave={save}
      >
        <ActiveStatusField
          checked={draft.isActive}
          onChange={(isActive) => setDraft({ ...draft, isActive })}
        />
        <section aria-labelledby={`${formId}-content`}>
          <h3
            id={`${formId}-content`}
            className="text-sm font-semibold text-neutral-950"
          >
            Content
          </h3>
          <div className="mt-3 grid gap-3">
            <Field
              id={`${formId}-eyebrow`}
              label="Eyebrow"
              value={draft.eyebrow}
              placeholder="Short line above the title"
              onChange={(eyebrow) => setDraft({ ...draft, eyebrow })}
            />
            <div>
              <FieldLabel htmlFor={`${formId}-title`}>
                Title <span className="text-red-700">*</span>
              </FieldLabel>
              <input
                id={`${formId}-title`}
                autoFocus
                value={draft.title}
                placeholder="The main line on the contact page"
                aria-invalid={titleError ? true : undefined}
                onChange={(event) => {
                  setDraft({ ...draft, title: event.target.value });
                  setTitleError("");
                }}
                className={cn(adminFieldClass, titleError && "border-red-400")}
              />
              {titleError ? <FieldError message={titleError} /> : null}
            </div>
            <Area
              id={`${formId}-subtitle`}
              label="Subtitle"
              value={draft.subtitle}
              rows={3}
              placeholder="A short line under the title"
              onChange={(subtitle) => setDraft({ ...draft, subtitle })}
            />
          </div>
        </section>
        <section
          className="border-t border-neutral-100 pt-5"
          aria-labelledby={`${formId}-buttons`}
        >
          <h3
            id={`${formId}-buttons`}
            className="text-sm font-semibold text-neutral-950"
          >
            Buttons
          </h3>
          <p className="mt-1 text-sm text-neutral-500">
            The filled button is first. The outline button is second. Leave a
            label empty to hide that button.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field
              id={`${formId}-primary-label`}
              label="Primary button label"
              value={draft.primaryLabel}
              placeholder="WhatsApp"
              onChange={(primaryLabel) => setDraft({ ...draft, primaryLabel })}
            />
            <Field
              id={`${formId}-primary-link`}
              label="Primary button link"
              value={draft.primaryHref}
              placeholder="https://wa.me/..."
              onChange={(primaryHref) => setDraft({ ...draft, primaryHref })}
            />
            <Field
              id={`${formId}-secondary-label`}
              label="Secondary button label"
              value={draft.secondaryLabel}
              placeholder="Call"
              onChange={(secondaryLabel) =>
                setDraft({ ...draft, secondaryLabel })
              }
            />
            <Field
              id={`${formId}-secondary-link`}
              label="Secondary button link"
              value={draft.secondaryHref}
              placeholder="tel:+880..."
              onChange={(secondaryHref) =>
                setDraft({ ...draft, secondaryHref })
              }
            />
          </div>
        </section>
      </ContactModal>
    </FormCloseGuard>
  );
}

function Field({
  id,
  label,
  value,
  placeholder,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <input
        id={id}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={adminFieldClass}
      />
    </div>
  );
}

function Area({
  id,
  label,
  value,
  rows,
  placeholder,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  rows: number;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <textarea
        id={id}
        value={value}
        rows={rows}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={cn(adminFieldClass, "h-auto py-3")}
      />
    </div>
  );
}
