"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import {
  getAboutHero,
  saveAboutHero,
  type AboutHero,
} from "@/lib/mart-api/about-hero";
import { singleImageErrors } from "@/lib/mart-api/about-single-image";
import { MartApiError } from "@/lib/mart-api/products";
import { cn } from "@/lib/utils";

import { AdminFormModal } from "../../../_components/admin-form-modal";
import {
  adminButtonClass,
  adminFieldClass,
  AdminPageHeader,
  FieldError,
  FieldLabel,
} from "../../../_components/admin-ui";
import { FormCloseGuard } from "../../../_components/form-close-guard";
import { findCmsPage } from "../../../_config/cms";
import { SingleImageField } from "./single-image-field";

type HeroDraft = {
  eyebrow: string;
  title: string;
  subtitle: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  image: AboutHero["image"];
};

function draftFromHero(hero: AboutHero): HeroDraft {
  return {
    eyebrow: hero.eyebrow,
    title: hero.title,
    subtitle: hero.subtitle,
    primaryLabel: hero.primaryLabel,
    primaryHref: hero.primaryHref,
    secondaryLabel: hero.secondaryLabel,
    secondaryHref: hero.secondaryHref,
    image: hero.image ? { ...hero.image } : null,
  };
}

export function AboutHeroEditor() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const editing = params.has("edit");
  const [hero, setHero] = useState<AboutHero | null>(null);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState("");
  const focusEdit = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef(false);
  const page = findCmsPage("about");

  useEffect(() => {
    let cancelled = false;
    getAboutHero()
      .then((next) => {
        if (!cancelled) setHero(next);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setLoadError(error instanceof MartApiError ? error.message : "Could not load the about hero.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (editing || !returnFocus.current) return;
    returnFocus.current = false;
    focusEdit.current?.focus();
  }, [editing]);

  function setEditing(open: boolean) {
    if (!open) returnFocus.current = true;
    const next = new URLSearchParams(window.location.search);
    if (open) next.set("edit", "hero");
    else next.delete("edit");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }

  async function save(draft: HeroDraft) {
    if (!hero) return;
    const next = await saveAboutHero({
      eyebrow: draft.eyebrow.trim(),
      title: draft.title.trim(),
      subtitle: draft.subtitle.trim(),
      primaryLabel: draft.primaryLabel.trim(),
      primaryHref: draft.primaryHref.trim(),
      secondaryLabel: draft.secondaryLabel.trim(),
      secondaryHref: draft.secondaryHref.trim(),
      image: draft.image?.src
        ? { ...draft.image, alt: draft.image.alt.trim() }
        : null,
    });
    setHero(next);
    setNotice("Saved.");
    window.setTimeout(() => setNotice(""), 1600);
    setEditing(false);
  }

  return (
    <div className="min-w-0 space-y-4">
      <div>
        <nav
          aria-label="Breadcrumb"
          className="mb-3 flex flex-wrap items-center gap-1 text-sm text-neutral-500"
        >
          <Link
            href="/admin/pages/about"
            className="font-medium hover:text-neutral-950"
          >
            About
          </Link>
          <MaterialIcon
            name="chevron_right"
            className="text-[16px] text-neutral-300"
          />
          <span className="font-medium text-neutral-950">Hero</span>
        </nav>
        {page ? (
          <div
            className="mb-4 flex gap-2 overflow-x-auto pb-1"
            aria-label="About sections"
          >
            {page.sections.map((section) => {
              const active = section.id === "hero";
              return (
                <Link
                  key={section.id}
                  href={`${page.href}/${section.id}`}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex h-9 shrink-0 items-center rounded-full px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                    active
                      ? "bg-neutral-950 font-medium text-white"
                      : "bg-white font-medium text-neutral-600 ring-1 ring-neutral-200 hover:bg-neutral-50",
                  )}
                >
                  {section.label}
                </Link>
              );
            })}
          </div>
        ) : null}
        <AdminPageHeader
          title="Hero"
          description="The banner at the top of the about page."
          action={
            <div className="flex flex-wrap items-center gap-2">
              <a
                href="/about-us"
                target="_blank"
                rel="noreferrer"
                className={adminButtonClass.secondary}
              >
                View on site
                <MaterialIcon name="open_in_new" className="text-[18px]" />
              </a>
              <button
                ref={focusEdit}
                type="button"
                onClick={() => setEditing(true)}
                className={adminButtonClass.primary}
              >
                <MaterialIcon name="edit" className="text-[18px]" />
                Edit hero
              </button>
            </div>
          }
        />
      </div>

      {notice ? (
        <p role="status" className="text-sm font-medium text-emerald-800">
          {notice} The about page banner is up to date.
        </p>
      ) : null}
      {loadError ? (
        <p role="alert" className="rounded-2xl bg-white px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
          {loadError}
        </p>
      ) : null}
      {!hero ? (
        loadError ? null : <p className="text-sm text-neutral-500">Loading the hero…</p>
      ) : (
      <>
      <section
        className="overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200/90"
        aria-labelledby="about-hero-card-heading"
      >
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-neutral-100 px-4 py-3 sm:px-5">
          <div>
            <h2
              id="about-hero-card-heading"
              className="text-sm font-semibold text-neutral-950"
            >
              Hero content
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              Shown at the top of the about page. Words on the left, one
              photo beside them.
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
        {hero.title.trim() || hero.subtitle.trim() || hero.image?.src ? (
          <div className="p-4 sm:p-5">
            <HeroPreview hero={hero} />
          </div>
        ) : (
          <div className="px-4 py-12 text-center">
            <p className="text-sm font-semibold text-neutral-950">
              No hero content yet
            </p>
            <p className="mx-auto mt-1 max-w-md text-sm text-neutral-500">
              Add the heading, buttons, and photo for the about page banner.
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
      </>
      )}
    </div>
  );
}

function HeroPreview({ hero }: { hero: AboutHero }) {
  const photo = hero.image;

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
          {hero.primaryLabel.trim() ? (
            <span className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-primary px-4 text-sm font-semibold text-white">
              {hero.primaryLabel}
              <MaterialIcon name="arrow_forward" className="text-[18px]" />
            </span>
          ) : null}
          {hero.secondaryLabel.trim() ? (
            <span className="inline-flex h-9 items-center justify-center rounded-full px-4 text-sm font-semibold text-white ring-1 ring-white/25">
              {hero.secondaryLabel}
            </span>
          ) : null}
        </div>
      </div>
      <div className="p-4 sm:p-5">
            <div
              className="relative aspect-[4/3] max-w-xs overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10"
            >
              {photo?.src ? (
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="320px"
                  className="object-cover"
                />
              ) : (
                <span className="grid size-full place-items-center px-2 text-center text-xs text-white/60">
                  Photo
                </span>
              )}
            </div>
      </div>
    </div>
  );
}

function HeroFormModal({
  hero,
  onClose,
  onSave,
}: {
  hero: AboutHero;
  onClose: () => void;
  onSave: (draft: HeroDraft) => Promise<void>;
}) {
  const initial = draftFromHero(hero);
  const [draft, setDraft] = useState(initial);
  const [baseline] = useState(initial);
  const [titleError, setTitleError] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [altError, setAltError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(0);
  const formId = useId();

  async function save() {
    if (saving || uploading > 0) return;
    const imageErrors = singleImageErrors(draft.image);
    setTitleError(draft.title.trim() ? "" : "Title is required.");
    setPhotoError(imageErrors.photo);
    setAltError(imageErrors.alt);
    setSaveError("");
    if (!draft.title.trim() || imageErrors.photo || imageErrors.alt) return;
    setSaving(true);
    try {
      await onSave(draft);
    } catch (error) {
      setSaving(false);
      setSaveError(error instanceof MartApiError ? error.message : "Could not save the about hero.");
    }
  }

  return (
    <FormCloseGuard baseline={baseline} value={draft} onClose={onClose}>
      <AdminFormModal titleId="about-hero-drawer-title" size="lg">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-neutral-100 px-5 py-4">
          <div className="min-w-0">
            <h2
              id="about-hero-drawer-title"
              className="text-lg font-semibold text-neutral-950"
            >
              Edit hero
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              Update the banner displayed on the about page.
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
                  placeholder="The main line on the about page"
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
              The filled button is first. The outline button is second. Leave a
              label empty to hide that button.
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
            <h3
              id={`${formId}-photos`}
              className="text-sm font-semibold text-neutral-950"
            >
              Photo
            </h3>
            <p className="mt-1 text-sm text-neutral-500">
              One photo sits beside the banner text. Use Replace to change it.
            </p>
            <div className="mt-3 max-w-md">
              <SingleImageField
                id={`${formId}-photo`}
                value={draft.image}
                photoError={photoError}
                altError={altError}
                onBusy={(busy) =>
                  setUploading((count) => Math.max(0, count + (busy ? 1 : -1)))
                }
                onChange={(image) => {
                  setDraft((current) => ({ ...current, image }));
                  setPhotoError("");
                  setAltError("");
                }}
              />
            </div>
            {saveError ? (
              <div className="mt-3" role="alert">
                <FieldError message={saveError} />
              </div>
            ) : null}
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
