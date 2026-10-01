"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import {
  readSustainabilitySections,
  saveSustainabilitySections,
  type SustainHero,
  type SustainMedia,
} from "@/lib/mart-mock/sustainability-sections";
import { useSustainabilitySections } from "@/lib/mart-mock/hooks";
import { cn } from "@/lib/utils";

import { AdminFormModal } from "../../../_components/admin-form-modal";
import {
  adminButtonClass,
  adminFieldClass,
  FieldError,
  FieldLabel,
} from "../../../_components/admin-ui";
import { FormCloseGuard } from "../../../_components/form-close-guard";
import { ImageField } from "../../../_components/image-field";
import { replaceSearch, SustainHeader, useSustainNav } from "./sustain-shared";

type HeroDraft = {
  eyebrow: string;
  title: string;
  subtitle: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  primaryImage: SustainMedia;
  secondaryImage: SustainMedia;
};

function draftFromHero(hero: SustainHero): HeroDraft {
  return {
    eyebrow: hero.eyebrow,
    title: hero.title,
    subtitle: hero.subtitle,
    primaryLabel: hero.primaryCta.label,
    primaryHref: hero.primaryCta.href,
    secondaryLabel: hero.secondaryCta.label,
    secondaryHref: hero.secondaryCta.href,
    primaryImage: { ...hero.primaryImage },
    secondaryImage: { ...hero.secondaryImage },
  };
}

export function SustainabilityHeroEditor() {
  const { hero } = useSustainabilitySections();
  const params = useSearchParams();
  const { pathname, router } = useSustainNav();
  const editing = params.has("edit") || params.has("photo");
  const [notice, setNotice] = useState("");
  const focusEdit = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef(false);

  useEffect(() => {
    if (editing || !returnFocus.current) return;
    returnFocus.current = false;
    focusEdit.current?.focus();
  }, [editing]);

  function setEditing(open: boolean) {
    if (!open) returnFocus.current = true;
    replaceSearch(router, pathname, (next) => {
      if (open) next.set("edit", "hero");
      else {
        next.delete("edit");
        next.delete("photo");
      }
    });
  }

  function save(draft: HeroDraft) {
    const doc = readSustainabilitySections();
    saveSustainabilitySections({
      ...doc,
      hero: {
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
        primaryImage: {
          src: draft.primaryImage.src,
          alt: draft.primaryImage.alt.trim(),
        },
        secondaryImage: {
          src: draft.secondaryImage.src,
          alt: draft.secondaryImage.alt.trim(),
        },
      },
    });
    setNotice("Saved.");
    window.setTimeout(() => setNotice(""), 1600);
    setEditing(false);
  }

  return (
    <div className="min-w-0 space-y-4">
      <SustainHeader
        sectionId="hero"
        title="Hero"
        description="The banner at the top of the sustainability page."
        extra={
          <button
            ref={focusEdit}
            type="button"
            onClick={() => setEditing(true)}
            className={adminButtonClass.primary}
          >
            <MaterialIcon name="edit" className="text-[18px]" />
            Edit hero
          </button>
        }
      />

      {notice ? (
        <p role="status" className="text-sm font-medium text-emerald-800">
          {notice} The sustainability banner is up to date.
        </p>
      ) : null}

      <section
        className="overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200/90"
        aria-labelledby="sustain-hero-card-heading"
      >
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-neutral-100 px-4 py-3 sm:px-5">
          <div>
            <h2
              id="sustain-hero-card-heading"
              className="text-sm font-semibold text-neutral-950"
            >
              Hero content
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              Shown at the top of the sustainability page. Words on the left,
              two photos on the right.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className={adminButtonClass.secondary}
          >
            Edit
          </button>
        </div>
        {hero.title.trim() || hero.subtitle.trim() ? (
          <div className="bg-admin-canvas p-4 sm:p-5">
            <HeroPreview hero={hero} />
          </div>
        ) : (
          <div className="px-4 py-12 text-center">
            <p className="text-sm font-semibold text-neutral-950">
              No hero content yet
            </p>
            <p className="mx-auto mt-1 max-w-md text-sm text-neutral-500">
              Add the heading, buttons, and photos for the sustainability
              banner.
            </p>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className={cn(adminButtonClass.primary, "mt-4")}
            >
              <MaterialIcon name="edit" className="text-[18px]" />
              Edit hero
            </button>
          </div>
        )}
      </section>

      {editing ? (
        <HeroFormModal
          hero={hero}
          onClose={() => setEditing(false)}
          onSave={save}
        />
      ) : null}
    </div>
  );
}

