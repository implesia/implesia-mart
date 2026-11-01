"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import {
  BADGE_NAME_MAX,
  BADGE_TONE_LABEL,
  BADGE_TONES,
  badgeNameError,
  badgeToneClass,
  type AdminBadge,
  type BadgeTone,
} from "@/lib/mart-api/badge-rules";
import {
  createMartBadge,
  deleteMartBadge,
  listMartBadges,
  updateMartBadge,
} from "@/lib/mart-api/badges";
import { MartApiError } from "@/lib/mart-api/products";
import { cn } from "@/lib/utils";

import {
  AdminEmpty,
  AdminLoading,
  AdminNotice,
  AdminPageHeader,
  FieldError,
  FieldLabel,
  VisibilityBadge,
  adminButtonClass,
  adminFieldClass,
} from "../_components/admin-ui";

type Editor = { id: string | null; name: string; tone: BadgeTone; isActive: boolean };

const EMPTY: Editor = { id: null, name: "", tone: "primary", isActive: true };

function message(reason: unknown, fallback: string) {
  return reason instanceof MartApiError ? reason.message : fallback;
}

export default function AdminBadgesPage() {
  const [badges, setBadges] = useState<AdminBadge[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editor, setEditor] = useState<Editor>(EMPTY);
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<{ id: string; text: string } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      setBadges(await listMartBadges());
    } catch (reason) {
      setLoadError(message(reason, "Badges could not be loaded."));
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    listMartBadges()
      .then((items) => {
        if (!cancelled) setBadges(items);
      })
      .catch((reason: unknown) => {
        if (!cancelled) setLoadError(message(reason, "Badges could not be loaded."));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const taken = (badges ?? []).filter((item) => item.id !== editor.id).map((item) => item.name);
  const nameError = badgeNameError(editor.name, taken);
  const editing = editor.id !== null;

  function startEdit(badge: AdminBadge) {
    setEditor({ id: badge.id, name: badge.name, tone: badge.tone, isActive: badge.isActive });
    setTouched(false);
    setFormError(null);
    setNotice(null);
  }

  function reset() {
    setEditor(EMPTY);
    setTouched(false);
    setFormError(null);
  }

  function replace(next: AdminBadge) {
    setBadges((current) => {
      const list = current ?? [];
      return list.some((item) => item.id === next.id)
        ? list.map((item) => (item.id === next.id ? next : item))
        : [...list, next];
    });
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setTouched(true);
    if (nameError || saving) return;
    setSaving(true);
    setFormError(null);
    const input = { name: editor.name.replace(/\s+/g, " ").trim(), tone: editor.tone, isActive: editor.isActive };
    try {
      const saved = editor.id
        ? await updateMartBadge(editor.id, input)
        : await createMartBadge(input);
      replace(saved);
      setNotice(editor.id ? `“${saved.name}” saved.` : `“${saved.name}” created.`);
      reset();
    } catch (reason) {
      setFormError(message(reason, "The badge could not be saved."));
    } finally {
      setSaving(false);
    }
  }

  async function toggle(badge: AdminBadge) {
    setBusyId(badge.id);
    setRowError(null);
    try {
      replace(await updateMartBadge(badge.id, { isActive: !badge.isActive }));
    } catch (reason) {
      setRowError({ id: badge.id, text: message(reason, "The badge could not be updated.") });
    } finally {
      setBusyId(null);
    }
  }

  async function remove(badge: AdminBadge) {
    if (!window.confirm(`Delete the badge “${badge.name}”? This cannot be undone.`)) return;
    setBusyId(badge.id);
    setRowError(null);
    try {
      await deleteMartBadge(badge.id);
      setBadges((current) => (current ?? []).filter((item) => item.id !== badge.id));
      if (editor.id === badge.id) reset();
      setNotice(`“${badge.name}” deleted.`);
    } catch (reason) {
      setRowError({ id: badge.id, text: message(reason, "The badge could not be deleted.") });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="Badges"
        description="Create the badges you can attach to products, such as “Eid Special” or “Gift Pick”. Switch a badge off to hide it from the storefront everywhere without changing any product."
      />

      {notice ? (
        <div className="mb-4">
          <AdminNotice tone="success">{notice}</AdminNotice>
        </div>
      ) : null}

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="order-2 overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200/90 lg:order-1">
          <div className="flex items-center justify-between gap-3 border-b border-neutral-100 px-4 py-3.5 sm:px-5">
            <h2 className="text-sm font-semibold text-neutral-950">All badges</h2>
            {badges ? (
              <span className="text-xs text-neutral-500">
                {badges.length} {badges.length === 1 ? "badge" : "badges"}
              </span>
            ) : null}
          </div>

          {loadError ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm text-red-600">{loadError}</p>
              <button type="button" onClick={() => void load()} className={cn(adminButtonClass.secondary, "mt-3")}>
                Try again
              </button>
            </div>
          ) : badges === null ? (
            <div className="p-4 sm:p-5">
              <AdminLoading />
            </div>
          ) : badges.length === 0 ? (
            <AdminEmpty title="No badges yet" detail="Create your first badge with the form." />
          ) : (
            <ul className="divide-y divide-neutral-100">
              {badges.map((badge) => (
                <li key={badge.id} className="px-4 py-3.5 sm:px-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "max-w-full truncate rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase",
                          badgeToneClass(badge.tone),
                          !badge.isActive && "opacity-50",
                        )}
                      >
                        {badge.name}
                      </span>
                      <VisibilityBadge active={badge.isActive} />
                      {badge.isSystem ? (
                        <span className="inline-flex rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-600">
                          Built-in
                        </span>
                      ) : null}
                      <span className="text-xs text-neutral-500">
                        {badge.productCount === 0
                          ? "Not on any product"
                          : `On ${badge.productCount} ${badge.productCount === 1 ? "product" : "products"}`}
                      </span>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => startEdit(badge)}
                        disabled={busyId === badge.id}
                        className={cn(adminButtonClass.secondary, "h-9 px-3")}
                      >
                        <MaterialIcon name="edit" className="text-[18px]" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void toggle(badge)}
                        disabled={busyId === badge.id}
                        className={cn(adminButtonClass.secondary, "h-9 px-3")}
                      >
                        {badge.isActive ? "Switch off" : "Switch on"}
                      </button>
                      {badge.isSystem ? null : (
                        <button
                          type="button"
                          onClick={() => void remove(badge)}
                          disabled={busyId === badge.id}
                          aria-label={`Delete ${badge.name}`}
                          className="inline-flex size-9 items-center justify-center rounded-full text-red-600 ring-1 ring-neutral-200 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:text-neutral-300"
                        >
                          <MaterialIcon name="delete" className="text-[18px]" />
                        </button>
                      )}
                    </div>
                  </div>
                  {rowError?.id === badge.id ? (
                    <p role="alert" className="mt-2 text-xs text-red-600">
                      {rowError.text}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        <form
          onSubmit={save}
          noValidate
          className="order-1 rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90 sm:p-5 lg:sticky lg:top-4 lg:order-2"
        >
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-neutral-950">
              {editing ? "Edit badge" : "New badge"}
            </h2>
            {editing ? (
              <button type="button" onClick={reset} className={cn(adminButtonClass.quiet, "h-8")}>
                Cancel
              </button>
            ) : null}
          </div>

          <FieldLabel htmlFor="badge-name">Name</FieldLabel>
          <input
            id="badge-name"
            value={editor.name}
            maxLength={BADGE_NAME_MAX + 8}
            placeholder="Eid Special"
            aria-invalid={touched && Boolean(nameError)}
            aria-describedby="badge-name-help"
            onChange={(event) => {
              setEditor({ ...editor, name: event.target.value });
              setFormError(null);
            }}
            onBlur={() => setTouched(true)}
            className={adminFieldClass}
          />
          {touched && nameError ? (
            <FieldError message={nameError} />
          ) : (
            <p id="badge-name-help" className="mt-1.5 text-xs text-neutral-500">
              Up to {BADGE_NAME_MAX} characters. Shoppers see it on product cards and pages.
            </p>
          )}

          <fieldset className="mt-4">
            <legend className="mb-1.5 block text-sm font-medium text-neutral-700">Colour</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">
              {BADGE_TONES.map((tone) => (
                <label
                  key={tone}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-medium text-neutral-700 ring-1",
                    editor.tone === tone ? "ring-2 ring-primary" : "ring-neutral-200 hover:bg-neutral-50",
                  )}
                >
                  <input
                    type="radio"
                    name="badge-tone"
                    value={tone}
                    checked={editor.tone === tone}
                    onChange={() => setEditor({ ...editor, tone })}
                    className="sr-only"
                  />
                  <span className={cn("size-4 shrink-0 rounded-full ring-1 ring-black/10", badgeToneClass(tone))} />
                  {BADGE_TONE_LABEL[tone]}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-neutral-200/90 px-4 py-3">
            <span>
              <span className="block text-sm font-medium text-neutral-950">
                {editor.isActive ? "On" : "Off"}
              </span>
              <span className="mt-0.5 block text-xs text-neutral-500">
                {editor.isActive ? "Shown on the storefront" : "Hidden from the storefront"}
              </span>
            </span>
            <input
              type="checkbox"
              checked={editor.isActive}
              onChange={(event) => setEditor({ ...editor, isActive: event.target.checked })}
              className="size-5 accent-primary"
            />
          </label>

          <div className="mt-4">
            <p className="mb-1.5 text-xs font-medium text-neutral-500">Preview</p>
            <div className="flex min-h-10 items-center rounded-xl bg-[#f5f6f8] px-3">
              <span
                className={cn(
                  "max-w-full truncate rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide uppercase shadow-sm",
                  badgeToneClass(editor.tone),
                  !editor.isActive && "opacity-50",
                )}
              >
                {editor.name.trim() || "Badge name"}
              </span>
            </div>
          </div>

          {formError ? (
            <p role="alert" className="mt-3 text-sm text-red-600">
              {formError}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={saving || (touched && Boolean(nameError))}
            className={cn(adminButtonClass.primary, "mt-4 w-full")}
          >
            {saving ? "Saving…" : editing ? "Save badge" : "Create badge"}
          </button>
        </form>
      </div>
    </div>
  );
}
