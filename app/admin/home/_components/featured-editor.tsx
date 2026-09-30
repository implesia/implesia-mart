"use client";

import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import { cn } from "@/lib/utils";
import {
  catalogChoices,
  readHomeSections,
  saveHomeSections,
  type CatalogChoice,
  type FeaturedSection,
} from "@/lib/mart-mock/home-sections";
import { formatTaka } from "@/lib/mart-mock/store";

import { adminButtonClass, adminFieldClass, FieldError, FieldLabel } from "../../_components/admin-ui";
import { HomeCmsHeader } from "./home-cms-header";
import { SectionCopyForm } from "./section-copy-form";

type Draft = { slug: string };

export function FeaturedProducts({ section }: { section: FeaturedSection }) {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const selected = params.get("edit");
  const creating = selected === "new";
  const choices = catalogChoices();
  const bySlug = new Map(choices.map((item) => [item.slug, item]));
  const slugs = section.slugs;
  const used = new Set(slugs);
  const unused = choices.filter((item) => !used.has(item.slug));
  const [draft, setDraft] = useState<Draft | null>(null);
  const [productError, setProductError] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [savedId, setSavedId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [resolved, setResolved] = useState<string | null>(null);
  const loaded = useRef<string | null>(null);
  const focusId = useRef<string | null>(null);
  const productId = useId();

  useEffect(() => {
    if (loaded.current === selected) return;
    loaded.current = selected;
    setResolved(selected);
    setProductError("");
    if (!selected) {
      setDraft(null);
      return;
    }
    const doc = readHomeSections();
    const taken = new Set(doc.featured.slugs);
    if (selected === "new") {
      const next = catalogChoices().find((item) => !taken.has(item.slug));
      setDraft(next ? { slug: next.slug } : null);
      return;
    }
    setDraft(taken.has(selected) ? { slug: selected } : null);
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
    document.getElementById(`featured-${id}`)?.focus();
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

  function patch(partial: Partial<FeaturedSection>) {
    const doc = readHomeSections();
    saveHomeSections({ ...doc, featured: { ...doc.featured, ...partial } });
  }

  function save() {
    if (!draft || saving) return;
    if (!draft.slug) {
      setProductError("Choose a product.");
      return;
    }
    setSaving(true);
    const doc = readHomeSections();
    const current = doc.featured.slugs;
    if (creating) {
      if (current.includes(draft.slug)) {
        setSaving(false);
        setProductError("That product is already featured.");
        return;
      }
      saveHomeSections({ ...doc, featured: { ...doc.featured, slugs: [...current, draft.slug] } });
    } else if (selected) {
      if (draft.slug !== selected && current.includes(draft.slug)) {
        setSaving(false);
        setProductError("That product is already featured.");
        return;
      }
      saveHomeSections({
        ...doc,
        featured: {
          ...doc.featured,
          slugs: current.map((item) => (item === selected ? draft.slug : item)),
        },
      });
    }
    const id = draft.slug;
    setSaving(false);
    setSavedId(id);
    focusId.current = id;
    flash("Saved");
    setEdit(null);
  }

  function remove(slug: string) {
    const doc = readHomeSections();
    saveHomeSections({
      ...doc,
      featured: { ...doc.featured, slugs: doc.featured.slugs.filter((item) => item !== slug) },
    });
    if (selected === slug) setEdit(null);
    setConfirmId(null);
    flash("Removed");
  }

  function move(slug: string, direction: -1 | 1) {
    const doc = readHomeSections();
    const index = doc.featured.slugs.indexOf(slug);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= doc.featured.slugs.length) return;
    const next = [...doc.featured.slugs];
    const [item] = next.splice(index, 1);
    if (!item) return;
    next.splice(target, 0, item);
    saveHomeSections({ ...doc, featured: { ...doc.featured, slugs: next } });
  }

  function dropOn(targetSlug: string) {
    if (!dragId || dragId === targetSlug) {
      setDragId(null);
      setOverId(null);
      return;
    }
    const doc = readHomeSections();
    const next = [...doc.featured.slugs];
    const from = next.indexOf(dragId);
    const to = next.indexOf(targetSlug);
    if (from < 0 || to < 0) return;
    const [item] = next.splice(from, 1);
    if (!item) return;
    next.splice(to, 0, item);
    saveHomeSections({ ...doc, featured: { ...doc.featured, slugs: next } });
    setDragId(null);
    setOverId(null);
  }

  const missing = Boolean(selected && selected !== "new" && resolved === selected && !draft);
  const draftProduct = draft ? bySlug.get(draft.slug) : undefined;
  const editingTitle = draftProduct?.title || "Product";

  return (
    <div className="min-w-0 space-y-4">
      <HomeCmsHeader
        title="Featured products"
        description="Manage the products shown in the featured section on your storefront."
        sectionId="featured"
        extra={
          <button
            type="button"
            onClick={() => setEdit("new")}
            disabled={unused.length === 0}
            title={unused.length === 0 ? "Every catalog product is already featured." : undefined}
            className={adminButtonClass.primary}
          >
            <MaterialIcon name="add" className="text-[18px]" />
            Add product
          </button>
        }
      />

      {notice && !draft ? (
        <p role="status" className="text-sm font-medium text-emerald-800">
          {notice}. The featured list is up to date.
        </p>
      ) : null}
      {missing ? (
        <p className="rounded-2xl bg-white px-4 py-3 text-sm text-neutral-600 ring-1 ring-neutral-200/90">
          This product is no longer in the featured list.{" "}
          <button type="button" onClick={() => setEdit(null)} className="font-medium text-primary">
            Close
          </button>
        </p>
      ) : null}

      <section className="overflow-hidden rounded-2xl bg-[#f5f6f8] ring-1 ring-neutral-200/90" aria-labelledby="featured-preview-heading">
        <div className="px-4 pt-4 sm:px-5">
          <h2 id="featured-preview-heading" className="text-sm font-semibold text-neutral-950">
            Storefront preview
          </h2>
          <p className="mt-0.5 text-sm text-neutral-500">Shown on the home page, in this order. Every product in the list appears there.</p>
        </div>
        <div className="px-4 py-4 sm:px-5">
          <div className="rounded-2xl border border-neutral-200/90 bg-white px-4 py-4 sm:px-5 sm:py-5">
            <SectionCopyForm
              values={{ heading: section.heading, viewAllLabel: section.viewAllLabel, viewAllHref: section.viewAllHref }}
              fields={[
                { name: "heading", label: "Heading", wide: true },
                { name: "viewAllLabel", label: "View all label" },
                { name: "viewAllHref", label: "View all link" },
              ]}
              saveLabel="Save heading"
              onSave={(next) =>
                patch({
                  heading: next.heading ?? "",
                  viewAllLabel: next.viewAllLabel ?? "",
                  viewAllHref: next.viewAllHref ?? "",
                })
              }
            />

            {slugs.length === 0 ? (
              <div className="px-2 py-10 text-center">
                <p className="text-sm font-semibold text-neutral-950">No featured products yet</p>
                <p className="mx-auto mt-1 max-w-md text-sm text-neutral-500">
                  Add a catalog product so it appears in the featured row on the home page.
                </p>
                <button
                  type="button"
                  onClick={() => setEdit("new")}
                  disabled={unused.length === 0}
                  className={cn(adminButtonClass.primary, "mt-4")}
                >
                  <MaterialIcon name="add" className="text-[18px]" />
                  Add product
                </button>
              </div>
            ) : (
              <ul className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
                {slugs.map((slug) => {
                  const product = bySlug.get(slug);
                  return (
                    <li key={slug}>
                      <button
                        type="button"
                        onClick={() => setEdit(slug)}
                        className={cn(
                          "flex h-full w-full flex-col overflow-hidden rounded-2xl bg-white text-left ring-1 ring-neutral-200",
                          selected === slug && "ring-2 ring-primary",
                        )}
                      >
                        <span className="relative aspect-4/5 bg-neutral-100">
                          {product ? (
                            <Image src={product.imageSrc} alt="" fill sizes="(max-width: 1280px) 40vw, 20vw" className="object-cover" />
                          ) : null}
                        </span>
                        <span className="min-w-0 px-2.5 py-2.5">
                          <span className="block truncate text-sm font-semibold text-neutral-950">
                            {product?.title || "Product unavailable"}
                          </span>
                          {product ? <span className="mt-0.5 block text-xs text-neutral-500">{formatTaka(product.price)}</span> : null}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </section>

      {slugs.length > 0 ? (
        <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200/90" aria-labelledby="featured-list-heading">
          <div className="border-b border-neutral-100 px-4 py-3 sm:px-5">
            <h2 id="featured-list-heading" className="text-sm font-semibold text-neutral-950">
              {slugs.length === 1 ? "1 product" : `${slugs.length} products`}
            </h2>
          </div>
          <ol>
            {slugs.map((slug, index) => {
              const product = bySlug.get(slug);
              return (
                <li
                  key={slug}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setOverId(slug);
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    dropOn(slug);
                  }}
                  className={cn(
                    "border-t border-neutral-100 first:border-t-0",
                    selected === slug && "bg-primary/5",
                    savedId === slug && "bg-emerald-50",
                    overId === slug && dragId && dragId !== slug && "bg-primary/10",
                    dragId === slug && "opacity-60",
                  )}
                >
                  <div className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:px-4">
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <button
                        type="button"
                        draggable
                        aria-label={`Reorder ${product?.title || "product"}`}
                        onDragStart={(event) => {
                          event.dataTransfer.setData("text/plain", slug);
                          event.dataTransfer.effectAllowed = "move";
                          setDragId(slug);
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
                        id={`featured-${slug}`}
                        type="button"
                        onClick={() => setEdit(slug)}
                        className="flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                      >
                        <span className="w-5 shrink-0 text-right text-xs text-neutral-400 tabular-nums">{index + 1}</span>
                        <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                          {product ? (
                            <Image src={product.imageSrc} alt="" fill sizes="48px" className="object-cover" />
                          ) : (
                            <span className="grid size-full place-items-center text-neutral-400">
                              <MaterialIcon name="image" className="text-[18px]" />
                            </span>
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-neutral-950">
                            {product?.title || "Product unavailable"}
                          </span>
                          <span className="block truncate text-xs text-neutral-500">{product ? formatTaka(product.price) : "Not in the catalog"}</span>
                        </span>
                      </button>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center justify-end gap-1 pl-11 sm:pl-0">
                      <IconButton label="Move earlier" icon="arrow_upward" disabled={index === 0} onClick={() => move(slug, -1)} />
                      <IconButton label="Move later" icon="arrow_downward" disabled={index === slugs.length - 1} onClick={() => move(slug, 1)} />
                      <button type="button" onClick={() => setEdit(slug)} className={adminButtonClass.quiet}>
                        Edit
                      </button>
                      {confirmId === slug ? (
                        <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-xs text-red-700">
                          Remove from the home page?
                          <button type="button" onClick={() => remove(slug)} className="font-semibold underline">
                            Yes
                          </button>
                          <button type="button" onClick={() => setConfirmId(null)} className="font-semibold">
                            No
                          </button>
                        </span>
                      ) : (
                        <IconButton label="Remove product" icon="delete" danger onClick={() => setConfirmId(slug)} />
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      ) : null}

      {draft ? (
        <div className="fixed inset-0 z-40 flex justify-end bg-neutral-950/40" role="presentation" onClick={() => setEdit(null)}>
          <div
            key={selected ?? "closed"}
            role="dialog"
            aria-modal="true"
            aria-labelledby="featured-drawer-title"
            className="force-light flex h-full w-full max-w-md flex-col bg-white shadow-xl"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => {
              if (event.key === "Escape") setEdit(null);
            }}
          >
            <div className="flex items-start justify-between gap-3 border-b border-neutral-100 px-5 py-4">
              <div className="min-w-0">
                <p className="text-xs font-medium tracking-wide text-neutral-400 uppercase">{creating ? "Add product" : "Edit product"}</p>
                <h2 id="featured-drawer-title" className="mt-1 truncate text-lg font-semibold text-neutral-950">
                  {creating ? "New product" : editingTitle}
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
              {draftProduct ? <ProductPreview product={draftProduct} /> : null}
              <div>
                <FieldLabel htmlFor={productId}>
                  Product <span className="text-red-700">*</span>
                </FieldLabel>
                <select
                  id={productId}
                  autoFocus
                  value={draft.slug}
                  onChange={(event) => {
                    setDraft({ slug: event.target.value });
                    setProductError("");
                  }}
                  aria-invalid={productError ? true : undefined}
                  aria-describedby={productError ? `${productId}-error` : undefined}
                  className={cn(adminFieldClass, productError && "border-red-400")}
                >
                  {choices.map((item) => (
                    <option key={item.slug} value={item.slug} disabled={used.has(item.slug) && item.slug !== (creating ? "" : selected)}>
                      {item.title}
                    </option>
                  ))}
                </select>
                {productError ? (
                  <div id={`${productId}-error`}>
                    <FieldError message={productError} />
                  </div>
                ) : (
                  <p className="mt-1.5 text-xs text-neutral-500">Products already in this list stay unavailable.</p>
                )}
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
                {saving ? "Saving…" : creating ? "Save product" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ProductPreview({ product }: { product: CatalogChoice }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-[#f5f6f8] p-3">
      <span className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-white">
        <Image src={product.imageSrc} alt="" fill sizes="64px" className="object-cover" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-neutral-950">{product.title}</span>
        <span className="mt-0.5 block text-xs text-neutral-500">{formatTaka(product.price)}</span>
      </span>
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
