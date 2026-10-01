"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import {
  blankSustainText,
  readSustainabilitySections,
  saveSustainabilitySections,
  type SustainDurability,
  type SustainMedia,
  type SustainTextItem,
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
import {
  IconButton,
  replaceSearch,
  SustainHeader,
  useSustainNav,
} from "./sustain-shared";

type DurabilityDraft = {
  title: string;
  body: string;
  image: SustainMedia;
  bullets: SustainTextItem[];
};

function draftFrom(durability: SustainDurability): DurabilityDraft {
  return {
    title: durability.title,
    body: durability.body,
    image: { ...durability.image },
    bullets: durability.bullets.map((bullet) => ({
      ...bullet,
      isActive: bullet.isActive !== false,
    })),
  };
}

function uniqueId(id: string) {
  return `${id}-${Math.random().toString(36).slice(2, 6)}`;
}

export function SustainabilityDurabilityEditor() {
  const { durability } = useSustainabilitySections();
  const params = useSearchParams();
  const { pathname, router } = useSustainNav();
  const editing = params.has("edit") || params.has("photo");
  const [notice, setNotice] = useState("");
  const focusEdit = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef(false);
  const empty =
    !durability.title.trim() &&
    !durability.body.trim() &&
    !durability.image.src &&
    durability.bullets.length === 0;

  useEffect(() => {
    if (editing || !returnFocus.current) return;
    returnFocus.current = false;
    focusEdit.current?.focus();
  }, [editing]);

  function setEditing(open: boolean) {
    if (!open) returnFocus.current = true;
    replaceSearch(router, pathname, (next) => {
      if (open) next.set("edit", "durability");
      else {
        next.delete("edit");
        next.delete("photo");
      }
    });
  }

  function save(draft: DurabilityDraft) {
    const doc = readSustainabilitySections();
    saveSustainabilitySections({
      ...doc,
      durability: {
        title: draft.title.trim(),
        body: draft.body.trim(),
        image: { src: draft.image.src, alt: draft.image.alt.trim() },
        bullets: draft.bullets.map((bullet) => ({
          id: bullet.id,
          text: bullet.text.trim(),
          isActive: bullet.isActive !== false,
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
        sectionId="durability"
        title="Built to last"
        description="Less waste, products that last."
        extra={
          <button
            ref={focusEdit}
            type="button"
            onClick={() => setEditing(true)}
            className={adminButtonClass.primary}
          >
            <MaterialIcon name="edit" className="text-[18px]" />
            Edit built to last
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
        aria-labelledby="sustain-durability-card-heading"
      >
        <div className="border-b border-neutral-100 px-4 py-3 sm:px-5">
          <h2
            id="sustain-durability-card-heading"
            className="text-sm font-semibold text-neutral-950"
          >
            Built to last
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Shown on the sustainability page. The words are on the left and the
            photo is on the right.
          </p>
        </div>
        {empty ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm font-semibold text-neutral-950">
              No content yet
            </p>
            <p className="mx-auto mt-1 max-w-md text-sm text-neutral-500">
              Add the heading, the points, and the cover photo.
            </p>
          </div>
        ) : (
          <div className="bg-admin-canvas p-4 sm:p-5">
            <DurabilityPreview durability={durability} />
          </div>
        )}
      </section>

      {editing ? (
        <DurabilityFormModal
          durability={durability}
          onClose={() => setEditing(false)}
          onSave={save}
        />
      ) : null}
    </div>
  );
}

function DurabilityPreview({ durability }: { durability: SustainDurability }) {
  return (
    <div className="flex items-start gap-4">
      <div className="relative aspect-4/3 w-28 shrink-0 overflow-hidden rounded-xl bg-white ring-1 ring-neutral-200">
        {durability.image.src ? (
          <Image
            src={durability.image.src}
            alt=""
            fill
            sizes="112px"
            className="object-cover"
          />
        ) : (
          <span className="grid size-full place-items-center px-2 text-center text-xs text-neutral-500">
            Photo
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xl font-semibold text-neutral-950">
          {durability.title.trim() || "Title"}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          {durability.body.trim() || "Body"}
        </p>
        {durability.bullets.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-500">No points yet</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {durability.bullets.map((bullet) => {
              const hidden = bullet.isActive === false;
              return (
                <li
                  key={bullet.id}
                  className={cn(
                    "flex items-start gap-2 text-sm text-neutral-700",
                    hidden && "opacity-50",
                  )}
                >
                  <MaterialIcon
                    name="check_circle"
                    className="mt-0.5 shrink-0 text-[18px] text-primary"
                  />
                  <span>
                    {bullet.text || "Empty point"}
                    {hidden ? (
                      <span className="ml-2 rounded-full bg-neutral-950/80 px-2 py-0.5 text-[11px] font-semibold text-white">
                        Hidden
                      </span>
                    ) : null}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function DurabilityFormModal({
  durability,
  onClose,
  onSave,
}: {
  durability: SustainDurability;
  onClose: () => void;
  onSave: (draft: DurabilityDraft) => void;
}) {
  const initial = draftFrom(durability);
  const [draft, setDraft] = useState(initial);
  const [baseline] = useState(initial);
  const [titleError, setTitleError] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [bulletError, setBulletError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(0);
  const formId = useId();

  function save() {
    if (saving || uploading > 0) return;
    const nextTitleError = draft.title.trim() ? "" : "Title is required.";
    const nextPhotoError = draft.image.src ? "" : "Cover photo is required.";
    const nextBulletError = draft.bullets.some((bullet) => !bullet.text.trim())
      ? "Write each point, or remove the empty one."
      : "";
    setTitleError(nextTitleError);
    setPhotoError(nextPhotoError);
    setBulletError(nextBulletError);
    if (nextTitleError || nextPhotoError || nextBulletError) return;
    setSaving(true);
    onSave(draft);
  }

  function moveBullet(index: number, direction: -1 | 1) {
    setDraft((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.bullets.length) return current;
      const bullets = [...current.bullets];
      const [item] = bullets.splice(index, 1);
      if (!item) return current;
      bullets.splice(target, 0, item);
      return { ...current, bullets };
    });
  }

  return (
    <FormCloseGuard baseline={baseline} value={draft} onClose={onClose}>
      <AdminFormModal titleId="sustain-durability-drawer-title" size="lg">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-neutral-100 px-5 py-4">
          <div className="min-w-0">
            <h2
              id="sustain-durability-drawer-title"
              className="text-lg font-semibold text-neutral-950"
            >
              Edit built to last
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              Update the heading, points, and cover photo for this section.
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
                <FieldLabel htmlFor={`${formId}-title`}>
                  Title <span className="text-red-700">*</span>
                </FieldLabel>
                <input
                  id={`${formId}-title`}
                  autoFocus
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
                  rows={4}
                  placeholder="The paragraph under the title"
                  onChange={(event) =>
                    setDraft({ ...draft, body: event.target.value })
                  }
                  className={cn(adminFieldClass, "h-auto py-3")}
                />
              </div>
            </div>
          </section>

          <section
            className="border-t border-neutral-100 pt-5"
            aria-labelledby={`${formId}-photo`}
          >
            <h3
              id={`${formId}-photo`}
              className="text-sm font-semibold text-neutral-950"
            >
              Cover photo
            </h3>
            <p className="mt-1 text-sm text-neutral-500">
              This photo sits on the right of the section.
            </p>
            <div className="mt-3">
              <ImageField
                variant="thumb"
                label=""
                value={draft.image.src}
                confirmRemove
                onBusy={(busy) =>
                  setUploading((count) => Math.max(0, count + (busy ? 1 : -1)))
                }
                onChange={(src) => {
                  setDraft({ ...draft, image: { ...draft.image, src } });
                  setPhotoError("");
                }}
              />
            </div>
            {photoError ? (
              <div className="mt-3">
                <FieldError message={photoError} />
              </div>
            ) : null}
            <label className="mt-3 block">
              <span className="mb-1.5 block text-sm font-medium text-neutral-700">
                Description
              </span>
              <input
                value={draft.image.alt}
                placeholder="What this photo shows"
                aria-label="Cover photo description"
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    image: { ...draft.image, alt: event.target.value },
                  })
                }
                className={adminFieldClass}
              />
            </label>
          </section>

          <section
            className="border-t border-neutral-100 pt-5"
            aria-labelledby={`${formId}-points`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3
                  id={`${formId}-points`}
                  className="text-sm font-semibold text-neutral-950"
                >
                  Points
                </h3>
                <p className="mt-1 text-sm text-neutral-500">
                  The checked lines under the paragraph. Hidden points stay here
                  but do not appear on the website.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const item = blankSustainText();
                  setDraft((current) => ({
                    ...current,
                    bullets: [
                      ...current.bullets,
                      { ...item, id: uniqueId(item.id) },
                    ],
                  }));
                  setBulletError("");
                }}
                className={adminButtonClass.secondary}
              >
                <MaterialIcon name="add" className="text-[18px]" />
                Add point
              </button>
            </div>
            {bulletError ? (
              <div className="mt-3">
                <FieldError message={bulletError} />
              </div>
            ) : null}
            {draft.bullets.length === 0 ? (
              <p className="mt-3 text-sm text-neutral-500">No points yet.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {draft.bullets.map((bullet, index) => (
                  <li
                    key={bullet.id}
                    className="rounded-2xl bg-admin-canvas p-3"
                  >
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-neutral-950">
                        Point {index + 1}
                      </p>
                      <div className="flex items-center">
                        <IconButton
                          label={`Move point ${index + 1} earlier`}
                          icon="arrow_upward"
                          disabled={index === 0}
                          onClick={() => moveBullet(index, -1)}
                        />
                        <IconButton
                          label={`Move point ${index + 1} later`}
                          icon="arrow_downward"
                          disabled={index === draft.bullets.length - 1}
                          onClick={() => moveBullet(index, 1)}
                        />
                        <IconButton
                          label={`Remove point ${index + 1}`}
                          icon="delete"
                          danger
                          onClick={() => {
                            setDraft((current) => ({
                              ...current,
                              bullets: current.bullets.filter(
                                (item) => item.id !== bullet.id,
                              ),
                            }));
                            setBulletError("");
                          }}
                        />
                      </div>
                    </div>
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-medium text-neutral-700">
                        Point <span className="text-red-700">*</span>
                      </span>
                      <textarea
                        value={bullet.text}
                        rows={2}
                        placeholder="A short point under the heading"
                        aria-label={`Point ${index + 1}`}
                        onChange={(event) => {
                          const text = event.target.value;
                          setDraft((current) => ({
                            ...current,
                            bullets: current.bullets.map((item) =>
                              item.id === bullet.id ? { ...item, text } : item,
                            ),
                          }));
                          setBulletError("");
                        }}
                        className={cn(
                          adminFieldClass,
                          "h-auto py-3",
                          bulletError &&
                            !bullet.text.trim() &&
                            "border-red-400",
                        )}
                      />
                    </label>
                    <VisibilitySwitch
                      checked={bullet.isActive !== false}
                      showLabel={`Show point ${index + 1}`}
                      hideLabel={`Hide point ${index + 1}`}
                      onChange={(isActive) =>
                        setDraft((current) => ({
                          ...current,
                          bullets: current.bullets.map((item) =>
                            item.id === bullet.id
                              ? { ...item, isActive }
                              : item,
                          ),
                        }))
                      }
                    />
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

function VisibilitySwitch({
  checked,
  showLabel,
  hideLabel,
  onChange,
}: {
  checked: boolean;
  showLabel: string;
  hideLabel: string;
  onChange: (active: boolean) => void;
}) {
  return (
    <div className="mt-3 flex items-center justify-between gap-3">
      <span className="text-sm text-neutral-600">
        {checked ? "Visible on the website" : "Hidden from the website"}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={checked ? hideLabel : showLabel}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          checked ? "bg-primary" : "bg-neutral-300",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-5 rounded-full bg-white transition-all",
            checked ? "left-5" : "left-0.5",
          )}
        />
      </button>
    </div>
  );
}