function HeroPreview({ hero }: { hero: SustainHero }) {
  const photos = [
    { key: "primary", image: hero.primaryImage, label: "Left photo" },
    { key: "secondary", image: hero.secondaryImage, label: "Right photo" },
  ];

  return (
    <div className="grid overflow-hidden rounded-2xl bg-[linear-gradient(100deg,#071820_0%,#070c14_46%,#05060a_100%)] lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
      <div className="px-5 py-6 sm:px-7 sm:py-7">
        <p className="text-xs font-medium text-primary">
          {hero.eyebrow.trim() || "Eyebrow"}
        </p>
        <p className="mt-2 text-xl leading-snug font-semibold text-white sm:text-2xl">
          {hero.title.trim() || "Title"}
        </p>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/70">
          {hero.subtitle.trim() || "Subtitle"}
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {hero.primaryCta.label.trim() ? (
            <span className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-primary px-4 text-sm font-semibold text-white">
              {hero.primaryCta.label}
              <MaterialIcon name="arrow_forward" className="text-[18px]" />
            </span>
          ) : null}
          {hero.secondaryCta.label.trim() ? (
            <span className="inline-flex h-9 items-center justify-center rounded-full px-4 text-sm font-semibold text-white ring-1 ring-white/25">
              {hero.secondaryCta.label}
            </span>
          ) : null}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 p-4 sm:p-5">
        {photos.map((photo) => (
          <div
            key={photo.key}
            className="relative aspect-square overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10"
          >
            {photo.image.src ? (
              <Image
                src={photo.image.src}
                alt={photo.image.alt}
                fill
                sizes="180px"
                className="object-cover"
              />
            ) : (
              <span className="grid size-full place-items-center px-2 text-center text-xs text-white/60">
                {photo.label}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function HeroFormModal({
  hero,
  onClose,
  onSave,
}: {
  hero: SustainHero;
  onClose: () => void;
  onSave: (draft: HeroDraft) => void;
}) {
  const initial = draftFromHero(hero);
  const [draft, setDraft] = useState(initial);
  const [baseline] = useState(initial);
  const [titleError, setTitleError] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(0);
  const formId = useId();

  function save() {
    if (saving || uploading > 0) return;
    if (!draft.title.trim()) {
      setTitleError("Title is required.");
      return;
    }
    if (!draft.primaryImage.src || !draft.secondaryImage.src) {
      setPhotoError("Both banner photos are required.");
      return;
    }
    setSaving(true);
    onSave(draft);
  }

  return (
    <FormCloseGuard baseline={baseline} value={draft} onClose={onClose}>
      <AdminFormModal titleId="sustain-hero-drawer-title" size="lg">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-neutral-100 px-5 py-4">
          <div className="min-w-0">
            <h2
              id="sustain-hero-drawer-title"
              className="text-lg font-semibold text-neutral-950"
            >
              Edit hero
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              Update the banner displayed on the sustainability page.
            </p>
          </div>
          <button
            type="button"
            data-form-dismiss=""
            aria-label="Close"
            title="Close"
            onClick={onClose}
            className="grid size-9 shrink-0 place-items-center rounded-full text-neutral-500 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <MaterialIcon name="close" className="text-[20px]" />
          </button>
        </div>
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-4">
          <section aria-labelledby={`${formId}-content`}>
            <h3
              id={`${formId}-content`}
              className="text-sm font-semibold text-neutral-950"
            >
              Content
            </h3>
            <p className="mt-1 text-sm text-neutral-500">
              The words on the left of the banner.
            </p>
            <div className="mt-3 grid gap-3">
              <div>
                <FieldLabel htmlFor={`${formId}-eyebrow`}>Eyebrow</FieldLabel>
                <input
                  id={`${formId}-eyebrow`}
                  value={draft.eyebrow}
                  placeholder="Short line above the title"
                  onChange={(event) =>
                    setDraft({ ...draft, eyebrow: event.target.value })
                  }
                  className={adminFieldClass}
                />
              </div>
              <div>
                <FieldLabel htmlFor={`${formId}-title`}>
                  Title <span className="text-red-700">*</span>
                </FieldLabel>
                <input
                  id={`${formId}-title`}
                  autoFocus
                  value={draft.title}
                  placeholder="The main line on the sustainability page"
                  aria-invalid={titleError ? true : undefined}
                  aria-describedby={
                    titleError ? `${formId}-title-error` : undefined
                  }
                  onChange={(event) => {
                    setDraft({ ...draft, title: event.target.value });
                    setTitleError("");
                  }}
                  className={cn(
                    adminFieldClass,
                    titleError && "border-red-400",
                  )}
                />
                {titleError ? (
                  <div id={`${formId}-title-error`}>
                    <FieldError message={titleError} />
                  </div>
                ) : null}
              </div>
              <div>
                <FieldLabel htmlFor={`${formId}-subtitle`}>Subtitle</FieldLabel>
                <textarea
                  id={`${formId}-subtitle`}
                  value={draft.subtitle}
                  rows={4}
                  placeholder="A short description under the title"
                  onChange={(event) =>
                    setDraft({ ...draft, subtitle: event.target.value })
                  }
                  className={cn(adminFieldClass, "h-auto py-3")}
                />
              </div>
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
              The filled button is first. The outline button is second.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <FieldLabel htmlFor={`${formId}-primary-label`}>
                  Primary button label
                </FieldLabel>
                <input
                  id={`${formId}-primary-label`}
                  value={draft.primaryLabel}
                  placeholder="See all products"
                  onChange={(event) =>
                    setDraft({ ...draft, primaryLabel: event.target.value })
                  }
                  className={adminFieldClass}
                />
              </div>
              <div>
                <FieldLabel htmlFor={`${formId}-primary-link`}>
                  Primary button link
                </FieldLabel>
                <input
                  id={`${formId}-primary-link`}
                  value={draft.primaryHref}
                  placeholder="/products"
                  onChange={(event) =>
                    setDraft({ ...draft, primaryHref: event.target.value })
                  }
                  className={adminFieldClass}
                />
              </div>
              <div>
                <FieldLabel htmlFor={`${formId}-secondary-label`}>
                  Secondary button label
                </FieldLabel>
                <input
                  id={`${formId}-secondary-label`}
                  value={draft.secondaryLabel}
                  placeholder="Contact"
                  onChange={(event) =>
                    setDraft({ ...draft, secondaryLabel: event.target.value })
                  }
                  className={adminFieldClass}
                />
              </div>
              <div>
                <FieldLabel htmlFor={`${formId}-secondary-link`}>
                  Secondary button link
                </FieldLabel>
                <input
                  id={`${formId}-secondary-link`}
                  value={draft.secondaryHref}
                  placeholder="/contact-us"
                  onChange={(event) =>
                    setDraft({ ...draft, secondaryHref: event.target.value })
                  }
                  className={adminFieldClass}
                />
              </div>
            </div>
          </section>

          <section
            className="border-t border-neutral-100 pt-5"
            aria-labelledby={`${formId}-photos`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3
                  id={`${formId}-photos`}
                  className="text-sm font-semibold text-neutral-950"
                >
                  Photos
                </h3>
                <p className="mt-1 text-sm text-neutral-500">
                  These photos sit on the right of the banner. The first is on
                  the left, the second on the right.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setDraft({
                    ...draft,
                    primaryImage: draft.secondaryImage,
                    secondaryImage: draft.primaryImage,
                  })
                }
                className={adminButtonClass.quiet}
              >
                Swap sides
              </button>
            </div>
            {photoError ? (
              <div className="mt-3">
                <FieldError message={photoError} />
              </div>
            ) : null}
            <div className="mt-3 grid gap-4 lg:grid-cols-2">
              {(
                [
                  ["primaryImage", "Left photo"],
                  ["secondaryImage", "Right photo"],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="space-y-3">
                  <p className="text-sm font-medium text-neutral-950">
                    {label}
                  </p>
                  <ImageField
                    label="Hero image"
                    value={draft[key].src}
                    onBusy={(busy) =>
                      setUploading((count) =>
                        Math.max(0, count + (busy ? 1 : -1)),
                      )
                    }
                    onChange={(src) => {
                      setDraft({
                        ...draft,
                        [key]: { ...draft[key], src },
                      });
                      setPhotoError("");
                    }}
                  />
                  <div>
                    <FieldLabel htmlFor={`${formId}-${key}-alt`}>
                      Image description
                    </FieldLabel>
                    <input
                      id={`${formId}-${key}-alt`}
                      value={draft[key].alt}
                      placeholder="What this photo shows"
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          [key]: { ...draft[key], alt: event.target.value },
                        })
                      }
                      className={adminFieldClass}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-neutral-100 px-5 py-3">
          <button
            type="button"
            data-form-dismiss=""
            onClick={onClose}
            className={adminButtonClass.secondary}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving || uploading > 0}
            className={adminButtonClass.primary}
          >
            {saving ? "Saving…" : uploading > 0 ? "Uploading…" : "Save changes"}
          </button>
        </div>
      </AdminFormModal>
    </FormCloseGuard>
  );
}
