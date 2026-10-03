"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import {
  blankAboutStat,
  createAboutStat,
  deleteAboutStat,
  listAboutStats,
  reorderAboutStats,
  updateAboutStat,
  type AboutStat,
  type AboutStatDraft,
} from "@/lib/mart-api/about-stats";
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

type Draft = AboutStatDraft;

function draftFromStat(stat: AboutStat): Draft {
  return { icon: stat.icon, value: stat.value, label: stat.label, isActive: stat.isActive };
}

function iconChoices(current: string) {
  if (ICONS.some((icon) => icon.name === current)) return ICONS;
  return [{ name: current, label: current }, ...ICONS];
}

function iconLabel(name: string) {
  return ICONS.find((icon) => icon.name === name)?.label ?? name;
}

export function AboutStatsEditor() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const selected = params.get("edit");
  const creating = selected === "new";
  const [stats, setStats] = useState<AboutStat[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const items = stats ?? [];
  const visible = items.filter(isContentActive);
  const opened =
    selected && selected !== "new"
      ? (items.find((stat) => stat.id === selected) ?? null)
      : null;
  const [notice, setNotice] = useState("");
  const [savedId, setSavedId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const focusId = useRef<string | null>(null);
  const page = findCmsPage("about");

  useEffect(() => {
    let cancelled = false;
    listAboutStats()
      .then((next) => {
        if (!cancelled) setStats(next);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setLoadError(error instanceof MartApiError ? error.message : "Could not load the stats.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (selected || !focusId.current) return;
    const id = focusId.current;
    focusId.current = null;
    document.getElementById(`about-stat-${id}`)?.focus();
  }, [selected]);

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

  async function commit(draft: Draft) {
    if (!stats) return;
    if (creating) {
      const stat = await createAboutStat(draft);
      setStats([...stats, stat]);
      setSavedId(stat.id);
      focusId.current = stat.id;
    } else if (selected) {
      const stat = await updateAboutStat(selected, draft);
      setStats(stats.map((entry) => (entry.id === selected ? stat : entry)));
      setSavedId(selected);
      focusId.current = selected;
    }
    flash("Saved");
    setEdit(null);
  }

  async function remove(id: string) {
    if (!stats) return;
    setLoadError("");
    try {
      await deleteAboutStat(id);
      setStats(stats.filter((stat) => stat.id !== id));
      if (selected === id) setEdit(null);
      setConfirmId(null);
      flash("Removed");
    } catch (error) {
      setLoadError(error instanceof MartApiError ? error.message : "Could not remove the stat.");
    }
  }

  async function applyOrder(ids: string[]) {
    setLoadError("");
    try {
      setStats(await reorderAboutStats(ids));
    } catch (error) {
      setLoadError(error instanceof MartApiError ? error.message : "Could not reorder the stats.");
    }
  }

  function move(id: string, direction: -1 | 1) {
    const index = items.findIndex((stat) => stat.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= items.length) return;
    const next = [...items];
    const [stat] = next.splice(index, 1);
    if (!stat) return;
    next.splice(target, 0, stat);
    void applyOrder(next.map((entry) => entry.id));
  }

  function dropOn(targetId: string) {
    if (!dragId || dragId === targetId) {
      setDragId(null);
      setOverId(null);
      return;
    }
    const next = [...items];
    const from = next.findIndex((stat) => stat.id === dragId);
    const to = next.findIndex((stat) => stat.id === targetId);
    setDragId(null);
    setOverId(null);
    if (from < 0 || to < 0) return;
    const [stat] = next.splice(from, 1);
    if (!stat) return;
    next.splice(to, 0, stat);
    void applyOrder(next.map((entry) => entry.id));
  }

  const missing = Boolean(selected && selected !== "new" && !opened);

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
          <span className="font-medium text-neutral-950">Stats</span>
        </nav>
        {page ? (
          <div
            className="mb-4 flex gap-2 overflow-x-auto pb-1"
            aria-label="About sections"
          >
            {page.sections.map((section) => {
              const active = section.id === "stats";
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
          title="Stats"
          description="Categories, districts, COD, and returns."
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
                Add stat
              </button>
            </div>
          }
        />
      </div>

      {loadError ? (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">
          {loadError}
        </p>
      ) : null}
      {notice && !selected ? (
        <p role="status" className="text-sm font-medium text-emerald-800">
          {notice}. The stats bar is up to date.
        </p>
      ) : null}
      {missing ? (
        <p className="rounded-2xl bg-white px-4 py-3 text-sm text-neutral-600 ring-1 ring-neutral-200/90">
          This stat is no longer here.{" "}
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
        aria-labelledby="about-stats-preview-heading"
      >
        <div className="px-4 pt-4 sm:px-5">
          <h2
            id="about-stats-preview-heading"
            className="text-sm font-semibold text-neutral-950"
          >
            Storefront preview
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Shown under the about banner. Hidden stats stay off the about page.
          </p>
        </div>
        <div className="p-4 sm:p-5">
          {stats === null ? (
            <p className="text-sm text-neutral-500">Loading stats…</p>
          ) : visible.length === 0 ? (
            <div className="rounded-2xl bg-white px-4 py-10 text-center ring-1 ring-neutral-200">
              <p className="text-sm font-semibold text-neutral-950">
                {items.length === 0 ? "No stats yet" : "All stats are hidden."}
              </p>
              <button
                type="button"
                onClick={() => setEdit("new")}
                className={cn(adminButtonClass.primary, "mt-4")}
              >
                <MaterialIcon name="add" className="text-[18px]" />
                Add stat
              </button>
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-2 xl:grid-cols-4">
              {visible.map((stat) => (
                <li key={stat.id}>
                  <button
                    type="button"
                    onClick={() => setEdit(stat.id)}
                    className={cn(
                      "flex h-full w-full flex-col items-center gap-1 rounded-2xl bg-white px-3 py-3.5 text-center ring-1 ring-neutral-200 sm:flex-row sm:gap-2.5 sm:text-left",
                      selected === stat.id && "ring-2 ring-primary",
                    )}
                  >
                    <MaterialIcon
                      name={stat.icon || "notes"}
                      className="text-[20px] text-primary"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-neutral-950 tabular-nums">
                        {stat.value || "—"}
                      </span>
                      <span className="block text-xs leading-tight text-neutral-600">
                        {stat.label || "Stat"}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {items.length > 0 ? (
        <section
          className="overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200/90"
          aria-labelledby="about-stats-list-heading"
        >
          <div className="border-b border-neutral-100 px-4 py-3 sm:px-5">
            <h2
              id="about-stats-list-heading"
              className="text-sm font-semibold text-neutral-950"
            >
              {items.length === 1 ? "1 stat" : `${items.length} stats`}
            </h2>
          </div>
          <ol>
            {items.map((stat, index) => (
              <li
                key={stat.id}
                onDragOver={(event) => {
                  event.preventDefault();
                  setOverId(stat.id);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  dropOn(stat.id);
                }}
                className={cn(
                  "border-t border-neutral-100 first:border-t-0",
                  selected === stat.id && "bg-primary/5",
                  savedId === stat.id && "bg-emerald-50",
                  overId === stat.id &&
                    dragId &&
                    dragId !== stat.id &&
                    "bg-primary/10",
                  dragId === stat.id && "opacity-60",
                )}
              >
                <div className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:px-4">
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <button
                      type="button"
                      draggable
                      aria-label={`Reorder ${stat.label || "stat"}`}
                      onDragStart={(event) => {
                        event.dataTransfer.setData("text/plain", stat.id);
                        event.dataTransfer.effectAllowed = "move";
                        setDragId(stat.id);
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
                      id={`about-stat-${stat.id}`}
                      type="button"
                      onClick={() => setEdit(stat.id)}
                      className="flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                      <span className="w-5 shrink-0 text-right text-xs text-neutral-400 tabular-nums">
                        {index + 1}
                      </span>
                      <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-admin-canvas text-primary">
                        <MaterialIcon
                          name={stat.icon || "notes"}
                          className="text-[22px]"
                        />
                      </span>
                      <span className="min-w-0">
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="truncate text-sm font-semibold text-neutral-950">
                            {stat.label || "Untitled stat"}
                          </span>
                          <VisibilityBadge active={isContentActive(stat)} />
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-neutral-500">
                          {stat.value || "No value"} · {iconLabel(stat.icon)}
                        </span>
                      </span>
                    </button>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-1 pl-11 sm:pl-0">
                    <IconButton
                      label="Move earlier"
                      icon="arrow_upward"
                      disabled={index === 0}
                      onClick={() => move(stat.id, -1)}
                    />
                    <IconButton
                      label="Move later"
                      icon="arrow_downward"
                      disabled={index === items.length - 1}
                      onClick={() => move(stat.id, 1)}
                    />
                    <button
                      type="button"
                      onClick={() => setEdit(stat.id)}
                      className={adminButtonClass.quiet}
                    >
                      Edit
                    </button>
                    {confirmId === stat.id ? (
                      <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-xs text-red-700">
                        Remove from the about page?
                        <button
                          type="button"
                          onClick={() => remove(stat.id)}
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
                        label="Remove stat"
                        icon="delete"
                        danger
                        onClick={() => setConfirmId(stat.id)}
                      />
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {selected === "new" || opened ? (
        <StatDrawer
          key={selected}
          creating={creating}
          initial={opened ? draftFromStat(opened) : blankAboutStat()}
          notice={notice}
          onClose={() => setEdit(null)}
          onSave={commit}
        />
      ) : null}
    </div>
  );
}

function StatDrawer({
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
  const baseline = useRef(draft);
  const [valueError, setValueError] = useState("");
  const [labelError, setLabelError] = useState("");
  const [saving, setSaving] = useState(false);
  const valueId = useId();
  const labelId = useId();
  const title = draft.label.trim() || "Stat";

  async function save() {
    if (saving) return;
    const value = draft.value.trim();
    const label = draft.label.trim();
    setValueError(value ? "" : "Value is required.");
    setLabelError(label ? "" : "Label is required.");
    if (!value || !label) return;
    setSaving(true);
    try {
      await onSave({ icon: draft.icon, value, label, isActive: draft.isActive });
    } catch (error) {
      setLabelError(error instanceof MartApiError ? error.message : "Could not save the stat.");
      setSaving(false);
    }
  }

  return (
    <FormCloseGuard baseline={baseline.current} value={draft} onClose={onClose}>
    <AdminFormModal titleId="about-stats-drawer-title" size="sm">
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-neutral-100 px-5 py-4">
        <div className="min-w-0">
          <h2
            id="about-stats-drawer-title"
            className="text-lg font-semibold text-neutral-950"
          >
            {creating ? "Add stat" : "Edit stat"}
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            {creating ? "Add a number and a short label." : "Update this stat."}
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
        <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 ring-1 ring-neutral-200">
          <MaterialIcon
            name={draft.icon || "notes"}
            className="text-[22px] text-primary"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-neutral-950">
              {draft.value.trim() || "Value"}
            </p>
            <p className="truncate text-xs text-neutral-500">
              {draft.label.trim() || "Label"}
            </p>
          </div>
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
          onClick={save}
          disabled={saving}
          className={adminButtonClass.primary}
        >
          {saving ? "Saving…" : creating ? "Save stat" : "Save changes"}
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
