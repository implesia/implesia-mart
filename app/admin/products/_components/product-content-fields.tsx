"use client";

import Image from "next/image";
import { useId, useRef, useState, type ReactNode } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import {
  blankFaq,
  blankGalleryImage,
  blankSpec,
  SPEC_GROUP_OPTIONS,
  type ProductFaqRow,
  type ProductGalleryImage,
  type ProductSpecRow,
  type ProductStorefrontContent,
} from "@/lib/mart-mock/product-content";
import { cn } from "@/lib/utils";

import {
  adminButtonClass,
  adminFieldClass,
  FieldLabel,
} from "../../_components/admin-ui";
import { youtubeId, youtubeThumb } from "@/lib/mart-api/youtube";

import {
  ImageField,
  uploadImage,
  uploadVideo,
  VIDEO_ACCEPT,
} from "../../_components/image-field";

export function ProductCopyFields({
  formId,
  content,
  onChange,
}: {
  formId: string;
  content: ProductStorefrontContent;
  onChange: (content: ProductStorefrontContent) => void;
}) {
  return (
    <div className="grid gap-4">
      <div>
        <FieldLabel htmlFor={`${formId}-tagline`}>
          Label above the name
        </FieldLabel>
        <input
          id={`${formId}-tagline`}
          value={content.tagline}
          onChange={(event) =>
            onChange({ ...content, tagline: event.target.value })
          }
          placeholder="Shown above the product name"
          className={adminFieldClass}
        />
      </div>
      <div>
        <FieldLabel htmlFor={`${formId}-description`}>
          Product description
        </FieldLabel>
        <textarea
          id={`${formId}-description`}
          value={content.description}
          onChange={(event) =>
            onChange({ ...content, description: event.target.value })
          }
          rows={5}
          placeholder="The paragraph under the product name"
          className={cn(adminFieldClass, "h-auto py-3 leading-relaxed")}
        />
      </div>
    </div>
  );
}

const MAX_GALLERY = 12;

