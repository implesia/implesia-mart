"use client";

import { useEffect, useId, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import { getAdminSiteSettings, saveAdminSiteSettings } from "@/lib/mart-api/site-settings";
import { MartApiError } from "@/lib/mart-api/products";
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE, SITE_URL } from "@/lib/seo";
import {
  applyTitleTemplate,
  collapseSeoText,
  draftFromSettings,
  isTitleTemplate,
  previewStorefrontSeo,
  SEO_DESCRIPTION_GUIDE,
  SEO_DESCRIPTION_MAX,
  SEO_TEMPLATE_MAX,
  SEO_TITLE_GUIDE,
  SEO_TITLE_MAX,
  siteSettingsUpdate,
  type SeoDraft,
} from "@/lib/site-seo";
import { cn } from "@/lib/utils";

import {
  AdminLoading,
  AdminNotice,
  AdminPageHeader,
  FieldLabel,
  adminButtonClass,
  adminFieldClass,
} from "../../../_components/admin-ui";

const EMPTY: SeoDraft = { title: "", description: "", template: "" };

function same(a: SeoDraft, b: SeoDraft) {
  return a.title === b.title && a.description === b.description && a.template === b.template;
}

function Counter({
  length,
  guide,
  max,
}: {
  length: number;
  guide: number;
  max: number;
}) {
  const overGuide = length > guide;
  return (
    <span
      className={cn(
        "text-xs tabular-nums",
        overGuide ? "font-medium text-amber-700" : "text-neutral-500",
      )}
    >
      {length} / {guide}
      <span className="font-normal text-neutral-400"> (max {max})</span>
    </span>
  );
}

