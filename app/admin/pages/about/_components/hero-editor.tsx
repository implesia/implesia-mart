"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import {
  blankAboutImage,
  readAboutSections,
  saveAboutSections,
  type AboutHeroContent,
  type AboutImage,
  type AboutLink,
} from "@/lib/mart-mock/about-sections";
import { useAboutSections } from "@/lib/mart-mock/hooks";
import { cn } from "@/lib/utils";

import { adminButtonClass, adminFieldClass, AdminPageHeader, FieldError, FieldLabel } from "../../../_components/admin-ui";
import { ImageField } from "../../../_components/image-field";
import { findCmsPage } from "../../../_config/cms";

const PHOTO_LIMIT = 2;

type Draft = Pick<AboutImage, "src" | "alt">;

function emptyDraft(): Draft {
  return { src: "", alt: "" };
}

function draftFromImage(image: AboutImage): Draft {
  return { src: image.src, alt: image.alt };
}

function slotLabel(index: number) {
  if (index === 0) return "Left photo";
  if (index === 1) return "Right photo";
  return "Not shown";
}

export function AboutHeroEditor() {
  const { hero } = useAboutSections();
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const selected = params.get("edit");
  const creating = selected === "new";
  const images = hero.images;
  const opened = selected && selected !== "new" ? (images.find((image) => image.id === selected) ?? null) : null;
  const [notice, setNotice] = useState("");
  const [savedId, setSavedId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const focusId = useRef<string | null>(null);
  const fieldId = useId();
  const page = findCmsPage("about");
  const full = images.length >= PHOTO_LIMIT;

  useEffect(() => {
    if (selected || !focusId.current) return;
    const id = focusId.current;
    focusId.current = null;
    document.getElementById(`about-hero-${id}`)?.focus();
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

  function patch(partial: Partial<AboutHeroContent>) {
    const doc = readAboutSections();
    saveAboutSections({ ...doc, hero: { ...doc.hero, ...partial } });
  }

  function commit(draft: Draft) {
    const doc = readAboutSections();
    if (creating) {
      if (doc.hero.images.length >= PHOTO_LIMIT) return;
      const image = { ...blankAboutImage(), src: draft.src, alt: draft.alt };
      saveAboutSections({ ...doc, hero: { ...doc.hero, images: [...doc.hero.images, image] } });
      setSavedId(image.id);
      focusId.current = image.id;
    } else if (selected) {
      saveAboutSections({
        ...doc,
        hero: {
          ...doc.hero,
          images: doc.hero.images.map((image) => (image.id === selected ? { ...image, src: draft.src, alt: draft.alt } : image)),
        },
      });
      setSavedId(selected);
      focusId.current = selected;
    }
    flash("Saved");
    setEdit(null);
  }

  function remove(id: string) {
    const doc = readAboutSections();
    saveAboutSections({ ...doc, hero: { ...doc.hero, images: doc.hero.images.filter((image) => image.id !== id) } });
    if (selected === id) setEdit(null);
    setConfirmId(null);
    flash("Removed");
  }

  function move(id: string, direction: -1 | 1) {
    const doc = readAboutSections();
    const index = doc.hero.images.findIndex((image) => image.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= doc.hero.images.length) return;
    const next = [...doc.hero.images];
    const [image] = next.splice(index, 1);
    if (!image) return;
    next.splice(target, 0, image);
    saveAboutSections({ ...doc, hero: { ...doc.hero, images: next } });
  }

  function dropOn(targetId: string) {
    if (!dragId || dragId === targetId) {
      setDragId(null);
      setOverId(null);
      return;
    }
    const doc = readAboutSections();
    const next = [...doc.hero.images];
    const from = next.findIndex((image) => image.id === dragId);
    const to = next.findIndex((image) => image.id === targetId);
    if (from < 0 || to < 0) return;
    const [image] = next.splice(from, 1);
    if (!image) return;
    next.splice(to, 0, image);
    saveAboutSections({ ...doc, hero: { ...doc.hero, images: next } });
    setDragId(null);
    setOverId(null);
  }

  const missing = Boolean(selected && selected !== "new" && !opened);
  const shown = images.slice(0, PHOTO_LIMIT);

  return (
    <div className="min-w-0 space-y-4">
      <div>
        <nav aria-label="Breadcrumb" className="mb-3 flex flex-wrap items-center gap-1 text-sm text-neutral-500">
          <Link href="/admin/pages/about" className="font-medium hover:text-neutral-950">
            About
          </Link>
          <MaterialIcon name="chevron_right" className="text-[16px] text-neutral-300" />
          <span className="font-medium text-neutral-950">Hero</span>
        </nav>
        {page ? (
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1" aria-label="About sections">
            {page.sections.map((section) => {
              const active = section.id === "hero";
              return (
                <Link
                  key={section.id}
                  href={`${page.href}/${section.id}`}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex h-9 shrink-0 items-center rounded-full px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                    active ? "bg-neutral-950 font-medium text-white" : "bg-white font-medium text-neutral-600 ring-1 ring-neutral-200 hover:bg-neutral-50",
                  )}
                >
                  {section.label}
                </Link>
              );
            })}
          </div>
        ) : null}
        <AdminPageHeader
          title="Hero"
          description="The banner at the top of the about page. Words on the left, two photos on the right."
          action={
            <div className="flex flex-wrap items-center gap-2">
              <a href="/about-us" target="_blank" rel="noreferrer" className={adminButtonClass.secondary}>
                View on site
                <MaterialIcon name="open_in_new" className="text-[18px]" />
              </a>
              <button
                type="button"
                onClick={() => setEdit("new")}
                disabled={full}
                title={full ? "The banner shows two photos." : undefined}
                className={adminButtonClass.primary}
              >
                <MaterialIcon name="add" className="text-[18px]" />
                Add photo
              </button>
            </div>
          }
        />
      </div>

      {notice && !selected ? (
        <p role="status" className="text-sm font-medium text-emerald-800">
          {notice}. The banner is up to date.
        </p>
      ) : null}
      {missing ? (
        <p className="rounded-2xl bg-white px-4 py-3 text-sm text-neutral-600 ring-1 ring-neutral-200/90">
          This photo is no longer here.{" "}
          <button type="button" onClick={() => setEdit(null)} className="font-medium text-primary">
            Close
          </button>
        </p>
      ) : null}

      <section className="overflow-hidden rounded-2xl bg-[#f5f6f8] ring-1 ring-neutral-200/90" aria-labelledby="about-hero-preview-heading">
        <div className="px-4 pt-4 sm:px-5">
          <h2 id="about-hero-preview-heading" className="text-sm font-semibold text-neutral-950">
            Storefront preview
          </h2>
          <p className="mt-1 text-sm text-neutral-500">Shown at the top of the about page. The first photo is on the left, the second on the right.</p>
        </div>
        <div className="p-4 sm:p-5">
          <div className="grid overflow-hidden rounded-2xl bg-[linear-gradient(100deg,#071820_0%,#070c14_46%,#05060a_100%)] xl:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
            <div className="px-5 py-6 sm:px-7 sm:py-7">
              <p className="text-xs font-medium text-primary">{hero.eyebrow}</p>
              <p className="mt-2 text-xl leading-snug font-semibold text-white sm:text-2xl">{hero.title}</p>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/70">{hero.subtitle}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {hero.primaryCta.label ? (
                  <span className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-semibold text-white">
                    {hero.primaryCta.label}
                    <MaterialIcon name="arrow_forward" className="text-[18px]" />
                  </span>
                ) : null}
                {hero.secondaryCta.label ? (
                  <span className="inline-flex h-9 items-center rounded-full px-4 text-sm font-semibold text-white ring-1 ring-white/25">
                    {hero.secondaryCta.label}
                  </span>
                ) : null}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 p-4 sm:p-5">
              {[0, 1].map((index) => {
                const photo = shown[index];
                return (
                  <button
                    key={photo?.id ?? `empty-${index}`}
                    type="button"
                    aria-label={photo ? photo.alt || slotLabel(index) : slotLabel(index)}
                    onClick={() => (photo ? setEdit(photo.id) : setEdit("new"))}
                    disabled={!photo && full}
                    className="relative aspect-square overflow-hidden rounded-xl bg-white/5 text-left ring-1 ring-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {photo?.src ? (
                      <Image src={photo.src} alt="" fill sizes="180px" className="object-cover" />
                    ) : (
                      <span className="grid size-full place-items-center px-2 text-center text-xs text-white/60">
                        {index === 0 ? "Left photo" : "Right photo"}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor={`${fieldId}-eyebrow`}>Eyebrow</FieldLabel>
            <input
              id={`${fieldId}-eyebrow`}
              value={hero.eyebrow}
              onChange={(event) => patch({ eyebrow: event.target.value })}
              className={adminFieldClass}
            />
          </div>
          <div className="sm:col-span-2">
            <FieldLabel htmlFor={`${fieldId}-title`}>Title</FieldLabel>
            <input
              id={`${fieldId}-title`}
              value={hero.title}
              onChange={(event) => patch({ title: event.target.value })}
              className={adminFieldClass}
            />
          </div>
          <div className="sm:col-span-2">
            <FieldLabel htmlFor={`${fieldId}-subtitle`}>Subtitle</FieldLabel>
            <textarea
              id={`${fieldId}-subtitle`}
              value={hero.subtitle}
              rows={4}
              onChange={(event) => patch({ subtitle: event.target.value })}
              className={cn(adminFieldClass, "h-auto py-3")}
            />
          </div>
          <LinkFields
            idPrefix={`${fieldId}-primary`}
            title="First button"
            value={hero.primaryCta}
            onChange={(primaryCta) => patch({ primaryCta })}
          />
          <LinkFields
            idPrefix={`${fieldId}-secondary`}
            title="Second button"
            value={hero.secondaryCta}
            onChange={(secondaryCta) => patch({ secondaryCta })}
          />
        </div>
        <p className="mt-3 text-xs text-neutral-500">The heading and buttons save as you type.</p>
      </section>

      <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200/90" aria-labelledby="about-hero-list-heading">
        <div className="border-b border-neutral-100 px-4 py-3 sm:px-5">
          <h2 id="about-hero-list-heading" className="text-sm font-semibold text-neutral-950">
            {images.length === 1 ? "1 photo" : `${images.length} photos`}
          </h2>
        </div>
        {images.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-sm font-semibold text-neutral-950">No photos yet</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-neutral-500">Add the left and right photos for the about banner.</p>
            <button type="button" onClick={() => setEdit("new")} className={cn(adminButtonClass.primary, "mt-4")}>
              <MaterialIcon name="add" className="text-[18px]" />
              Add photo
            </button>
          </div>
        ) : (
          <ol>
            {images.map((image, index) => (
              <li
                key={image.id}
                onDragOver={(event) => {
                  event.preventDefault();
                  setOverId(image.id);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  dropOn(image.id);
                }}
                className={cn(
                  "border-t border-neutral-100 first:border-t-0",
                  selected === image.id && "bg-primary/5",
                  savedId === image.id && "bg-emerald-50",
                  overId === image.id && dragId && dragId !== image.id && "bg-primary/10",
                  dragId === image.id && "opacity-60",
                )}
              >
                <div className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:px-4">
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <button
                      type="button"
                      draggable
                      aria-label={`Reorder ${image.alt || slotLabel(index)}`}
                      onDragStart={(event) => {
                        event.dataTransfer.setData("text/plain", image.id);
                        event.dataTransfer.effectAllowed = "move";
                        setDragId(image.id);
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
                      id={`about-hero-${image.id}`}
                      type="button"
                      onClick={() => setEdit(image.id)}
                      className="flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                      <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                        {image.src ? (
                          <Image src={image.src} alt="" fill sizes="48px" className="object-cover" />
                        ) : (
                          <span className="grid size-full place-items-center text-neutral-400">
                            <MaterialIcon name="image" className="text-[18px]" />
                          </span>
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-neutral-950">{image.alt || "No description"}</span>
                        <span className="mt-0.5 block text-xs text-neutral-500">{slotLabel(index)}</span>
                      </span>
                    </button>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-1 pl-11 sm:pl-0">
                    <IconButton label="Move earlier" icon="arrow_upward" disabled={index === 0} onClick={() => move(image.id, -1)} />
                    <IconButton label="Move later" icon="arrow_downward" disabled={index === images.length - 1} onClick={() => move(image.id, 1)} />
                    <button type="button" onClick={() => setEdit(image.id)} className={adminButtonClass.quiet}>
                      Edit
                    </button>
                    {confirmId === image.id ? (
                      <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-xs text-red-700">
                        Remove from the about page?
                        <button type="button" onClick={() => remove(image.id)} className="font-semibold underline">
                          Yes
                        </button>
                        <button type="button" onClick={() => setConfirmId(null)} className="font-semibold">
                          No
                        </button>
                      </span>
                    ) : (
                      <IconButton label="Remove photo" icon="delete" danger onClick={() => setConfirmId(image.id)} />
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      {selected === "new" || opened ? (
        <PhotoDrawer
          key={selected}
          creating={creating}
          title={creating ? "New photo" : opened ? slotLabel(images.findIndex((image) => image.id === opened.id)) : "Photo"}
          initial={opened ? draftFromImage(opened) : emptyDraft()}
          notice={notice}
          onClose={() => setEdit(null)}
          onSave={commit}
        />
      ) : null}
    </div>
  );
}

function LinkFields({
  idPrefix,
  title,
  value,
  onChange,
}: {
  idPrefix: string;
  title: string;
  value: AboutLink;
  onChange: (next: AboutLink) => void;
}) {
  return (
    <div className="grid gap-3">
      <p className="text-sm font-medium text-neutral-950">{title}</p>
      <div>
        <FieldLabel htmlFor={`${idPrefix}-label`}>Label</FieldLabel>
        <input
          id={`${idPrefix}-label`}
          value={value.label}
          onChange={(event) => onChange({ ...value, label: event.target.value })}
          className={adminFieldClass}
        />
      </div>
      <div>
        <FieldLabel htmlFor={`${idPrefix}-href`}>Link</FieldLabel>
        <input
          id={`${idPrefix}-href`}
          value={value.href}
          onChange={(event) => onChange({ ...value, href: event.target.value })}
          className={adminFieldClass}
        />
      </div>
    </div>
  );
}

function PhotoDrawer({
  creating,
  title,
  initial,
  notice,
  onClose,
  onSave,
}: {
  creating: boolean;
  title: string;
  initial: Draft;
  notice: string;
  onClose: () => void;
  onSave: (draft: Draft) => void;
}) {
  const [draft, setDraft] = useState(initial);
  const [imageError, setImageError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const altId = useId();
  const heading = draft.alt.trim() || title;

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  function save() {
    if (saving || uploading) return;
    if (!draft.src) {
      setImageError("Image is required.");
      return;
    }
    setSaving(true);
    onSave({ src: draft.src, alt: draft.alt.trim() });
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-neutral-950/40" role="presentation" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="about-hero-drawer-title"
        className="force-light flex h-full w-full max-w-md flex-col bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === "Escape") onClose();
        }}
      >
        <div className="flex items-start justify-between gap-3 border-b border-neutral-100 px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-medium tracking-wide text-neutral-400 uppercase">{creating ? "Add photo" : "Edit photo"}</p>
            <h2 id="about-hero-drawer-title" className="mt-1 truncate text-lg font-semibold text-neutral-950">
              {creating ? "New photo" : heading}
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
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-neutral-100 ring-1 ring-neutral-200">
            {draft.src ? (
              <Image src={draft.src} alt="" fill sizes="400px" className="object-cover" />
            ) : (
              <span className="grid size-full place-items-center text-sm text-neutral-500">Photo</span>
            )}
          </div>
          <ImageField
            value={draft.src}
            onChange={(src) => {
              setDraft({ ...draft, src });
              setImageError("");
            }}
            onBusy={setUploading}
            confirmRemove
          />
          {imageError ? (
            <div id={`${altId}-image-error`}>
              <FieldError message={imageError} />
            </div>
          ) : null}
          <div>
            <FieldLabel htmlFor={altId}>Image description</FieldLabel>
            <input
              id={altId}
              autoFocus
              value={draft.alt}
              onChange={(event) => setDraft({ ...draft, alt: event.target.value })}
              className={adminFieldClass}
            />
            <p className="mt-1.5 text-xs text-neutral-500">Read by screen readers when the photo is shown.</p>
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
            {saving ? "Saving…" : uploading ? "Uploading…" : creating ? "Save photo" : "Save changes"}
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
