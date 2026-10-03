"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import { cn } from "@/lib/utils";

import { AdminFormModal } from "../../../_components/admin-form-modal";
import {
  ActiveStatusField,
  adminButtonClass,
  adminFieldClass,
  AdminPageHeader,
  FieldError,
  FieldLabel,
  VisibilityBadge,
} from "../../../_components/admin-ui";
import { FormCloseGuard } from "../../../_components/form-close-guard";
import { ImageField } from "../../../_components/image-field";
import { findCmsPage } from "../../../_config/cms";

export const SUSTAIN_ICONS: { name: string; label: string }[] = [
  { name: "payments", label: "Payments" },
  { name: "local_shipping", label: "Delivery" },
  { name: "assignment_return", label: "Returns" },
  { name: "verified", label: "Verified" },
  { name: "eco", label: "Eco" },
  { name: "check_circle", label: "Checked" },
  { name: "volunteer_activism", label: "Care" },
  { name: "category", label: "Category" },
  { name: "location_on", label: "Location" },
  { name: "design_services", label: "Design" },
  { name: "back_hand", label: "Handmade" },
  { name: "checkroom", label: "Dresses" },
  { name: "visibility", label: "Visibility" },
  { name: "rocket_launch", label: "Launch" },
  { name: "search", label: "Search" },
  { name: "task_alt", label: "Done" },
  { name: "storefront", label: "Store" },
  { name: "support_agent", label: "Support" },
  { name: "favorite", label: "Favorite" },
  { name: "shield", label: "Shield" },
];

export function iconChoices(current: string) {
  if (SUSTAIN_ICONS.some((icon) => icon.name === current)) return SUSTAIN_ICONS;
  return [{ name: current, label: current }, ...SUSTAIN_ICONS];
}

export function iconLabel(name: string) {
  return SUSTAIN_ICONS.find((icon) => icon.name === name)?.label ?? name;
}

export function useFocusWhenClosed(open: boolean) {
  const focusRef = useRef<string | null>(null);

  useEffect(() => {
    if (open || !focusRef.current) return;
    const id = focusRef.current;
    focusRef.current = null;
    document.getElementById(id)?.focus();
  }, [open]);

  return focusRef;
}

export function replaceSearch(
  router: ReturnType<typeof useRouter>,
  pathname: string,
  mutate: (params: URLSearchParams) => void,
) {
  const next = new URLSearchParams(window.location.search);
  mutate(next);
  const query = next.toString();
  router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
}

export function useSustainNav() {
  const pathname = usePathname();
  const router = useRouter();
  return { pathname, router };
}

