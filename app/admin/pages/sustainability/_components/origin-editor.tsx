"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import {
  readSustainabilitySections,
  saveSustainabilitySections,
  type SustainImage,
  type SustainOrigin,
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
import { ImageField, MultiImageUpload } from "../../../_components/image-field";
import {
  IconButton,
  replaceSearch,
  SustainHeader,
  useSustainNav,
} from "./sustain-shared";

type OriginDraft = {
  eyebrow: string;
  title: string;
  body: string;
  quote: string;
  images: SustainImage[];
};

function draftFrom(origin: SustainOrigin): OriginDraft {
  return {
    eyebrow: origin.eyebrow,
    title: origin.title,
    body: origin.body,
    quote: origin.quote,
    images: origin.images.map((image) => ({
      ...image,
      isActive: image.isActive !== false,
    })),
  };
}

function newImageId(index: number) {
  return `origin-photo-${Date.now().toString(36)}-${index}-${Math.random().toString(36).slice(2, 6)}`;
}

export function SustainabilityOriginEditor() {
  const { origin } = useSustainabilitySections();
  const params = useSearchParams();
  const { pathname, router } = useSustainNav();
  const editing = params.has("edit") || params.has("image");
  const [notice, setNotice] = useState("");
  const focusEdit = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef(false);
  const empty =
    !origin.title.trim() &&
    !origin.body.trim() &&
    !origin.quote.trim() &&
    origin.images.length === 0;

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

  function save(draft: OriginDraft) {
    const doc = readSustainabilitySections();
    saveSustainabilitySections({
      ...doc,
      origin: {
        eyebrow: draft.eyebrow.trim(),
        title: draft.title.trim(),
        body: draft.body.trim(),
        quote: draft.quote.trim(),
        images: draft.images.map((image) => ({
          id: image.id,
          src: image.src,
          alt: image.alt.trim(),
          isActive: image.isActive !== false,
        })),
      },
    });
    setNotice("Saved.");
    window.setTimeout(() => setNotice(""), 1600);
    setEditing(false);
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
            Shown on the sustainability page. Words on the left, photos on the
            right, two in each row.
          </p>
        </div>
        {empty ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm font-semibold text-neutral-950">
              No point of view yet
            </p>
            <p className="mx-auto mt-1 max-w-md text-sm text-neutral-500">
              Add the heading, the quote, and the photos shown beside them.
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

function OriginPreview({ origin }: { origin: SustainOrigin }) {
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
      {origin.images.length === 0 ? (
        <p className="grid min-h-40 place-items-center rounded-2xl bg-white text-sm text-neutral-500 ring-1 ring-neutral-200">
          No photos yet
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-2">
          {origin.images.map((image, index) => {
            const hidden = image.isActive === false;
            return (
              <li key={image.id} className={cn(hidden && "opacity-50")}>
                <div className="relative aspect-square overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200">
                  {image.src ? (
                    <Image
                      src={image.src}
                      alt=""
                      fill
                      sizes="180px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="grid size-full place-items-center text-xs text-neutral-500">
                      Photo {index + 1}
                    </span>
                  )}
                  {hidden ? (
                    <span className="absolute top-2 left-2 rounded-full bg-neutral-950/80 px-2 py-0.5 text-[11px] font-semibold text-white">
                      Hidden
                    </span>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function OriginFormModal({
  origin,
  onClose,
  onSave,
}: {
  origin: SustainOrigin;
  onClose: () => void;
  onSave: (draft: OriginDraft) => void;
}) {
  const initial = draftFrom(origin);
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
    if (draft.images.some((image) => !image.src)) {
      setPhotoError("Add an image, or remove the empty photo.");
      return;
    }
    setSaving(true);
    onSave(draft);
  }

  function updateImages(images: SustainImage[]) {
    setDraft((current) => ({ ...current, images }));
    setPhotoError("");
  }

  function moveImage(index: number, direction: -1 | 1) {
    const target = index + direction;
    setDraft((current) => {
      if (target < 0 || target >= current.images.length) return current;
      const images = [...current.images];
      const [item] = images.splice(index, 1);
      if (!item) return current;
      images.splice(target, 0, item);
      return { ...current, images };
    });
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
              Update the heading, quote, and photos for this section.
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
              Photos
            </h3>
            <p className="mt-1 text-sm text-neutral-500">
              Drop or pick several images at once. They appear beside the text,
              two in each row, in this order. Hide a photo to keep it here
              without showing it on the website.
            </p>
            <div className="mt-3">
              <MultiImageUpload
                inputId={`${formId}-upload`}
                onBusy={(busy) =>
                  setUploading((count) => Math.max(0, count + (busy ? 1 : -1)))
                }
                onUploaded={(srcs) => {
                  setDraft((current) => ({
                    ...current,
                    images: [
                      ...current.images,
                      ...srcs.map((src, index) => ({
                        id: newImageId(index),
                        src,
                        alt: "",
                        isActive: true,
                      })),
                    ],
                  }));
                  setPhotoError("");
                }}
              />
            </div>
            {photoError ? (
              <div className="mt-3">
                <FieldError message={photoError} />
              </div>
            ) : null}
            {draft.images.length === 0 ? (
              <p className="mt-3 text-sm text-neutral-500">No photos yet.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {draft.images.map((image, index) => (
                  <li
                    key={image.id}
                    className="rounded-2xl bg-admin-canvas p-3"
                  >
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-neutral-950">
                        Photo {index + 1}
                      </p>
                      <div className="flex items-center">
                        <IconButton
                          label={`Move photo ${index + 1} earlier`}
                          icon="arrow_upward"
                          disabled={index === 0}
                          onClick={() => moveImage(index, -1)}
                        />
                        <IconButton
                          label={`Move photo ${index + 1} later`}
                          icon="arrow_downward"
                          disabled={index === draft.images.length - 1}
                          onClick={() => moveImage(index, 1)}
                        />
                        <IconButton
                          label={`Remove photo ${index + 1}`}
                          icon="delete"
                          danger
                          onClick={() =>
                            updateImages(
                              draft.images.filter(
                                (item) => item.id !== image.id,
                              ),
                            )
                          }
                        />
                      </div>
                    </div>
                    <ImageField
                      compact
                      variant="thumb"
                      label=""
                      value={image.src}
                      confirmRemove
                      onBusy={(busy) =>
                        setUploading((count) =>
                          Math.max(0, count + (busy ? 1 : -1)),
                        )
                      }
                      onChange={(src) =>
                        updateImages(
                          draft.images.map((item) =>
                            item.id === image.id ? { ...item, src } : item,
                          ),
                        )
                      }
                    />
                    <label className="mt-3 block">
                      <span className="mb-1.5 block text-sm font-medium text-neutral-700">
                        Description
                      </span>
                      <input
                        value={image.alt}
                        placeholder="What this photo shows"
                        aria-label={`Description for photo ${index + 1}`}
                        onChange={(event) =>
                          updateImages(
                            draft.images.map((item) =>
                              item.id === image.id
                                ? { ...item, alt: event.target.value }
                                : item,
                            ),
                          )
                        }
                        className={adminFieldClass}
                      />
                    </label>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <span className="text-sm text-neutral-600">
                        {image.isActive !== false
                          ? "Visible on the website"
                          : "Hidden from the website"}
                      </span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={image.isActive !== false}
                        aria-label={
                          image.isActive !== false
                            ? `Hide photo ${index + 1}`
                            : `Show photo ${index + 1}`
                        }
                        onClick={() =>
                          updateImages(
                            draft.images.map((item) =>
                              item.id === image.id
                                ? {
                                    ...item,
                                    isActive: item.isActive === false,
                                  }
                                : item,
                            ),
                          )
                        }
                        className={cn(
                          "relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                          image.isActive !== false
                            ? "bg-primary"
                            : "bg-neutral-300",
                        )}
                      >
                        <span
                          className={cn(
                            "absolute top-0.5 size-5 rounded-full bg-white transition-all",
                            image.isActive !== false ? "left-5" : "left-0.5",
                          )}
                        />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
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
