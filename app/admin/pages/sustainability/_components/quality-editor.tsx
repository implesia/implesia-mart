"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import {
  blankSustainBadge,
  blankSustainText,
} from "@/lib/mart-mock/sustainability-sections";
import {
  getSustainabilityQuality,
  saveSustainabilityQuality,
  type SustainabilityQuality,
  type SustainabilityQualityBadge,
  type SustainabilityQualityStep,
} from "@/lib/mart-api/sustainability-quality";
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
  IconButton,
  IconPicker,
  replaceSearch,
  SustainHeader,
  useSustainNav,
} from "./sustain-shared";

type QualityDraft = {
  title: string;
  body: string;
  image: { src: string; alt: string };
  steps: SustainabilityQualityStep[];
  badges: SustainabilityQualityBadge[];
};

function draftFrom(quality: SustainabilityQuality): QualityDraft {
  return {
    title: quality.title,
    body: quality.body,
    image: { ...quality.image },
    steps: quality.steps.map((step) => ({
      ...step,
      isActive: step.isActive !== false,
    })),
    badges: quality.badges.map((badge) => ({
      ...badge,
      isActive: badge.isActive !== false,
    })),
  };
}

function uniqueId(id: string) {
  return `${id}-${Math.random().toString(36).slice(2, 6)}`;
}

