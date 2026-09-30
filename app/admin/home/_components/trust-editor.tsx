"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import { cn } from "@/lib/utils";
import {
  blankTrustItem,
  readHomeSections,
  saveHomeSections,
  type TrustItem,
} from "@/lib/mart-mock/home-sections";

import { adminButtonClass, adminFieldClass, FieldError, FieldLabel } from "../../_components/admin-ui";
import { HomeCmsHeader } from "./home-cms-header";

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

type Draft = { icon: string; label: string; href: string };

export function TrustBenefits({ items }: { items: TrustItem[] }) {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const selected = params.get("edit");
  const creating = selected === "new";
  const [draft, setDraft] = useState<Draft | null>(null);
  const [labelError, setLabelError] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [savedId, setSavedId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [resolved, setResolved] = useState<string | null>(null);
  const loaded = useRef<string | null>(null);
  const focusId = useRef<string | null>(null);
  const labelId = useId();

  useEffect(() => {
    if (loaded.current === selected) return;
    loaded.current = selected;
    setResolved(selected);
    setLabelError("");
    if (!selected) {
      setDraft(null);
      return;
    }
    if (selected === "new") {
      setDraft({ icon: "verified", label: "", href: "/shipping-returns" });
      return;
    }
    const item = readHomeSections().trust.find((entry) => entry.id === selected);
    setDraft(item ? { icon: item.icon, label: item.label, href: item.href } : null);
  }, [selected]);

  useEffect(() => {
    if (!draft) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [draft]);

  useEffect(() => {
    if (draft || !focusId.current) return;
    const id = focusId.current;
    focusId.current = null;
    document.getElementById(`trust-${id}`)?.focus();
  }, [draft]);

  function setEdit(id: string | null) {
    const next = new URLSearchParams(window.location.search);
    if (id) next.set("edit", id);
    else next.delete("edit");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function save() {
    if (!draft || saving) return;
    const label = draft.label.trim();
    if (!label) {
      setLabelError("Label is required.");
      return;
    }
    setSaving(true);
    const doc = readHomeSections();
    const href = draft.href.trim();
    const created = creating ? { ...blankTrustItem(), icon: draft.icon, label, href } : null;
    if (created) {
      saveHomeSections({ ...doc, trust: [...doc.trust, created] });
    } else if (selected) {
      saveHomeSections({
        ...doc,
        trust: doc.trust.map((entry) => (entry.id === selected ? { ...entry, icon: draft.icon, label, href } : entry)),
      });
    }
    const id = created?.id ?? selected;
    setSaving(false);
    setSavedId(id);
    focusId.current = id;
    setNotice("Saved");
    window.setTimeout(() => {
      setNotice("");
      setSavedId(null);
    }, 1600);
    setEdit(null);
  }

  function remove(id: string) {
    const doc = readHomeSections();
    saveHomeSections({ ...doc, trust: doc.trust.filter((item) => item.id !== id) });
    if (selected === id) setEdit(null);
    setConfirmId(null);
    setNotice("Removed");
    window.setTimeout(() => setNotice(""), 1600);
  }

  function move(id: string, direction: -1 | 1) {
    const doc = readHomeSections();
    const index = doc.trust.findIndex((item) => item.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= doc.trust.length) return;
    const next = [...doc.trust];
    const [item] = next.splice(index, 1);
    if (!item) return;
    next.splice(target, 0, item);
    saveHomeSections({ ...doc, trust: next });
  }

  function dropOn(targetId: string) {
    if (!dragId || dragId === targetId) {
      setDragId(null);
      setOverId(null);
      return;
    }
    const doc = readHomeSections();
    const next = [...doc.trust];
    const from = next.findIndex((item) => item.id === dragId);
    const to = next.findIndex((item) => item.id === targetId);
    if (from < 0 || to < 0) return;
    const [item] = next.splice(from, 1);
    if (!item) return;
    next.splice(to, 0, item);
    saveHomeSections({ ...doc, trust: next });
    setDragId(null);
    setOverId(null);
  }

  const missing = Boolean(selected && selected !== "new" && resolved === selected && !draft);
  const editingLabel = draft?.label.trim() || "Benefit";

  return (
    <div className="min-w-0 space-y-4">
      <HomeCmsHeader
        title="Trust & Benefits"
        description="Manage the trust signals and customer benefits displayed on your storefront."
        sectionId="trust"
        extra={
          <button type="button" onClick={() => setEdit("new")} className={adminButtonClass.primary}>
            <MaterialIcon name="add" className="text-[18px]" />
            Add benefit
          </button>
        }
      />

      {notice && !draft ? (
        <p role="status" className="text-sm font-medium text-emerald-800">
          {notice}. The benefit list is up to date.
        </p>
      ) : null}
      {missing ? (
        <p className="rounded-2xl bg-white px-4 py-3 text-sm text-neutral-600 ring-1 ring-neutral-200/90">
          This benefit is no longer here.{" "}
          <button type="button" onClick={() => setEdit(null)} className="font-medium text-primary">
            Close
          </button>
        </p>
      ) : null}

      <section className="overflow-hidden rounded-2xl bg-[#f5f6f8] ring-1 ring-neutral-200/90" aria-labelledby="trust-preview-heading">
        <div className="px-4 pt-4 sm:px-5">
          <h2 id="trust-preview-heading" className="text-sm font-semibold text-neutral-950">
            Storefront strip
          </h2>
          <p className="mt-0.5 text-sm text-neutral-500">
            Shown under the hero, in this order. Every benefit in the list appears on the home page.
          </p>
        </div>
        {items.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <p className="text-sm font-semibold text-neutral-950">No benefits yet</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-neutral-500">
              Add a benefit such as cash on delivery, nationwide delivery, or easy returns so customers can see it under the hero.
            </p>
            <button type="button" onClick={() => setEdit("new")} className={cn(adminButtonClass.primary, "mt-4")}>
              <MaterialIcon name="add" className="text-[18px]" />
              Add benefit
            </button>
          </div>
        ) : (
          <div className="px-4 py-4 sm:px-5">
            <ul className="grid grid-cols-3 divide-x divide-neutral-200 overflow-hidden rounded-2xl border border-neutral-200/90 bg-white">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setEdit(item.id)}
                    className={cn(
                      "flex h-full w-full flex-col items-center justify-center gap-1 px-1.5 py-3 text-center text-[11px] leading-tight font-medium text-neutral-800 hover:bg-neutral-50 sm:flex-row sm:gap-2.5 sm:px-3 sm:py-4 sm:text-left sm:text-sm sm:leading-normal",
                      selected === item.id && "bg-primary/5",
                    )}
                  >
                    <MaterialIcon name={item.icon || "verified"} className="text-[18px] text-primary sm:text-[20px]" />
                    <span className="min-w-0">{item.label || "Untitled benefit"}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {items.length > 0 ? (
        <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200/90" aria-labelledby="trust-list-heading">
          <div className="border-b border-neutral-100 px-4 py-3 sm:px-5">
            <h2 id="trust-list-heading" className="text-sm font-semibold text-neutral-950">
              {items.length === 1 ? "1 benefit" : `${items.length} benefits`}
            </h2>
          </div>
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
                  overId === item.id && dragId && dragId !== item.id && "bg-primary/10",
                  dragId === item.id && "opacity-60",
                )}
              >
                <div className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:px-4">
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <button
                      type="button"
                      draggable
                      aria-label={`Reorder ${item.label || "benefit"}`}
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
                      <MaterialIcon name="drag_indicator" className="text-[18px]" />
                    </button>
                    <button id={`trust-${item.id}`} type="button" onClick={() => setEdit(item.id)} className="flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
                      <span className="w-5 shrink-0 text-right text-xs text-neutral-400 tabular-nums">{index + 1}</span>
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-admin-subtle text-primary">
                        <MaterialIcon name={item.icon || "verified"} className="text-[20px]" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-neutral-950">{item.label || "Untitled benefit"}</span>
                        <span className="block truncate text-xs text-neutral-500">{item.href || "/shipping-returns"}</span>
                      </span>
                    </button>
                  </div>
                  <div className="flex shrink-0 items-center justify-end gap-1 pl-11 sm:pl-0">
                    <IconButton label="Move earlier" icon="arrow_upward" disabled={index === 0} onClick={() => move(item.id, -1)} />
                    <IconButton label="Move later" icon="arrow_downward" disabled={index === items.length - 1} onClick={() => move(item.id, 1)} />
                    <button type="button" onClick={() => setEdit(item.id)} className={adminButtonClass.quiet}>
                      Edit
                    </button>
                    {confirmId === item.id ? (
                      <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-xs text-red-700">
                        Remove from the home page?
                        <button type="button" onClick={() => remove(item.id)} className="font-semibold underline">
                          Yes
                        </button>
                        <button type="button" onClick={() => setConfirmId(null)} className="font-semibold">
                          No
                        </button>
                      </span>
                    ) : (
                      <IconButton label="Remove benefit" icon="delete" danger onClick={() => setConfirmId(item.id)} />
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {draft ? (
        <div className="fixed inset-0 z-40 flex justify-end bg-neutral-950/40" role="presentation" onClick={() => setEdit(null)}>
          <div
            key={selected ?? "closed"}
            role="dialog"
            aria-modal="true"
            aria-labelledby="trust-drawer-title"
            className="force-light flex h-full w-full max-w-md flex-col bg-white shadow-xl"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => {
              if (event.key === "Escape") setEdit(null);
            }}
          >
            <div className="flex items-start justify-between gap-3 border-b border-neutral-100 px-5 py-4">
              <div className="min-w-0">
                <p className="text-xs font-medium tracking-wide text-neutral-400 uppercase">{creating ? "Add benefit" : "Edit benefit"}</p>
                <h2 id="trust-drawer-title" className="mt-1 truncate text-lg font-semibold text-neutral-950">
                  {creating ? "New benefit" : editingLabel}
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setEdit(null)}
                className="grid size-9 shrink-0 place-items-center rounded-full text-neutral-500 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <MaterialIcon name="close" className="text-[20px]" />
              </button>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
              <div className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-3 py-3">
                <MaterialIcon name={draft.icon || "verified"} className="text-[22px] text-primary" />
                <span className="min-w-0 text-sm font-medium text-neutral-800">{draft.label.trim() || "Label"}</span>
              </div>
              <div>
                <FieldLabel>Icon</FieldLabel>
                <div className="flex flex-wrap gap-1.5" role="group" aria-label="Icon">
                  {ICONS.map((icon) => (
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
              <div>
                <FieldLabel htmlFor={`${labelId}-href`}>Link</FieldLabel>
                <input
                  id={`${labelId}-href`}
                  value={draft.href}
                  onChange={(event) => setDraft({ ...draft, href: event.target.value })}
                  placeholder="/shipping-returns"
                  className={adminFieldClass}
                />
                <p className="mt-1.5 text-xs text-neutral-500">Where this benefit goes when a customer taps it. Blank uses the shipping page.</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-neutral-100 px-5 py-3">
              {notice ? (
                <p role="status" className="mr-auto text-sm font-medium text-emerald-800">
                  {notice}
                </p>
              ) : null}
              <button type="button" onClick={() => setEdit(null)} className={adminButtonClass.secondary}>
                Cancel
              </button>
              <button type="button" onClick={save} disabled={saving} className={adminButtonClass.primary}>
                {saving ? "Saving…" : creating ? "Save benefit" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
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
