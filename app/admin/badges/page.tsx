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
  listMartBadges,
  updateMartBadge,
} from "@/lib/mart-api/badges";
import { MartApiError } from "@/lib/mart-api/products";
import { cn } from "@/lib/utils";

import {
  AdminLoading,
  AdminNotice,
  AdminPageHeader,
  FieldError,
  FieldLabel,
  VisibilityBadge,
  adminButtonClass,
  adminFieldClass,
} from "../_components/admin-ui";
import { ImpactDeleteModal, type ImpactDeleteTarget } from "../_components/impact-delete-modal";
import { useIsSuperadmin } from "../_components/use-superadmin";

type Editor = { id: string | null; name: string; tone: BadgeTone; isActive: boolean };

const EMPTY: Editor = { id: null, name: "", tone: "primary", isActive: true };

function message(reason: unknown, fallback: string) {
  return reason instanceof MartApiError ? reason.message : fallback;
}

export default function AdminBadgesPage() {
  const canDelete = useIsSuperadmin();
  const [badges, setBadges] = useState<AdminBadge[] | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ImpactDeleteTarget | null>(null);
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

  function remove(badge: AdminBadge) {
    setRowError(null);
    setDeleteTarget({
      entity: "badge",
      id: badge.id,
      label: badge.name,
    });
  }

  return (
    <div className="w-full space-y-4 pb-10">
      <AdminPageHeader
        title="Badges"
        description="Create the badges you can attach to products, such as “Eid Special” or “Gift Pick”. Switch a badge off to hide it from the storefront everywhere without changing any product."
      />

      {notice ? (
        <div className="animate-in fade-in slide-in-from-top-2">
          <AdminNotice tone="success">{notice}</AdminNotice>
        </div>
      ) : null}

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_24rem]">
        
        {/* Left Side: List */}
        <section className="order-2 flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200/90 lg:order-1">
          <div className="flex items-center justify-between gap-3 border-b border-neutral-100 bg-neutral-50/50 px-4 py-3 sm:px-5">
            <h2 className="text-sm font-semibold text-neutral-950">All badges</h2>
            {badges ? (
              <span className="inline-flex items-center rounded-full bg-neutral-200/70 px-2 py-0.5 text-[11px] font-semibold text-neutral-700 tabular-nums">
                {badges.length} {badges.length === 1 ? "badge" : "badges"}
              </span>
            ) : null}
          </div>

          {loadError ? (
            <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 text-center">
              <MaterialIcon name="error" className="mb-2 text-[32px] text-red-400" />
              <p className="text-sm font-medium text-red-700">{loadError}</p>
              <button type="button" onClick={() => void load()} className={cn(adminButtonClass.secondary, "mt-3")}>
                Try again
              </button>
            </div>
          ) : badges === null ? (
            <div className="p-6">
              <AdminLoading />
            </div>
          ) : badges.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
              <div className="mb-3 grid size-10 place-items-center rounded-full bg-neutral-100">
                <MaterialIcon name="sell" className="text-[20px] text-neutral-400" />
              </div>
              <h3 className="text-sm font-semibold text-neutral-900">No badges yet</h3>
              <p className="mt-1 text-xs text-neutral-500">Use the form to create your first badge.</p>
            </div>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {badges.map((badge) => (
                <li key={badge.id} className="group px-4 py-2.5 transition-colors hover:bg-neutral-50/60 sm:px-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "max-w-full truncate rounded-full px-2 py-0.5 text-[11px] font-bold tracking-wide uppercase shadow-sm ring-1 ring-black/5 transition-opacity",
                          badgeToneClass(badge.tone),
                          !badge.isActive && "opacity-50"
                        )}
                      >
                        {badge.name}
                      </span>
                      <VisibilityBadge active={badge.isActive} />
                      {badge.isSystem ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-600">
                          <MaterialIcon name="lock" className="text-[12px]" />
                          Built-in
                        </span>
                      ) : null}
                      <span className="text-[11px] font-medium text-neutral-400">
                        {badge.productCount === 0
                          ? "Not on any product"
                          : `On ${badge.productCount} ${badge.productCount === 1 ? "product" : "products"}`}
                      </span>
                    </div>

                    <div className="flex shrink-0 items-center gap-1 rounded-lg bg-white p-1 ring-1 ring-neutral-200/60 shadow-sm sm:bg-transparent sm:p-0 sm:ring-0 sm:shadow-none sm:opacity-70 sm:group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => startEdit(badge)}
                        disabled={busyId === badge.id}
                        className={cn(adminButtonClass.secondary, "h-7 px-2 text-xs")}
                      >
                        <MaterialIcon name="edit" className="text-[14px]" />
                        Edit
                      </button>
                      
                      <button
                        type="button"
                        role="switch"
                        aria-checked={badge.isActive}
                        aria-busy={busyId === badge.id}
                        onClick={() => void toggle(badge)}
                        disabled={busyId === badge.id}
                        aria-label={`${badge.isActive ? "Switch off" : "Switch on"} ${badge.name}`}
                        title={badge.isActive ? "Switch off" : "Switch on"}
                        className="inline-flex h-7 items-center rounded-full px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 disabled:cursor-wait"
                      >
                        <span
                          aria-hidden
                          className={cn(
                            "relative h-4.5 w-8 shrink-0 rounded-full shadow-inner transition-colors duration-200 ease-out",
                            badge.isActive ? "bg-emerald-500" : "bg-neutral-300",
                            busyId === badge.id && "opacity-60"
                          )}
                        >
                          <span
                            className={cn(
                              "absolute top-0.5 left-0.5 grid size-3.5 place-items-center rounded-full bg-white shadow-sm ring-1 ring-black/5 transition-transform duration-200 ease-out",
                              badge.isActive ? "translate-x-3.5" : "translate-x-0"
                            )}
                          >
                            {busyId === badge.id ? (
                              <span className="size-2 animate-spin rounded-full border-2 border-neutral-300 border-t-primary" />
                            ) : null}
                          </span>
                        </span>
                      </button>

                      {!canDelete || badge.isSystem ? null : (
                        <button
                          type="button"
                          onClick={() => remove(badge)}
                          disabled={busyId === badge.id}
                          aria-label={`Delete or merge ${badge.name}`}
                          title="Delete or merge badge (Admin only)"
                          className="inline-flex size-7 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:text-neutral-300"
                        >
                          <MaterialIcon name="delete" className="text-[14px]" />
                        </button>
                      )}
                    </div>
                  </div>
                  {rowError?.id === badge.id ? (
                    <p role="alert" className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-600">
                      <MaterialIcon name="error" className="text-[14px]" />
                      {rowError.text}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Right Side: Form */}
        <form
          onSubmit={save}
          noValidate
          className="order-1 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-200/90 sm:p-5 lg:sticky lg:top-4 lg:order-2"
        >
          <div className="mb-4 flex items-center justify-between gap-2 border-b border-neutral-100 pb-3">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold text-neutral-950">
              <MaterialIcon name={editing ? "edit_square" : "add_box"} className="text-[18px] text-primary" />
              {editing ? "Edit badge" : "New badge"}
            </h2>
            {editing ? (
              <button type="button" onClick={reset} className={cn(adminButtonClass.quiet, "h-7 text-xs")}>
                Cancel
              </button>
            ) : null}
          </div>

          <div className="space-y-4">
            <div>
              <FieldLabel htmlFor="badge-name">Badge name</FieldLabel>
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
                className={cn(adminFieldClass, "h-10 text-sm")}
              />
              {touched && nameError ? (
                <FieldError message={nameError} />
              ) : (
                <p id="badge-name-help" className="mt-1 text-[11px] text-neutral-500">
                  Up to {BADGE_NAME_MAX} characters. Shoppers see this on product cards.
                </p>
              )}
            </div>

            <fieldset>
              <legend className="mb-1.5 block text-xs font-medium text-neutral-700">Style</legend>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-2">
                {BADGE_TONES.map((tone) => {
                  const isActive = editor.tone === tone;
                  return (
                    <label
                      key={tone}
                      className={cn(
                        "relative flex cursor-pointer items-center gap-2 rounded-lg border p-2 text-xs font-medium transition-all",
                        isActive 
                          ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/20 shadow-sm" 
                          : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50"
                      )}
                    >
                      <input
                        type="radio"
                        name="badge-tone"
                        value={tone}
                        checked={isActive}
                        onChange={() => setEditor({ ...editor, tone })}
                        className="sr-only"
                      />
                      <span className={cn("size-3.5 shrink-0 rounded-full ring-1 ring-black/10 shadow-sm", badgeToneClass(tone))} />
                      <span className="truncate">{BADGE_TONE_LABEL[tone]}</span>
                      {isActive && (
                        <MaterialIcon name="check_circle" className="ml-auto text-[14px] text-primary" />
                      )}
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div>
              <p className="mb-1.5 text-xs font-medium text-neutral-700">Preview</p>
              <div className="flex min-h-[3.5rem] w-full items-center justify-center rounded-lg border border-dashed border-neutral-200 bg-neutral-50 p-2.5">
                <span
                  className={cn(
                    "max-w-full truncate rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase shadow-sm ring-1 ring-black/5 transition-opacity",
                    badgeToneClass(editor.tone),
                    !editor.isActive && "opacity-50 grayscale-[50%]"
                  )}
                >
                  {editor.name.trim() || "Badge name"}
                </span>
              </div>
            </div>

            <label className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200/90 bg-white px-3 py-2.5 shadow-sm transition-colors hover:bg-neutral-50/50 cursor-pointer">
              <span className="min-w-0">
                <span className="block text-xs font-semibold text-neutral-900">
                  {editor.isActive ? "Active" : "Hidden"}
                </span>
                <span className="mt-0.5 block text-[11px] text-neutral-500">
                  {editor.isActive ? "Shown everywhere" : "Hidden everywhere"}
                </span>
              </span>
              <div className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={editor.isActive}
                  onChange={(event) => setEditor({ ...editor, isActive: event.target.checked })}
                  className="peer sr-only"
                />
                <div className="h-5 w-9 rounded-full bg-neutral-200 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-emerald-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/40"></div>
              </div>
            </label>
          </div>

          {formError ? (
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 p-2.5 text-xs font-medium text-red-700">
              <MaterialIcon name="error" className="mt-0.5 shrink-0 text-[14px]" />
              <p>{formError}</p>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={saving || (touched && Boolean(nameError))}
            className={cn(adminButtonClass.primary, "mt-4 h-9 w-full text-sm shadow-sm transition-all")}
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="size-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Saving…
              </span>
            ) : editing ? (
              "Save changes"
            ) : (
              "Create badge"
            )}
          </button>
        </form>
      </div>

      <ImpactDeleteModal
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDeleted={() => {
          if (deleteTarget && editor.id === deleteTarget.id) reset();
          void load();
        }}
      />
    </div>
  );
}