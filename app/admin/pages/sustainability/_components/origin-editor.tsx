"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import {
  getSustainabilityOrigin,
  saveSustainabilityOrigin,
  type SustainabilityOrigin,
} from "@/lib/mart-api/sustainability-origin";
import { optionalImageErrors } from "@/lib/mart-api/about-single-image-rules";
import { cn } from "@/lib/utils";

import { AdminFormModal } from "../../../_components/admin-form-modal";
import {
  adminButtonClass,
  adminFieldClass,
  FieldError,
  FieldLabel,
} from "../../../_components/admin-ui";
import { FormCloseGuard } from "../../../_components/form-close-guard";
import { SingleImageField } from "../../about/_components/single-image-field";
import {
  replaceSearch,
  SustainHeader,
  useSustainNav,
} from "./sustain-shared";

type OriginDraft = {
  eyebrow: string;
  title: string;
  body: string;
  quote: string;
  /** Optional single photo; src "" means none. */
  image: { src: string; alt: string };
};

function draftFrom(origin: SustainabilityOrigin): OriginDraft {
  return {
    eyebrow: origin.eyebrow,
    title: origin.title,
    body: origin.body,
    quote: origin.quote,
    image: { src: origin.image?.src ?? "", alt: origin.image?.alt ?? "" },
  };
}

