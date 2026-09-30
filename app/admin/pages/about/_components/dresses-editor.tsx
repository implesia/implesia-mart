"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import {
  blankAboutImage,
  blankFeature,
  readAboutSections,
  saveAboutSections,
  type AboutFeatureItem,
  type AboutImage,
} from "@/lib/mart-mock/about-sections";
import { useAboutSections } from "@/lib/mart-mock/hooks";
import { cn } from "@/lib/utils";

import { adminButtonClass, adminFieldClass, AdminPageHeader, FieldError, FieldLabel } from "../../../_components/admin-ui";
import { ImageField } from "../../../_components/image-field";
import { findCmsPage } from "../../../_config/cms";
import { SectionCopyForm } from "../../../home/_components/section-copy-form";

const ICONS: { name: string; label: string }[] = [
  { name: "payments", label: "Payments" },
  { name: "local_shipping", label: "Delivery" },
  { name: "assignment_return", label: "Returns" },
  { name: "verified", label: "Verified" },
  { name: "category", label: "Category" },
  { name: "location_on", label: "Location" },
  { name: "design_services", label: "Design" },
  { name: "back_hand", label: "Handmade" },
  { name: "checkroom", label: "Dresses" },
  { name: "visibility", label: "Visibility" },
  { name: "rocket_launch", label: "Launch" },
  { name: "search", label: "Search" },
  { name: "task_alt", label: "Done" },
  { name: "storefront", label: "Store" },
  { name: "support_agent", label: "Support" },
  { name: "favorite", label: "Favorite" },
  { name: "shield", label: "Shield" },
];

type FeatureDraft = Pick<AboutFeatureItem, "icon" | "title" | "description">;
type ImageDraft = Pick<AboutImage, "src" | "alt">;

function emptyFeature(): FeatureDraft {
  return { icon: "verified", title: "", description: "" };
}

function draftFromFeature(item: AboutFeatureItem): FeatureDraft {
  return { icon: item.icon, title: item.title, description: item.description };
}

function emptyImage(): ImageDraft {
  return { src: "", alt: "" };
}

function draftFromImage(image: AboutImage): ImageDraft {
  return { src: image.src, alt: image.alt };
}

function iconChoices(current: string) {
  if (ICONS.some((icon) => icon.name === current)) return ICONS;
  return [{ name: current, label: current }, ...ICONS];
}

function iconLabel(name: string) {
  return ICONS.find((icon) => icon.name === name)?.label ?? name;
}