export function ProductGalleryFields({
  content,
  onChange,
  onBusy,
}: {
  content: ProductStorefrontContent;
  onChange: (content: ProductStorefrontContent) => void;
  onBusy: (busy: boolean) => void;
}) {
  const addId = useId();
  const [adding, setAdding] = useState(0);
  const [addError, setAddError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const imageInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [link, setLink] = useState("");
  const [linkError, setLinkError] = useState("");
  const full = content.gallery.length >= MAX_GALLERY;

  function update(index: number, patch: Partial<ProductGalleryImage>) {
    onChange({
      ...content,
      gallery: content.gallery.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item,
      ),
    });
  }

  function append(items: ProductGalleryImage[]) {
    const room = MAX_GALLERY - content.gallery.length;
    if (items.length > room) {
      setAddError(`A product can have at most ${MAX_GALLERY} gallery items.`);
    }
    if (room > 0 && items.length) {
      onChange({ ...content, gallery: [...content.gallery, ...items.slice(0, room)] });
    }
  }

  // Same upload as each tile (kept in the browser until Save), several files at once.
  async function addFiles(list: FileList | null, kind: "image" | "video") {
    const files = Array.from(list ?? []);
    setMenuOpen(false);
    if (files.length === 0) return;
    setAddError("");
    setAdding(files.length);
    onBusy(true);
    try {
      const upload = kind === "video" ? uploadVideo : uploadImage;
      const results = await Promise.allSettled(files.map(upload));
      append(
        results.flatMap((result) =>
          result.status === "fulfilled"
            ? [{ ...blankGalleryImage(), kind, src: result.value }]
            : [],
        ),
      );
      const failed = results.find(
        (result): result is PromiseRejectedResult => result.status === "rejected",
      );
      if (failed) {
        setAddError(
          failed.reason instanceof Error
            ? failed.reason.message
            : "Upload failed. Try again.",
        );
      }
    } finally {
      setAdding(0);
      onBusy(false);
    }
  }

  function addLink() {
    const id = youtubeId(link);
    if (!id) {
      setLinkError(
        "Not a YouTube video link. Paste a youtube.com/watch, youtu.be, or Shorts link.",
      );
      return;
    }
    setAddError("");
    append([{ ...blankGalleryImage(), kind: "youtube", youtubeId: id }]);
    setLink("");
    setLinkError("");
    setLinkOpen(false);
  }

  function remove(item: ProductGalleryImage) {
    if (item.src.startsWith("blob:")) URL.revokeObjectURL(item.src);
    onChange({
      ...content,
      gallery: content.gallery.filter((row) => row.id !== item.id),
    });
  }

  const menuItemClass =
    "flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-neutral-800 hover:bg-neutral-100 focus-within:bg-neutral-100 focus-visible:bg-neutral-100 focus-visible:outline-none";

  return (
    <div className="mt-5 border-t border-neutral-100 pt-4">
      <h3 className="text-sm font-semibold text-neutral-950">Gallery</h3>
      <p className="mt-1 text-sm text-neutral-500">
        Photos and videos appear on the product page. The catalog image above is
        the thumbnail. An existing product video stays first and is not
        edited here.
      </p>
      <ul className="mt-4 flex flex-wrap gap-3" aria-label="Gallery photos">
        {content.gallery.map((item, index) => {
          const overlay = (
            <>
              <TileButton
                label={`Move item ${index + 1} earlier`}
                icon="chevron_left"
                disabled={index === 0}
                onClick={() =>
                  onChange({
                    ...content,
                    gallery: move(content.gallery, index, index - 1),
                  })
                }
              />
              <TileButton
                label={`Move item ${index + 1} later`}
                icon="chevron_right"
                disabled={index === content.gallery.length - 1}
                onClick={() =>
                  onChange({
                    ...content,
                    gallery: move(content.gallery, index, index + 1),
                  })
                }
              />
            </>
          );
          return (
            <li key={item.id} className="w-28">
              {item.kind === "video" || item.kind === "youtube" ? (
                <VideoTile item={item} overlay={overlay} onRemove={() => remove(item)} />
              ) : (
                <ImageField
                  label=""
                  variant="tile"
                  value={item.src}
                  onChange={(src) => update(index, { src })}
                  onRemove={() => remove(item)}
                  overlay={overlay}
                  onBusy={onBusy}
                />
              )}
              <input
                value={item.alt}
                onChange={(event) => update(index, { alt: event.target.value })}
                placeholder="Description"
                aria-label={`Item ${index + 1} description`}
                className="mt-1.5 h-8 w-full rounded-lg bg-white px-2 text-xs text-neutral-800 ring-1 ring-neutral-200 placeholder:text-neutral-400 focus:ring-2 focus:ring-primary/40 focus:outline-none"
              />
            </li>
          );
        })}
        {full ? null : (
          <li
            className="relative w-28"
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                setMenuOpen(false);
              }
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") setMenuOpen(false);
            }}
          >
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              disabled={adding > 0}
              onClick={() => setMenuOpen((open) => !open)}
              className="grid size-28 place-items-center rounded-xl border border-dashed border-neutral-300 bg-[#f7f8fa] text-center text-neutral-500 hover:border-primary hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none disabled:opacity-60"
            >
              <span>
                <MaterialIcon name="add" className="text-[22px]" />
                <span className="block text-xs font-medium">
                  {adding > 0 ? "Uploading…" : "Add"}
                </span>
              </span>
            </button>
            {/* The pickers stay mounted: the menu closes as soon as focus leaves it,
                which would unmount an input inside it before its change event. */}
            <input
              ref={imageInput}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              hidden
              tabIndex={-1}
              onChange={(event) => {
                void addFiles(event.target.files, "image");
                event.target.value = "";
              }}
            />
            <input
              ref={videoInput}
              type="file"
              accept={VIDEO_ACCEPT}
              multiple
              hidden
              tabIndex={-1}
              onChange={(event) => {
                void addFiles(event.target.files, "video");
                event.target.value = "";
              }}
            />
            {menuOpen ? (
              <div
                role="menu"
                aria-label="Add to gallery"
                // Keep focus on the trigger so the menu is not closed by blur mid-click.
                onMouseDown={(event) => event.preventDefault()}
                className="absolute top-[calc(100%+0.25rem)] left-0 z-20 w-52 rounded-xl bg-white p-1 shadow-lg ring-1 ring-neutral-200"
              >
                <button
                  type="button"
                  role="menuitem"
                  className={menuItemClass}
                  onClick={() => {
                    setMenuOpen(false);
                    imageInput.current?.click();
                  }}
                >
                  <MaterialIcon name="image" className="text-[18px] text-neutral-500" />
                  Image
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className={menuItemClass}
                  onClick={() => {
                    setMenuOpen(false);
                    videoInput.current?.click();
                  }}
                >
                  <MaterialIcon name="movie" className="text-[18px] text-neutral-500" />
                  <span>
                    Video
                    <span className="block text-xs text-neutral-500">MP4 or WEBM, up to 50 MB</span>
                  </span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className={menuItemClass}
                  onClick={() => {
                    setMenuOpen(false);
                    setLinkOpen(true);
                    setLinkError("");
                  }}
                >
                  <MaterialIcon name="smart_display" className="text-[18px] text-neutral-500" />
                  YouTube link
                </button>
              </div>
            ) : null}
          </li>
        )}
      </ul>
      {linkOpen ? (
        <div className="mt-3 max-w-xl">
          <FieldLabel htmlFor={addId}>YouTube link</FieldLabel>
          <div className="flex flex-wrap gap-2">
            <input
              id={addId}
              type="url"
              inputMode="url"
              autoFocus
              value={link}
              placeholder="https://www.youtube.com/watch?v=…"
              aria-invalid={linkError ? true : undefined}
              aria-describedby={linkError ? `${addId}-error` : undefined}
              onChange={(event) => {
                setLink(event.target.value);
                if (linkError) setLinkError("");
              }}
              onKeyDown={(event) => {
                // Enter adds the link; it must not submit the product form.
                if (event.key === "Enter") {
                  event.preventDefault();
                  addLink();
                }
              }}
              className={cn(adminFieldClass, "min-w-0 flex-1")}
            />
            <button type="button" onClick={addLink} className={adminButtonClass.secondary}>
              Add video
            </button>
            <button
              type="button"
              onClick={() => {
                setLinkOpen(false);
                setLink("");
                setLinkError("");
              }}
              className="h-10 rounded-full px-3 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
            >
              Cancel
            </button>
          </div>
          {linkError ? (
            <p id={`${addId}-error`} className="mt-1.5 text-xs text-red-700">
              {linkError}
            </p>
          ) : null}
        </div>
      ) : null}
      {addError ? <p className="mt-1.5 text-xs text-red-700">{addError}</p> : null}
      {content.gallery.length === 0 ? (
        <p className="mt-2 text-xs text-neutral-500">
          No gallery photos. The product page uses the catalog image.
        </p>
      ) : null}
    </div>
  );
}

