"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import {
  blankAboutValue,
  createAboutValue,
  deleteAboutValue,
  listAboutValues,
  reorderAboutValues,
  updateAboutValue,
  updateAboutValuesCopy,
  type AboutValue,
  type AboutValueDraft,
  type AboutValues,
} from "@/lib/mart-api/about-values";
import { MartApiError } from "@/lib/mart-api/products";
import { isContentActive } from "@/lib/mart-mock/visibility";
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
import { findCmsPage } from "../../../_config/cms";
import { SectionCopyForm } from "../../../home/_components/section-copy-form";

const ICONS: { name: string; label: string }[] = [
  { name: "payments", label: "Payments" },
  { name: "local_shipping", label: "Delivery" },
  { name: "assignment_return", label: "Returns" },
  { name: "verified", label: "Verified" },
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

type Draft = AboutValueDraft;

function emptyDraft(): Draft {
  return blankAboutValue();
}

function draftFromItem(item: AboutValue): Draft {
  return {
    icon: item.icon,
    title: item.title,
    description: item.description,
    isActive: item.isActive !== false,
  };
}

function iconChoices(current: string) {
  if (ICONS.some((icon) => icon.name === current)) return ICONS;
  return [{ name: current, label: current }, ...ICONS];
}

function iconLabel(name: string) {
  return ICONS.find((icon) => icon.name === name)?.label ?? name;
}

export function AboutValuesEditor() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const selected = params.get("edit");
  const creating = selected === "new";
  const [section, setSection] = useState<AboutValues | null>(null);
  const [loadError, setLoadError] = useState("");
  const items = section?.items ?? [];
  const visible = items.filter(isContentActive);
  const opened =
    selected && selected !== "new" ? (items.find((item) => item.id === selected) ?? null) : null;
  const [notice, setNotice] = useState("");
  const [savedId, setSavedId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const focusId = useRef<string | null>(null);
  const page = findCmsPage("about");
  const drawerOpen = creating || Boolean(opened);

  useEffect(() => {
    let cancelled = false;
    listAboutValues()
      .then((next) => {
        if (!cancelled) setSection(next);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setLoadError(
          error instanceof MartApiError ? error.message : "Could not load the values.",
        );
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (drawerOpen || !focusId.current) return;
    const id = focusId.current;
    focusId.current = null;
    document.getElementById(id)?.focus();
  }, [drawerOpen]);

  function setEdit(id: string | null) {
    const next = new URLSearchParams(window.location.search);
    if (id) next.set("edit", id);
    else next.delete("edit");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => {
      setNotice("");
      setSavedId(null);
    }, 1600);
  }

  async function saveCopy(next: Record<string, string>) {
    if (!section) return;
    const saved = await updateAboutValuesCopy({
      kicker: next.kicker ?? "",
      title: next.title ?? "",
      subtitle: next.subtitle ?? "",
    });
    setSection(saved);
  }

  async function saveItem(draft: Draft) {
    if (!section) return;
    if (creating) {
      const item = await createAboutValue(draft);
      setSection({ ...section, items: [...section.items, item] });
      setSavedId(item.id);
      focusId.current = `about-value-${item.id}`;
    } else if (selected) {
      const item = await updateAboutValue(selected, draft);
      setSection({
        ...section,
        items: section.items.map((entry) => (entry.id === selected ? item : entry)),
      });
      setSavedId(selected);
      focusId.current = `about-value-${selected}`;
    }
    flash("Saved");
    setEdit(null);
  }

  async function remove(id: string) {
    if (!section) return;
    try {
      await deleteAboutValue(id);
      setSection({ ...section, items: section.items.filter((item) => item.id !== id) });
      if (selected === id) setEdit(null);
      setConfirmId(null);
      flash("Removed");
    } catch (error) {
      setLoadError(error instanceof MartApiError ? error.message : "Could not remove the value.");
    }
  }

  async function place(nextIds: string[]) {
    try {
      const saved = await reorderAboutValues(nextIds);
      setSection(saved);
    } catch (error) {
      setLoadError(
        error instanceof MartApiError ? error.message : "Could not reorder the values.",
      );
    }
  }

  function move(id: string, direction: -1 | 1) {
    const index = items.findIndex((item) => item.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= items.length) return;
    const next = items.map((item) => item.id);
    const [moved] = next.splice(index, 1);
    if (!moved) return;
    next.splice(target, 0, moved);
    void place(next);
  }

  function dropOn(targetId: string) {
    if (!dragId || dragId === targetId) {
      setDragId(null);
      setOverId(null);
      return;
    }
    const next = items.map((item) => item.id);
    const from = next.indexOf(dragId);
    const to = next.indexOf(targetId);
    if (from < 0 || to < 0) return;
    const [moved] = next.splice(from, 1);
    if (!moved) return;
    next.splice(to, 0, moved);
    setDragId(null);
    setOverId(null);
    void place(next);
  }

  const missing = Boolean(section && selected && selected !== "new" && !opened);

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
          <span className="font-medium text-neutral-950">Values</span>
        </nav>
        {page ? (
          <div
            className="mb-4 flex gap-2 overflow-x-auto pb-1"
            aria-label="About sections"
          >
            {page.sections.map((section) => {
              const active = section.id === "values";
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
          title="Values"
          description="Quality, COD, delivery, and returns. Hidden values stay off the about page."
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
                type="button"
                onClick={() => setEdit("new")}
                className={adminButtonClass.primary}
              >
                <MaterialIcon name="add" className="text-[18px]" />
                Add value
              </button>
            </div>
          }
        />
      </div>

      {loadError ? (
        <p className="rounded-2xl bg-white px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
          {loadError}
        </p>
      ) : null}
      {notice && !drawerOpen ? (
        <p role="status" className="text-sm font-medium text-emerald-800">
          {notice}. The values are up to date.
        </p>
      ) : null}
      {missing ? (
        <p className="rounded-2xl bg-white px-4 py-3 text-sm text-neutral-600 ring-1 ring-neutral-200/90">
          This value is no longer here.{" "}
          <button
            type="button"
            onClick={() => setEdit(null)}
            className="font-medium text-primary"
          >
            Close
          </button>
        </p>
      ) : null}

      <section
        className="overflow-hidden rounded-2xl bg-admin-canvas ring-1 ring-neutral-200/90"
        aria-labelledby="about-values-preview-heading"
      >
        <div className="px-4 pt-4 sm:px-5">
          <h2
            id="about-values-preview-heading"
            className="text-sm font-semibold text-neutral-950"
          >
            Storefront preview
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Shown on the about page. Values stay in this order.
          </p>
        </div>
        <div className="p-4 sm:p-5">
          {section === null ? (
            <p className="text-sm text-neutral-500">Loading values…</p>
          ) : (
          <div className="rounded-2xl bg-[#f5f6f8] p-4 sm:p-5">
            <div className="mx-auto mb-5 max-w-2xl text-center">
              <p className="text-xs font-medium tracking-wide text-primary uppercase">
                {section.kicker}
              </p>
              <p className="mt-2 text-xl font-semibold tracking-tight text-neutral-950">
                {section.title}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                {section.subtitle}
              </p>
            </div>
            <ul className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              {visible.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setEdit(item.id)}
                    className="h-full w-full rounded-2xl border border-neutral-200/90 bg-white p-4 text-center shadow-[0_1px_2px_rgba(16,24,40,0.04)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:p-5"
                  >
                    <span className="mx-auto mb-2.5 flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <MaterialIcon
                        name={item.icon || "notes"}
                        filled
                        className="text-[20px]"
                      />
                    </span>
                    <span className="mb-1 block text-sm font-semibold text-neutral-950">
                      {item.title}
                    </span>
                    <span className="block text-xs leading-relaxed text-neutral-600">
                      {item.description}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90 sm:p-5">
        {section === null ? (
          <p className="text-sm text-neutral-500">Loading values…</p>
        ) : (
        <SectionCopyForm
          values={{
            kicker: section.kicker,
            title: section.title,
            subtitle: section.subtitle,
          }}
          fields={[
            { name: "kicker", label: "Eyebrow" },
            { name: "title", label: "Title" },
            {
              name: "subtitle",
              label: "Subtitle",
              multiline: true,
              rows: 3,
              wide: true,
            },
          ]}
          saveLabel="Save heading"
          onSave={saveCopy}
        />
        )}
      </section>

      <section
        className="overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200/90"
        aria-labelledby="about-values-list-heading"
      >
        <div className="border-b border-neutral-100 px-4 py-3 sm:px-5">
          <h2
            id="about-values-list-heading"
            className="text-sm font-semibold text-neutral-950"
          >
            {section === null
              ? "Loading values…"
              : items.length === 1
                ? "1 value"
                : `${items.length} values`}
          </h2>
        </div>
        {section === null ? null : items.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-sm font-semibold text-neutral-950">
              No values yet
            </p>
            <p className="mx-auto mt-1 max-w-md text-sm text-neutral-500">
              Add the points shown under the heading.
            </p>
            <button
              type="button"
              onClick={() => setEdit("new")}
              className={cn(adminButtonClass.primary, "mt-4")}
            >
              <MaterialIcon name="add" className="text-[18px]" />
              Add value
            </button>
          </div>
        ) : (
          <ol>
            {items.map((item, index) => (
              <li
                key={item.id}
                onDragOver={(event) => {
                  event.preventDefault();
                  setOverId(item.id);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  dropOn(item.id);
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
                      aria-label={`Reorder ${item.title || "value"}`}
                      onDragStart={(event) => {
                        event.dataTransfer.setData("text/plain", item.id);
                        event.dataTransfer.effectAllowed = "move";
                        setDragId(item.id);
                      }}
                      onDragEnd={() => {
                        setDragId(null);
                        setOverId(null);
                      }}
                      className="grid size-9 shrink-0 cursor-grab place-items-center rounded-full text-neutral-400 hover:bg-neutral-100 active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                      <MaterialIcon
                        name="drag_indicator"
                        className="text-[18px]"
                      />
                    </button>
                    <button
                      id={`about-value-${item.id}`}
                      type="button"
                      onClick={() => setEdit(item.id)}
                      className="flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                      <span className="w-5 shrink-0 text-right text-xs text-neutral-400 tabular-nums">
                        {index + 1}
                      </span>
                      <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-admin-canvas text-primary">
                        <MaterialIcon
                          name={item.icon || "notes"}
                          className="text-[22px]"
                        />
                      </span>
                      <span className="min-w-0">
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="line-clamp-2 text-sm font-semibold text-neutral-950">
                            {item.title || "Empty value"}
                          </span>
                          <VisibilityBadge active={isContentActive(item)} />
                        </span>
                        <span className="mt-0.5 line-clamp-2 block text-xs text-neutral-500">
                          {item.description || iconLabel(item.icon)}
                        </span>
                      </span>
                    </button>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-1 pl-11 sm:pl-0">
                    <IconButton
                      label="Move earlier"
                      icon="arrow_upward"
                      disabled={index === 0}
                      onClick={() => move(item.id, -1)}
                    />
                    <IconButton
                      label="Move later"
                      icon="arrow_downward"
                      disabled={index === items.length - 1}
                      onClick={() => move(item.id, 1)}
                    />
                    <button
                      type="button"
                      onClick={() => setEdit(item.id)}
                      className={adminButtonClass.quiet}
                    >
                      Edit
                    </button>
                    {confirmId === item.id ? (
                      <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-xs text-red-700">
                        Remove from the about page?
                        <button
                          type="button"
                          onClick={() => remove(item.id)}
                          className="font-semibold underline"
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmId(null)}
                          className="font-semibold"
                        >
                          No
                        </button>
                      </span>
                    ) : (
                      <IconButton
                        label="Remove value"
                        icon="delete"
                        danger
                        onClick={() => setConfirmId(item.id)}
                      />
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      {drawerOpen ? (
        <ValueDrawer
          key={selected}
          creating={creating}
          initial={opened ? draftFromItem(opened) : emptyDraft()}
          notice={notice}
          onClose={() => setEdit(null)}
          onSave={saveItem}
        />
      ) : null}
    </div>
  );
}

function ValueDrawer({
  creating,
  initial,
  notice,
  onClose,
  onSave,
}: {
  creating: boolean;
  initial: Draft;
  notice: string;
  onClose: () => void;
  onSave: (draft: Draft) => Promise<void>;
}) {
  const [draft, setDraft] = useState(initial);
  const [baseline] = useState(initial);
  const [titleError, setTitleError] = useState("");
  const [descriptionError, setDescriptionError] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const titleId = useId();
  const descriptionId = useId();

  async function save() {
    if (saving) return;
    const nextTitle = draft.title.trim();
    const nextDescription = draft.description.trim();
    setTitleError(nextTitle ? "" : "Title is required.");
    setDescriptionError(nextDescription ? "" : "Description is required.");
    if (!nextTitle || !nextDescription) return;
    setSaving(true);
    setError("");
    try {
      await onSave({
        icon: draft.icon || "verified",
        title: nextTitle,
        description: nextDescription,
        isActive: draft.isActive,
      });
    } catch (caught) {
      setSaving(false);
      setError(caught instanceof MartApiError ? caught.message : "Could not save the value.");
    }
  }

  return (
    <FormCloseGuard baseline={baseline} value={draft} onClose={onClose}>
    <AdminFormModal titleId="about-values-drawer-title" size="sm">
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-neutral-100 px-5 py-4">
        <div className="min-w-0">
          <h2
            id="about-values-drawer-title"
            className="text-lg font-semibold text-neutral-950"
          >
            {creating ? "Add value" : "Edit value"}
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            {creating
              ? "Add a principle for the about page."
              : "Update this principle."}
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
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
        <ActiveStatusField
          checked={draft.isActive !== false}
          onChange={(isActive) => setDraft({ ...draft, isActive })}
        />
        <div className="rounded-2xl bg-white px-4 py-3 text-center ring-1 ring-neutral-200">
          <span className="mx-auto mb-2 flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MaterialIcon
              name={draft.icon || "notes"}
              filled
              className="text-[20px]"
            />
          </span>
          <p className="text-sm font-semibold text-neutral-950">
            {draft.title.trim() || "Title"}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-neutral-500">
            {draft.description.trim() || "Description"}
          </p>
        </div>
        <div>
          <FieldLabel>Icon</FieldLabel>
          <div className="flex flex-wrap gap-1.5">
            {iconChoices(draft.icon).map((icon) => (
              <button
                key={icon.name}
                type="button"
                aria-pressed={draft.icon === icon.name}
                aria-label={icon.label}
                onClick={() => setDraft({ ...draft, icon: icon.name })}
                className={cn(
                  "grid size-10 place-items-center rounded-xl ring-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                  draft.icon === icon.name
                    ? "bg-primary/10 text-primary ring-primary/30"
                    : "bg-white text-neutral-600 ring-neutral-200",
                )}
              >
                <MaterialIcon name={icon.name} className="text-[20px]" />
              </button>
            ))}
          </div>
        </div>
        <div>
          <FieldLabel htmlFor={titleId}>
            Title <span className="text-red-700">*</span>
          </FieldLabel>
          <input
            id={titleId}
            autoFocus
            value={draft.title}
            placeholder="Quality checked"
            onChange={(event) => {
              setDraft({ ...draft, title: event.target.value });
              setTitleError("");
            }}
            aria-invalid={titleError ? true : undefined}
            aria-describedby={titleError ? `${titleId}-error` : undefined}
            className={cn(adminFieldClass, titleError && "border-red-400")}
          />
          {titleError ? (
            <div id={`${titleId}-error`}>
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
            placeholder="What this principle means for customers"
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
      <div className="flex shrink-0 items-center justify-end gap-2 border-t border-neutral-100 px-5 py-3">
        {error ? (
          <p role="alert" className="mr-auto text-sm font-medium text-red-700">
            {error}
          </p>
        ) : notice ? (
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
          onClick={save}
          disabled={saving}
          className={adminButtonClass.primary}
        >
          {saving ? "Saving…" : creating ? "Save value" : "Save changes"}
        </button>
      </div>
    </AdminFormModal>
    </FormCloseGuard>
  );
}

function IconButton({
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
