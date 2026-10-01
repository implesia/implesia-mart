"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import {
  blankDress,
  blankFeature,
  readAboutSections,
  saveAboutSections,
  type AboutDressBlock,
} from "@/lib/mart-mock/about-sections";
import { useAboutSections } from "@/lib/mart-mock/hooks";
import { cn } from "@/lib/utils";

import {
  adminButtonClass,
  adminFieldClass,
  AdminPageHeader,
  FieldError,
  FieldLabel,
} from "../../../_components/admin-ui";
import { ImageField, MultiImageUpload } from "../../../_components/image-field";
import { findCmsPage } from "../../../_config/cms";

const ICONS: { name: string; label: string }[] = [
  { name: "design_services", label: "Design" },
  { name: "back_hand", label: "Handmade" },
  { name: "checkroom", label: "Dresses" },
  { name: "verified", label: "Verified" },
  { name: "payments", label: "Payments" },
  { name: "local_shipping", label: "Delivery" },
  { name: "assignment_return", label: "Returns" },
  { name: "favorite", label: "Favorite" },
  { name: "storefront", label: "Store" },
];

export function AboutDressesEditor() {
  const { dresses } = useAboutSections();
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const dressId = params.get("dress");
  const creating = dressId === "new";
  const editing = creating
    ? null
    : (dresses.find((item) => item.id === dressId) ?? null);
  const drawerOpen = creating || Boolean(editing);
  const missing = Boolean(dressId && !creating && !editing);
  const [notice, setNotice] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const page = findCmsPage("about");

  useEffect(() => {
    if (!drawerOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [drawerOpen]);

  function openDress(id: string | null) {
    const next = new URLSearchParams(window.location.search);
    next.delete("feature");
    next.delete("gallery");
    if (id) next.set("dress", id);
    else next.delete("dress");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 1600);
  }

  function saveDress(draft: AboutDressBlock) {
    const doc = readAboutSections();
    const next = cleanDress(draft);
    const dresses = creating
      ? [...doc.dresses, next]
      : doc.dresses.map((item) => (item.id === next.id ? next : item));
    saveAboutSections({ ...doc, dresses });
    flash("Saved");
    openDress(null);
  }

  function removeDress(id: string) {
    const doc = readAboutSections();
    saveAboutSections({
      ...doc,
      dresses: doc.dresses.filter((item) => item.id !== id),
    });
    if (dressId === id) openDress(null);
    setConfirmId(null);
    flash("Removed");
  }

  function moveDress(id: string, direction: -1 | 1) {
    const doc = readAboutSections();
    const index = doc.dresses.findIndex((item) => item.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= doc.dresses.length) return;
    const next = [...doc.dresses];
    const [item] = next.splice(index, 1);
    if (!item) return;
    next.splice(target, 0, item);
    saveAboutSections({ ...doc, dresses: next });
  }

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
          <span className="font-medium text-neutral-950">Custom dresses</span>
        </nav>
        {page ? (
          <div
            className="mb-4 flex gap-2 overflow-x-auto pb-1"
            aria-label="About sections"
          >
            {page.sections.map((section) => {
              const active = section.id === "custom-dresses";
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
          title="Custom dresses"
          description="Each block is one section on the about page: the writing, buttons, and photos."
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
                onClick={() => openDress("new")}
                className={adminButtonClass.primary}
              >
                <MaterialIcon name="add" className="text-[18px]" />
                Add custom dress
              </button>
            </div>
          }
        />
      </div>

      {notice && !drawerOpen ? (
        <p role="status" className="text-sm font-medium text-emerald-800">
          {notice}. The about page is up to date.
        </p>
      ) : null}
      {missing ? (
        <p className="rounded-2xl bg-white px-4 py-3 text-sm text-neutral-600 ring-1 ring-neutral-200/90">
          This block is no longer here.{" "}
          <button
            type="button"
            onClick={() => openDress(null)}
            className="font-medium text-primary"
          >
            Close
          </button>
        </p>
      ) : null}

      <section
        className="overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200/90"
        aria-labelledby="about-dresses-heading"
      >
        <div className="border-b border-neutral-100 px-4 py-3 sm:px-5">
          <h2
            id="about-dresses-heading"
            className="text-sm font-semibold text-neutral-950"
          >
            {dresses.length === 1
              ? "1 custom dress"
              : `${dresses.length} custom dresses`}
          </h2>
        </div>
        {dresses.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm font-semibold text-neutral-950">
              No custom dresses yet
            </p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-neutral-500">
              Add a block with its writing, buttons, and photos.
            </p>
            <button
              type="button"
              onClick={() => openDress("new")}
              className={cn(adminButtonClass.primary, "mt-4")}
            >
              <MaterialIcon name="add" className="text-[18px]" />
              Add custom dress
            </button>
          </div>
        ) : (
          <ol>
            {dresses.map((dress, index) => {
              const photos = dress.gallery.filter((image) => image.src);
              return (
                <li
                  key={dress.id}
                  className="border-t border-neutral-100 first:border-t-0"
                >
                  <div className="flex flex-col gap-3 px-3 py-3 sm:px-4 lg:flex-row lg:items-center">
                    <button
                      type="button"
                      onClick={() => openDress(dress.id)}
                      className="flex min-w-0 flex-1 items-start gap-3 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                      <span className="mt-0.5 w-5 shrink-0 text-right text-xs text-neutral-400 tabular-nums">
                        {index + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-neutral-950">
                          {dress.title.trim() || "Untitled custom dress"}
                        </span>
                        {dress.kicker ? (
                          <span className="mt-0.5 block truncate text-xs text-primary">
                            {dress.kicker}
                          </span>
                        ) : null}
                        {dress.subtitle ? (
                          <span className="mt-1 line-clamp-2 block text-sm text-neutral-500">
                            {dress.subtitle}
                          </span>
                        ) : null}
                        <span className="mt-2 flex flex-wrap items-center gap-2">
                          {dress.primaryCta.label.trim() ? (
                            <span className="inline-flex h-7 items-center rounded-full bg-neutral-950 px-2.5 text-xs font-semibold text-white">
                              {dress.primaryCta.label}
                            </span>
                          ) : (
                            <span className="text-xs text-neutral-400">
                              No button
                            </span>
                          )}
                          {dress.secondaryCta.label.trim() ? (
                            <span className="inline-flex h-7 items-center rounded-full bg-white px-2.5 text-xs font-semibold text-neutral-700 ring-1 ring-neutral-200">
                              {dress.secondaryCta.label}
                            </span>
                          ) : null}
                          {photos.slice(0, 4).map((image) => (
                            <span
                              key={image.id}
                              className="relative size-8 overflow-hidden rounded-lg bg-neutral-100"
                            >
                              <Image
                                src={image.src}
                                alt=""
                                fill
                                sizes="32px"
                                className="object-cover"
                              />
                            </span>
                          ))}
                          {photos.length === 0 ? (
                            <span className="text-xs text-neutral-400">
                              No photo
                            </span>
                          ) : null}
                        </span>
                      </span>
                    </button>
                    <div className="flex shrink-0 flex-wrap items-center justify-end gap-1 pl-8 lg:pl-0">
                      <IconButton
                        label="Move earlier"
                        icon="arrow_upward"
                        disabled={index === 0}
                        onClick={() => moveDress(dress.id, -1)}
                      />
                      <IconButton
                        label="Move later"
                        icon="arrow_downward"
                        disabled={index === dresses.length - 1}
                        onClick={() => moveDress(dress.id, 1)}
                      />
                      <button
                        type="button"
                        onClick={() => openDress(dress.id)}
                        className={adminButtonClass.quiet}
                      >
                        Edit
                      </button>
                      {confirmId === dress.id ? (
                        <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-xs text-red-700">
                          Remove this block?
                          <button
                            type="button"
                            onClick={() => removeDress(dress.id)}
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
                          label={`Remove ${dress.title.trim() || "custom dress"}`}
                          icon="delete"
                          danger
                          onClick={() => setConfirmId(dress.id)}
                        />
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      {drawerOpen ? (
        <div
          className="fixed inset-0 z-40 flex justify-end bg-neutral-950/40"
          role="presentation"
          onClick={() => openDress(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="about-dress-drawer-title"
            className="force-light flex h-full w-full max-w-xl flex-col overflow-y-auto bg-white shadow-xl"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => {
              if (event.key === "Escape") openDress(null);
            }}
          >
            <DressForm
              key={dressId}
              creating={creating}
              initial={editing ?? blankDress()}
              notice={notice}
              onClose={() => openDress(null)}
              onSave={saveDress}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DressForm({
  creating,
  initial,
  notice,
  onClose,
  onSave,
}: {
  creating: boolean;
  initial: AboutDressBlock;
  notice: string;
  onClose: () => void;
  onSave: (dress: AboutDressBlock) => void;
}) {
  const [dress, setDress] = useState(initial);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(0);
  const formId = useId();

  function save() {
    if (saving || uploading > 0) return;
    const hasText = Boolean(
      dress.title.trim() ||
      dress.subtitle.trim() ||
      dress.features.some(
        (item) => item.title.trim() || item.description.trim(),
      ),
    );
    if (!hasText) {
      setError("Add a title or some text.");
      return;
    }
    if (
      (dress.primaryCta.label.trim() && !dress.primaryCta.href.trim()) ||
      (dress.secondaryCta.label.trim() && !dress.secondaryCta.href.trim())
    ) {
      setError(
        "Add a link for each button that has a label, or clear the label.",
      );
      return;
    }
    setSaving(true);
    onSave(dress);
  }

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex items-start justify-between gap-3 border-b border-neutral-100 px-5 py-4">
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-wide text-neutral-400 uppercase">
            {creating ? "New custom dress" : "Edit custom dress"}
          </p>
          <h2
            id="about-dress-drawer-title"
            className="mt-1 text-lg font-semibold text-neutral-950"
          >
            {creating
              ? "Add custom dress"
              : dress.title.trim() || "Custom dress"}
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

      <div className="flex-1 space-y-6 px-5 py-4">
        <section aria-labelledby={`${formId}-content`}>
          <h3
            id={`${formId}-content`}
            className="text-sm font-semibold text-neutral-950"
          >
            Content
          </h3>
          <p className="mt-1 text-sm text-neutral-500">
            The words beside the photos.
          </p>
          <div className="mt-3 grid gap-3">
            <div>
              <FieldLabel htmlFor={`${formId}-kicker`}>Eyebrow</FieldLabel>
              <input
                id={`${formId}-kicker`}
                value={dress.kicker}
                placeholder="Short line above the title"
                onChange={(event) =>
                  setDress({ ...dress, kicker: event.target.value })
                }
                className={adminFieldClass}
              />
            </div>
            <div>
              <FieldLabel htmlFor={`${formId}-title`}>Title</FieldLabel>
              <input
                id={`${formId}-title`}
                autoFocus
                value={dress.title}
                placeholder="What this block is about"
                onChange={(event) => {
                  setDress({ ...dress, title: event.target.value });
                  setError("");
                }}
                className={adminFieldClass}
              />
            </div>
            <div>
              <FieldLabel htmlFor={`${formId}-text`}>Text</FieldLabel>
              <textarea
                id={`${formId}-text`}
                value={dress.subtitle}
                placeholder="A few lines about your custom dresses"
                rows={4}
                onChange={(event) => {
                  setDress({ ...dress, subtitle: event.target.value });
                  setError("");
                }}
                className={cn(adminFieldClass, "h-auto py-3")}
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-neutral-700">Highlights</p>
              {dress.features.map((feature, index) => (
                <div key={feature.id} className="rounded-xl bg-[#f5f6f8] p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-neutral-500">
                      Highlight {index + 1}
                    </span>
                    <IconButton
                      label={`Remove highlight ${index + 1}`}
                      icon="close"
                      disabled={dress.features.length === 1}
                      onClick={() =>
                        setDress({
                          ...dress,
                          features: dress.features.filter(
                            (item) => item.id !== feature.id,
                          ),
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <label>
                      <span className="mb-1 block text-xs font-medium text-neutral-600">
                        Icon
                      </span>
                      <select
                        aria-label={`Icon for highlight ${index + 1}`}
                        value={feature.icon}
                        onChange={(event) =>
                          setDress({
                            ...dress,
                            features: replace(dress.features, feature.id, {
                              icon: event.target.value,
                            }),
                          })
                        }
                        className={adminFieldClass}
                      >
                        {iconChoices(feature.icon).map((icon) => (
                          <option key={icon.name} value={icon.name}>
                            {icon.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span className="mb-1 block text-xs font-medium text-neutral-600">
                        Title
                      </span>
                      <input
                        value={feature.title}
                        placeholder="Your own design"
                        aria-label={`Title for highlight ${index + 1}`}
                        onChange={(event) =>
                          setDress({
                            ...dress,
                            features: replace(dress.features, feature.id, {
                              title: event.target.value,
                            }),
                          })
                        }
                        className={adminFieldClass}
                      />
                    </label>
                    <label>
                      <span className="mb-1 block text-xs font-medium text-neutral-600">
                        Text
                      </span>
                      <textarea
                        value={feature.description}
                        placeholder="One line that explains it"
                        rows={2}
                        aria-label={`Text for highlight ${index + 1}`}
                        onChange={(event) =>
                          setDress({
                            ...dress,
                            features: replace(dress.features, feature.id, {
                              description: event.target.value,
                            }),
                          })
                        }
                        className={cn(adminFieldClass, "h-auto py-3")}
                      />
                    </label>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  setDress({
                    ...dress,
                    features: [...dress.features, blankFeature()],
                  })
                }
                className={adminButtonClass.secondary}
              >
                <MaterialIcon name="add" className="text-[18px]" />
                Add highlight
              </button>
            </div>
          </div>
        </section>

        <section
          className="border-t border-neutral-100 pt-5"
          aria-labelledby={`${formId}-buttons`}
        >
          <h3
            id={`${formId}-buttons`}
            className="text-sm font-semibold text-neutral-950"
          >
            Buttons
          </h3>
          <p className="mt-1 text-sm text-neutral-500">
            Optional. The first button is filled. The second is an outline.
          </p>
          <div className="mt-3 grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <FieldLabel htmlFor={`${formId}-primary-label`}>
                  First button
                </FieldLabel>
                <input
                  id={`${formId}-primary-label`}
                  value={dress.primaryCta.label}
                  placeholder="Order now"
                  onChange={(event) => {
                    setDress({
                      ...dress,
                      primaryCta: {
                        ...dress.primaryCta,
                        label: event.target.value,
                      },
                    });
                    setError("");
                  }}
                  className={adminFieldClass}
                />
              </div>
              <div>
                <FieldLabel htmlFor={`${formId}-primary-link`}>
                  First button link
                </FieldLabel>
                <input
                  id={`${formId}-primary-link`}
                  value={dress.primaryCta.href}
                  placeholder="/products"
                  onChange={(event) => {
                    setDress({
                      ...dress,
                      primaryCta: {
                        ...dress.primaryCta,
                        href: event.target.value,
                      },
                    });
                    setError("");
                  }}
                  className={adminFieldClass}
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <FieldLabel htmlFor={`${formId}-secondary-label`}>
                  Second button
                </FieldLabel>
                <input
                  id={`${formId}-secondary-label`}
                  value={dress.secondaryCta.label}
                  placeholder="See all dresses"
                  onChange={(event) => {
                    setDress({
                      ...dress,
                      secondaryCta: {
                        ...dress.secondaryCta,
                        label: event.target.value,
                      },
                    });
                    setError("");
                  }}
                  className={adminFieldClass}
                />
              </div>
              <div>
                <FieldLabel htmlFor={`${formId}-secondary-link`}>
                  Second button link
                </FieldLabel>
                <input
                  id={`${formId}-secondary-link`}
                  value={dress.secondaryCta.href}
                  placeholder="/products?category=dresses"
                  onChange={(event) => {
                    setDress({
                      ...dress,
                      secondaryCta: {
                        ...dress.secondaryCta,
                        href: event.target.value,
                      },
                    });
                    setError("");
                  }}
                  className={adminFieldClass}
                />
              </div>
            </div>
          </div>
        </section>

        <section
          className="border-t border-neutral-100 pt-5"
          aria-labelledby={`${formId}-images`}
        >
          <div>
            <h3
              id={`${formId}-images`}
              className="text-sm font-semibold text-neutral-950"
            >
              Images
            </h3>
            <p className="mt-1 text-sm text-neutral-500">
              Optional photos on the left of this block. Pick or drop several
              images at once.
            </p>
          </div>
          <div className="mt-3">
            <MultiImageUpload
              inputId={`${formId}-upload`}
              onBusy={(busy) =>
                setUploading((count) => Math.max(0, count + (busy ? 1 : -1)))
              }
              onUploaded={(srcs) =>
                setDress((current) => ({
                  ...current,
                  gallery: [
                    ...current.gallery,
                    ...srcs.map((src, index) => ({
                      id: `image-${Date.now().toString(36)}-${index}-${Math.random().toString(36).slice(2, 6)}`,
                      src,
                      alt: "",
                    })),
                  ],
                }))
              }
            />
          </div>
          {dress.gallery.length === 0 ? (
            <p className="mt-3 text-sm text-neutral-500">No photos yet.</p>
          ) : null}
          <ul className={cn("space-y-3", dress.gallery.length > 0 && "mt-3")}>
            {dress.gallery.map((image, index) => (
              <li key={image.id} className="rounded-xl bg-[#f5f6f8] p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-neutral-500">
                    Image {index + 1}
                  </span>
                  <IconButton
                    label={`Remove image ${index + 1}`}
                    icon="close"
                    onClick={() =>
                      setDress({
                        ...dress,
                        gallery: dress.gallery.filter(
                          (item) => item.id !== image.id,
                        ),
                      })
                    }
                  />
                </div>
                <ImageField
                  compact
                  label=""
                  value={image.src}
                  confirmRemove
                  onBusy={(busy) =>
                    setUploading((count) =>
                      Math.max(0, count + (busy ? 1 : -1)),
                    )
                  }
                  onChange={(src) =>
                    setDress((current) => ({
                      ...current,
                      gallery: replace(current.gallery, image.id, { src }),
                    }))
                  }
                />
                <label className="mt-2 block">
                  <span className="mb-1 block text-xs font-medium text-neutral-600">
                    Description
                  </span>
                  <input
                    value={image.alt}
                    placeholder="What the picture shows"
                    aria-label={`Description for image ${index + 1}`}
                    onChange={(event) =>
                      setDress({
                        ...dress,
                        gallery: replace(dress.gallery, image.id, {
                          alt: event.target.value,
                        }),
                      })
                    }
                    className={adminFieldClass}
                  />
                </label>
              </li>
            ))}
          </ul>
        </section>

        {error ? <FieldError message={error} /> : null}
      </div>

      <div className="mt-auto flex items-center justify-end gap-2 border-t border-neutral-100 px-5 py-3">
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
          onClick={onClose}
          className={adminButtonClass.secondary}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={save}
          disabled={saving || uploading > 0}
          className={adminButtonClass.primary}
        >
          {saving
            ? "Saving…"
            : uploading > 0
              ? "Uploading…"
              : creating
                ? "Add custom dress"
                : "Save changes"}
        </button>
      </div>
    </div>
  );
}

function cleanDress(dress: AboutDressBlock): AboutDressBlock {
  return {
    ...dress,
    kicker: dress.kicker.trim(),
    title: dress.title.trim(),
    subtitle: dress.subtitle.trim(),
    features: dress.features
      .map((item) => ({
        ...item,
        title: item.title.trim(),
        description: item.description.trim(),
      }))
      .filter((item) => item.title || item.description),
    primaryCta: {
      label: dress.primaryCta.label.trim(),
      href: dress.primaryCta.href.trim(),
    },
    secondaryCta: {
      label: dress.secondaryCta.label.trim(),
      href: dress.secondaryCta.href.trim(),
    },
    gallery: dress.gallery
      .map((item) => ({ ...item, src: item.src.trim(), alt: item.alt.trim() }))
      .filter((item) => item.src),
  };
}

function iconChoices(current: string) {
  if (ICONS.some((icon) => icon.name === current)) return ICONS;
  return [{ name: current, label: current }, ...ICONS];
}

function replace<T extends { id: string }>(
  items: T[],
  id: string,
  patch: Partial<T>,
) {
  return items.map((item) => (item.id === id ? { ...item, ...patch } : item));
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
        "grid size-9 shrink-0 place-items-center rounded-full text-neutral-500 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-30",
        danger && "hover:bg-red-50 hover:text-red-600",
      )}
    >
      <MaterialIcon name={icon} className="text-[18px]" />
    </button>
  );
}