export function SeoSettingsEditor() {
  const id = useId();
  const [saved, setSaved] = useState<SeoDraft | null>(null);
  const [draft, setDraft] = useState<SeoDraft | null>(null);
  const [mocked, setMocked] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getAdminSiteSettings()
      .then((next) => {
        if (cancelled) return;
        const form = draftFromSettings(next.settings);
        setSaved(form);
        setDraft(form);
        setMocked(next.mocked);
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setLoadError(cause instanceof MartApiError ? cause.message : "Could not load SEO settings.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const header = (
    <AdminPageHeader
      title="SEO"
      description="The title and description for the home page, and the template other pages add to their own titles. Empty fields use the built-in text."
      action={
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
        >
          View on site
          <MaterialIcon name="open_in_new" className="text-[18px]" />
        </a>
      }
    />
  );

  if (loadError) {
    return (
      <div className="min-w-0 space-y-4">
        {header}
        <AdminNotice tone="warning">{loadError}</AdminNotice>
      </div>
    );
  }
  if (!saved || !draft) {
    return (
      <div className="min-w-0 space-y-4">
        {header}
        <AdminLoading />
      </div>
    );
  }

  const preview = previewStorefrontSeo(draft);
  const titleLength = collapseSeoText(draft.title).length;
  const descriptionLength = collapseSeoText(draft.description).length;
  const templateLength = collapseSeoText(draft.template).length;
  const templateText = collapseSeoText(draft.template);
  const templateError =
    templateText && !isTitleTemplate(templateText)
      ? "The title template must contain %s exactly once."
      : "";
  const update = siteSettingsUpdate(draft);
  const dirty = !same(saved, draft);
  const blank = same(draft, EMPTY);
  const host = SITE_URL.replace(/^https?:\/\//, "");

  function change(patch: Partial<SeoDraft>) {
    setDraft((current) => (current ? { ...current, ...patch } : current));
    setError("");
    setNotice("");
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (busy || !dirty || !draft || !update.ok) return;
    setBusy(true);
    setError("");
    try {
      const next = await saveAdminSiteSettings(draft);
      const form = draftFromSettings(next.settings);
      setSaved(form);
      setDraft(form);
      setMocked(next.mocked);
      setNotice(
        next.mocked
          ? "Saved in this browser only. The storefront still uses the built-in text until the SEO settings API is available."
          : "Saved. The home page picks this up within about a minute.",
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save SEO settings.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-w-0 space-y-4">
      {header}
      {mocked ? (
        <AdminNotice tone="warning">
          The SEO settings API is not available, so this form is kept in this browser only. The
          storefront keeps its built-in title and description.
        </AdminNotice>
      ) : null}
      <form onSubmit={onSubmit} className="grid min-w-0 gap-4" aria-busy={busy} noValidate>
        <div className="grid gap-4 rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90 sm:p-5">
          <div
            className="rounded-xl bg-neutral-50 px-4 py-3 ring-1 ring-neutral-200"
            aria-label="Google search preview"
          >
            <p className="mb-2 text-xs font-medium tracking-wide text-neutral-500 uppercase">
              Google preview
            </p>
            <p className="truncate text-xs text-neutral-600">{host}</p>
            <p className="mt-0.5 line-clamp-1 text-lg leading-snug text-primary">{preview.title}</p>
            <p className="mt-0.5 line-clamp-2 text-sm leading-relaxed text-neutral-600">
              {preview.description}
            </p>
          </div>

          <div>
            <div className="flex items-baseline justify-between gap-2">
              <FieldLabel htmlFor={`${id}-title`}>SEO title</FieldLabel>
              <Counter length={titleLength} guide={SEO_TITLE_GUIDE} max={SEO_TITLE_MAX} />
            </div>
            <input
              id={`${id}-title`}
              name="seo_title"
              value={draft.title}
              maxLength={SEO_TITLE_MAX}
              onChange={(event) => change({ title: event.target.value })}
              placeholder={DEFAULT_TITLE}
              aria-describedby={`${id}-title-hint`}
              className={adminFieldClass}
            />
            <p id={`${id}-title-hint`} className="mt-1.5 text-xs text-neutral-500">
              Home page and the default title. Empty uses the built-in title.
              {titleLength > SEO_TITLE_GUIDE ? (
                <span className="mt-1 block font-medium text-amber-700">
                  Longer than {SEO_TITLE_GUIDE} characters. Search results may cut this off.
                </span>
              ) : null}
            </p>
          </div>

          <div>
            <div className="flex items-baseline justify-between gap-2">
              <FieldLabel htmlFor={`${id}-description`}>Meta description</FieldLabel>
              <Counter
                length={descriptionLength}
                guide={SEO_DESCRIPTION_GUIDE}
                max={SEO_DESCRIPTION_MAX}
              />
            </div>
            <textarea
              id={`${id}-description`}
              name="seo_description"
              value={draft.description}
              maxLength={SEO_DESCRIPTION_MAX}
              rows={3}
              onChange={(event) => change({ description: event.target.value })}
              placeholder={DEFAULT_DESCRIPTION}
              aria-describedby={`${id}-description-hint`}
              className={cn(adminFieldClass, "h-auto py-2.5")}
            />
            <p id={`${id}-description-hint`} className="mt-1.5 text-xs text-neutral-500">
              Home page description. Empty uses the built-in description.
              {descriptionLength > SEO_DESCRIPTION_GUIDE ? (
                <span className="mt-1 block font-medium text-amber-700">
                  Longer than {SEO_DESCRIPTION_GUIDE} characters. Search results may cut this off.
                </span>
              ) : null}
            </p>
          </div>

          <div>
            <div className="flex items-baseline justify-between gap-2">
              <FieldLabel htmlFor={`${id}-template`}>Title template</FieldLabel>
              <span className="text-xs text-neutral-500 tabular-nums">
                {templateLength} / {SEO_TEMPLATE_MAX}
              </span>
            </div>
            <input
              id={`${id}-template`}
              name="seo_title_template"
              value={draft.template}
              maxLength={SEO_TEMPLATE_MAX}
              spellCheck={false}
              onChange={(event) => change({ template: event.target.value })}
              placeholder="%s | Implesia Mart"
              aria-invalid={templateError ? true : undefined}
              aria-describedby={templateError ? `${id}-template-error` : `${id}-template-hint`}
              className={cn(
                adminFieldClass,
                "font-mono text-sm",
                templateError &&
                  "border-red-400 focus-visible:border-red-500 focus-visible:ring-red-200",
              )}
            />
            {templateError ? (
              <p id={`${id}-template-error`} className="mt-1.5 text-sm text-red-700">
                {templateError}
              </p>
            ) : (
              <p id={`${id}-template-hint`} className="mt-1.5 text-xs text-neutral-500">
                Other pages only. <span className="font-mono">%s</span> is that page’s title, once.
                Empty keeps <span className="font-mono">%s | Implesia Mart</span>. Example:{" "}
                {applyTitleTemplate("About", preview.titleTemplate)}
              </p>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 z-10 -mx-1 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/95 p-3 ring-1 ring-neutral-200/90 backdrop-blur">
          <div className="min-w-0 flex-1 text-sm" aria-live="polite">
            {error ? (
              <p role="alert" className="text-red-700">
                {error}
              </p>
            ) : notice ? (
              <p role="status" className="font-medium text-emerald-800">
                {notice}
              </p>
            ) : !update.ok ? (
              <p className="text-amber-800">{update.message}</p>
            ) : dirty ? (
              <p className="text-neutral-600">You have unsaved changes.</p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={adminButtonClass.secondary}
              disabled={blank || busy}
              onClick={() => change(EMPTY)}
            >
              Clear
            </button>
            <button
              type="submit"
              className={adminButtonClass.primary}
              disabled={!dirty || busy || !update.ok}
            >
              {busy ? "Saving…" : "Save SEO"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