/** Uploaded video or YouTube link: a still frame with a play mark, same size as a photo tile. */
function VideoTile({
  item,
  overlay,
  onRemove,
}: {
  item: ProductGalleryImage;
  overlay: ReactNode;
  onRemove: () => void;
}) {
  const youtube = item.kind === "youtube" && item.youtubeId;
  return (
    <div className="group relative size-28 overflow-hidden rounded-xl bg-neutral-900 ring-1 ring-neutral-200">
      {youtube ? (
        <Image
          src={youtubeThumb(item.youtubeId!)}
          alt=""
          fill
          sizes="112px"
          className="object-cover"
        />
      ) : (
        <video
          src={item.src}
          muted
          playsInline
          preload="metadata"
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <span className="pointer-events-none absolute inset-0 grid place-items-center">
        <span className="grid size-8 place-items-center rounded-full bg-white/95 text-neutral-900 shadow">
          <MaterialIcon name="play_arrow" className="text-[20px]" />
        </span>
      </span>
      <span className="pointer-events-none absolute right-1.5 bottom-1.5 rounded bg-black/60 px-1 text-[10px] font-semibold text-white">
        {youtube ? "YouTube" : "Video"}
      </span>
      <button
        type="button"
        aria-label={youtube ? "Remove YouTube video" : "Remove video"}
        onClick={onRemove}
        className="absolute top-1.5 right-1.5 grid size-6 place-items-center rounded-full bg-white/95 text-neutral-700 shadow ring-1 ring-neutral-200 transition-opacity hover:text-red-600 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:opacity-0 sm:group-hover:opacity-100"
      >
        <MaterialIcon name="close" className="text-[16px]" />
      </button>
      <div className="absolute bottom-1.5 left-1.5 flex gap-1 transition-opacity focus-within:opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
        {overlay}
      </div>
    </div>
  );
}

function TileButton({
  label,
  icon,
  disabled,
  onClick,
}: {
  label: string;
  icon: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-6 place-items-center rounded-full bg-white/95 text-neutral-700 shadow ring-1 ring-neutral-200 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:hidden"
    >
      <MaterialIcon name={icon} className="text-[16px]" />
    </button>
  );
}

export function ProductDetailFields({
  formId,
  content,
  onChange,
  category,
}: {
  formId: string;
  content: ProductStorefrontContent;
  onChange: (content: ProductStorefrontContent) => void;
  /** Top-level category slug. Only used to suggest empty specification rows. */
  category?: string;
}) {
  return (
    <div className="space-y-6">
      <LineList
        label="Highlights"
        hint="Checklist under the price on the product page."
        items={content.highlights}
        placeholder="Highlight"
        addLabel="Add highlight"
        onChange={(highlights) => onChange({ ...content, highlights })}
      />
      <LineList
        label="Suitable for"
        hint="Shown in the buy box and again on the details tab."
        items={content.suitableFor}
        placeholder="Who or what it is for"
        addLabel="Add item"
        onChange={(suitableFor) => onChange({ ...content, suitableFor })}
      />
      <div className="border-t border-neutral-100 pt-5">
        <h3 className="text-sm font-semibold text-neutral-950">Details tab</h3>
        <p className="mt-1 text-sm text-neutral-500">
          The story customers read on the details tab.
        </p>
        <div className="mt-4 grid gap-4">
          <div>
            <FieldLabel htmlFor={`${formId}-story-heading`}>Heading</FieldLabel>
            <input
              id={`${formId}-story-heading`}
              value={content.storyHeading}
              onChange={(event) =>
                onChange({ ...content, storyHeading: event.target.value })
              }
              className={adminFieldClass}
            />
          </div>
          <div>
            <FieldLabel htmlFor={`${formId}-story-body`}>Story</FieldLabel>
            <textarea
              id={`${formId}-story-body`}
              value={content.storyBody}
              rows={5}
              onChange={(event) =>
                onChange({ ...content, storyBody: event.target.value })
              }
              className={cn(adminFieldClass, "h-auto py-3 leading-relaxed")}
            />
          </div>
          <LineList
            label="Story points"
            hint="Short points under the story."
            items={content.storyBullets}
            placeholder="Point"
            addLabel="Add point"
            onChange={(storyBullets) => onChange({ ...content, storyBullets })}
          />
          <LineList
            label="How to use"
            hint="Numbered steps on the details tab."
            items={content.howToUse}
            placeholder="Step"
            addLabel="Add step"
            onChange={(howToUse) => onChange({ ...content, howToUse })}
          />
        </div>
      </div>
      <SpecList content={content} onChange={onChange} category={category} />
      <LineList
        label="What's included"
        hint="Package list on the specifications tab."
        items={content.packageItems}
        placeholder="Item in the package"
        addLabel="Add item"
        onChange={(packageItems) => onChange({ ...content, packageItems })}
      />
      <FaqList formId={formId} content={content} onChange={onChange} />
      <div className="border-t border-neutral-100 pt-5">
        <h3 className="text-sm font-semibold text-neutral-950">Quality note</h3>
        <p className="mt-1 text-sm text-neutral-500">
          The quality card on the details tab. The checklist beside it stays the
          same for every product.
        </p>
        <div className="mt-4 grid gap-4">
          <div>
            <FieldLabel htmlFor={`${formId}-quality-title`}>Title</FieldLabel>
            <input
              id={`${formId}-quality-title`}
              value={content.qualityTitle}
              onChange={(event) =>
                onChange({ ...content, qualityTitle: event.target.value })
              }
              className={adminFieldClass}
            />
          </div>
          <div>
            <FieldLabel htmlFor={`${formId}-quality-body`}>Text</FieldLabel>
            <textarea
              id={`${formId}-quality-body`}
              value={content.qualityBody}
              rows={3}
              onChange={(event) =>
                onChange({ ...content, qualityBody: event.target.value })
              }
              className={cn(adminFieldClass, "h-auto py-3 leading-relaxed")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Labels worth asking about, per category. They add EMPTY rows: nothing is filled in and a row
 * with no value is not saved, so no spec is ever invented.
 */
const SPEC_SUGGESTIONS: Record<string, { label: string; group: ProductSpecRow["group"] }[]> = {
  gadgets: [
    { label: "Battery capacity", group: "power" },
    { label: "Charging", group: "power" },
    { label: "Connectivity", group: "connectivity" },
    { label: "Dimensions", group: "dimensions" },
    { label: "Warranty", group: "general" },
  ],
  fashion: [
    { label: "Fabric", group: "fabric" },
    { label: "Fit", group: "sizing" },
    { label: "Care", group: "care" },
    { label: "Customization", group: "customization" },
  ],
};

function SpecList({
  content,
  onChange,
  category,
}: {
  content: ProductStorefrontContent;
  onChange: (content: ProductStorefrontContent) => void;
  category?: string;
}) {
  const suggestions = (SPEC_SUGGESTIONS[category ?? ""] ?? []).filter(
    (item) =>
      !content.specs.some(
        (row) => row.label.trim().toLowerCase() === item.label.toLowerCase(),
      ),
  );
  function update(id: string, patch: Partial<ProductSpecRow>) {
    onChange({
      ...content,
      specs: content.specs.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    });
  }

  return (
    <div className="border-t border-neutral-100 pt-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-neutral-950">
            Specifications
          </h3>
          <p className="mt-1 text-sm text-neutral-500">
            Rows on the specifications tab, grouped by topic. The first few also
            appear beside the gallery on large screens.
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            onChange({ ...content, specs: [...content.specs, blankSpec()] })
          }
          className={adminButtonClass.secondary}
        >
          Add specification
        </button>
      </div>
      {suggestions.length > 0 ? (
        <div className="mt-3 flex flex-wrap items-center gap-2" data-testid="spec-suggestions">
          <span className="text-xs text-neutral-500">Suggested for this category:</span>
          {suggestions.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() =>
                onChange({
                  ...content,
                  specs: [
                    ...content.specs,
                    { ...blankSpec(), label: item.label, group: item.group },
                  ],
                })
              }
              className="h-9 rounded-full bg-[#f5f6f8] px-3 text-xs font-medium text-neutral-800 ring-1 ring-neutral-200 hover:bg-neutral-100"
            >
              + {item.label}
            </button>
          ))}
        </div>
      ) : null}
      {content.specs.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-500">No specifications yet.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {content.specs.map((item, index) => (
            <li
              key={item.id}
              className="rounded-2xl bg-[#f7f8fa] p-3 ring-1 ring-neutral-200"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-neutral-500">
                  Specification {index + 1}
                </p>
                <RowActions
                  label={`specification ${index + 1}`}
                  disableUp={index === 0}
                  disableDown={index === content.specs.length - 1}
                  onUp={() =>
                    onChange({
                      ...content,
                      specs: move(content.specs, index, index - 1),
                    })
                  }
                  onDown={() =>
                    onChange({
                      ...content,
                      specs: move(content.specs, index, index + 1),
                    })
                  }
                  onRemove={() =>
                    onChange({
                      ...content,
                      specs: content.specs.filter((row) => row.id !== item.id),
                    })
                  }
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-[9rem_minmax(0,1fr)_minmax(0,1fr)]">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-neutral-700">
                    Group
                  </span>
                  <select
                    value={item.group}
                    aria-label={`Group for specification ${index + 1}`}
                    onChange={(event) =>
                      update(item.id, {
                        group: event.target.value as ProductSpecRow["group"],
                      })
                    }
                    className={adminFieldClass}
                  >
                    {SPEC_GROUP_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-neutral-700">
                    Specification
                  </span>
                  <input
                    value={item.label}
                    aria-label={`Name for specification ${index + 1}`}
                    onChange={(event) =>
                      update(item.id, { label: event.target.value })
                    }
                    className={adminFieldClass}
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-neutral-700">
                    Value
                  </span>
                  <input
                    value={item.value}
                    aria-label={`Value for specification ${index + 1}`}
                    onChange={(event) =>
                      update(item.id, { value: event.target.value })
                    }
                    className={adminFieldClass}
                  />
                </label>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FaqList({
  formId,
  content,
  onChange,
}: {
  formId: string;
  content: ProductStorefrontContent;
  onChange: (content: ProductStorefrontContent) => void;
}) {
  function update(id: string, patch: Partial<ProductFaqRow>) {
    onChange({
      ...content,
      faqs: content.faqs.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    });
  }

  return (
    <div className="border-t border-neutral-100 pt-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-neutral-950">Questions</h3>
          <p className="mt-1 text-sm text-neutral-500">
            The questions tab. Leave this empty to hide that tab.
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            onChange({ ...content, faqs: [...content.faqs, blankFaq()] })
          }
          className={adminButtonClass.secondary}
        >
          Add question
        </button>
      </div>
      {content.faqs.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-500">No questions yet.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {content.faqs.map((item, index) => (
            <li
              key={item.id}
              className="rounded-2xl bg-[#f7f8fa] p-3 ring-1 ring-neutral-200"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-neutral-500">
                  Question {index + 1}
                </p>
                <RowActions
                  label={`question ${index + 1}`}
                  disableUp={index === 0}
                  disableDown={index === content.faqs.length - 1}
                  onUp={() =>
                    onChange({
                      ...content,
                      faqs: move(content.faqs, index, index - 1),
                    })
                  }
                  onDown={() =>
                    onChange({
                      ...content,
                      faqs: move(content.faqs, index, index + 1),
                    })
                  }
                  onRemove={() =>
                    onChange({
                      ...content,
                      faqs: content.faqs.filter((row) => row.id !== item.id),
                    })
                  }
                />
              </div>
              <div className="grid gap-3">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-neutral-700">
                    Question
                  </span>
                  <input
                    id={`${formId}-faq-q-${item.id}`}
                    value={item.question}
                    onChange={(event) =>
                      update(item.id, { question: event.target.value })
                    }
                    className={adminFieldClass}
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-neutral-700">
                    Answer
                  </span>
                  <textarea
                    id={`${formId}-faq-a-${item.id}`}
                    value={item.answer}
                    rows={3}
                    onChange={(event) =>
                      update(item.id, { answer: event.target.value })
                    }
                    className={cn(
                      adminFieldClass,
                      "h-auto py-3 leading-relaxed",
                    )}
                  />
                </label>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function LineList({
  label,
  hint,
  items,
  placeholder,
  addLabel,
  onChange,
}: {
  label: string;
  hint: string;
  items: string[];
  placeholder: string;
  addLabel: string;
  onChange: (items: string[]) => void;
}) {
  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-neutral-950">{label}</h3>
          <p className="mt-1 text-sm text-neutral-500">{hint}</p>
        </div>
        <button
          type="button"
          onClick={() => onChange([...items, ""])}
          className={adminButtonClass.secondary}
        >
          {addLabel}
        </button>
      </div>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-500">None yet.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((item, index) => (
            <li key={`${label}-${index}`} className="flex items-center gap-2">
              <input
                value={item}
                aria-label={`${label} ${index + 1}`}
                placeholder={placeholder}
                onChange={(event) =>
                  onChange(
                    items.map((row, rowIndex) =>
                      rowIndex === index ? event.target.value : row,
                    ),
                  )
                }
                className={adminFieldClass}
              />
              <RowActions
                label={`${label} ${index + 1}`}
                disableUp={index === 0}
                disableDown={index === items.length - 1}
                onUp={() => onChange(move(items, index, index - 1))}
                onDown={() => onChange(move(items, index, index + 1))}
                onRemove={() =>
                  onChange(items.filter((_, rowIndex) => rowIndex !== index))
                }
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RowActions({
  label,
  disableUp,
  disableDown,
  onUp,
  onDown,
  onRemove,
}: {
  label: string;
  disableUp: boolean;
  disableDown: boolean;
  onUp: () => void;
  onDown: () => void;
  onRemove: () => void;
}) {
  return (
    <span className="flex shrink-0 items-center">
      <IconButton
        label={`Move ${label} up`}
        disabled={disableUp}
        onClick={onUp}
        icon="arrow_upward"
      />
      <IconButton
        label={`Move ${label} down`}
        disabled={disableDown}
        onClick={onDown}
        icon="arrow_downward"
      />
      <IconButton label={`Remove ${label}`} onClick={onRemove} icon="close" />
    </span>
  );
}

function IconButton({
  label,
  disabled,
  onClick,
  icon,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  icon: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-9 place-items-center rounded-full text-neutral-500 hover:bg-white hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:text-neutral-300"
    >
      <MaterialIcon name={icon} className="text-[18px]" />
    </button>
  );
}

function move<T>(items: T[], from: number, to: number) {
  if (to < 0 || to >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  if (item === undefined) return items;
  next.splice(to, 0, item);
  return next;
}
