"use client";

import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { WhatsAppIcon } from "@/app/(client)/_components/common/brand-icons";
import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import { cn } from "@/lib/utils";
import {
  blankReview,
  readHomeSections,
  saveHomeSections,
  type ReviewItem,
  type ReviewsSection,
} from "@/lib/mart-mock/home-sections";

import { adminButtonClass, adminFieldClass, FieldError, FieldLabel } from "../../_components/admin-ui";
import { ImageField } from "../../_components/image-field";
import { HomeCmsHeader } from "./home-cms-header";
import { SectionCopyForm } from "./section-copy-form";

type Draft = Pick<ReviewItem, "product" | "channel" | "imageSrc" | "imageAlt">;

const CHANNELS: ReviewItem["channel"][] = ["WhatsApp", "Messenger"];

function emptyDraft(): Draft {
  return { product: "", channel: "WhatsApp", imageSrc: "", imageAlt: "" };
}

function draftFromItem(item: ReviewItem): Draft {
  return { product: item.product, channel: item.channel, imageSrc: item.imageSrc, imageAlt: item.imageAlt };
}

export function CustomerReviews({ section }: { section: ReviewsSection }) {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const selected = params.get("edit");
  const creating = selected === "new";
  const items = section.items;
  const opened = selected && selected !== "new" ? (items.find((item) => item.id === selected) ?? null) : null;
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
    document.getElementById(`review-${id}`)?.focus();
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

  function patchCopy(partial: Partial<Pick<ReviewsSection, "kicker" | "title" | "subtitle">>) {
    const doc = readHomeSections();
    saveHomeSections({ ...doc, reviews: { ...doc.reviews, ...partial } });
  }

  function commit(draft: Draft) {
    const doc = readHomeSections();
    if (creating) {
      const item = { ...blankReview(), ...draft };
      saveHomeSections({ ...doc, reviews: { ...doc.reviews, items: [...doc.reviews.items, item] } });
      setSavedId(item.id);
      focusId.current = item.id;
    } else if (selected) {
      saveHomeSections({
        ...doc,
        reviews: {
          ...doc.reviews,
          items: doc.reviews.items.map((entry) => (entry.id === selected ? { ...entry, ...draft } : entry)),
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
    saveHomeSections({ ...doc, reviews: { ...doc.reviews, items: doc.reviews.items.filter((item) => item.id !== id) } });
    if (selected === id) setEdit(null);
    setConfirmId(null);
    flash("Removed");
  }

  function move(id: string, direction: -1 | 1) {
    const doc = readHomeSections();
    const index = doc.reviews.items.findIndex((item) => item.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= doc.reviews.items.length) return;
    const next = [...doc.reviews.items];
    const [item] = next.splice(index, 1);
    if (!item) return;
    next.splice(target, 0, item);
    saveHomeSections({ ...doc, reviews: { ...doc.reviews, items: next } });
  }

  function dropOn(targetId: string) {
    if (!dragId || dragId === targetId) {
      setDragId(null);
      setOverId(null);
      return;
    }
    const doc = readHomeSections();
    const next = [...doc.reviews.items];
    const from = next.findIndex((item) => item.id === dragId);
    const to = next.findIndex((item) => item.id === targetId);
    if (from < 0 || to < 0) return;
    const [item] = next.splice(from, 1);
    if (!item) return;
    next.splice(to, 0, item);
    saveHomeSections({ ...doc, reviews: { ...doc.reviews, items: next } });
    setDragId(null);
    setOverId(null);
  }

  const missing = Boolean(selected && selected !== "new" && !opened);

  return (
    <div className="min-w-0 space-y-4">
      <HomeCmsHeader
        title="Reviews"
        description="Manage the customer review screenshots displayed on your storefront."
        sectionId="reviews"
        extra={
          <button type="button" onClick={() => setEdit("new")} className={adminButtonClass.primary}>
            <MaterialIcon name="add" className="text-[18px]" />
            Add review
          </button>
        }
      />

      {notice && !selected ? (
        <p role="status" className="text-sm font-medium text-emerald-800">
          {notice}. The review list is up to date.
        </p>
      ) : null}
      {missing ? (
        <p className="rounded-2xl bg-white px-4 py-3 text-sm text-neutral-600 ring-1 ring-neutral-200/90">
          This review is no longer here.{" "}
          <button type="button" onClick={() => setEdit(null)} className="font-medium text-primary">
            Close
          </button>
        </p>
      ) : null}

      <section className="overflow-hidden rounded-2xl bg-[#f5f6f8] ring-1 ring-neutral-200/90" aria-labelledby="reviews-preview-heading">
        <div className="px-4 pt-4 sm:px-5">
          <h2 id="reviews-preview-heading" className="text-sm font-semibold text-neutral-950">
            Storefront preview
          </h2>
          <p className="mt-0.5 text-sm text-neutral-500">Shown on the home page, in this order. Every review in the list appears there.</p>
        </div>
        <div className="px-4 py-4 sm:px-5">
          <div className="rounded-2xl border border-neutral-200/90 bg-white px-4 py-4 sm:px-5 sm:py-5">
            <SectionCopyForm
              values={{ kicker: section.kicker, title: section.title, subtitle: section.subtitle }}
              fields={[
                { name: "kicker", label: "Eyebrow" },
                { name: "title", label: "Title" },
                { name: "subtitle", label: "Subtitle", multiline: true, wide: true },
              ]}
              saveLabel="Save heading"
              onSave={(next) => patchCopy({ kicker: next.kicker ?? "", title: next.title ?? "", subtitle: next.subtitle ?? "" })}
            />
            {items.length === 0 ? (
              <div className="px-2 py-10 text-center">
                <p className="text-sm font-semibold text-neutral-950">No reviews yet</p>
                <p className="mx-auto mt-1 max-w-md text-sm text-neutral-500">
                  Add a customer screenshot so it appears in the review row on the home page.
                </p>
                <button type="button" onClick={() => setEdit("new")} className={cn(adminButtonClass.primary, "mt-4")}>
                  <MaterialIcon name="add" className="text-[18px]" />
                  Add review
                </button>
              </div>
            ) : (
              <ul className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
                {items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setEdit(item.id)}
                      className={cn(
                        "flex h-full w-full flex-col overflow-hidden rounded-2xl bg-white text-left ring-1 ring-neutral-200",
                        selected === item.id && "ring-2 ring-primary",
                      )}
                    >
                      <span className="relative aspect-[4/5] bg-neutral-100">
                        {item.imageSrc ? (
                          <Image src={item.imageSrc} alt="" fill sizes="(max-width: 1280px) 40vw, 20vw" className="object-cover object-top" />
                        ) : (
                          <span className="grid size-full place-items-center px-3 text-center text-xs text-neutral-500">Screenshot</span>
                        )}
                      </span>
                      <span className="min-w-0 px-2.5 py-2.5">
                        <span className="block truncate text-sm font-semibold text-neutral-950">{item.product || "Untitled review"}</span>
                        <span className="mt-0.5 flex items-center gap-1.5 text-xs text-neutral-500">
                          <ChannelMark channel={item.channel} />
                          {item.channel}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {items.length > 0 ? (
        <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200/90" aria-labelledby="reviews-list-heading">
          <div className="border-b border-neutral-100 px-4 py-3 sm:px-5">
            <h2 id="reviews-list-heading" className="text-sm font-semibold text-neutral-950">
              {items.length === 1 ? "1 review" : `${items.length} reviews`}
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
                      aria-label={`Reorder ${item.product || "review"}`}
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
                    <button
                      id={`review-${item.id}`}
                      type="button"
                      onClick={() => setEdit(item.id)}
                      className="flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                      <span className="w-5 shrink-0 text-right text-xs text-neutral-400 tabular-nums">{index + 1}</span>
                      <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                        {item.imageSrc ? (
                          <Image src={item.imageSrc} alt="" fill sizes="48px" className="object-cover object-top" />
                        ) : (
                          <span className="grid size-full place-items-center text-neutral-400">
                            <MaterialIcon name="image" className="text-[18px]" />
                          </span>
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-neutral-950">{item.product || "Untitled review"}</span>
                        <span className="mt-0.5 flex items-center gap-1.5 text-xs text-neutral-500">
                          <ChannelMark channel={item.channel} />
                          {item.channel}
                        </span>
                      </span>
                    </button>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-1 pl-11 sm:pl-0">
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
                      <IconButton label="Remove review" icon="delete" danger onClick={() => setConfirmId(item.id)} />
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {selected === "new" || opened ? (
        <ReviewDrawer
          key={selected}
          creating={creating}
          initial={opened ? draftFromItem(opened) : emptyDraft()}
          notice={notice}
          onClose={() => setEdit(null)}
          onSave={commit}
        />
      ) : null}
    </div>
  );
}

function ReviewDrawer({
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
  const [productError, setProductError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const productId = useId();
  const title = draft.product.trim() || "Review";

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  function save() {
    if (saving || uploading) return;
    const product = draft.product.trim();
    if (!product) {
      setProductError("Product is required.");
      return;
    }
    setSaving(true);
    onSave({ ...draft, product, imageAlt: draft.imageAlt.trim() });
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-neutral-950/40" role="presentation" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reviews-drawer-title"
        className="force-light flex h-full w-full max-w-md flex-col bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === "Escape") onClose();
        }}
      >
        <div className="flex items-start justify-between gap-3 border-b border-neutral-100 px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-medium tracking-wide text-neutral-400 uppercase">{creating ? "Add review" : "Edit review"}</p>
            <h2 id="reviews-drawer-title" className="mt-1 truncate text-lg font-semibold text-neutral-950">
              {creating ? "New review" : title}
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
          <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200">
            <div className="relative aspect-[4/5] max-h-52 bg-neutral-100">
              {draft.imageSrc ? (
                <Image src={draft.imageSrc} alt="" fill sizes="400px" className="object-cover object-top" />
              ) : (
                <span className="grid size-full place-items-center text-sm text-neutral-500">Screenshot</span>
              )}
            </div>
            <div className="px-3 py-2.5">
              <p className="truncate text-sm font-semibold text-neutral-950">{draft.product.trim() || "Product"}</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-neutral-500">
                <ChannelMark channel={draft.channel} />
                {draft.channel}
              </p>
            </div>
          </div>
          <ImageField value={draft.imageSrc} onChange={(imageSrc) => setDraft({ ...draft, imageSrc })} onBusy={setUploading} confirmRemove />
          <div>
            <FieldLabel htmlFor={productId}>
              Product <span className="text-red-700">*</span>
            </FieldLabel>
            <input
              id={productId}
              autoFocus
              value={draft.product}
              onChange={(event) => {
                setDraft({ ...draft, product: event.target.value });
                setProductError("");
              }}
              aria-invalid={productError ? true : undefined}
              aria-describedby={productError ? `${productId}-error` : undefined}
              className={cn(adminFieldClass, productError && "border-red-400")}
            />
            {productError ? (
              <div id={`${productId}-error`}>
                <FieldError message={productError} />
              </div>
            ) : null}
          </div>
          <div>
            <FieldLabel htmlFor={`${productId}-channel`}>Channel</FieldLabel>
            <select
              id={`${productId}-channel`}
              value={draft.channel}
              onChange={(event) => setDraft({ ...draft, channel: event.target.value as ReviewItem["channel"] })}
              className={adminFieldClass}
            >
              {CHANNELS.map((channel) => (
                <option key={channel} value={channel}>
                  {channel}
                </option>
              ))}
            </select>
          </div>
          <div>
            <FieldLabel htmlFor={`${productId}-alt`}>Image description</FieldLabel>
            <input
              id={`${productId}-alt`}
              value={draft.imageAlt}
              onChange={(event) => setDraft({ ...draft, imageAlt: event.target.value })}
              className={adminFieldClass}
            />
            <p className="mt-1.5 text-xs text-neutral-500">Read by screen readers when the screenshot is shown.</p>
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
          <button type="button" onClick={save} disabled={saving || uploading} className={adminButtonClass.primary}>
            {saving ? "Saving…" : uploading ? "Uploading…" : creating ? "Save review" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ChannelMark({ channel }: { channel: ReviewItem["channel"] }) {
  if (channel === "WhatsApp") return <WhatsAppIcon className="size-3.5 text-[#25D366]" />;
  return <MaterialIcon name="chat" className="text-[15px] text-[#0084ff]" />;
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