export function AboutDressesEditor() {
  const { customDresses } = useAboutSections();
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const featureId = params.get("feature");
  const galleryId = params.get("gallery");
  const features = customDresses.features;
  const gallery = customDresses.gallery;
  const openedFeature = featureId && featureId !== "new" ? (features.find((item) => item.id === featureId) ?? null) : null;
  const openedImage = galleryId && galleryId !== "new" ? (gallery.find((item) => item.id === galleryId) ?? null) : null;
  const [notice, setNotice] = useState("");
  const [savedId, setSavedId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const focusId = useRef<string | null>(null);
  const page = findCmsPage("about");
  const drawerOpen = Boolean(featureId === "new" || openedFeature || galleryId === "new" || openedImage);

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

  function setKey(key: "feature" | "gallery", id: string | null) {
    const next = new URLSearchParams(window.location.search);
    if (id) next.set(key, id);
    else next.delete(key);
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function closeAll() {
    const next = new URLSearchParams(window.location.search);
    next.delete("feature");
    next.delete("gallery");
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
      customDresses: {
        ...doc.customDresses,
        kicker: next.kicker ?? "",
        title: next.title ?? "",
        subtitle: next.subtitle ?? "",
        primaryCta: { label: next.primaryLabel ?? "", href: next.primaryHref ?? "" },
        secondaryCta: { label: next.secondaryLabel ?? "", href: next.secondaryHref ?? "" },
      },
    });
  }

  function saveFeature(draft: FeatureDraft) {
    const doc = readAboutSections();
    if (featureId === "new") {
      const item = { ...blankFeature(), icon: draft.icon, title: draft.title, description: draft.description };
      saveAboutSections({
        ...doc,
        customDresses: { ...doc.customDresses, features: [...doc.customDresses.features, item] },
      });
      setSavedId(item.id);
      focusId.current = `about-dress-f-${item.id}`;
    } else if (featureId) {
      saveAboutSections({
        ...doc,
        customDresses: {
          ...doc.customDresses,
          features: doc.customDresses.features.map((item) =>
            item.id === featureId ? { ...item, icon: draft.icon, title: draft.title, description: draft.description } : item,
          ),
        },
      });
      setSavedId(featureId);
      focusId.current = `about-dress-f-${featureId}`;
    }
    flash("Saved");
    setKey("feature", null);
  }

  function saveImage(draft: ImageDraft) {
    const doc = readAboutSections();
    if (galleryId === "new") {
      const image = { ...blankAboutImage(), src: draft.src, alt: draft.alt };
      saveAboutSections({
        ...doc,
        customDresses: { ...doc.customDresses, gallery: [...doc.customDresses.gallery, image] },
      });
      setSavedId(image.id);
      focusId.current = `about-dress-g-${image.id}`;
    } else if (galleryId) {
      saveAboutSections({
        ...doc,
        customDresses: {
          ...doc.customDresses,
          gallery: doc.customDresses.gallery.map((image) =>
            image.id === galleryId ? { ...image, src: draft.src, alt: draft.alt } : image,
          ),
        },
      });
      setSavedId(galleryId);
      focusId.current = `about-dress-g-${galleryId}`;
    }
    flash("Saved");
    setKey("gallery", null);
  }

  function removeFeature(id: string) {
    const doc = readAboutSections();
    saveAboutSections({
      ...doc,
      customDresses: { ...doc.customDresses, features: doc.customDresses.features.filter((item) => item.id !== id) },
    });
    if (featureId === id) setKey("feature", null);
    setConfirmId(null);
    flash("Removed");
  }

  function removeImage(id: string) {
    const doc = readAboutSections();
    saveAboutSections({
      ...doc,
      customDresses: { ...doc.customDresses, gallery: doc.customDresses.gallery.filter((item) => item.id !== id) },
    });
    if (galleryId === id) setKey("gallery", null);
    setConfirmId(null);
    flash("Removed");
  }

  function moveFeature(id: string, direction: -1 | 1) {
    const doc = readAboutSections();
    const index = doc.customDresses.features.findIndex((item) => item.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= doc.customDresses.features.length) return;
    const next = [...doc.customDresses.features];
    const [item] = next.splice(index, 1);
    if (!item) return;
    next.splice(target, 0, item);
    saveAboutSections({ ...doc, customDresses: { ...doc.customDresses, features: next } });
  }

  function moveImage(id: string, direction: -1 | 1) {
    const doc = readAboutSections();
    const index = doc.customDresses.gallery.findIndex((item) => item.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= doc.customDresses.gallery.length) return;
    const next = [...doc.customDresses.gallery];
    const [item] = next.splice(index, 1);
    if (!item) return;
    next.splice(target, 0, item);
    saveAboutSections({ ...doc, customDresses: { ...doc.customDresses, gallery: next } });
  }

  function dropFeature(targetId: string) {
    if (!dragId || dragId === targetId) {
      setDragId(null);
      setOverId(null);
      return;
    }
    const doc = readAboutSections();
    const next = [...doc.customDresses.features];
    const from = next.findIndex((item) => item.id === dragId);
    const to = next.findIndex((item) => item.id === targetId);
    if (from < 0 || to < 0) return;
    const [item] = next.splice(from, 1);
    if (!item) return;
    next.splice(to, 0, item);
    saveAboutSections({ ...doc, customDresses: { ...doc.customDresses, features: next } });
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
    const next = [...doc.customDresses.gallery];
    const from = next.findIndex((item) => item.id === dragId);
    const to = next.findIndex((item) => item.id === targetId);
    if (from < 0 || to < 0) return;
    const [item] = next.splice(from, 1);
    if (!item) return;
    next.splice(to, 0, item);
    saveAboutSections({ ...doc, customDresses: { ...doc.customDresses, gallery: next } });
    setDragId(null);
    setOverId(null);
  }

  const missingFeature = Boolean(featureId && featureId !== "new" && !openedFeature);
  const missingImage = Boolean(galleryId && galleryId !== "new" && !openedImage);

  return (
    <div className="min-w-0 space-y-4">
      <div>
        <nav aria-label="Breadcrumb" className="mb-3 flex flex-wrap items-center gap-1 text-sm text-neutral-500">
          <Link href="/admin/pages/about" className="font-medium hover:text-neutral-950">
            About
          </Link>
          <MaterialIcon name="chevron_right" className="text-[16px] text-neutral-300" />
          <span className="font-medium text-neutral-950">Custom dresses</span>
        </nav>
        {page ? (
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1" aria-label="About sections">
            {page.sections.map((section) => {
              const active = section.id === "custom-dresses";
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
          title="Custom dresses"
          description="Dress block and gallery."
          action={
            <div className="flex flex-wrap items-center gap-2">
              <a href="/about-us" target="_blank" rel="noreferrer" className={adminButtonClass.secondary}>
                View on site
                <MaterialIcon name="open_in_new" className="text-[18px]" />
              </a>
              <button type="button" onClick={() => setKey("feature", "new")} className={adminButtonClass.primary}>
                <MaterialIcon name="add" className="text-[18px]" />
                Add feature
              </button>
              <button type="button" onClick={() => setKey("gallery", "new")} className={adminButtonClass.secondary}>
                <MaterialIcon name="add" className="text-[18px]" />
                Add photo
              </button>
            </div>
          }
        />
      </div>

      {notice && !drawerOpen ? (
        <p role="status" className="text-sm font-medium text-emerald-800">
          {notice}. The dress block is up to date.
        </p>
      ) : null}
      {missingFeature ? (
        <p className="rounded-2xl bg-white px-4 py-3 text-sm text-neutral-600 ring-1 ring-neutral-200/90">
          This feature is no longer here.{" "}
          <button type="button" onClick={() => setKey("feature", null)} className="font-medium text-primary">
            Close
          </button>
        </p>
      ) : null}
      {missingImage ? (
        <p className="rounded-2xl bg-white px-4 py-3 text-sm text-neutral-600 ring-1 ring-neutral-200/90">
          This photo is no longer here.{" "}
          <button type="button" onClick={() => setKey("gallery", null)} className="font-medium text-primary">
            Close
          </button>
        </p>
      ) : null}

      <section className="overflow-hidden rounded-2xl bg-admin-canvas ring-1 ring-neutral-200/90" aria-labelledby="about-dresses-preview-heading">
        <div className="px-4 pt-4 sm:px-5">
          <h2 id="about-dresses-preview-heading" className="text-sm font-semibold text-neutral-950">
            Storefront preview
          </h2>
          <p className="mt-1 text-sm text-neutral-500">Shown on the about page. Photos and features stay in this order.</p>
        </div>
        <div className="p-4 sm:p-5">
          <div className="grid items-start gap-6 rounded-2xl bg-[#f5f6f8] p-4 xl:grid-cols-12 xl:gap-8 sm:p-5">
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:col-span-7">
              {gallery.map((image) => (
                <li key={image.id}>
                  <button
                    type="button"
                    onClick={() => setKey("gallery", image.id)}
                    aria-label={image.alt || "Photo"}
                    className="relative block aspect-4/5 w-full overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {image.src ? (
                      <Image src={image.src} alt="" fill sizes="180px" className="object-cover" />
                    ) : (
                      <span className="grid size-full place-items-center text-xs text-neutral-500">Photo</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
            <div className="xl:col-span-5">
              <p className="text-xs font-medium tracking-wide text-primary uppercase">{customDresses.kicker}</p>
              <p className="mt-2 text-xl font-semibold tracking-tight text-neutral-950">{customDresses.title}</p>
              <p className="mt-3 text-sm leading-relaxed text-neutral-600">{customDresses.subtitle}</p>
              <ul className="mt-5 grid grid-cols-1 gap-3 min-[400px]:grid-cols-2">
                {features.map((feature) => (
                  <li key={feature.id}>
                    <button
                      type="button"
                      onClick={() => setKey("feature", feature.id)}
                      className="flex w-full items-start gap-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <MaterialIcon name={feature.icon || "notes"} className="text-[16px]" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-neutral-950">{feature.title}</span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-neutral-600">{feature.description}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:gap-3">
                {customDresses.primaryCta.label ? (
                  <span className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-primary px-5 text-sm font-semibold text-on-primary">
                    {customDresses.primaryCta.label}
                    <MaterialIcon name="arrow_forward" className="text-[18px]" />
                  </span>
                ) : null}
                {customDresses.secondaryCta.label ? (
                  <span className="inline-flex h-10 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-neutral-950 ring-1 ring-neutral-200">
                    {customDresses.secondaryCta.label}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90 sm:p-5">
        <SectionCopyForm
          values={{
            kicker: customDresses.kicker,
            title: customDresses.title,
            subtitle: customDresses.subtitle,
            primaryLabel: customDresses.primaryCta.label,
            primaryHref: customDresses.primaryCta.href,
            secondaryLabel: customDresses.secondaryCta.label,
            secondaryHref: customDresses.secondaryCta.href,
          }}
          fields={[
            { name: "kicker", label: "Eyebrow" },
            { name: "title", label: "Title", wide: true },
            { name: "subtitle", label: "Subtitle", multiline: true, rows: 4, wide: true },
            { name: "primaryLabel", label: "Primary button label" },
            { name: "primaryHref", label: "Primary button link" },
            { name: "secondaryLabel", label: "Secondary button label" },
            { name: "secondaryHref", label: "Secondary button link" },
          ]}
          saveLabel="Save heading"
          onSave={saveCopy}
        />
      </section>

      <RecordList
        headingId="about-dresses-features-heading"
        title={features.length === 1 ? "1 feature" : `${features.length} features`}
        emptyTitle="No features yet"
        emptyBody="Add the points shown beside the dress photos."
        emptyAction="Add feature"
        onEmpty={() => setKey("feature", "new")}
        items={features.map((item) => ({
          id: item.id,
          buttonId: `about-dress-f-${item.id}`,
          title: item.title || "Empty feature",
          meta: item.description || iconLabel(item.icon),
          reorder: item.title || "feature",
          icon: item.icon,
        }))}
        selected={featureId}
        savedId={savedId}
        confirmId={confirmId}
        dragId={dragId}
        overId={overId}
        onOpen={(id) => setKey("feature", id)}
        onDrag={setDragId}
        onOver={setOverId}
        onDrop={dropFeature}
        onMove={moveFeature}
        onAskRemove={setConfirmId}
        onRemove={removeFeature}
        removeLabel="Remove feature"
      />

      <RecordList
        headingId="about-dresses-photos-heading"
        title={gallery.length === 1 ? "1 photo" : `${gallery.length} photos`}
        emptyTitle="No photos yet"
        emptyBody="Add the dress photos shown on the about page."
        emptyAction="Add photo"
        onEmpty={() => setKey("gallery", "new")}
        items={gallery.map((image) => ({
          id: image.id,
          buttonId: `about-dress-g-${image.id}`,
          title: image.alt || "No description",
          meta: "Photo",
          reorder: image.alt || "photo",
          imageSrc: image.src,
        }))}
        selected={galleryId}
        savedId={savedId}
        confirmId={confirmId}
        dragId={dragId}
        overId={overId}
        onOpen={(id) => setKey("gallery", id)}
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
            aria-labelledby="about-dresses-drawer-title"
            className="force-light flex h-full w-full max-w-md flex-col overflow-y-auto bg-white shadow-xl"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => {
              if (event.key === "Escape") closeAll();
            }}
          >
            {featureId === "new" || openedFeature ? (
              <FeatureDrawer
                key={featureId}
                creating={featureId === "new"}
                initial={openedFeature ? draftFromFeature(openedFeature) : emptyFeature()}
                notice={notice}
                onClose={() => setKey("feature", null)}
                onSave={saveFeature}
              />
            ) : null}
            {galleryId === "new" || openedImage ? (
              <ImageDrawer
                key={galleryId}
                creating={galleryId === "new"}
                titleId={featureId === "new" || openedFeature ? undefined : "about-dresses-drawer-title"}
                initial={openedImage ? draftFromImage(openedImage) : emptyImage()}
                notice={notice}
                onClose={() => setKey("gallery", null)}
                onSave={saveImage}
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FeatureDrawer({
  creating,
  initial,
  notice,
  onClose,
  onSave,
}: {
  creating: boolean;
  initial: FeatureDraft;
  notice: string;
  onClose: () => void;
  onSave: (draft: FeatureDraft) => void;
}) {
  const [draft, setDraft] = useState(initial);
  const [titleError, setTitleError] = useState("");
  const [descriptionError, setDescriptionError] = useState("");
  const [saving, setSaving] = useState(false);
  const titleId = useId();
  const descriptionId = useId();
  const title = draft.title.trim() || "Feature";

  function save() {
    if (saving) return;
    const nextTitle = draft.title.trim();
    const nextDescription = draft.description.trim();
    setTitleError(nextTitle ? "" : "Title is required.");
    setDescriptionError(nextDescription ? "" : "Description is required.");
    if (!nextTitle || !nextDescription) return;
    setSaving(true);
    onSave({ icon: draft.icon || "verified", title: nextTitle, description: nextDescription });
  }

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex items-start justify-between gap-3 border-b border-neutral-100 px-5 py-4">
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-wide text-neutral-400 uppercase">{creating ? "Add feature" : "Edit feature"}</p>
          <h2 id="about-dresses-drawer-title" className="mt-1 line-clamp-2 text-lg font-semibold text-neutral-950">
            {creating ? "New feature" : title}
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
        <div className="flex items-start gap-3 rounded-2xl bg-white px-4 py-3 ring-1 ring-neutral-200">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MaterialIcon name={draft.icon || "notes"} className="text-[16px]" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-neutral-950">{draft.title.trim() || "Title"}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-neutral-500">{draft.description.trim() || "Description"}</p>
          </div>
        </div>
        <div>
          <FieldLabel>Icon</FieldLabel>
          <div className="flex flex-wrap gap-1.5">
            {iconChoices(draft.icon).map((icon) => (
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
          <FieldLabel htmlFor={titleId}>
            Title <span className="text-red-700">*</span>
          </FieldLabel>
          <input
            id={titleId}
            autoFocus
            value={draft.title}
            onChange={(event) => {
              setDraft({ ...draft, title: event.target.value });
              setTitleError("");
            }}
            aria-invalid={titleError ? true : undefined}
            aria-describedby={titleError ? `${titleId}-error` : undefined}
            className={cn(adminFieldClass, titleError && "border-red-400")}
          />
          {titleError ? (
            <div id={`${titleId}-error`}>
              <FieldError message={titleError} />
            </div>
          ) : null}
        </div>
        <div>
          <FieldLabel htmlFor={descriptionId}>
            Description <span className="text-red-700">*</span>
          </FieldLabel>
          <textarea
            id={descriptionId}
            value={draft.description}
            rows={4}
            onChange={(event) => {
              setDraft({ ...draft, description: event.target.value });
              setDescriptionError("");
            }}
            aria-invalid={descriptionError ? true : undefined}
            aria-describedby={descriptionError ? `${descriptionId}-error` : undefined}
            className={cn(adminFieldClass, "h-auto py-3", descriptionError && "border-red-400")}
          />
          {descriptionError ? (
            <div id={`${descriptionId}-error`}>
              <FieldError message={descriptionError} />
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
          {saving ? "Saving…" : creating ? "Save feature" : "Save changes"}
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
        <div className="relative aspect-4/5 overflow-hidden rounded-2xl bg-neutral-100 ring-1 ring-neutral-200">
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
  items: { id: string; buttonId: string; title: string; meta: string; reorder: string; imageSrc?: string; icon?: string }[];
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
                    ) : item.icon ? (
                      <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-admin-canvas text-primary">
                        <MaterialIcon name={item.icon} className="text-[22px]" />
                      </span>
                    ) : null}
                    <span className="min-w-0">
                      <span className="line-clamp-2 text-sm font-semibold text-neutral-950">{item.title}</span>
                      <span className="mt-0.5 line-clamp-2 block text-xs text-neutral-500">{item.meta}</span>
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