export function SustainabilityOriginEditor() {
  const [origin, setOrigin] = useState<SustainabilityOrigin | null>(null);
  const [loadError, setLoadError] = useState("");
  const params = useSearchParams();
  const { pathname, router } = useSustainNav();
  const editing = params.has("edit") || params.has("image");
  const [notice, setNotice] = useState("");
  const focusEdit = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef(false);
  const empty =
    !origin ||
    (!origin.title.trim() &&
      !origin.body.trim() &&
      !origin.quote.trim() &&
      !origin.image);

  useEffect(() => {
    let active = true;
    getSustainabilityOrigin()
      .then((next) => {
        if (active) setOrigin(next);
      })
      .catch((error: unknown) => {
        if (active) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Could not load the point of view.",
          );
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (editing || !returnFocus.current) return;
    returnFocus.current = false;
    focusEdit.current?.focus();
  }, [editing]);

  function setEditing(open: boolean) {
    if (!open) returnFocus.current = true;
    replaceSearch(router, pathname, (next) => {
      if (open) next.set("edit", "origin");
      else {
        next.delete("edit");
        next.delete("image");
      }
    });
  }

  async function save(draft: OriginDraft) {
    const saved = await saveSustainabilityOrigin({
      eyebrow: draft.eyebrow.trim(),
      title: draft.title.trim(),
      body: draft.body.trim(),
      quote: draft.quote.trim(),
      image: draft.image.src
        ? { id: "photo", src: draft.image.src, alt: draft.image.alt.trim() }
        : null,
    });
    setOrigin(saved);
    setNotice("Saved.");
    window.setTimeout(() => setNotice(""), 1600);
    setEditing(false);
  }

  if (!origin) {
    return (
      <div className="min-w-0 space-y-4">
        <SustainHeader
          sectionId="origin"
          title="Point of view"
          description="Why quality is a responsibility."
        />
        <p className="text-sm text-neutral-600">
          {loadError || "Loading the point of view…"}
        </p>
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-4">
      <SustainHeader
        sectionId="origin"
        title="Point of view"
        description="Why quality is a responsibility."
        extra={
          <button
            ref={focusEdit}
            type="button"
            onClick={() => setEditing(true)}
            className={adminButtonClass.primary}
          >
            <MaterialIcon name="edit" className="text-[18px]" />
            Edit point of view
          </button>
        }
      />

      {notice ? (
        <p role="status" className="text-sm font-medium text-emerald-800">
          {notice} This section is up to date.
        </p>
      ) : null}

      <section
        className="overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200/90"
        aria-labelledby="sustain-origin-card-heading"
      >
        <div className="border-b border-neutral-100 px-4 py-3 sm:px-5">
          <h2
            id="sustain-origin-card-heading"
            className="text-sm font-semibold text-neutral-950"
          >
            Point of view
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Shown on the sustainability page. Words on the left, an optional
            photo on the right.
          </p>
        </div>
        {empty ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm font-semibold text-neutral-950">
              No point of view yet
            </p>
            <p className="mx-auto mt-1 max-w-md text-sm text-neutral-500">
              Add the heading, the quote, and the optional photo beside them.
            </p>
          </div>
        ) : (
          <div className="bg-admin-canvas p-4 sm:p-5">
            <OriginPreview origin={origin} />
          </div>
        )}
      </section>

      {editing ? (
        <OriginFormModal
          origin={origin}
          onClose={() => setEditing(false)}
          onSave={save}
        />
      ) : null}
    </div>
  );
}

function OriginPreview({ origin }: { origin: SustainabilityOrigin }) {
  return (
    <div className="grid items-start gap-6 rounded-2xl bg-admin-canvas lg:grid-cols-2">
      <div>
        <p className="text-xs font-medium tracking-wide text-primary uppercase">
          {origin.eyebrow.trim() || "Eyebrow"}
        </p>
        <p className="mt-2 text-xl font-semibold text-neutral-950">
          {origin.title.trim() || "Title"}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-neutral-600">
          {origin.body.trim() || "Body"}
        </p>
        {origin.quote.trim() ? (
          <p className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm text-neutral-700 italic ring-1 ring-neutral-200">
            {origin.quote}
          </p>
        ) : null}
      </div>
      {origin.image ? (
        <div className="relative aspect-4/3 overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200">
          <Image
            src={origin.image.src}
            alt=""
            fill
            sizes="360px"
            className="object-cover"
          />
        </div>
      ) : (
        <p className="grid min-h-40 place-items-center rounded-2xl bg-white text-sm text-neutral-500 ring-1 ring-neutral-200">
          No photo — text-only layout
        </p>
      )}
    </div>
  );
}

function OriginFormModal({
  origin,
  onClose,
  onSave,
}: {
  origin: SustainabilityOrigin;
  onClose: () => void;
  onSave: (draft: OriginDraft) => void | Promise<void>;
}) {
  const initial = draftFrom(origin);
  const [draft, setDraft] = useState(initial);
  const [baseline] = useState(initial);
  const [titleError, setTitleError] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(0);
  const formId = useId();

  async function save() {
    if (saving || uploading > 0) return;
    if (!draft.title.trim()) {
      setTitleError("Title is required.");
      return;
    }
    const altError = optionalImageErrors(draft.image).alt;
    setPhotoError(altError);
    setSaveError("");
    if (altError) return;
    setSaving(true);
    try {
      await onSave(draft);
    } catch (caught) {
      setSaving(false);
      setSaveError(
        caught instanceof Error
          ? caught.message
          : "Could not save the point of view.",
      );
    }
  }

  return (
    <FormCloseGuard baseline={baseline} value={draft} onClose={onClose}>
      <AdminFormModal titleId="sustain-origin-drawer-title" size="lg">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-neutral-100 px-5 py-4">
          <div className="min-w-0">
            <h2
              id="sustain-origin-drawer-title"
              className="text-lg font-semibold text-neutral-950"
            >
              Edit point of view
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              Update the heading, quote, and photo for this section.
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
              The words on the left of this section.
            </p>
            <div className="mt-3 grid gap-3">
              <div>
                <FieldLabel htmlFor={`${formId}-eyebrow`}>Eyebrow</FieldLabel>
                <input
                  id={`${formId}-eyebrow`}
                  autoFocus
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
                  value={draft.title}
                  placeholder="The main line of this section"
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
                <FieldLabel htmlFor={`${formId}-body`}>Body</FieldLabel>
                <textarea
                  id={`${formId}-body`}
                  value={draft.body}
                  rows={5}
                  placeholder="The paragraph under the title"
                  onChange={(event) =>
                    setDraft({ ...draft, body: event.target.value })
                  }
                  className={cn(adminFieldClass, "h-auto py-3")}
                />
              </div>
              <div>
                <FieldLabel htmlFor={`${formId}-quote`}>Quote</FieldLabel>
                <textarea
                  id={`${formId}-quote`}
                  value={draft.quote}
                  rows={3}
                  placeholder="The line in the white box"
                  onChange={(event) =>
                    setDraft({ ...draft, quote: event.target.value })
                  }
                  className={cn(adminFieldClass, "h-auto py-3")}
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
              Optional. One photo beside the text; without it the section uses a
              text-only layout.
            </p>
            <div className="mt-3 max-w-md">
              <SingleImageField
                id={`${formId}-photo`}
                optional
                value={{ id: "photo", ...draft.image }}
                altError={photoError}
                onBusy={(busy) =>
                  setUploading((count) => Math.max(0, count + (busy ? 1 : -1)))
                }
                onChange={(image) => {
                  setDraft((current) => ({
                    ...current,
                    image: { src: image?.src ?? "", alt: image?.alt ?? "" },
                  }));
                  setPhotoError("");
                }}
              />
            </div>
          </section>
          {saveError ? (
            <div role="alert">
              <FieldError message={saveError} />
            </div>
          ) : null}
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
