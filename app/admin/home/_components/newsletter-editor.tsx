"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import { cn } from "@/lib/utils";
import {
  blankPerk,
  readHomeSections,
  saveHomeSections,
  type NewsletterContent,
  type NewsletterPerk,
} from "@/lib/mart-mock/home-sections";

import { adminButtonClass, adminFieldClass, FieldError, FieldLabel } from "../../_components/admin-ui";
import { HomeCmsHeader } from "./home-cms-header";
import { SectionCopyForm } from "./section-copy-form";

const ICONS: { name: string; label: string }[] = [
  { name: "payments", label: "Payments" },
  { name: "local_shipping", label: "Delivery" },
  { name: "assignment_return", label: "Returns" },
  { name: "verified", label: "Verified" },
  { name: "local_offer", label: "Offer" },
  { name: "campaign", label: "Campaign" },
  { name: "shield", label: "Shield" },
  { name: "support_agent", label: "Support" },
  { name: "schedule", label: "Schedule" },
];

type Draft = Pick<NewsletterPerk, "icon" | "label">;

function emptyDraft(): Draft {
  return { icon: "local_offer", label: "" };
}

function draftFromPerk(perk: NewsletterPerk): Draft {
  return { icon: perk.icon, label: perk.label };
}

function iconChoices(current: string) {
  if (ICONS.some((icon) => icon.name === current)) return ICONS;
  return [{ name: current, label: current }, ...ICONS];
}

