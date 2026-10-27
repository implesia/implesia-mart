"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import {
  blankAboutStory,
  createAboutStory,
  deleteAboutStory,
  listAboutStories,
  reorderAboutStories,
  updateAboutStory,
  type AboutStory,
} from "@/lib/mart-api/about-stories";
import { singleImageErrors } from "@/lib/mart-api/about-single-image";
import { MartApiError } from "@/lib/mart-api/products";
import { isContentActive } from "@/lib/mart-mock/visibility";
import { cn } from "@/lib/utils";

import { AdminFormModal } from "../../../_components/admin-form-modal";
import {
  ActiveStatusField,
  adminButtonClass,
  adminFieldClass,
  AdminPageHeader,
  FieldError,
  FieldLabel,
  VisibilityBadge,
} from "../../../_components/admin-ui";
import { FormCloseGuard } from "../../../_components/form-close-guard";
import { findCmsPage } from "../../../_config/cms";
import { SingleImageField } from "./single-image-field";

export function AboutStoryEditor() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const storyId = params.get("story");
  const creating = storyId === "new";
  const [stories, setStories] = useState<AboutStory[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const items = stories ?? [];
  const editing = creating
    ? null
    : (items.find((item) => item.id === storyId) ?? null);
  const drawerOpen = creating || Boolean(editing);
  const missing = stories !== null && Boolean(storyId && !creating && !editing);
  const [notice, setNotice] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const page = findCmsPage("about");

  useEffect(() => {
    let cancelled = false;
    listAboutStories()
      .then((next) => {
        if (!cancelled) setStories(next);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setLoadError(error instanceof MartApiError ? error.message : "Could not load the stories.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function openStory(id: string | null) {
    const next = new URLSearchParams(window.location.search);
    next.delete("paragraph");
    next.delete("image");
    if (id) next.set("story", id);
    else next.delete("story");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 1600);
  }

  async function saveStory(draft: AboutStory) {
    if (!stories) return;
    const next = cleanStory(draft);
    if (creating) {
      const saved = await createAboutStory(next);
      setStories([...stories, saved]);
    } else if (storyId) {
      const saved = await updateAboutStory(storyId, next);
      setStories(stories.map((item) => (item.id === storyId ? saved : item)));
    }
    flash("Saved");
    openStory(null);
  }

  async function removeStory(id: string) {
    if (!stories) return;
    setLoadError("");
    try {
      await deleteAboutStory(id);
      setStories(stories.filter((item) => item.id !== id));
      if (storyId === id) openStory(null);
      setConfirmId(null);
      flash("Removed");
    } catch (error) {
      setLoadError(error instanceof MartApiError ? error.message : "Could not remove the story.");
    }
  }

  async function applyOrder(ids: string[]) {
    setLoadError("");
    try {
      setStories(await reorderAboutStories(ids));
    } catch (error) {
      setLoadError(
        error instanceof MartApiError ? error.message : "Could not reorder the stories.",
      );
    }
  }

  function moveStory(id: string, direction: -1 | 1) {
    const index = items.findIndex((item) => item.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= items.length) return;
    const next = [...items];
    const [item] = next.splice(index, 1);
    if (!item) return;
    next.splice(target, 0, item);
    void applyOrder(next.map((entry) => entry.id));
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
          <span className="font-medium text-neutral-950">Story</span>
        </nav>
        {page ? (
          <div
            className="mb-4 flex gap-2 overflow-x-auto pb-1"
            aria-label="About sections"
          >
            {page.sections.map((section) => {
              const active = section.id === "story";
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
          title="Story"
          description="Each story is one block on the about page. Hidden stories stay off the about page."
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
                onClick={() => openStory("new")}
                className={adminButtonClass.primary}
              >
                <MaterialIcon name="add" className="text-[18px]" />
                Add story
              </button>
            </div>
          }
        />
      </div>

      {loadError ? (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">
          {loadError}
        </p>
      ) : null}
      {notice && !drawerOpen ? (
        <p role="status" className="text-sm font-medium text-emerald-800">
          {notice}. The about page is up to date.
        </p>
      ) : null}
      {missing ? (
        <p className="rounded-2xl bg-white px-4 py-3 text-sm text-neutral-600 ring-1 ring-neutral-200/90">
          This story is no longer here.{" "}
          <button
            type="button"
            onClick={() => openStory(null)}
            className="font-medium text-primary"
          >
            Close
          </button>
        </p>
      ) : null}

      <section
        className="overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200/90"
        aria-labelledby="about-stories-heading"
      >
        <div className="border-b border-neutral-100 px-4 py-3 sm:px-5">
          <h2
            id="about-stories-heading"
            className="text-sm font-semibold text-neutral-950"
          >
            {stories === null
              ? "Stories"
              : stories.length === 1
                ? "1 story"
                : `${stories.length} stories`}
          </h2>
        </div>
        {stories === null ? (
          <p className="px-4 py-12 text-center text-sm text-neutral-500">Loading stories…</p>
        ) : stories.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm font-semibold text-neutral-950">
              No stories yet
            </p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-neutral-500">
              Add a story with its writing, button, and photo.
            </p>
            <button
              type="button"
              onClick={() => openStory("new")}
              className={cn(adminButtonClass.primary, "mt-4")}
            >
              <MaterialIcon name="add" className="text-[18px]" />
              Add story
            </button>
          </div>
        ) : (
          <ol>
            {items.map((story, index) => {
              const excerpt =
                story.paragraphs.find((item) => item.text.trim())?.text ?? "";
              const photos = story.image?.src ? [story.image] : [];
              return (
                <li
                  key={story.id}
                  className="border-t border-neutral-100 first:border-t-0"
                >
                  <div className="flex flex-col gap-3 px-3 py-3 sm:px-4 lg:flex-row lg:items-center">
                    <button
                      type="button"
                      onClick={() => openStory(story.id)}
                      className="flex min-w-0 flex-1 items-start gap-3 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                      <span className="mt-0.5 w-5 shrink-0 text-right text-xs text-neutral-500 tabular-nums">
                        {index + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="truncate text-sm font-semibold text-neutral-950">
                            {story.title.trim() || "Untitled story"}
                          </span>
                          <VisibilityBadge active={isContentActive(story)} />
                        </span>
                        {story.kicker ? (
                          <span className="mt-0.5 block truncate text-xs text-primary">
                            {story.kicker}
                          </span>
                        ) : null}
                        {excerpt ? (
                          <span className="mt-1 line-clamp-2 block text-sm text-neutral-500">
                            {excerpt}
                          </span>
                        ) : null}
                        <span className="mt-2 flex flex-wrap items-center gap-2">
                          {story.cta.label.trim() ? (
                            <span className="inline-flex h-7 items-center rounded-full bg-neutral-950 px-2.5 text-xs font-semibold text-white">
                              {story.cta.label}
                            </span>
                          ) : (
                            <span className="text-xs text-neutral-500">
                              No button
                            </span>
                          )}
                          {photos.map((image) => (
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
                            <span className="text-xs text-neutral-500">
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
                        onClick={() => moveStory(story.id, -1)}
                      />
                      <IconButton
                        label="Move later"
                        icon="arrow_downward"
                        disabled={index === items.length - 1}
                        onClick={() => moveStory(story.id, 1)}
                      />
                      <button
                        type="button"
                        onClick={() => openStory(story.id)}
                        className={adminButtonClass.quiet}
                      >
                        Edit
                      </button>
                      {confirmId === story.id ? (
                        <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-xs text-red-700">
                          Remove this story?
                          <button
                            type="button"
                            onClick={() => removeStory(story.id)}
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
                          label={`Remove ${story.title.trim() || "story"}`}
                          icon="delete"
                          danger
                          onClick={() => setConfirmId(story.id)}
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
        <AdminFormModal titleId="about-story-drawer-title" size="lg">
          <StoryForm
            key={storyId}
            creating={creating}
            initial={editing ?? blankAboutStory()}
            notice={notice}
            onClose={() => openStory(null)}
            onSave={saveStory}
          />
        </AdminFormModal>
      ) : null}
    </div>
  );
}

function StoryForm({
  creating,
  initial,
  notice,
  onClose,
  onSave,
}: {
  creating: boolean;
  initial: AboutStory;
  notice: string;
  onClose: () => void;
  onSave: (story: AboutStory) => Promise<void>;
}) {
  const [story, setStory] = useState(() => ({ ...initial, isActive: initial.isActive !== false }));
  const [baseline] = useState(story);
  const [error, setError] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [altError, setAltError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(0);
  const formId = useId();

  async function save() {
    if (saving || uploading > 0) return;
    const imageErrors = singleImageErrors(story.image);
    setPhotoError(imageErrors.photo);
    setAltError(imageErrors.alt);
    if (imageErrors.photo || imageErrors.alt) {
      setError("");
      return;
    }
    if (
      !story.title.trim() &&
      !story.paragraphs.some((item) => item.text.trim())
    ) {
      setError("Add a title or some story text.");
      return;
    }
    if (story.cta.label.trim() && !story.cta.href.trim()) {
      setError("Add a link for the button, or clear the button label.");
      return;
    }
    setSaving(true);
    try {
      await onSave(story);
    } catch (error) {
      setError(error instanceof MartApiError ? error.message : "Could not save the story.");
      setSaving(false);
    }
  }

  return (
    <FormCloseGuard baseline={baseline} value={story} onClose={onClose}>
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-neutral-100 px-5 py-4">
        <div className="min-w-0">
          <h2
            id="about-story-drawer-title"
            className="text-lg font-semibold text-neutral-950"
          >
            {creating ? "Add story" : "Edit story"}
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            {creating
              ? "Write the story, button, and photo together."
              : "Update this story."}
          </p>
        </div>
        <button
          type="button"
          data-form-dismiss=""
          aria-label="Close"
          title="Close"
          onClick={onClose}
          className="grid size-9 shrink-0 place-items-center rounded-full text-neutral-500 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <MaterialIcon name="close" className="text-[20px]" />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-4">
        <ActiveStatusField
          checked={story.isActive !== false}
          onChange={(isActive) => setStory({ ...story, isActive })}
        />
        <section aria-labelledby={`${formId}-content`}>
          <h3
            id={`${formId}-content`}
            className="text-sm font-semibold text-neutral-950"
          >
            Content
          </h3>
          <p className="mt-1 text-sm text-neutral-500">
            The words on the left of the story block.
          </p>
          <div className="mt-3 grid gap-3">
            <div>
              <FieldLabel htmlFor={`${formId}-kicker`}>Eyebrow</FieldLabel>
              <input
                id={`${formId}-kicker`}
                value={story.kicker}
                placeholder="Short line above the title"
                onChange={(event) =>
                  setStory({ ...story, kicker: event.target.value })
                }
                className={adminFieldClass}
              />
            </div>
            <div>
              <FieldLabel htmlFor={`${formId}-title`}>Title</FieldLabel>
              <input
                id={`${formId}-title`}
                autoFocus
                value={story.title}
                placeholder="What this story is about"
                onChange={(event) => {
                  setStory({ ...story, title: event.target.value });
                  setError("");
                }}
                className={adminFieldClass}
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-neutral-700">Story text</p>
              {story.paragraphs.map((paragraph, index) => (
                <div key={paragraph.id} className="flex items-start gap-2">
                  <textarea
                    value={paragraph.text}
                    rows={4}
                    placeholder="A few lines of the story"
                    aria-label={`Paragraph ${index + 1}`}
                    onChange={(event) => {
                      setStory({
                        ...story,
                        paragraphs: replace(story.paragraphs, paragraph.id, {
                          text: event.target.value,
                        }),
                      });
                      setError("");
                    }}
                    className={cn(adminFieldClass, "h-auto py-3")}
                  />
                  <IconButton
                    label={`Remove paragraph ${index + 1}`}
                    icon="close"
                    disabled={story.paragraphs.length === 1}
                    onClick={() =>
                      setStory({
                        ...story,
                        paragraphs: story.paragraphs.filter(
                          (item) => item.id !== paragraph.id,
                        ),
                      })
                    }
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  setStory({
                    ...story,
                    paragraphs: [
                      ...story.paragraphs,
                      { id: `paragraph-${Date.now().toString(36)}`, text: "" },
                    ],
                  })
                }
                className={adminButtonClass.secondary}
              >
                <MaterialIcon name="add" className="text-[18px]" />
                Add paragraph
              </button>
            </div>
          </div>
        </section>

        <section
          className="border-t border-neutral-100 pt-5"
          aria-labelledby={`${formId}-button`}
        >
          <h3
            id={`${formId}-button`}
            className="text-sm font-semibold text-neutral-950"
          >
            Button
          </h3>
          <p className="mt-1 text-sm text-neutral-500">
            Optional. Shown under the story text.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <FieldLabel htmlFor={`${formId}-button-label`}>
                Button label
              </FieldLabel>
              <input
                id={`${formId}-button-label`}
                value={story.cta.label}
                placeholder="See all products"
                onChange={(event) => {
                  setStory({
                    ...story,
                    cta: { ...story.cta, label: event.target.value },
                  });
                  setError("");
                }}
                className={adminFieldClass}
              />
            </div>
            <div>
              <FieldLabel htmlFor={`${formId}-button-link`}>
                Button link
              </FieldLabel>
              <input
                id={`${formId}-button-link`}
                value={story.cta.href}
                onChange={(event) => {
                  setStory({
                    ...story,
                    cta: { ...story.cta, href: event.target.value },
                  });
                  setError("");
                }}
                placeholder="/products"
                className={adminFieldClass}
              />
            </div>
          </div>
        </section>

        <section
          className="border-t border-neutral-100 pt-5"
          aria-labelledby={`${formId}-images`}
        >
          <h3
            id={`${formId}-images`}
            className="text-sm font-semibold text-neutral-950"
          >
            Photo
          </h3>
          <p className="mt-1 text-sm text-neutral-500">
            One photo sits beside the story. Use Replace to change it.
          </p>
          <div className="mt-3">
            <SingleImageField
              id={`${formId}-photo`}
              value={story.image}
              photoError={photoError}
              altError={altError}
              onBusy={(busy) =>
                setUploading((count) => Math.max(0, count + (busy ? 1 : -1)))
              }
              onChange={(image) => {
                setStory((current) => ({ ...current, image }));
                setPhotoError("");
                setAltError("");
              }}
            />
          </div>
        </section>

        {error ? <FieldError message={error} /> : null}
      </div>

      <div className="flex shrink-0 items-center justify-end gap-2 border-t border-neutral-100 px-5 py-3">
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
          data-form-dismiss=""
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
                ? "Add story"
                : "Save changes"}
        </button>
      </div>
    </div>
    </FormCloseGuard>
  );
}

function cleanStory(story: AboutStory): AboutStory {
  return {
    ...story,
    kicker: story.kicker.trim(),
    title: story.title.trim(),
    paragraphs: story.paragraphs
      .map((item) => ({ ...item, text: item.text.trim() }))
      .filter((item) => item.text),
    cta: { label: story.cta.label.trim(), href: story.cta.href.trim() },
    image: story.image?.src.trim()
      ? { ...story.image, src: story.image.src.trim(), alt: story.image.alt.trim() }
      : null,
  };
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