export function SustainHeader({
  sectionId,
  title,
  description,
  extra,
}: {
  sectionId: string;
  title: string;
  description: string;
  extra?: ReactNode;
}) {
  const page = findCmsPage("sustainability");
  return (
    <div>
      <nav
        aria-label="Breadcrumb"
        className="mb-3 flex flex-wrap items-center gap-1 text-sm text-neutral-500"
      >
        <Link
          href="/admin/pages/sustainability"
          className="font-medium hover:text-neutral-950"
        >
          Sustainability
        </Link>
        <MaterialIcon
          name="chevron_right"
          className="text-[16px] text-neutral-300"
        />
        <span className="font-medium text-neutral-950">{title}</span>
      </nav>
      {page ? (
        <div
          className="mb-4 flex gap-2 overflow-x-auto pb-1"
          aria-label="Sustainability sections"
        >
          {page.sections.map((section) => {
            const active = section.id === sectionId;
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
        title={title}
        description={description}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <a
              href="/sustainability"
              target="_blank"
              rel="noreferrer"
              className={adminButtonClass.secondary}
            >
              View on site
              <MaterialIcon name="open_in_new" className="text-[18px]" />
            </a>
            {extra}
          </div>
        }
      />
    </div>
  );
}

export function SavedLine({ notice, open }: { notice: string; open: boolean }) {
  if (!notice || open) return null;
  return (
    <p role="status" className="text-sm font-medium text-emerald-800">
      {notice}. This section is up to date.
    </p>
  );
}

export function MissingLine({
  show,
  onClose,
}: {
  show: boolean;
  onClose: () => void;
}) {
  if (!show) return null;
  return (
    <p className="rounded-2xl bg-white px-4 py-3 text-sm text-neutral-600 ring-1 ring-neutral-200/90">
      This record is no longer here.{" "}
      <button
        type="button"
        onClick={onClose}
        className="font-medium text-primary"
      >
        Close
      </button>
    </p>
  );
}

export function DrawerOverlay({
  titleId,
  children,
}: {
  titleId: string;
  children: ReactNode;
}) {
  return (
    <AdminFormModal titleId={titleId} size="sm">
      {children}
    </AdminFormModal>
  );
}

function DrawerHead({
  title,
  description,
  titleId,
  onClose,
  closeLabel = "Close",
}: {
  title: string;
  description: string;
  titleId?: string;
  onClose: () => void;
  closeLabel?: string;
}) {
  return (
    <div className="flex shrink-0 items-start justify-between gap-3 border-b border-neutral-100 px-5 py-4">
      <div className="min-w-0">
        <h2 id={titleId} className="text-lg font-semibold text-neutral-950">
          {title}
        </h2>
        <p className="mt-1 text-sm text-neutral-500">{description}</p>
      </div>
      <button
        type="button"
        data-form-dismiss=""
        aria-label={closeLabel}
        title={closeLabel}
        onClick={onClose}
        className="grid size-9 shrink-0 place-items-center rounded-full text-neutral-500 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <MaterialIcon name="close" className="text-[20px]" />
      </button>
    </div>
  );
}

function DrawerFoot({
  notice,
  onClose,
  onSave,
  saving,
  uploading,
  createLabel,
  editLabel = "Save changes",
  creating,
}: {
  notice: string;
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
  uploading?: boolean;
  createLabel: string;
  editLabel?: string;
  creating: boolean;
}) {
  return (
    <div className="flex shrink-0 items-center justify-end gap-2 border-t border-neutral-100 px-5 py-3">
      {notice ? (
        <p
          role="status"
          className="mr-auto text-sm font-medium text-emerald-800"
        >
          {notice}
        </p>
      ) : null}
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
        onClick={onSave}
        disabled={saving || uploading}
        className={adminButtonClass.primary}
      >
        {saving
          ? "Saving…"
          : uploading
            ? "Uploading…"
            : creating
              ? createLabel
              : editLabel}
      </button>
    </div>
  );
}

export function IconPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (name: string) => void;
}) {
  return (
    <div>
      <FieldLabel>Icon</FieldLabel>
      <div className="flex flex-wrap gap-1.5">
        {iconChoices(value).map((icon) => (
          <button
            key={icon.name}
            type="button"
            aria-pressed={value === icon.name}
            aria-label={icon.label}
            onClick={() => onChange(icon.name)}
            className={cn(
              "grid size-10 place-items-center rounded-xl ring-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              value === icon.name
                ? "bg-primary/10 text-primary ring-primary/30"
                : "bg-white text-neutral-600 ring-neutral-200",
            )}
          >
            <MaterialIcon name={icon.name} className="text-[20px]" />
          </button>
        ))}
      </div>
    </div>
  );
}

export function TextPanel({
  creating,
  noun,
  titleId,
  initial,
  active = true,
  notice,
  onClose,
  onSave,
}: {
  creating: boolean;
  noun: string;
  titleId?: string;
  initial: string;
  active?: boolean;
  notice: string;
  onClose: () => void;
  onSave: (text: string, isActive: boolean) => void;
}) {
  const [text, setText] = useState(initial);
  const [isActive, setActive] = useState(active !== false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const fieldId = useId();
  const baseline = useRef({ text: initial, isActive: active !== false });

  function save() {
    if (saving) return;
    const next = text.trim();
    if (!next) {
      setError(`${noun} is required.`);
      return;
    }
    setSaving(true);
    onSave(next, isActive);
  }

  return (
    <FormCloseGuard
      baseline={baseline.current}
      value={{ text, isActive }}
      onClose={onClose}
    >
      <div className="flex min-h-0 flex-1 flex-col border-t border-neutral-100 first:border-t-0">
        <DrawerHead
          title={
            creating
              ? `Add ${noun.toLowerCase()}`
              : `Edit ${noun.toLowerCase()}`
          }
          description={
            creating
              ? `Write the new ${noun.toLowerCase()}.`
              : `Update this ${noun.toLowerCase()}.`
          }
          titleId={titleId}
          onClose={onClose}
        />
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <ActiveStatusField checked={isActive} onChange={setActive} />
          <div>
            <FieldLabel htmlFor={fieldId}>
              {noun} <span className="text-red-700">*</span>
            </FieldLabel>
            <textarea
              id={fieldId}
              autoFocus
              value={text}
              rows={5}
              placeholder={`Write the ${noun.toLowerCase()}`}
              onChange={(event) => {
                setText(event.target.value);
                setError("");
              }}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `${fieldId}-error` : undefined}
              className={cn(
                adminFieldClass,
                "h-auto py-3",
                error && "border-red-400",
              )}
            />
            {error ? (
              <div id={`${fieldId}-error`}>
                <FieldError message={error} />
              </div>
            ) : null}
          </div>
        </div>
        <DrawerFoot
          notice={notice}
          onClose={onClose}
          onSave={save}
          saving={saving}
          creating={creating}
          createLabel={`Save ${noun.toLowerCase()}`}
        />
      </div>
    </FormCloseGuard>
  );
}

export function StatPanel({
  creating,
  titleId,
  initial,
  notice,
  onClose,
  onSave,
}: {
  creating: boolean;
  titleId?: string;
  initial: { icon: string; value: string; label: string; isActive?: boolean };
  notice: string;
  onClose: () => void;
  onSave: (draft: {
    icon: string;
    value: string;
    label: string;
    isActive: boolean;
  }) => void | Promise<void>;
}) {
  const [draft, setDraft] = useState(() => ({
    ...initial,
    isActive: initial.isActive !== false,
  }));
  const [baseline] = useState(draft);
  const [valueError, setValueError] = useState("");
  const [labelError, setLabelError] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const valueId = useId();
  const labelId = useId();

  async function save() {
    if (saving) return;
    const value = draft.value.trim();
    const label = draft.label.trim();
    setValueError(value ? "" : "Value is required.");
    setLabelError(label ? "" : "Label is required.");
    if (!value || !label) return;
    setSaving(true);
    setError("");
    try {
      await onSave({
        icon: draft.icon || "verified",
        value,
        label,
        isActive: draft.isActive,
      });
    } catch (caught) {
      setSaving(false);
      setError(
        caught instanceof Error ? caught.message : "Could not save the stat.",
      );
    }
  }

  return (
    <FormCloseGuard baseline={baseline} value={draft} onClose={onClose}>
      <div className="flex min-h-0 flex-1 flex-col">
        <DrawerHead
          title={creating ? "Add stat" : "Edit stat"}
          description={
            creating ? "Add a number and a short label." : "Update this stat."
          }
          titleId={titleId}
          onClose={onClose}
        />
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {error ? <FieldError message={error} /> : null}
          <ActiveStatusField
            checked={draft.isActive}
            onChange={(isActive) => setDraft({ ...draft, isActive })}
          />
          <IconPicker
            value={draft.icon}
            onChange={(icon) => setDraft({ ...draft, icon })}
          />
          <div>
            <FieldLabel htmlFor={valueId}>
              Value <span className="text-red-700">*</span>
            </FieldLabel>
            <input
              id={valueId}
              autoFocus
              value={draft.value}
              placeholder="64"
              onChange={(event) => {
                setDraft({ ...draft, value: event.target.value });
                setValueError("");
              }}
              aria-invalid={valueError ? true : undefined}
              aria-describedby={valueError ? `${valueId}-error` : undefined}
              className={cn(adminFieldClass, valueError && "border-red-400")}
            />
            {valueError ? (
              <div id={`${valueId}-error`}>
                <FieldError message={valueError} />
              </div>
            ) : null}
          </div>
          <div>
            <FieldLabel htmlFor={labelId}>
              Label <span className="text-red-700">*</span>
            </FieldLabel>
            <input
              id={labelId}
              value={draft.label}
              placeholder="Districts we deliver to"
              onChange={(event) => {
                setDraft({ ...draft, label: event.target.value });
                setLabelError("");
              }}
              aria-invalid={labelError ? true : undefined}
              aria-describedby={labelError ? `${labelId}-error` : undefined}
              className={cn(adminFieldClass, labelError && "border-red-400")}
            />
            {labelError ? (
              <div id={`${labelId}-error`}>
                <FieldError message={labelError} />
              </div>
            ) : null}
          </div>
        </div>
        <DrawerFoot
          notice={notice}
          onClose={onClose}
          onSave={save}
          saving={saving}
          creating={creating}
          createLabel="Save stat"
        />
      </div>
    </FormCloseGuard>
  );
}

export function CardPanel({
  creating,
  noun,
  titleId,
  initial,
  notice,
  onClose,
  onSave,
}: {
  creating: boolean;
  noun: string;
  titleId?: string;
  initial: {
    icon: string;
    title: string;
    description: string;
    isActive?: boolean;
  };
  notice: string;
  onClose: () => void;
  onSave: (draft: {
    icon: string;
    title: string;
    description: string;
    isActive: boolean;
  }) => void;
}) {
  const [draft, setDraft] = useState(() => ({
    ...initial,
    isActive: initial.isActive !== false,
  }));
  const baseline = useRef(draft);
  const [titleError, setTitleError] = useState("");
  const [descriptionError, setDescriptionError] = useState("");
  const [saving, setSaving] = useState(false);
  const titleField = useId();
  const descriptionId = useId();

  function save() {
    if (saving) return;
    const nextTitle = draft.title.trim();
    const nextDescription = draft.description.trim();
    setTitleError(nextTitle ? "" : "Title is required.");
    setDescriptionError(nextDescription ? "" : "Description is required.");
    if (!nextTitle || !nextDescription) return;
    setSaving(true);
    onSave({
      icon: draft.icon || "verified",
      title: nextTitle,
      description: nextDescription,
      isActive: draft.isActive,
    });
  }

  return (
    <FormCloseGuard baseline={baseline.current} value={draft} onClose={onClose}>
      <div className="flex min-h-0 flex-1 flex-col">
        <DrawerHead
          title={
            creating
              ? `Add ${noun.toLowerCase()}`
              : `Edit ${noun.toLowerCase()}`
          }
          description={
            creating
              ? `Add a new ${noun.toLowerCase()}.`
              : `Update this ${noun.toLowerCase()}.`
          }
          titleId={titleId}
          onClose={onClose}
        />
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <ActiveStatusField
            checked={draft.isActive}
            onChange={(isActive) => setDraft({ ...draft, isActive })}
          />
          <IconPicker
            value={draft.icon}
            onChange={(icon) => setDraft({ ...draft, icon })}
          />
          <div>
            <FieldLabel htmlFor={titleField}>
              Title <span className="text-red-700">*</span>
            </FieldLabel>
            <input
              id={titleField}
              autoFocus
              value={draft.title}
              placeholder="What this point is called"
              onChange={(event) => {
                setDraft({ ...draft, title: event.target.value });
                setTitleError("");
              }}
              aria-invalid={titleError ? true : undefined}
              aria-describedby={titleError ? `${titleField}-error` : undefined}
              className={cn(adminFieldClass, titleError && "border-red-400")}
            />
            {titleError ? (
              <div id={`${titleField}-error`}>
                <FieldError message={titleError} />
              </div>
            ) : null}
          </div>
          <div>
            <FieldLabel htmlFor={descriptionId}>
              Description <span className="text-red-700">*</span>
            </FieldLabel>
            <textarea
              id={descriptionId}
              value={draft.description}
              rows={4}
              placeholder="A short explanation"
              onChange={(event) => {
                setDraft({ ...draft, description: event.target.value });
                setDescriptionError("");
              }}
              aria-invalid={descriptionError ? true : undefined}
              aria-describedby={
                descriptionError ? `${descriptionId}-error` : undefined
              }
              className={cn(
                adminFieldClass,
                "h-auto py-3",
                descriptionError && "border-red-400",
              )}
            />
            {descriptionError ? (
              <div id={`${descriptionId}-error`}>
                <FieldError message={descriptionError} />
              </div>
            ) : null}
          </div>
        </div>
        <DrawerFoot
          notice={notice}
          onClose={onClose}
          onSave={save}
          saving={saving}
          creating={creating}
          createLabel={`Save ${noun.toLowerCase()}`}
        />
      </div>
    </FormCloseGuard>
  );
}

export function BadgePanel({
  creating,
  titleId,
  initial,
  notice,
  onClose,
  onSave,
}: {
  creating: boolean;
  titleId?: string;
  initial: { icon: string; label: string; isActive?: boolean };
  notice: string;
  onClose: () => void;
  onSave: (draft: { icon: string; label: string; isActive: boolean }) => void;
}) {
  const [draft, setDraft] = useState(() => ({
    ...initial,
    isActive: initial.isActive !== false,
  }));
  const baseline = useRef(draft);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const fieldId = useId();

  function save() {
    if (saving) return;
    const label = draft.label.trim();
    if (!label) {
      setError("Label is required.");
      return;
    }
    setSaving(true);
    onSave({
      icon: draft.icon || "check_circle",
      label,
      isActive: draft.isActive,
    });
  }

  return (
    <FormCloseGuard baseline={baseline.current} value={draft} onClose={onClose}>
      <div className="flex min-h-0 flex-1 flex-col border-t border-neutral-100 first:border-t-0">
        <DrawerHead
          title={creating ? "Add badge" : "Edit badge"}
          description={
            creating
              ? "Add a short badge for this section."
              : "Update this badge."
          }
          titleId={titleId}
          onClose={onClose}
          closeLabel="Close badge"
        />
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <ActiveStatusField
            checked={draft.isActive}
            onChange={(isActive) => setDraft({ ...draft, isActive })}
          />
          <IconPicker
            value={draft.icon}
            onChange={(icon) => setDraft({ ...draft, icon })}
          />
          <div>
            <FieldLabel htmlFor={fieldId}>
              Label <span className="text-red-700">*</span>
            </FieldLabel>
            <input
              id={fieldId}
              autoFocus
              value={draft.label}
              placeholder="Checked before delivery"
              onChange={(event) => {
                setDraft({ ...draft, label: event.target.value });
                setError("");
              }}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `${fieldId}-error` : undefined}
              className={cn(adminFieldClass, error && "border-red-400")}
            />
            {error ? (
              <div id={`${fieldId}-error`}>
                <FieldError message={error} />
              </div>
            ) : null}
          </div>
        </div>
        <DrawerFoot
          notice={notice}
          onClose={onClose}
          onSave={save}
          saving={saving}
          creating={creating}
          createLabel="Save badge"
        />
      </div>
    </FormCloseGuard>
  );
}

export function ImagePanel({
  creating,
  titleId,
  initial,
  publishable = false,
  notice,
  onClose,
  onSave,
}: {
  creating: boolean;
  titleId?: string;
  initial: { src: string; alt: string; isActive?: boolean };
  publishable?: boolean;
  notice: string;
  onClose: () => void;
  onSave: (draft: { src: string; alt: string; isActive?: boolean }) => void;
}) {
  const [draft, setDraft] = useState(() => ({
    src: initial.src,
    alt: initial.alt,
    isActive: initial.isActive !== false,
  }));
  const baseline = useRef(draft);
  const [imageError, setImageError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const altId = useId();

  function save() {
    if (saving || uploading) return;
    if (!draft.src) {
      setImageError("Image is required.");
      return;
    }
    setSaving(true);
    onSave({
      src: draft.src,
      alt: draft.alt.trim(),
      ...(publishable ? { isActive: draft.isActive } : {}),
    });
  }

  return (
    <FormCloseGuard baseline={baseline.current} value={draft} onClose={onClose}>
      <div className="flex min-h-0 flex-1 flex-col border-t border-neutral-100 first:border-t-0">
        <DrawerHead
          title={creating ? "Add photo" : "Edit photo"}
          description={
            creating ? "Add a photo for this section." : "Update this photo."
          }
          titleId={titleId}
          onClose={onClose}
          closeLabel="Close photo"
        />
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {publishable ? (
            <ActiveStatusField
              checked={draft.isActive}
              onChange={(isActive) => setDraft({ ...draft, isActive })}
            />
          ) : null}
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-neutral-100 ring-1 ring-neutral-200">
            {draft.src ? (
              <Image
                src={draft.src}
                alt=""
                fill
                sizes="400px"
                className="object-cover"
              />
            ) : (
              <span className="grid size-full place-items-center text-sm text-neutral-500">
                Photo
              </span>
            )}
          </div>
          <ImageField
            value={draft.src}
            onChange={(src) => {
              setDraft({ ...draft, src });
              setImageError("");
            }}
            onBusy={setUploading}
            confirmRemove
          />
          {imageError ? (
            <div id={`${altId}-image-error`}>
              <FieldError message={imageError} />
            </div>
          ) : null}
          <div>
            <FieldLabel htmlFor={altId}>Image description</FieldLabel>
            <input
              id={altId}
              value={draft.alt}
              placeholder="What the photo shows"
              onChange={(event) =>
                setDraft({ ...draft, alt: event.target.value })
              }
              className={adminFieldClass}
            />
            <p className="mt-1.5 text-xs text-neutral-500">
              Read by screen readers when the photo is shown.
            </p>
          </div>
        </div>
        <DrawerFoot
          notice={notice}
          onClose={onClose}
          onSave={save}
          saving={saving}
          uploading={uploading}
          creating={creating}
          createLabel="Save photo"
        />
      </div>
    </FormCloseGuard>
  );
}

export type ListItem = {
  id: string;
  buttonId: string;
  title: string;
  meta: string;
  reorder: string;
  imageSrc?: string;
  icon?: string;
  active?: boolean;
};

export function RecordList({
  headingId,
  title,
  emptyTitle,
  emptyBody,
  emptyAction,
  onEmpty,
  items,
  selected,
  savedId,
  confirmId,
  dragId,
  overId,
  onOpen,
  onDrag,
  onOver,
  onDrop,
  onMove,
  onAskRemove,
  onRemove,
  removeLabel,
}: {
  headingId: string;
  title: string;
  emptyTitle: string;
  emptyBody: string;
  emptyAction: string;
  onEmpty: () => void;
  items: ListItem[];
  selected: string | null;
  savedId: string | null;
  confirmId: string | null;
  dragId: string | null;
  overId: string | null;
  onOpen: (id: string) => void;
  onDrag: (id: string | null) => void;
  onOver: (id: string | null) => void;
  onDrop: (id: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onAskRemove: (id: string | null) => void;
  onRemove: (id: string) => void;
  removeLabel: string;
}) {
  return (
    <section
      className="overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200/90"
      aria-labelledby={headingId}
    >
      <div className="border-b border-neutral-100 px-4 py-3 sm:px-5">
        <h2 id={headingId} className="text-sm font-semibold text-neutral-950">
          {title}
        </h2>
      </div>
      {items.length === 0 ? (
        <div className="px-4 py-10 text-center">
          <p className="text-sm font-semibold text-neutral-950">{emptyTitle}</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-neutral-500">
            {emptyBody}
          </p>
          <button
            type="button"
            onClick={onEmpty}
            className={cn(adminButtonClass.primary, "mt-4")}
          >
            <MaterialIcon name="add" className="text-[18px]" />
            {emptyAction}
          </button>
        </div>
      ) : (
        <ol>
          {items.map((item, index) => (
            <li
              key={item.id}
              onDragOver={(event) => {
                event.preventDefault();
                onOver(item.id);
              }}
              onDrop={(event) => {
                event.preventDefault();
                onDrop(item.id);
              }}
              className={cn(
                "border-t border-neutral-100 first:border-t-0",
                selected === item.id && "bg-primary/5",
                savedId === item.id && "bg-emerald-50",
                overId === item.id &&
                  dragId &&
                  dragId !== item.id &&
                  "bg-primary/10",
                dragId === item.id && "opacity-60",
              )}
            >
              <div className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:px-4">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <button
                    type="button"
                    draggable
                    aria-label={`Reorder ${item.reorder}`}
                    onDragStart={(event) => {
                      event.dataTransfer.setData("text/plain", item.id);
                      event.dataTransfer.effectAllowed = "move";
                      onDrag(item.id);
                    }}
                    onDragEnd={() => {
                      onDrag(null);
                      onOver(null);
                    }}
                    className="grid size-9 shrink-0 cursor-grab place-items-center rounded-full text-neutral-400 hover:bg-neutral-100 active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  >
                    <MaterialIcon
                      name="drag_indicator"
                      className="text-[18px]"
                    />
                  </button>
                  <button
                    id={item.buttonId}
                    type="button"
                    onClick={() => onOpen(item.id)}
                    className="flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  >
                    <span className="w-5 shrink-0 text-right text-xs text-neutral-400 tabular-nums">
                      {index + 1}
                    </span>
                    {item.imageSrc !== undefined ? (
                      <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                        {item.imageSrc ? (
                          <Image
                            src={item.imageSrc}
                            alt=""
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        ) : (
                          <span className="grid size-full place-items-center text-neutral-400">
                            <MaterialIcon
                              name="image"
                              className="text-[18px]"
                            />
                          </span>
                        )}
                      </span>
                    ) : item.icon ? (
                      <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-admin-canvas text-primary">
                        <MaterialIcon
                          name={item.icon}
                          className="text-[22px]"
                        />
                      </span>
                    ) : null}
                    <span className="min-w-0">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="line-clamp-2 text-sm font-semibold text-neutral-950">
                          {item.title}
                        </span>
                        {item.active === undefined ? null : (
                          <VisibilityBadge active={item.active} />
                        )}
                      </span>
                      <span className="mt-0.5 line-clamp-2 block text-xs text-neutral-500">
                        {item.meta}
                      </span>
                    </span>
                  </button>
                </div>
                <div className="flex shrink-0 flex-wrap items-center justify-end gap-1 pl-11 sm:pl-0">
                  <IconButton
                    label="Move earlier"
                    icon="arrow_upward"
                    disabled={index === 0}
                    onClick={() => onMove(item.id, -1)}
                  />
                  <IconButton
                    label="Move later"
                    icon="arrow_downward"
                    disabled={index === items.length - 1}
                    onClick={() => onMove(item.id, 1)}
                  />
                  <button
                    type="button"
                    onClick={() => onOpen(item.id)}
                    className={adminButtonClass.quiet}
                  >
                    Edit
                  </button>
                  {confirmId === item.id ? (
                    <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-xs text-red-700">
                      Remove from the page?
                      <button
                        type="button"
                        onClick={() => onRemove(item.id)}
                        className="font-semibold underline"
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => onAskRemove(null)}
                        className="font-semibold"
                      >
                        No
                      </button>
                    </span>
                  ) : (
                    <IconButton
                      label={removeLabel}
                      icon="delete"
                      danger
                      onClick={() => onAskRemove(item.id)}
                    />
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export function IconButton({
  label,
  icon,
  onClick,
  danger,
  disabled,
}: {
  label: string;
  icon: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "grid size-9 place-items-center rounded-full text-neutral-500 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-30",
        danger && "hover:bg-red-50 hover:text-red-600",
      )}
    >
      <MaterialIcon name={icon} className="text-[18px]" />
    </button>
  );
}

export function AddButton({
  children,
  onClick,
  secondary,
}: {
  children: ReactNode;
  onClick: () => void;
  secondary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        secondary ? adminButtonClass.secondary : adminButtonClass.primary
      }
    >
      <MaterialIcon name="add" className="text-[18px]" />
      {children}
    </button>
  );
}