export function SustainabilityQualityEditor() {
  const [quality, setQuality] = useState<SustainabilityQuality | null>(null);
  const [loadError, setLoadError] = useState("");
  const params = useSearchParams();
  const { pathname, router } = useSustainNav();
  const editing =
    params.has("edit") ||
    params.has("step") ||
    params.has("badge") ||
    params.has("photo");
  const [notice, setNotice] = useState("");
  const focusEdit = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef(false);
  const empty =
    !quality ||
    (!quality.title.trim() &&
      !quality.body.trim() &&
      !quality.image.src &&
      quality.steps.length === 0 &&
      quality.badges.length === 0);

  useEffect(() => {
    let active = true;
    getSustainabilityQuality()
      .then((next) => {
        if (active) setQuality(next);
      })
      .catch((error: unknown) => {
        if (active) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Could not load the quality section.",
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
      if (open) next.set("edit", "quality");
      else {
        next.delete("edit");
        next.delete("step");
        next.delete("badge");
        next.delete("photo");
      }
    });
  }

  async function save(draft: QualityDraft) {
    const saved = await saveSustainabilityQuality({
      title: draft.title.trim(),
      body: draft.body.trim(),
      image: { src: draft.image.src, alt: draft.image.alt.trim() },
      steps: draft.steps.map((step) => ({
        id: step.id,
        text: step.text.trim(),
        isActive: step.isActive !== false,
      })),
      badges: draft.badges.map((badge) => ({
        id: badge.id,
        icon: badge.icon || "check_circle",
        label: badge.label.trim(),
        isActive: badge.isActive !== false,
      })),
    });
    setQuality(saved);
    setNotice("Saved.");
    window.setTimeout(() => setNotice(""), 1600);
    setEditing(false);
  }

  if (!quality) {
    return (
      <div className="min-w-0 space-y-4">
        <SustainHeader
          sectionId="quality"
          title="Quality"
          description="Check process and badges."
        />
        <p className="text-sm text-neutral-600">
          {loadError || "Loading the quality section…"}
        </p>
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-4">
      <SustainHeader
        sectionId="quality"
        title="Quality"
        description="Check process and badges."
        extra={
          <button
            ref={focusEdit}
            type="button"
            onClick={() => setEditing(true)}
            className={adminButtonClass.primary}
          >
            <MaterialIcon name="edit" className="text-[18px]" />
            Edit quality
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
        aria-labelledby="sustain-quality-card-heading"
      >
        <div className="border-b border-neutral-100 px-4 py-3 sm:px-5">
          <h2
            id="sustain-quality-card-heading"
            className="text-sm font-semibold text-neutral-950"
          >
            Quality
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Shown on the sustainability page. The photo is on the left. Steps
            and badges are on the right.
          </p>
        </div>
        {empty ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm font-semibold text-neutral-950">
              No quality content yet
            </p>
            <p className="mx-auto mt-1 max-w-md text-sm text-neutral-500">
              Add the heading, photo, check steps, and badges.
            </p>
          </div>
        ) : (
          <div className="bg-admin-canvas p-4 sm:p-5">
            <QualityPreview quality={quality} />
          </div>
        )}
      </section>

      {editing ? (
        <QualityFormModal
          quality={quality}
          onClose={() => setEditing(false)}
          onSave={save}
        />
      ) : null}
    </div>
  );
}

function QualityPreview({ quality }: { quality: SustainabilityQuality }) {
  return (
    <div className="flex items-start gap-4">
      <div className="relative aspect-4/5 w-24 shrink-0 overflow-hidden rounded-xl bg-white ring-1 ring-neutral-200 sm:w-28">
        {quality.image.src ? (
          <Image
            src={quality.image.src}
            alt=""
            fill
            sizes="112px"
            className="object-cover"
          />
        ) : (
          <span className="grid size-full place-items-center px-2 text-center text-xs text-neutral-500">
            No photo
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xl font-semibold text-neutral-950">
          {quality.title.trim() || "Title"}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-neutral-600">
          {quality.body.trim() || "Body"}
        </p>
        {quality.steps.length === 0 ? (
          <p className="mt-5 text-sm text-neutral-500">No steps yet</p>
        ) : (
          <ol className="mt-5 space-y-3">
            {quality.steps.map((step, index) => {
              const hidden = step.isActive === false;
              const number = quality.steps
                .slice(0, index + 1)
                .filter((item) => item.isActive !== false).length;
              return (
                <li
                  key={step.id}
                  className={cn(
                    "flex items-start gap-3",
                    hidden && "opacity-50",
                  )}
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {hidden ? "–" : number}
                  </span>
                  <span className="pt-0.5 text-sm text-neutral-700">
                    {step.text || "Empty step"}
                    {hidden ? (
                      <span className="ml-2 rounded-full bg-neutral-950/80 px-2 py-0.5 text-[11px] font-semibold text-white">
                        Hidden
                      </span>
                    ) : null}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
        {quality.badges.length === 0 ? (
          <p className="mt-5 text-sm text-neutral-500">No badges yet</p>
        ) : (
          <div className="mt-5 flex flex-wrap gap-2">
            {quality.badges.map((badge) => {
              const hidden = badge.isActive === false;
              return (
                <span
                  key={badge.id}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 ring-1 ring-neutral-200",
                    hidden && "opacity-50",
                  )}
                >
                  <MaterialIcon
                    name={badge.icon || "notes"}
                    className="text-[16px] text-primary"
                  />
                  {badge.label || "Empty badge"}
                  {hidden ? " · Hidden" : ""}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function QualityFormModal({
  quality,
  onClose,
  onSave,
}: {
  quality: SustainabilityQuality;
  onClose: () => void;
  onSave: (draft: QualityDraft) => void | Promise<void>;
}) {
  const initial = draftFrom(quality);
  const [draft, setDraft] = useState(initial);
  const [baseline] = useState(initial);
  const [titleError, setTitleError] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [stepError, setStepError] = useState("");
  const [badgeError, setBadgeError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(0);
  const formId = useId();

  async function save() {
    if (saving || uploading > 0) return;
    const nextTitleError = draft.title.trim() ? "" : "Title is required.";
    // The photo is optional; alt text is only required when a photo is present.
    const nextPhotoError = optionalImageErrors(draft.image).alt;
    const nextStepError = draft.steps.some((step) => !step.text.trim())
      ? "Write each step, or remove the empty one."
      : "";
    const nextBadgeError = draft.badges.some((badge) => !badge.label.trim())
      ? "Write each badge, or remove the empty one."
      : "";
    setTitleError(nextTitleError);
    setPhotoError(nextPhotoError);
    setStepError(nextStepError);
    setBadgeError(nextBadgeError);
    if (draft.steps.length > 12) {
      setStepError("You can add up to 12 steps");
      return;
    }
    if (draft.badges.length > 12) {
      setBadgeError("You can add up to 12 badges");
      return;
    }
    if (nextTitleError || nextPhotoError || nextStepError || nextBadgeError) {
      return;
    }
    setSaving(true);
    setPhotoError("");
    setSaveError("");
    try {
      await onSave(draft);
    } catch (caught) {
      setSaving(false);
      setSaveError(
        caught instanceof Error
          ? caught.message
          : "Could not save the quality section.",
      );
    }
  }

  function moveSteps(index: number, direction: -1 | 1) {
    setDraft((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.steps.length) return current;
      const steps = [...current.steps];
      const [item] = steps.splice(index, 1);
      if (!item) return current;
      steps.splice(target, 0, item);
      return { ...current, steps };
    });
  }

  function moveBadges(index: number, direction: -1 | 1) {
    setDraft((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.badges.length) return current;
      const badges = [...current.badges];
      const [item] = badges.splice(index, 1);
      if (!item) return current;
      badges.splice(target, 0, item);
      return { ...current, badges };
    });
  }

  return (
    <FormCloseGuard baseline={baseline} value={draft} onClose={onClose}>
      <AdminFormModal titleId="sustain-quality-drawer-title" size="lg">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-neutral-100 px-5 py-4">
          <div className="min-w-0">
            <h2
              id="sustain-quality-drawer-title"
              className="text-lg font-semibold text-neutral-950"
            >
              Edit quality
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              Update the heading, photo, steps, and badges for this section.
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
              The words beside the photo.
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
              Photo
            </h3>
            <p className="mt-1 text-sm text-neutral-500">
              Optional. Shown on the left of the section; without a photo the
              section uses a text-only layout.
            </p>
            <div className="mt-3">
              <SingleImageField
                id={`${formId}-photo-field`}
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

          <section
            className="border-t border-neutral-100 pt-5"
            aria-labelledby={`${formId}-steps`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3
                  id={`${formId}-steps`}
                  className="text-sm font-semibold text-neutral-950"
                >
                  Steps
                </h3>
                <p className="mt-1 text-sm text-neutral-500">
                  Numbered checks under the paragraph. Hidden steps stay here
                  but do not appear on the website.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const item = blankSustainText();
                  setDraft((current) => ({
                    ...current,
                    steps: [
                      ...current.steps,
                      { id: uniqueId(item.id), text: "", isActive: true },
                    ],
                  }));
                  setStepError("");
                }}
                className={adminButtonClass.secondary}
              >
                <MaterialIcon name="add" className="text-[18px]" />
                Add step
              </button>
            </div>
            {stepError ? (
              <div className="mt-3">
                <FieldError message={stepError} />
              </div>
            ) : null}
            {draft.steps.length === 0 ? (
              <p className="mt-3 text-sm text-neutral-500">No steps yet.</p>
            ) : (
              <ol className="mt-3 space-y-3">
                {draft.steps.map((step, index) => (
                  <li key={step.id} className="rounded-2xl bg-admin-canvas p-3">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-neutral-950">
                        Step {index + 1}
                      </p>
                      <div className="flex items-center">
                        <IconButton
                          label={`Move step ${index + 1} earlier`}
                          icon="arrow_upward"
                          disabled={index === 0}
                          onClick={() => moveSteps(index, -1)}
                        />
                        <IconButton
                          label={`Move step ${index + 1} later`}
                          icon="arrow_downward"
                          disabled={index === draft.steps.length - 1}
                          onClick={() => moveSteps(index, 1)}
                        />
                        <IconButton
                          label={`Remove step ${index + 1}`}
                          icon="delete"
                          danger
                          onClick={() => {
                            setDraft((current) => ({
                              ...current,
                              steps: current.steps.filter(
                                (item) => item.id !== step.id,
                              ),
                            }));
                            setStepError("");
                          }}
                        />
                      </div>
                    </div>
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-medium text-neutral-700">
                        Step <span className="text-red-700">*</span>
                      </span>
                      <textarea
                        value={step.text}
                        rows={2}
                        placeholder="What happens at this step"
                        aria-label={`Step ${index + 1}`}
                        onChange={(event) => {
                          const text = event.target.value;
                          setDraft((current) => ({
                            ...current,
                            steps: current.steps.map((item) =>
                              item.id === step.id ? { ...item, text } : item,
                            ),
                          }));
                          setStepError("");
                        }}
                        className={cn(
                          adminFieldClass,
                          "h-auto py-3",
                          stepError && !step.text.trim() && "border-red-400",
                        )}
                      />
                    </label>
                    <VisibilitySwitch
                      checked={step.isActive !== false}
                      showLabel={`Show step ${index + 1}`}
                      hideLabel={`Hide step ${index + 1}`}
                      onChange={(isActive) =>
                        setDraft((current) => ({
                          ...current,
                          steps: current.steps.map((item) =>
                            item.id === step.id ? { ...item, isActive } : item,
                          ),
                        }))
                      }
                    />
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section
            className="border-t border-neutral-100 pt-5"
            aria-labelledby={`${formId}-badges`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3
                  id={`${formId}-badges`}
                  className="text-sm font-semibold text-neutral-950"
                >
                  Badges
                </h3>
                <p className="mt-1 text-sm text-neutral-500">
                  Short labels under the steps. Hidden badges stay here but do
                  not appear on the website.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const item = blankSustainBadge();
                  setDraft((current) => ({
                    ...current,
                    badges: [
                      ...current.badges,
                      {
                        id: uniqueId(item.id),
                        icon: item.icon,
                        label: "",
                        isActive: true,
                      },
                    ],
                  }));
                  setBadgeError("");
                }}
                className={adminButtonClass.secondary}
              >
                <MaterialIcon name="add" className="text-[18px]" />
                Add badge
              </button>
            </div>
            {badgeError ? (
              <div className="mt-3">
                <FieldError message={badgeError} />
              </div>
            ) : null}
            {draft.badges.length === 0 ? (
              <p className="mt-3 text-sm text-neutral-500">No badges yet.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {draft.badges.map((badge, index) => (
                  <li
                    key={badge.id}
                    className="rounded-2xl bg-admin-canvas p-3"
                  >
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-neutral-950">
                        Badge {index + 1}
                      </p>
                      <div className="flex items-center">
                        <IconButton
                          label={`Move badge ${index + 1} earlier`}
                          icon="arrow_upward"
                          disabled={index === 0}
                          onClick={() => moveBadges(index, -1)}
                        />
                        <IconButton
                          label={`Move badge ${index + 1} later`}
                          icon="arrow_downward"
                          disabled={index === draft.badges.length - 1}
                          onClick={() => moveBadges(index, 1)}
                        />
                        <IconButton
                          label={`Remove badge ${index + 1}`}
                          icon="delete"
                          danger
                          onClick={() => {
                            setDraft((current) => ({
                              ...current,
                              badges: current.badges.filter(
                                (item) => item.id !== badge.id,
                              ),
                            }));
                            setBadgeError("");
                          }}
                        />
                      </div>
                    </div>
                    <IconPicker
                      value={badge.icon}
                      onChange={(icon) =>
                        setDraft((current) => ({
                          ...current,
                          badges: current.badges.map((item) =>
                            item.id === badge.id ? { ...item, icon } : item,
                          ),
                        }))
                      }
                    />
                    <label className="mt-3 block">
                      <span className="mb-1.5 block text-sm font-medium text-neutral-700">
                        Label <span className="text-red-700">*</span>
                      </span>
                      <input
                        value={badge.label}
                        placeholder="Checked before delivery"
                        aria-label={`Label for badge ${index + 1}`}
                        onChange={(event) => {
                          const label = event.target.value;
                          setDraft((current) => ({
                            ...current,
                            badges: current.badges.map((item) =>
                              item.id === badge.id ? { ...item, label } : item,
                            ),
                          }));
                          setBadgeError("");
                        }}
                        className={cn(
                          adminFieldClass,
                          badgeError && !badge.label.trim() && "border-red-400",
                        )}
                      />
                    </label>
                    <VisibilitySwitch
                      checked={badge.isActive !== false}
                      showLabel={`Show badge ${index + 1}`}
                      hideLabel={`Hide badge ${index + 1}`}
                      onChange={(isActive) =>
                        setDraft((current) => ({
                          ...current,
                          badges: current.badges.map((item) =>
                            item.id === badge.id ? { ...item, isActive } : item,
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
