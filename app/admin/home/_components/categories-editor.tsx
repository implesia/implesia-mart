"use client";

import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import { cn } from "@/lib/utils";
import {
  blankCategoryTile,
  readHomeSections,
  saveHomeSections,
  type CategoriesSection,
} from "@/lib/mart-mock/home-sections";

import { adminButtonClass, adminFieldClass, FieldError, FieldLabel } from "../../_components/admin-ui";
import { ImageField } from "../../_components/image-field";
import { HomeCmsHeader } from "./home-cms-header";
import { SectionCopyForm } from "./section-copy-form";

type Draft = { label: string; imageSrc: string; href: string };

export function CategoryTiles({ section }: { section: CategoriesSection }) {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const selected = params.get("edit");
  const creating = selected === "new";
  const tiles = section.tiles;
  const [draft, setDraft] = useState<Draft | null>(null);
  const [labelError, setLabelError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
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
      setDraft({ label: "", imageSrc: "", href: "/products" });
      return;
    }
    const tile = readHomeSections().categories.tiles.find((entry) => entry.id === selected);
    setDraft(tile ? { label: tile.label, imageSrc: tile.imageSrc, href: tile.href } : null);
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
    document.getElementById(`category-${id}`)?.focus();
  }, [draft]);

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

  function saveHeading(heading: string) {
    const doc = readHomeSections();
    saveHomeSections({ ...doc, categories: { ...doc.categories, heading } });
  }

  function save() {
    if (!draft || saving || uploading) return;
    const label = draft.label.trim();
    if (!label) {
      setLabelError("Label is required.");
      return;
    }
    setSaving(true);
    const doc = readHomeSections();
    const href = draft.href.trim();
    const imageSrc = draft.imageSrc;
    const saved = creating ? { ...blankCategoryTile(), label, href, imageSrc } : null;
    if (saved) {
      saveHomeSections({ ...doc, categories: { ...doc.categories, tiles: [...doc.categories.tiles, saved] } });
    } else if (selected) {
      saveHomeSections({
        ...doc,
        categories: {
          ...doc.categories,
          tiles: doc.categories.tiles.map((entry) =>
            entry.id === selected ? { ...entry, label, href, imageSrc } : entry,
          ),
        },
      });
    }
    const id = saved?.id ?? selected;
    setSaving(false);
    setSavedId(id);
    focusId.current = id;
    flash("Saved");
    setEdit(null);
  }

  function remove(id: string) {
    const doc = readHomeSections();
    saveHomeSections({
      ...doc,
      categories: { ...doc.categories, tiles: doc.categories.tiles.filter((tile) => tile.id !== id) },
    });
    if (selected === id) setEdit(null);
    setConfirmId(null);
    flash("Removed");
  }

  function move(id: string, direction: -1 | 1) {
    const doc = readHomeSections();
    const index = doc.categories.tiles.findIndex((tile) => tile.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= doc.categories.tiles.length) return;
    const next = [...doc.categories.tiles];
    const [tile] = next.splice(index, 1);
    if (!tile) return;
    next.splice(target, 0, tile);
    saveHomeSections({ ...doc, categories: { ...doc.categories, tiles: next } });
  }

  function dropOn(targetId: string) {
    if (!dragId || dragId === targetId) {
      setDragId(null);
      setOverId(null);
      return;
    }
    const doc = readHomeSections();
    const next = [...doc.categories.tiles];
    const from = next.findIndex((tile) => tile.id === dragId);
    const to = next.findIndex((tile) => tile.id === targetId);
    if (from < 0 || to < 0) return;
    const [tile] = next.splice(from, 1);
    if (!tile) return;
    next.splice(to, 0, tile);
    saveHomeSections({ ...doc, categories: { ...doc.categories, tiles: next } });
    setDragId(null);
    setOverId(null);
  }

  const missing = Boolean(selected && selected !== "new" && resolved === selected && !draft);
  const editingLabel = draft?.label.trim() || "Category";

  return (
    <div className="min-w-0 space-y-4">
      <HomeCmsHeader
        title="Categories"
        description="Manage the category tiles displayed on your storefront."
        sectionId="categories"
        extra={
          <button type="button" onClick={() => setEdit("new")} className={adminButtonClass.primary}>
            <MaterialIcon name="add" className="text-[18px]" />
            Add category
          </button>
        }
      />

      {notice && !draft ? (
        <p role="status" className="text-sm font-medium text-emerald-800">
          {notice}. The category list is up to date.
        </p>
      ) : null}
      {missing ? (
        <p className="rounded-2xl bg-white px-4 py-3 text-sm text-neutral-600 ring-1 ring-neutral-200/90">
          This category is no longer here.{" "}
          <button type="button" onClick={() => setEdit(null)} className="font-medium text-primary">
            Close
          </button>
        </p>
      ) : null}

      <section className="overflow-hidden rounded-2xl bg-[#f5f6f8] ring-1 ring-neutral-200/90" aria-labelledby="category-preview-heading">
        <div className="px-4 pt-4 sm:px-5">
          <h2 id="category-preview-heading" className="text-sm font-semibold text-neutral-950">
            Storefront preview
          </h2>
          <p className="mt-0.5 text-sm text-neutral-500">Shown on the home page, in this order. Every category in the list appears there.</p>
        </div>
        <div className="px-4 py-4 sm:px-5">
          <div className="rounded-2xl border border-neutral-200/90 bg-white px-4 py-4 sm:px-6 sm:py-5">
            <SectionCopyForm
              values={{ heading: section.heading }}
              fields={[{ name: "heading", label: "Heading", wide: true }]}
              saveLabel="Save heading"
              onSave={(next) => saveHeading(next.heading ?? "")}
            />
            {tiles.length === 0 ? (
              <div className="px-2 py-10 text-center">
                <p className="text-sm font-semibold text-neutral-950">No categories yet</p>
                <p className="mx-auto mt-1 max-w-md text-sm text-neutral-500">
                  Add a category tile so customers can open a collection from the home page.
                </p>
                <button type="button" onClick={() => setEdit("new")} className={cn(adminButtonClass.primary, "mt-4")}>
                  <MaterialIcon name="add" className="text-[18px]" />
                  Add category
                </button>
              </div>
            ) : (
              <ul className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-3">
                {tiles.map((tile) => (
                  <li key={tile.id}>
                    <button
                      type="button"
                      onClick={() => setEdit(tile.id)}
                      className={cn(
                        "relative flex min-h-32 w-full overflow-hidden rounded-2xl text-left sm:min-h-56",
                        selected === tile.id && "ring-2 ring-primary",
                      )}
                    >
                      {tile.imageSrc ? (
                        <Image src={tile.imageSrc} alt="" fill sizes="(max-width: 640px) 50vw, 40vw" className="object-cover" />
                      ) : (
                        <span className="absolute inset-0 bg-neutral-800" />
                      )}
                      <span aria-hidden className="absolute inset-0 bg-linear-to-t from-black/75 via-black/25 to-black/10" />
                      <span className="relative z-10 mt-auto px-3 py-3 text-sm font-semibold text-white sm:px-5 sm:py-5 sm:text-2xl">
                        {tile.label || "Untitled category"}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {tiles.length > 0 ? (
        <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200/90" aria-labelledby="category-list-heading">
          <div className="border-b border-neutral-100 px-4 py-3 sm:px-5">
            <h2 id="category-list-heading" className="text-sm font-semibold text-neutral-950">
              {tiles.length === 1 ? "1 category" : `${tiles.length} categories`}
            </h2>
          </div>
          <ol>
            {tiles.map((tile, index) => (
              <li
                key={tile.id}
                onDragOver={(event) => {
                  event.preventDefault();
                  setOverId(tile.id);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  dropOn(tile.id);
                }}
                className={cn(
                  "border-t border-neutral-100 first:border-t-0",
                  selected === tile.id && "bg-primary/5",
                  savedId === tile.id && "bg-emerald-50",
                  overId === tile.id && dragId && dragId !== tile.id && "bg-primary/10",
                  dragId === tile.id && "opacity-60",
                )}
              >
                <div className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:px-4">
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <button
                      type="button"
                      draggable
                      aria-label={`Reorder ${tile.label || "category"}`}
                      onDragStart={(event) => {
                        event.dataTransfer.setData("text/plain", tile.id);
                        event.dataTransfer.effectAllowed = "move";
                        setDragId(tile.id);
                      }}
                      onDragEnd={() => {
                        setDragId(null);
                        setOverId(null);
                      }}
                      className="grid size-9 shrink-0 cursor-grab place-items-center rounded-full text-neutral-400 hover:bg-neutral-100 active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                      <MaterialIcon name="drag_indicator" className="text-[18px]" />
                    </button>
                    <button id={`category-${tile.id}`} type="button" onClick={() => setEdit(tile.id)} className="flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
                      <span className="w-5 shrink-0 text-right text-xs text-neutral-400 tabular-nums">{index + 1}</span>
                      <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                        {tile.imageSrc ? (
                          <Image src={tile.imageSrc} alt="" fill sizes="48px" className="object-cover" />
                        ) : (
                          <span className="grid size-full place-items-center text-neutral-400">
                            <MaterialIcon name="image" className="text-[18px]" />
                          </span>
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-neutral-950">{tile.label || "Untitled category"}</span>
                        <span className="block truncate text-xs text-neutral-500">{tile.href || "/products"}</span>
                      </span>
                    </button>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-1 pl-11 sm:pl-0">
                    <IconButton label="Move earlier" icon="arrow_upward" disabled={index === 0} onClick={() => move(tile.id, -1)} />
                    <IconButton label="Move later" icon="arrow_downward" disabled={index === tiles.length - 1} onClick={() => move(tile.id, 1)} />
                    <button type="button" onClick={() => setEdit(tile.id)} className={adminButtonClass.quiet}>
                      Edit
                    </button>
                    {confirmId === tile.id ? (
                      <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-xs text-red-700">
                        Remove from the home page?
                        <button type="button" onClick={() => remove(tile.id)} className="font-semibold underline">
                          Yes
                        </button>
                        <button type="button" onClick={() => setConfirmId(null)} className="font-semibold">
                          No
                        </button>
                      </span>
                    ) : (
                      <IconButton label="Remove category" icon="delete" danger onClick={() => setConfirmId(tile.id)} />
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
            aria-labelledby="category-drawer-title"
            className="force-light flex h-full w-full max-w-md flex-col bg-white shadow-xl"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => {
              if (event.key === "Escape") setEdit(null);
            }}
          >
            <div className="flex items-start justify-between gap-3 border-b border-neutral-100 px-5 py-4">
              <div className="min-w-0">
                <p className="text-xs font-medium tracking-wide text-neutral-400 uppercase">{creating ? "Add category" : "Edit category"}</p>
                <h2 id="category-drawer-title" className="mt-1 truncate text-lg font-semibold text-neutral-950">
                  {creating ? "New category" : editingLabel}
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
              <div className="relative flex min-h-28 overflow-hidden rounded-2xl bg-neutral-800">
                {draft.imageSrc ? (
                  <Image src={draft.imageSrc} alt="" fill sizes="400px" className="object-cover" />
                ) : null}
                <span aria-hidden className="absolute inset-0 bg-linear-to-t from-black/75 via-black/25 to-black/10" />
                <span className="relative z-10 mt-auto px-4 py-3 text-sm font-semibold text-white">
                  {draft.label.trim() || "Label"}
                </span>
              </div>
              <ImageField
                value={draft.imageSrc}
                onChange={(imageSrc) => setDraft({ ...draft, imageSrc })}
                onBusy={setUploading}
                confirmRemove
              />
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
                  placeholder="/products"
                  className={adminFieldClass}
                />
                <p className="mt-1.5 text-xs text-neutral-500">Where this category goes when a customer taps it. Blank uses the products page.</p>
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
              <button type="button" onClick={save} disabled={saving || uploading} className={adminButtonClass.primary}>
                {saving ? "Saving…" : uploading ? "Uploading…" : creating ? "Save category" : "Save changes"}
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
