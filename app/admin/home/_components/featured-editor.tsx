"use client";

import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import {
  createFeaturedItem,
  deleteFeaturedItem,
  featuredImage,
  getFeaturedSection,
  reorderFeaturedItems,
  updateFeaturedCopy,
  updateFeaturedItem,
  type FeaturedProduct,
  type FeaturedSection,
} from "@/lib/mart-api/featured";
import { MartApiError } from "@/lib/mart-api/products";
import { formatTaka } from "@/lib/mart-mock/store";
import { cn } from "@/lib/utils";

import { AdminFormModal } from "../../_components/admin-form-modal";
import { FormCloseGuard } from "../../_components/form-close-guard";
import {
  adminButtonClass,
  adminFieldClass,
  FieldError,
  FieldLabel,
} from "../../_components/admin-ui";
import { HomeCmsHeader } from "./home-cms-header";
import { SectionCopyForm } from "./section-copy-form";

type Draft = { productId: string };

export function FeaturedProducts() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const selected = params.get("edit");
  const creating = selected === "new";
  const [section, setSection] = useState<FeaturedSection | null>(null);
  const [loadError, setLoadError] = useState("");
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [baseline, setBaseline] = useState<Draft | null>(null);
  const [productError, setProductError] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [savedId, setSavedId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [resolved, setResolved] = useState<string | null>(null);
  const focusId = useRef<string | null>(null);
  const productFieldId = useId();
  const items = section?.items ?? [];
  const choices = section?.choices ?? [];
  const byId = new Map(choices.map((item) => [item.id, item]));
  const used = new Set(items.map((item) => item.productId));
  const unused = choices.filter((item) => !used.has(item.id));

  useEffect(() => {
    let cancelled = false;
    getFeaturedSection()
      .then((next) => {
        if (!cancelled) setSection(next);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setLoadError(
          error instanceof MartApiError ? error.message : "Could not load featured products.",
        );
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if ((selected === null || section) && selected !== openKey) {
    setOpenKey(selected);
    setResolved(selected);
    setProductError("");
    setFormError("");
    if (!selected || !section) {
      setDraft(null);
      setBaseline(null);
    } else if (selected === "new") {
      const taken = new Set(section.items.map((item) => item.productId));
      const next = section.choices.find((item) => !taken.has(item.id));
      const nextDraft = next ? { productId: next.id } : null;
      setDraft(nextDraft);
      setBaseline(nextDraft);
    } else {
      const item = section.items.find((entry) => entry.id === selected);
      const nextDraft = item ? { productId: item.productId } : null;
      setDraft(nextDraft);
      setBaseline(nextDraft);
    }
  }

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

  async function saveCopy(next: Record<string, string>) {
    if (!section) return;
    setSection(
      await updateFeaturedCopy({
        heading: next.heading ?? "",
        viewAllLabel: next.viewAllLabel ?? "",
        viewAllHref: next.viewAllHref ?? "",
      }),
    );
  }

  async function save() {
    if (!draft || saving || !section) return;
    if (!draft.productId) {
      setProductError("Choose a product.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      if (creating) {
        const created = await createFeaturedItem(draft.productId);
        setSection({ ...section, items: [...section.items, created] });
        setSavedId(created.id);
        focusId.current = created.id;
      } else if (selected) {
        const updated = await updateFeaturedItem(selected, draft.productId);
        setSection({
          ...section,
          items: section.items.map((entry) => (entry.id === selected ? updated : entry)),
        });
        setSavedId(selected);
        focusId.current = selected;
      }
      setSaving(false);
      flash("Saved");
      setEdit(null);
    } catch (error) {
      setSaving(false);
      setFormError(error instanceof MartApiError ? error.message : "Could not save the product.");
    }
  }

  async function remove(id: string) {
    if (!section) return;
    try {
      await deleteFeaturedItem(id);
      setSection({ ...section, items: section.items.filter((item) => item.id !== id) });
      if (selected === id) setEdit(null);
      setConfirmId(null);
      flash("Removed");
    } catch (error) {
      setLoadError(error instanceof MartApiError ? error.message : "Could not remove the product.");
    }
  }

  async function move(id: string, direction: -1 | 1) {
    if (!section) return;
    setLoadError("");
    const index = section.items.findIndex((item) => item.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= section.items.length) return;
    const next = [...section.items];
    const [item] = next.splice(index, 1);
    if (!item) return;
    next.splice(target, 0, item);
    try {
      setSection(await reorderFeaturedItems(next.map((entry) => entry.id)));
    } catch (error) {
      setLoadError(error instanceof MartApiError ? error.message : "Could not reorder the products.");
    }
  }

  async function dropOn(targetId: string) {
    if (!dragId || dragId === targetId || !section) {
      setDragId(null);
      setOverId(null);
      return;
    }
    const next = [...section.items];
    const from = next.findIndex((item) => item.id === dragId);
    const to = next.findIndex((item) => item.id === targetId);
    setDragId(null);
    setOverId(null);
    setLoadError("");
    if (from < 0 || to < 0) return;
    const [item] = next.splice(from, 1);
    if (!item) return;
    next.splice(to, 0, item);
    try {
      setSection(await reorderFeaturedItems(next.map((entry) => entry.id)));
    } catch (error) {
      setLoadError(error instanceof MartApiError ? error.message : "Could not reorder the products.");
    }
  }

  if (!section && !loadError) {
    return <div className="h-40 animate-pulse rounded-2xl bg-white ring-1 ring-neutral-200/90" />;
  }
  if (!section) {
    return (
      <p className="rounded-2xl bg-white px-4 py-10 text-center text-sm text-red-700 ring-1 ring-red-100">
        {loadError}
      </p>
    );
  }

  const missing = Boolean(selected && selected !== "new" && resolved === selected && !draft);
  const draftProduct = draft ? byId.get(draft.productId) : undefined;
  const keptProductId = creating ? "" : (items.find((item) => item.id === selected)?.productId ?? "");

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

      {loadError ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{loadError}</p>
      ) : null}
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

      <section
        className="overflow-hidden rounded-2xl bg-[#f5f6f8] ring-1 ring-neutral-200/90"
        aria-labelledby="featured-preview-heading"
      >
        <div className="px-4 pt-4 sm:px-5">
          <h2 id="featured-preview-heading" className="text-sm font-semibold text-neutral-950">
            Storefront preview
          </h2>
          <p className="mt-0.5 text-sm text-neutral-500">
            Shown on the home page, in this order. Hidden products stay off the home page.
          </p>
        </div>
        <div className="px-4 py-4 sm:px-5">
          <div className="rounded-2xl border border-neutral-200/90 bg-white px-4 py-4 sm:px-5 sm:py-5">
            <SectionCopyForm
              values={{
                heading: section.heading,
                viewAllLabel: section.viewAllLabel,
                viewAllHref: section.viewAllHref,
              }}
              fields={[
                { name: "heading", label: "Heading", wide: true },
                { name: "viewAllLabel", label: "View all label" },
                { name: "viewAllHref", label: "View all link" },
              ]}
              saveLabel="Save heading"
              onSave={saveCopy}
            />

            {items.length === 0 ? (
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
                {items.map((item) => {
                  const product = item.product ?? byId.get(item.productId);
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => setEdit(item.id)}
                        className={cn(
                          "flex h-full w-full flex-col overflow-hidden rounded-2xl bg-white text-left ring-1 ring-neutral-200",
                          selected === item.id && "ring-2 ring-primary",
                        )}
                      >
                        <span className="relative aspect-4/5 bg-neutral-100">
                          {product?.imageSrc ? (
                            <Image
                              src={featuredImage(product.imageSrc)}
                              alt=""
                              fill
                              sizes="(max-width: 1280px) 40vw, 20vw"
                              className="object-cover"
                            />
                          ) : null}
                        </span>
                        <span className="min-w-0 px-2.5 py-2.5">
                          <span className="block truncate text-sm font-semibold text-neutral-950">
                            {product?.title || "Product unavailable"}
                          </span>
                          {product ? (
                            <span className="mt-0.5 block text-xs text-neutral-500">
                              {formatTaka(product.price)}
                              {product.published ? "" : " · Hidden"}
                            </span>
                          ) : null}
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

      {items.length > 0 ? (
        <section
          className="overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200/90"
          aria-labelledby="featured-list-heading"
        >
          <div className="border-b border-neutral-100 px-4 py-3 sm:px-5">
            <h2 id="featured-list-heading" className="text-sm font-semibold text-neutral-950">
              {items.length === 1 ? "1 product" : `${items.length} products`}
            </h2>
          </div>
          <ol>
            {items.map((item, index) => {
              const product = item.product ?? byId.get(item.productId);
              return (
                <li
                  key={item.id}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setOverId(item.id);
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    void dropOn(item.id);
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
                        aria-label={`Reorder ${product?.title || "product"}`}
                        onDragStart={(event) => {
                          event.dataTransfer.setData("text/plain", item.id);
                          event.dataTransfer.effectAllowed = "move";
                          setDragId(item.id);
                        }}
                        onDragEnd={() => {
                          setDragId(null);
                          setOverId(null);
                        }}
                        className="grid size-9 shrink-0 cursor-grab place-items-center rounded-full text-neutral-500 hover:bg-neutral-100 active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                      >
                        <MaterialIcon name="drag_indicator" className="text-[18px]" />
                      </button>
                      <button
                        id={`featured-${item.id}`}
                        type="button"
                        onClick={() => setEdit(item.id)}
                        className="flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                      >
                        <span className="w-5 shrink-0 text-right text-xs text-neutral-500 tabular-nums">
                          {index + 1}
                        </span>
                        <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                          {product?.imageSrc ? (
                            <Image
                              src={featuredImage(product.imageSrc)}
                              alt=""
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          ) : (
                            <span className="grid size-full place-items-center text-neutral-500">
                              <MaterialIcon name="image" className="text-[18px]" />
                            </span>
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-neutral-950">
                            {product?.title || "Product unavailable"}
                          </span>
                          <span className="block truncate text-xs text-neutral-500">
                            {product
                              ? `${formatTaka(product.price)}${product.published ? "" : " · Hidden"}`
                              : "Not in the catalog"}
                          </span>
                        </span>
                      </button>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center justify-end gap-1 pl-11 sm:pl-0">
                      <IconButton
                        label="Move earlier"
                        icon="arrow_upward"
                        disabled={index === 0}
                        onClick={() => void move(item.id, -1)}
                      />
                      <IconButton
                        label="Move later"
                        icon="arrow_downward"
                        disabled={index === items.length - 1}
                        onClick={() => void move(item.id, 1)}
                      />
                      <button type="button" onClick={() => setEdit(item.id)} className={adminButtonClass.quiet}>
                        Edit
                      </button>
                      {confirmId === item.id ? (
                        <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-xs text-red-700">
                          Remove from the home page?
                          <button type="button" onClick={() => void remove(item.id)} className="font-semibold underline">
                            Yes
                          </button>
                          <button type="button" onClick={() => setConfirmId(null)} className="font-semibold">
                            No
                          </button>
                        </span>
                      ) : (
                        <IconButton
                          label="Remove product"
                          icon="delete"
                          danger
                          onClick={() => setConfirmId(item.id)}
                        />
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      ) : null}

      {draft && baseline ? (
        <FormCloseGuard baseline={baseline} value={draft} onClose={() => setEdit(null)}>
          <AdminFormModal key={selected ?? "closed"} titleId="featured-drawer-title" size="sm">
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-neutral-100 px-5 py-4">
              <div className="min-w-0">
                <h2 id="featured-drawer-title" className="text-lg font-semibold text-neutral-950">
                  {creating ? "Add product" : "Edit product"}
                </h2>
                <p className="mt-1 text-sm text-neutral-500">
                  {creating ? "Choose a product for the featured row." : "Change the featured product."}
                </p>
              </div>
              <button
                type="button"
                data-form-dismiss=""
                aria-label="Close"
                title="Close"
                onClick={() => setEdit(null)}
                className="grid size-9 shrink-0 place-items-center rounded-full text-neutral-500 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <MaterialIcon name="close" className="text-[20px]" />
              </button>
            </div>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
              {draftProduct ? <ProductPreview product={draftProduct} /> : null}
              <div>
                <FieldLabel htmlFor={productFieldId}>
                  Product <span className="text-red-700">*</span>
                </FieldLabel>
                <select
                  id={productFieldId}
                  autoFocus
                  value={draft.productId}
                  onChange={(event) => {
                    setDraft({ productId: event.target.value });
                    setProductError("");
                  }}
                  aria-invalid={productError ? true : undefined}
                  aria-describedby={productError ? `${productFieldId}-error` : undefined}
                  className={cn(adminFieldClass, productError && "border-red-400")}
                >
                  {choices.map((item) => (
                    <option
                      key={item.id}
                      value={item.id}
                      disabled={used.has(item.id) && item.id !== keptProductId}
                    >
                      {item.title}
                    </option>
                  ))}
                </select>
                {productError ? (
                  <div id={`${productFieldId}-error`}>
                    <FieldError message={productError} />
                  </div>
                ) : (
                  <p className="mt-1.5 text-xs text-neutral-500">
                    Products already in this list stay unavailable.{" "}
                    {draftProduct && !draftProduct.published
                      ? "This product is hidden, so it stays off the website until you publish it on the product page."
                      : "Visibility follows the product’s Live or Hidden status."}
                  </p>
                )}
              </div>
            </div>
            <div className="flex shrink-0 items-center justify-end gap-2 border-t border-neutral-100 px-5 py-3">
              {formError ? <p className="mr-auto text-sm text-red-700">{formError}</p> : null}
              {notice ? (
                <p role="status" className="mr-auto text-sm font-medium text-emerald-800">
                  {notice}
                </p>
              ) : null}
              <button type="button" data-form-dismiss="" onClick={() => setEdit(null)} className={adminButtonClass.secondary}>
                Cancel
              </button>
              <button type="button" onClick={() => void save()} disabled={saving} className={adminButtonClass.primary}>
                {saving ? "Saving…" : creating ? "Save product" : "Save changes"}
              </button>
            </div>
          </AdminFormModal>
        </FormCloseGuard>
      ) : null}
    </div>
  );
}

function ProductPreview({ product }: { product: FeaturedProduct }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-[#f5f6f8] p-3">
      <span className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-white">
        {product.imageSrc ? (
          <Image src={featuredImage(product.imageSrc)} alt="" fill sizes="64px" className="object-cover" />
        ) : null}
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