export function HomeNewsletter({ section }: { section: NewsletterContent }) {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const selected = params.get("edit");
  const creating = selected === "new";
  const perks = section.perks;
  const opened = selected && selected !== "new" ? (perks.find((perk) => perk.id === selected) ?? null) : null;
  const [notice, setNotice] = useState("");
  const [savedId, setSavedId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const focusId = useRef<string | null>(null);

  useEffect(() => {
    if (selected || !focusId.current) return;
    const id = focusId.current;
    focusId.current = null;
    document.getElementById(`newsletter-${id}`)?.focus();
  }, [selected]);

  function setEdit(id: string | null) {
    const next = new URLSearchParams(window.location.search);
    if (id) next.set("edit", id);
    else next.delete("edit");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => {
      setNotice("");
      setSavedId(null);
    }, 1600);
  }

  function patch(partial: Partial<NewsletterContent>) {
    const doc = readHomeSections();
    saveHomeSections({ ...doc, newsletter: { ...doc.newsletter, ...partial } });
  }

  function commit(draft: Draft) {
    const doc = readHomeSections();
    const label = draft.label.trim();
    if (creating) {
      const perk = { ...blankPerk(), icon: draft.icon, label };
      saveHomeSections({ ...doc, newsletter: { ...doc.newsletter, perks: [...doc.newsletter.perks, perk] } });
      setSavedId(perk.id);
      focusId.current = perk.id;
    } else if (selected) {
      saveHomeSections({
        ...doc,
        newsletter: {
          ...doc.newsletter,
          perks: doc.newsletter.perks.map((perk) => (perk.id === selected ? { ...perk, icon: draft.icon, label } : perk)),
        },
      });
      setSavedId(selected);
      focusId.current = selected;
    }
    flash("Saved");
    setEdit(null);
  }

  function remove(id: string) {
    const doc = readHomeSections();
    saveHomeSections({
      ...doc,
      newsletter: { ...doc.newsletter, perks: doc.newsletter.perks.filter((perk) => perk.id !== id) },
    });
    if (selected === id) setEdit(null);
    setConfirmId(null);
    flash("Removed");
  }

  function move(id: string, direction: -1 | 1) {
    const doc = readHomeSections();
    const index = doc.newsletter.perks.findIndex((perk) => perk.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= doc.newsletter.perks.length) return;
    const next = [...doc.newsletter.perks];
    const [perk] = next.splice(index, 1);
    if (!perk) return;
    next.splice(target, 0, perk);
    saveHomeSections({ ...doc, newsletter: { ...doc.newsletter, perks: next } });
  }

  function dropOn(targetId: string) {
    if (!dragId || dragId === targetId) {
      setDragId(null);
      setOverId(null);
      return;
    }
    const doc = readHomeSections();
    const next = [...doc.newsletter.perks];
    const from = next.findIndex((perk) => perk.id === dragId);
    const to = next.findIndex((perk) => perk.id === targetId);
    if (from < 0 || to < 0) return;
    const [perk] = next.splice(from, 1);
    if (!perk) return;
    next.splice(to, 0, perk);
    saveHomeSections({ ...doc, newsletter: { ...doc.newsletter, perks: next } });
    setDragId(null);
    setOverId(null);
  }

  const missing = Boolean(selected && selected !== "new" && !opened);

  return (
    <div className="min-w-0 space-y-4">
      <HomeCmsHeader
        title="Newsletter"
        description="The subscribe block at the bottom of the home page."
        sectionId="newsletter"
        extra={
          <button type="button" onClick={() => setEdit("new")} className={adminButtonClass.primary}>
            <MaterialIcon name="add" className="text-[18px]" />
            Add perk
          </button>
        }
      />

      {notice && !selected ? (
        <p role="status" className="text-sm font-medium text-emerald-800">
          {notice}. The subscribe block is up to date.
        </p>
      ) : null}
      {missing ? (
        <p className="rounded-2xl bg-white px-4 py-3 text-sm text-neutral-600 ring-1 ring-neutral-200/90">
          This perk is no longer here.{" "}
          <button type="button" onClick={() => setEdit(null)} className="font-medium text-primary">
            Close
          </button>
        </p>
      ) : null}

      <section className="overflow-hidden rounded-2xl bg-admin-canvas ring-1 ring-neutral-200/90" aria-labelledby="newsletter-preview-heading">
        <div className="px-4 pt-4 sm:px-5">
          <h2 id="newsletter-preview-heading" className="text-sm font-semibold text-neutral-950">
            Storefront preview
          </h2>
          <p className="mt-1 text-sm text-neutral-500">Shown at the bottom of the home page. Perks sit under the form, in this order.</p>
        </div>
        <div className="p-4 sm:p-5">
          <div className="relative overflow-hidden rounded-2xl bg-[#062f2c] px-5 py-8 sm:px-8 sm:py-10">
            <div className="relative z-10 mx-auto w-full max-w-2xl text-center">
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90">
                <span className="size-1.5 shrink-0 rounded-full bg-warm-gold" />
                {section.eyebrow}
              </p>
              <p className="mb-3 text-2xl font-semibold tracking-tight text-white">{section.title}</p>
              <p className="mx-auto mb-8 text-sm leading-relaxed text-white/70">{section.subtitle}</p>
              <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative block w-full min-w-0 flex-1">
                  <MaterialIcon name="mail" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[20px] text-white/45" />
                  <input
                    type="email"
                    disabled
                    value=""
                    placeholder={section.placeholder}
                    aria-label="Email preview"
                    className="box-border h-12 w-full rounded-xl border border-white/20 bg-white/10 pr-3 pl-10 text-sm text-white outline-none placeholder:text-white/40"
                  />
                </div>
                <span className="inline-flex h-12 w-full shrink-0 items-center justify-center gap-1.5 rounded-xl bg-warm-gold px-6 text-sm font-semibold text-on-surface sm:w-auto sm:px-8">
                  {section.cta}
                  <MaterialIcon name="arrow_forward" className="text-[18px]" />
                </span>
              </div>
              {section.success ? (
                <p className="mt-4 text-xs text-white/55">After subscribe: {section.success}</p>
              ) : null}
              {perks.length > 0 ? (
                <ul className="mt-8 flex w-full flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-8">
                  {perks.map((perk) => (
                    <li key={perk.id}>
                      <button
                        type="button"
                        onClick={() => setEdit(perk.id)}
                        className="flex items-center gap-2 rounded-full text-xs text-white/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warm-gold sm:text-sm"
                      >
                        <MaterialIcon name={perk.icon || "notes"} className="shrink-0 text-[18px] text-warm-gold" />
                        <span>{perk.label || "Perk"}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90 sm:p-5">
        <SectionCopyForm
          values={{
            eyebrow: section.eyebrow,
            title: section.title,
            subtitle: section.subtitle,
            placeholder: section.placeholder,
            cta: section.cta,
            success: section.success,
          }}
          fields={[
            { name: "eyebrow", label: "Eyebrow" },
            { name: "title", label: "Title" },
            { name: "subtitle", label: "Subtitle", multiline: true, wide: true },
            { name: "placeholder", label: "Email placeholder" },
            { name: "cta", label: "Button" },
            { name: "success", label: "Success message", wide: true },
          ]}
          saveLabel="Save heading"
          onSave={(next) =>
            patch({
              eyebrow: next.eyebrow ?? "",
              title: next.title ?? "",
              subtitle: next.subtitle ?? "",
              placeholder: next.placeholder ?? "",
              cta: next.cta ?? "",
              success: next.success ?? "",
            })
          }
        />
      </section>

      <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200/90" aria-labelledby="newsletter-list-heading">
        <div className="border-b border-neutral-100 px-4 py-3 sm:px-5">
          <h2 id="newsletter-list-heading" className="text-sm font-semibold text-neutral-950">
            {perks.length === 1 ? "1 perk" : `${perks.length} perks`}
          </h2>
        </div>
        {perks.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-sm font-semibold text-neutral-950">No perks yet</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-neutral-500">Add a short line that appears under the subscribe form.</p>
            <button type="button" onClick={() => setEdit("new")} className={cn(adminButtonClass.primary, "mt-4")}>
              <MaterialIcon name="add" className="text-[18px]" />
              Add perk
            </button>
          </div>
        ) : (
          <ol>
            {perks.map((perk, index) => (
              <li
                key={perk.id}
                onDragOver={(event) => {
                  event.preventDefault();
                  setOverId(perk.id);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  dropOn(perk.id);
                }}
                className={cn(
                  "border-t border-neutral-100 first:border-t-0",
                  selected === perk.id && "bg-primary/5",
                  savedId === perk.id && "bg-emerald-50",
                  overId === perk.id && dragId && dragId !== perk.id && "bg-primary/10",
                  dragId === perk.id && "opacity-60",
                )}
              >
                <div className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:px-4">
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <button
                      type="button"
                      draggable
                      aria-label={`Reorder ${perk.label || "perk"}`}
                      onDragStart={(event) => {
                        event.dataTransfer.setData("text/plain", perk.id);
                        event.dataTransfer.effectAllowed = "move";
                        setDragId(perk.id);
                      }}
                      onDragEnd={() => {
                        setDragId(null);
                        setOverId(null);
                      }}
                      className="grid size-9 shrink-0 cursor-grab place-items-center rounded-full text-neutral-400 hover:bg-neutral-100 active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                      <MaterialIcon name="drag_indicator" className="text-[18px]" />
                    </button>
                    <button
                      id={`newsletter-${perk.id}`}
                      type="button"
                      onClick={() => setEdit(perk.id)}
                      className="flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                      <span className="w-5 shrink-0 text-right text-xs text-neutral-400 tabular-nums">{index + 1}</span>
                      <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-admin-canvas text-neutral-700">
                        <MaterialIcon name={perk.icon || "notes"} className="text-[22px]" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-neutral-950">{perk.label || "Untitled perk"}</span>
                        <span className="mt-0.5 block text-xs text-neutral-500">
                          {ICONS.find((icon) => icon.name === perk.icon)?.label ?? perk.icon}
                        </span>
                      </span>
                    </button>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-1 pl-11 sm:pl-0">
                    <IconButton label="Move earlier" icon="arrow_upward" disabled={index === 0} onClick={() => move(perk.id, -1)} />
                    <IconButton label="Move later" icon="arrow_downward" disabled={index === perks.length - 1} onClick={() => move(perk.id, 1)} />
                    <button type="button" onClick={() => setEdit(perk.id)} className={adminButtonClass.quiet}>
                      Edit
                    </button>
                    {confirmId === perk.id ? (
                      <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-xs text-red-700">
                        Remove from the home page?
                        <button type="button" onClick={() => remove(perk.id)} className="font-semibold underline">
                          Yes
                        </button>
                        <button type="button" onClick={() => setConfirmId(null)} className="font-semibold">
                          No
                        </button>
                      </span>
                    ) : (
                      <IconButton label="Remove perk" icon="delete" danger onClick={() => setConfirmId(perk.id)} />
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      {selected === "new" || opened ? (
        <PerkDrawer
          key={selected}
          creating={creating}
          initial={opened ? draftFromPerk(opened) : emptyDraft()}
          notice={notice}
          onClose={() => setEdit(null)}
          onSave={commit}
        />
      ) : null}
    </div>
  );
}

function PerkDrawer({
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
  onSave: (draft: Draft) => void;
}) {
  const [draft, setDraft] = useState(initial);
  const [labelError, setLabelError] = useState("");
  const [saving, setSaving] = useState(false);
  const labelId = useId();
  const title = draft.label.trim() || "Perk";

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  function save() {
    if (saving) return;
    if (!draft.label.trim()) {
      setLabelError("Label is required.");
      return;
    }
    setSaving(true);
    onSave({ icon: draft.icon, label: draft.label.trim() });
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-neutral-950/40" role="presentation" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="newsletter-drawer-title"
        className="force-light flex h-full w-full max-w-md flex-col bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === "Escape") onClose();
        }}
      >
        <div className="flex items-start justify-between gap-3 border-b border-neutral-100 px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-medium tracking-wide text-neutral-400 uppercase">{creating ? "Add perk" : "Edit perk"}</p>
            <h2 id="newsletter-drawer-title" className="mt-1 truncate text-lg font-semibold text-neutral-950">
              {creating ? "New perk" : title}
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="grid size-9 shrink-0 place-items-center rounded-full text-neutral-500 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <MaterialIcon name="close" className="text-[20px]" />
          </button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div className="flex items-center gap-3 rounded-2xl bg-[#062f2c] px-4 py-3 text-white">
            <MaterialIcon name={draft.icon || "notes"} className="text-[22px] text-warm-gold" />
            <p className="min-w-0 truncate text-sm">{draft.label.trim() || "Perk"}</p>
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
                    draft.icon === icon.name ? "bg-primary/10 text-primary ring-primary/30" : "bg-white text-neutral-600 ring-neutral-200",
                  )}
                >
                  <MaterialIcon name={icon.name} className="text-[20px]" />
                </button>
              ))}
            </div>
          </div>
          <div>
            <FieldLabel htmlFor={labelId}>
              Label <span className="text-red-700">*</span>
            </FieldLabel>
            <input
              id={labelId}
              autoFocus
              value={draft.label}
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
        <div className="flex items-center justify-end gap-2 border-t border-neutral-100 px-5 py-3">
          {notice ? (
            <p role="status" className="mr-auto text-sm font-medium text-emerald-800">
              {notice}
            </p>
          ) : null}
          <button type="button" onClick={onClose} className={adminButtonClass.secondary}>
            Cancel
          </button>
          <button type="button" onClick={save} disabled={saving} className={adminButtonClass.primary}>
            {saving ? "Saving…" : creating ? "Save perk" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
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
