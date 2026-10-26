"use client";

import { useEffect, useId, useState } from "react";

import { PromoBannerView } from "@/app/(client)/_components/home/promo-banner-section";
import { adminCoverSrc } from "@/lib/blog-view";
import { getAdminPromo, savePromo } from "@/lib/mart-api/promo";
import { MartApiError } from "@/lib/mart-api/products";
import {
  PROMO_LIMITS,
  blankPromo,
  focalPosition,
  promoDraftError,
  safeCtaHref,
  type PromoAdmin,
} from "@/lib/promo-view";

import {
  ActiveStatusField,
  AdminLoading,
  AdminNotice,
  adminButtonClass,
  adminFieldClass,
  FieldLabel,
} from "../../_components/admin-ui";
import { ImageField } from "../../_components/image-field";
import { HomeCmsHeader } from "./home-cms-header";

const SAME = (a: PromoAdmin, b: PromoAdmin) => JSON.stringify(a) === JSON.stringify(b);

export function HomePromo() {
  const [saved, setSaved] = useState<PromoAdmin | null>(null);
  const [draft, setDraft] = useState<PromoAdmin>(blankPromo);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [picking, setPicking] = useState(false);
  const id = useId();

  useEffect(() => {
    let cancelled = false;
    getAdminPromo()
      .then((next) => {
        if (cancelled) return;
        setSaved(next);
        setDraft(next);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setLoadError(e instanceof MartApiError ? e.message : "Could not load the banner.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const dirty = saved ? !SAME(saved, draft) : false;

  function change(patch: Partial<PromoAdmin>) {
    setDraft((current) => ({ ...current, ...patch }));
    setError("");
    setNotice("");
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (busy || !dirty) return;
    const problem = promoDraftError(draft);
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const next = await savePromo(draft);
      if (draft.imageSrc.startsWith("blob:")) URL.revokeObjectURL(draft.imageSrc);
      setSaved(next);
      setDraft(next);
      setNotice(next.isActive ? "Saved. The banner is live on the home page." : "Saved. The banner is hidden.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the banner.");
    } finally {
      setBusy(false);
    }
  }

  const header = (
    <HomeCmsHeader
      title="Promo banner"
      description="A slim banner shown directly under Featured Products. It stays hidden until you add an image and turn it on."
      sectionId="promo"
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
  if (!saved) {
    return (
      <div className="min-w-0 space-y-4">
        {header}
        <AdminLoading />
      </div>
    );
  }

  const previewSrc = adminCoverSrc(draft.imageSrc);
  const previewCta = draft.ctaLabel.trim() && safeCtaHref(draft.ctaHref)
    ? { href: safeCtaHref(draft.ctaHref), label: draft.ctaLabel.trim() }
    : null;

  return (
    <div className="min-w-0 space-y-4">
      {header}
      {saved.imageNeedsUpload ? (
        <AdminNotice tone="warning">
          The saved image can no longer be shown on the site. Upload the image again and save.
        </AdminNotice>
      ) : null}
      <form
        onSubmit={onSubmit}
        className="grid min-w-0 gap-4 rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90 sm:p-5"
        aria-busy={busy}
      >
        <ActiveStatusField checked={draft.isActive} onChange={(isActive) => change({ isActive })} />

        <ImageField
          label="Banner image"
          variant="thumb"
          value={previewSrc}
          onChange={(imageSrc) => change({ imageSrc })}
          onBusy={setPicking}
        />
        <p className="-mt-2 text-xs text-neutral-500">
          Wide image, about 2400 × 600 px (JPG, PNG or WEBP, up to 5 MB). Keep the subject away from the left side, where the text sits.
        </p>

        <div>
          <FieldLabel htmlFor={`${id}-alt`}>Image description (alt text)</FieldLabel>
          <input
            id={`${id}-alt`}
            className={adminFieldClass}
            value={draft.imageAlt}
            maxLength={PROMO_LIMITS.imageAlt}
            onChange={(e) => change({ imageAlt: e.target.value })}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor={`${id}-eyebrow`}>Small label (optional)</FieldLabel>
            <input
              id={`${id}-eyebrow`}
              className={adminFieldClass}
              value={draft.eyebrow}
              maxLength={PROMO_LIMITS.eyebrow}
              onChange={(e) => change({ eyebrow: e.target.value })}
            />
          </div>
          <div>
            <FieldLabel htmlFor={`${id}-heading`}>Heading (optional)</FieldLabel>
            <input
              id={`${id}-heading`}
              className={adminFieldClass}
              value={draft.heading}
              maxLength={PROMO_LIMITS.heading}
              onChange={(e) => change({ heading: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <FieldLabel htmlFor={`${id}-body`}>Short text (optional, hidden on very small screens)</FieldLabel>
            <textarea
              id={`${id}-body`}
              rows={2}
              className={`${adminFieldClass} h-auto py-2.5`}
              value={draft.body}
              maxLength={PROMO_LIMITS.body}
              onChange={(e) => change({ body: e.target.value })}
            />
          </div>
          <div>
            <FieldLabel htmlFor={`${id}-cta`}>Button text (optional)</FieldLabel>
            <input
              id={`${id}-cta`}
              className={adminFieldClass}
              value={draft.ctaLabel}
              maxLength={PROMO_LIMITS.ctaLabel}
              onChange={(e) => change({ ctaLabel: e.target.value })}
            />
          </div>
          <div>
            <FieldLabel htmlFor={`${id}-href`}>Button link</FieldLabel>
            <input
              id={`${id}-href`}
              className={adminFieldClass}
              value={draft.ctaHref}
              maxLength={PROMO_LIMITS.ctaHref}
              placeholder="/products"
              onChange={(e) => change({ ctaHref: e.target.value })}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <FieldLabel htmlFor={`${id}-fx`}>Focus left–right ({draft.focalX}%)</FieldLabel>
            <input
              id={`${id}-fx`}
              type="range"
              min={0}
              max={100}
              value={draft.focalX}
              onChange={(e) => change({ focalX: Number(e.target.value) })}
              className="w-full"
            />
          </div>
          <div>
            <FieldLabel htmlFor={`${id}-fy`}>Focus top–bottom ({draft.focalY}%)</FieldLabel>
            <input
              id={`${id}-fy`}
              type="range"
              min={0}
              max={100}
              value={draft.focalY}
              onChange={(e) => change({ focalY: Number(e.target.value) })}
              className="w-full"
            />
          </div>
          <div>
            <FieldLabel htmlFor={`${id}-tone`}>Text style</FieldLabel>
            <select
              id={`${id}-tone`}
              className={adminFieldClass}
              value={draft.tone}
              onChange={(e) => change({ tone: e.target.value === "light" ? "light" : "dark" })}
            >
              <option value="dark">Light text on a dark overlay</option>
              <option value="light">Dark text on a light overlay</option>
            </select>
          </div>
        </div>

        {previewSrc ? (
          <div>
            <p className="mb-1.5 text-sm font-medium text-neutral-700">Preview</p>
            <PromoBannerView
              promo={draft}
              image={previewSrc}
              alt={draft.imageAlt || "Banner preview"}
              cta={previewCta}
              position={focalPosition(draft.focalX, draft.focalY)}
            />
          </div>
        ) : null}

        {error ? (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p role="status" className="text-sm font-medium text-emerald-800">
            {notice}
          </p>
        ) : null}
        <div className="flex justify-end">
          <button type="submit" className={adminButtonClass.primary} disabled={!dirty || busy || picking}>
            {busy ? "Saving…" : "Save banner"}
          </button>
        </div>
      </form>
    </div>
  );
}
