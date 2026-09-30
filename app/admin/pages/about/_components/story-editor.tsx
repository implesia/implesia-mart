"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import {
  blankAboutImage,
  blankParagraph,
  readAboutSections,
  saveAboutSections,
  type AboutImage,
} from "@/lib/mart-mock/about-sections";
import { useAboutSections } from "@/lib/mart-mock/hooks";
import { cn } from "@/lib/utils";

import { adminButtonClass, adminFieldClass, AdminPageHeader, FieldError, FieldLabel } from "../../../_components/admin-ui";
import { ImageField } from "../../../_components/image-field";
import { findCmsPage } from "../../../_config/cms";
import { SectionCopyForm } from "../../../home/_components/section-copy-form";

type ImageDraft = Pick<AboutImage, "src" | "alt">;

function emptyImage(): ImageDraft {
  return { src: "", alt: "" };
}

function draftFromImage(image: AboutImage): ImageDraft {
  return { src: image.src, alt: image.alt };
}

export function AboutStoryEditor() {
  const { story } = useAboutSections();
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const paragraphId = params.get("paragraph");
  const imageId = params.get("image");
  const paragraphs = story.paragraphs;
  const images = story.images;
  const openedParagraph = paragraphId && paragraphId !== "new" ? (paragraphs.find((item) => item.id === paragraphId) ?? null) : null;
  const openedImage = imageId && imageId !== "new" ? (images.find((item) => item.id === imageId) ?? null) : null;
  const [notice, setNotice] = useState("");
  const [savedId, setSavedId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const focusId = useRef<string | null>(null);
  const page = findCmsPage("about");
  const drawerOpen = Boolean(paragraphId === "new" || openedParagraph || imageId === "new" || openedImage);

  useEffect(() => {
    if (!drawerOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [drawerOpen]);

  useEffect(() => {
    if (drawerOpen || !focusId.current) return;
    const id = focusId.current;
    focusId.current = null;
    document.getElementById(id)?.focus();
  }, [drawerOpen]);

  function setKey(key: "paragraph" | "image", id: string | null) {
    const next = new URLSearchParams(window.location.search);
    if (id) next.set(key, id);
    else next.delete(key);
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function closeAll() {
    const next = new URLSearchParams(window.location.search);
    next.delete("paragraph");
    next.delete("image");
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

  function saveCopy(next: Record<string, string>) {
    const doc = readAboutSections();
    saveAboutSections({
      ...doc,
      story: {
        ...doc.story,
        kicker: next.kicker ?? "",
        title: next.title ?? "",
        cta: { label: next.ctaLabel ?? "", href: next.ctaHref ?? "" },
      },
    });
  }

  function saveParagraph(text: string) {
    const doc = readAboutSections();
    if (paragraphId === "new") {
      const item = { ...blankParagraph(), text };
      saveAboutSections({ ...doc, story: { ...doc.story, paragraphs: [...doc.story.paragraphs, item] } });
      setSavedId(item.id);
      focusId.current = `about-story-p-${item.id}`;
    } else if (paragraphId) {
      saveAboutSections({
        ...doc,
        story: {
          ...doc.story,
          paragraphs: doc.story.paragraphs.map((item) => (item.id === paragraphId ? { ...item, text } : item)),
        },
      });
      setSavedId(paragraphId);
      focusId.current = `about-story-p-${paragraphId}`;
    }
    flash("Saved");
    setKey("paragraph", null);
  }

  function saveImage(draft: ImageDraft) {
    const doc = readAboutSections();
    if (imageId === "new") {
      const image = { ...blankAboutImage(), src: draft.src, alt: draft.alt };
      saveAboutSections({ ...doc, story: { ...doc.story, images: [...doc.story.images, image] } });
      setSavedId(image.id);
      focusId.current = `about-story-img-${image.id}`;
    } else if (imageId) {
      saveAboutSections({
        ...doc,
        story: {
          ...doc.story,
          images: doc.story.images.map((image) => (image.id === imageId ? { ...image, src: draft.src, alt: draft.alt } : image)),
        },
      });
      setSavedId(imageId);
      focusId.current = `about-story-img-${imageId}`;
    }
    flash("Saved");
    setKey("image", null);
  }

  function removeParagraph(id: string) {
    const doc = readAboutSections();
    saveAboutSections({
      ...doc,
      story: { ...doc.story, paragraphs: doc.story.paragraphs.filter((item) => item.id !== id) },
    });
    if (paragraphId === id) setKey("paragraph", null);
    setConfirmId(null);
    flash("Removed");
  }

  function removeImage(id: string) {
    const doc = readAboutSections();
    saveAboutSections({
      ...doc,
      story: { ...doc.story, images: doc.story.images.filter((item) => item.id !== id) },
    });
    if (imageId === id) setKey("image", null);
    setConfirmId(null);
    flash("Removed");
  }

  function moveParagraph(id: string, direction: -1 | 1) {
    const doc = readAboutSections();
    const index = doc.story.paragraphs.findIndex((item) => item.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= doc.story.paragraphs.length) return;
    const next = [...doc.story.paragraphs];
    const [item] = next.splice(index, 1);
    if (!item) return;
    next.splice(target, 0, item);
    saveAboutSections({ ...doc, story: { ...doc.story, paragraphs: next } });
  }

  function moveImage(id: string, direction: -1 | 1) {
    const doc = readAboutSections();
    const index = doc.story.images.findIndex((item) => item.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= doc.story.images.length) return;
    const next = [...doc.story.images];
    const [item] = next.splice(index, 1);
    if (!item) return;
    next.splice(target, 0, item);
    saveAboutSections({ ...doc, story: { ...doc.story, images: next } });
  }

  function dropParagraph(targetId: string) {
    if (!dragId || dragId === targetId) {
      setDragId(null);
      setOverId(null);
      return;
    }
    const doc = readAboutSections();
    const next = [...doc.story.paragraphs];
    const from = next.findIndex((item) => item.id === dragId);
    const to = next.findIndex((item) => item.id === targetId);
    if (from < 0 || to < 0) return;
    const [item] = next.splice(from, 1);
    if (!item) return;
    next.splice(to, 0, item);
    saveAboutSections({ ...doc, story: { ...doc.story, paragraphs: next } });
    setDragId(null);
    setOverId(null);
  }

  function dropImage(targetId: string) {
    if (!dragId || dragId === targetId) {
      setDragId(null);
      setOverId(null);
      return;
    }
    const doc = readAboutSections();
    const next = [...doc.story.images];
    const from = next.findIndex((item) => item.id === dragId);
    const to = next.findIndex((item) => item.id === targetId);
    if (from < 0 || to < 0) return;
    const [item] = next.splice(from, 1);
    if (!item) return;
    next.splice(to, 0, item);
    saveAboutSections({ ...doc, story: { ...doc.story, images: next } });
    setDragId(null);
    setOverId(null);
  }

  const missingParagraph = Boolean(paragraphId && paragraphId !== "new" && !openedParagraph);
  const missingImage = Boolean(imageId && imageId !== "new" && !openedImage);

  return (
    <div className="min-w-0 space-y-4">
      <div>
        <nav aria-label="Breadcrumb" className="mb-3 flex flex-wrap items-center gap-1 text-sm text-neutral-500">
          <Link href="/admin/pages/about" className="font-medium hover:text-neutral-950">
            About
          </Link>
          <MaterialIcon name="chevron_right" className="text-[16px] text-neutral-300" />
          <span className="font-medium text-neutral-950">Story</span>
        </nav>
        {page ? (
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1" aria-label="About sections">
            {page.sections.map((section) => {
              const active = section.id === "story";
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
          title="Story"
          description="Why Implesia Mart started."
          action={
            <div className="flex flex-wrap items-center gap-2">
              <a href="/about-us" target="_blank" rel="noreferrer" className={adminButtonClass.secondary}>
                View on site
                <MaterialIcon name="open_in_new" className="text-[18px]" />
              </a>
              <button type="button" onClick={() => setKey("paragraph", "new")} className={adminButtonClass.primary}>
                <MaterialIcon name="add" className="text-[18px]" />
                Add paragraph
              </button>
              <button type="button" onClick={() => setKey("image", "new")} className={adminButtonClass.secondary}>
                <MaterialIcon name="add" className="text-[18px]" />
                Add photo
              </button>
            </div>
          }
        />
      </div>

      {notice && !drawerOpen ? (
        <p role="status" className="text-sm font-medium text-emerald-800">
          {notice}. The story is up to date.
        </p>
      ) : null}
      {missingParagraph ? (
        <p className="rounded-2xl bg-white px-4 py-3 text-sm text-neutral-600 ring-1 ring-neutral-200/90">
          This paragraph is no longer here.{" "}
          <button type="button" onClick={() => setKey("paragraph", null)} className="font-medium text-primary">
            Close
          </button>
        </p>
      ) : null}
      {missingImage ? (
        <p className="rounded-2xl bg-white px-4 py-3 text-sm text-neutral-600 ring-1 ring-neutral-200/90">
          This photo is no longer here.{" "}
          <button type="button" onClick={() => setKey("image", null)} className="font-medium text-primary">
            Close
          </button>
        </p>
      ) : null}

      <section className="overflow-hidden rounded-2xl bg-admin-canvas ring-1 ring-neutral-200/90" aria-labelledby="about-story-preview-heading">
        <div className="px-4 pt-4 sm:px-5">
          <h2 id="about-story-preview-heading" className="text-sm font-semibold text-neutral-950">
            Storefront preview
          </h2>
          <p className="mt-1 text-sm text-neutral-500">Shown on the about page. Paragraphs and photos stay in this order.</p>
        </div>
        <div className="p-4 sm:p-5">
          <div className="grid items-start gap-6 rounded-2xl bg-white p-4 ring-1 ring-neutral-200 xl:grid-cols-2 xl:gap-8 sm:p-5">
            <div>
              <p className="text-xs font-medium tracking-wide text-primary uppercase">{story.kicker}</p>
              <p className="mt-2 text-xl font-semibold tracking-tight text-neutral-950">{story.title}</p>
              <div className="mt-3 space-y-3">
                {paragraphs.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setKey("paragraph", item.id)}
                    className="block w-full text-left text-sm leading-relaxed text-neutral-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  >
                    {item.text}
                  </button>
                ))}
              </div>
              {story.cta.label ? (
                <span className="mt-4 inline-flex h-10 items-center gap-1.5 rounded-full bg-primary px-5 text-sm font-semibold text-on-primary">
                  {story.cta.label}
                  <MaterialIcon name="arrow_forward" className="text-[18px]" />
                </span>
              ) : null}
            </div>
            <ul className="grid grid-cols-2 gap-2.5">
              {images.map((image) => (
                <li key={image.id}>
                  <button
                    type="button"
                    onClick={() => setKey("image", image.id)}
                    aria-label={image.alt || "Photo"}
                    className="relative block aspect-square w-full overflow-hidden rounded-2xl bg-neutral-100 ring-1 ring-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {image.src ? (
                      <Image src={image.src} alt="" fill sizes="240px" className="object-cover" />
                    ) : (
                      <span className="grid size-full place-items-center text-xs text-neutral-500">Photo</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90 sm:p-5">
        <SectionCopyForm
          values={{ kicker: story.kicker, title: story.title, ctaLabel: story.cta.label, ctaHref: story.cta.href }}
          fields={[
            { name: "kicker", label: "Eyebrow" },
            { name: "title", label: "Title" },
            { name: "ctaLabel", label: "Button label" },
            { name: "ctaHref", label: "Button link" },
          ]}
          saveLabel="Save heading"
          onSave={saveCopy}
        />
      </section>

      <RecordList
        headingId="about-story-paragraphs-heading"
        title={paragraphs.length === 1 ? "1 paragraph" : `${paragraphs.length} paragraphs`}
        emptyTitle="No paragraphs yet"
        emptyBody="Add the story text that appears beside the photos."
        emptyAction="Add paragraph"
        onEmpty={() => setKey("paragraph", "new")}
        items={paragraphs.map((item, index) => ({
          id: item.id,
          buttonId: `about-story-p-${item.id}`,
          title: item.text || "Empty paragraph",
          meta: `Paragraph ${index + 1}`,
          reorder: item.text || "paragraph",
        }))}
        selected={paragraphId}
        savedId={savedId}
        confirmId={confirmId}
        dragId={dragId}
        overId={overId}
        onOpen={(id) => setKey("paragraph", id)}
        onDrag={setDragId}
        onOver={setOverId}
        onDrop={dropParagraph}
        onMove={moveParagraph}
        onAskRemove={setConfirmId}
        onRemove={removeParagraph}
        removeLabel="Remove paragraph"
      />

      <RecordList
        headingId="about-story-photos-heading"
        title={images.length === 1 ? "1 photo" : `${images.length} photos`}
        emptyTitle="No photos yet"
        emptyBody="Add the photos shown beside the story."
        emptyAction="Add photo"
        onEmpty={() => setKey("image", "new")}
        items={images.map((image) => ({
          id: image.id,
          buttonId: `about-story-img-${image.id}`,
          title: image.alt || "No description",
          meta: "Photo",
          reorder: image.alt || "photo",
          imageSrc: image.src,
        }))}
        selected={imageId}
        savedId={savedId}
        confirmId={confirmId}
        dragId={dragId}
        overId={overId}
        onOpen={(id) => setKey("image", id)}
        onDrag={setDragId}
        onOver={setOverId}
        onDrop={dropImage}
        onMove={moveImage}
        onAskRemove={setConfirmId}
        onRemove={removeImage}
        removeLabel="Remove photo"
      />

      {drawerOpen ? (
        <div className="fixed inset-0 z-40 flex justify-end bg-neutral-950/40" role="presentation" onClick={closeAll}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="about-story-drawer-title"
            className="force-light flex h-full w-full max-w-md flex-col overflow-y-auto bg-white shadow-xl"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => {
              if (event.key === "Escape") closeAll();
            }}
          >
            {paragraphId === "new" || openedParagraph ? (
              <ParagraphDrawer
                key={paragraphId}
                creating={paragraphId === "new"}
                initial={openedParagraph?.text ?? ""}
                notice={notice}
                onClose={() => setKey("paragraph", null)}
                onSave={saveParagraph}
              />
            ) : null}
            {imageId === "new" || openedImage ? (
              <ImageDrawer
                key={imageId}
                creating={imageId === "new"}
                titleId={paragraphId === "new" || openedParagraph ? undefined : "about-story-drawer-title"}
                initial={openedImage ? draftFromImage(openedImage) : emptyImage()}
                notice={notice}
                onClose={() => setKey("image", null)}
                onSave={saveImage}
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ParagraphDrawer({
  creating,
  initial,
  notice,
  onClose,
  onSave,
}: {
  creating: boolean;
  initial: string;
  notice: string;
  onClose: () => void;
  onSave: (text: string) => void;
}) {
  const [text, setText] = useState(initial);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const fieldId = useId();
  const title = text.trim() || "Paragraph";

  function save() {
    if (saving) return;
    const next = text.trim();
    if (!next) {
      setError("Paragraph is required.");
      return;
    }
    setSaving(true);
    onSave(next);
  }

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex items-start justify-between gap-3 border-b border-neutral-100 px-5 py-4">
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-wide text-neutral-400 uppercase">{creating ? "Add paragraph" : "Edit paragraph"}</p>
          <h2 id="about-story-drawer-title" className="mt-1 line-clamp-2 text-lg font-semibold text-neutral-950">
            {creating ? "New paragraph" : title}
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
      <div className="flex-1 space-y-4 px-5 py-4">
        <div>
          <FieldLabel htmlFor={fieldId}>
            Paragraph <span className="text-red-700">*</span>
          </FieldLabel>
          <textarea
            id={fieldId}
            autoFocus
            value={text}
            rows={8}
            onChange={(event) => {
              setText(event.target.value);
              setError("");
            }}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${fieldId}-error` : undefined}
            className={cn(adminFieldClass, "h-auto py-3", error && "border-red-400")}
          />
          {error ? (
            <div id={`${fieldId}-error`}>
              <FieldError message={error} />
            </div>
          ) : null}
        </div>
      </div>
      <div className="mt-auto flex items-center justify-end gap-2 border-t border-neutral-100 px-5 py-3">
        {notice ? (
          <p role="status" className="mr-auto text-sm font-medium text-emerald-800">
            {notice}
          </p>
        ) : null}
        <button type="button" onClick={onClose} className={adminButtonClass.secondary}>
          Cancel
        </button>
        <button type="button" onClick={save} disabled={saving} className={adminButtonClass.primary}>
          {saving ? "Saving…" : creating ? "Save paragraph" : "Save changes"}
        </button>
      </div>
    </div>
  );
}

function ImageDrawer({
  creating,
  titleId,
  initial,
  notice,
  onClose,
  onSave,
}: {
  creating: boolean;
  titleId?: string;
  initial: ImageDraft;
  notice: string;
  onClose: () => void;
  onSave: (draft: ImageDraft) => void;
}) {
  const [draft, setDraft] = useState(initial);
  const [imageError, setImageError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const altId = useId();
  const title = draft.alt.trim() || "Photo";

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
    <div className="flex min-h-full flex-col border-t border-neutral-100 first:border-t-0">
      <div className="flex items-start justify-between gap-3 border-b border-neutral-100 px-5 py-4">
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-wide text-neutral-400 uppercase">{creating ? "Add photo" : "Edit photo"}</p>
          <h2 id={titleId} className="mt-1 truncate text-lg font-semibold text-neutral-950">
            {creating ? "New photo" : title}
          </h2>
        </div>
        <button
          type="button"
          aria-label="Close photo"
          onClick={onClose}
          className="grid size-9 shrink-0 place-items-center rounded-full text-neutral-500 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <MaterialIcon name="close" className="text-[20px]" />
        </button>
      </div>
      <div className="flex-1 space-y-4 px-5 py-4">
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
            value={draft.alt}
            onChange={(event) => setDraft({ ...draft, alt: event.target.value })}
            className={adminFieldClass}
          />
          <p className="mt-1.5 text-xs text-neutral-500">Read by screen readers when the photo is shown.</p>
        </div>
      </div>
      <div className="mt-auto flex items-center justify-end gap-2 border-t border-neutral-100 px-5 py-3">
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
  );
}

function RecordList({
  headingId,
  title,
  emptyTitle,
  emptyBody,
  emptyAction,
  onEmpty,
  items,
  selected,
  savedId,
  confirmId,
  dragId,
  overId,
  onOpen,
  onDrag,
  onOver,
  onDrop,
  onMove,
  onAskRemove,
  onRemove,
  removeLabel,
}: {
  headingId: string;
  title: string;
  emptyTitle: string;
  emptyBody: string;
  emptyAction: string;
  onEmpty: () => void;
  items: { id: string; buttonId: string; title: string; meta: string; reorder: string; imageSrc?: string }[];
  selected: string | null;
  savedId: string | null;
  confirmId: string | null;
  dragId: string | null;
  overId: string | null;
  onOpen: (id: string) => void;
  onDrag: (id: string | null) => void;
  onOver: (id: string | null) => void;
  onDrop: (id: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onAskRemove: (id: string | null) => void;
  onRemove: (id: string) => void;
  removeLabel: string;
}) {
  return (
    <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200/90" aria-labelledby={headingId}>
      <div className="border-b border-neutral-100 px-4 py-3 sm:px-5">
        <h2 id={headingId} className="text-sm font-semibold text-neutral-950">
          {title}
        </h2>
      </div>
      {items.length === 0 ? (
        <div className="px-4 py-10 text-center">
          <p className="text-sm font-semibold text-neutral-950">{emptyTitle}</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-neutral-500">{emptyBody}</p>
          <button type="button" onClick={onEmpty} className={cn(adminButtonClass.primary, "mt-4")}>
            <MaterialIcon name="add" className="text-[18px]" />
            {emptyAction}
          </button>
        </div>
      ) : (
        <ol>
          {items.map((item, index) => (
            <li
              key={item.id}
              onDragOver={(event) => {
                event.preventDefault();
                onOver(item.id);
              }}
              onDrop={(event) => {
                event.preventDefault();
                onDrop(item.id);
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
                    aria-label={`Reorder ${item.reorder}`}
                    onDragStart={(event) => {
                      event.dataTransfer.setData("text/plain", item.id);
                      event.dataTransfer.effectAllowed = "move";
                      onDrag(item.id);
                    }}
                    onDragEnd={() => {
                      onDrag(null);
                      onOver(null);
                    }}
                    className="grid size-9 shrink-0 cursor-grab place-items-center rounded-full text-neutral-400 hover:bg-neutral-100 active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  >
                    <MaterialIcon name="drag_indicator" className="text-[18px]" />
                  </button>
                  <button
                    id={item.buttonId}
                    type="button"
                    onClick={() => onOpen(item.id)}
                    className="flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  >
                    <span className="w-5 shrink-0 text-right text-xs text-neutral-400 tabular-nums">{index + 1}</span>
                    {item.imageSrc !== undefined ? (
                      <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                        {item.imageSrc ? (
                          <Image src={item.imageSrc} alt="" fill sizes="48px" className="object-cover" />
                        ) : (
                          <span className="grid size-full place-items-center text-neutral-400">
                            <MaterialIcon name="image" className="text-[18px]" />
                          </span>
                        )}
                      </span>
                    ) : null}
                    <span className="min-w-0">
                      <span className="line-clamp-2 text-sm font-semibold text-neutral-950">{item.title}</span>
                      <span className="mt-0.5 block text-xs text-neutral-500">{item.meta}</span>
                    </span>
                  </button>
                </div>
                <div className="flex shrink-0 flex-wrap items-center justify-end gap-1 pl-11 sm:pl-0">
                  <IconButton label="Move earlier" icon="arrow_upward" disabled={index === 0} onClick={() => onMove(item.id, -1)} />
                  <IconButton label="Move later" icon="arrow_downward" disabled={index === items.length - 1} onClick={() => onMove(item.id, 1)} />
                  <button type="button" onClick={() => onOpen(item.id)} className={adminButtonClass.quiet}>
                    Edit
                  </button>
                  {confirmId === item.id ? (
                    <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-xs text-red-700">
                      Remove from the about page?
                      <button type="button" onClick={() => onRemove(item.id)} className="font-semibold underline">
                        Yes
                      </button>
                      <button type="button" onClick={() => onAskRemove(null)} className="font-semibold">
                        No
                      </button>
                    </span>
                  ) : (
                    <IconButton label={removeLabel} icon="delete" danger onClick={() => onAskRemove(item.id)} />
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
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
