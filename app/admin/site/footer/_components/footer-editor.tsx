"use client";

import { useEffect, useId, useState } from "react";

import Footer from "@/app/(client)/_components/common/footer";
import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import { adminCoverSrc } from "@/lib/blog-view";
import {
  FOOTER_LIMITS,
  blankLink,
  blankSection,
  blankTrustPoint,
  footerDraftError,
  moveItem,
  previewFooter,
  type FooterAdmin,
  type FooterLink,
  type FooterSection,
  type FooterTrustPoint,
} from "@/lib/footer-view";
import { getAdminFooter, resetFooter, saveFooter } from "@/lib/mart-api/footer";
import { MartApiError } from "@/lib/mart-api/products";
import {
  FALLBACK_CONTACT_DETAILS,
  listPublicContactDetails,
  type ContactDetails,
} from "@/lib/mart-api/contact-details";
import { cn } from "@/lib/utils";

import {
  AdminLoading,
  AdminNotice,
  AdminPageHeader,
  adminButtonClass,
  adminFieldClass,
  FieldLabel,
} from "../../../_components/admin-ui";
import { ImageField } from "../../../_components/image-field";

const SAME = (a: FooterAdmin, b: FooterAdmin) => JSON.stringify(a) === JSON.stringify(b);
const iconButton =
  "inline-flex size-9 items-center justify-center rounded-full text-neutral-600 ring-1 ring-neutral-200 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-40";

function RowTools({
  label,
  index,
  count,
  enabled,
  onEnabled,
  onMove,
  onRemove,
}: {
  label: string;
  index: number;
  count: number;
  enabled: boolean;
  onEnabled: (next: boolean) => void;
  onMove: (to: number) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <label className="mr-1 inline-flex min-h-9 items-center gap-1.5 text-sm text-neutral-700">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onEnabled(e.target.checked)}
          className="size-4"
        />
        Show
        <span className="sr-only"> {label}</span>
      </label>
      <button
        type="button"
        className={iconButton}
        disabled={index === 0}
        onClick={() => onMove(index - 1)}
        aria-label={`Move ${label} up`}
      >
        <MaterialIcon name="arrow_upward" className="text-[18px]" />
      </button>
      <button
        type="button"
        className={iconButton}
        disabled={index === count - 1}
        onClick={() => onMove(index + 1)}
        aria-label={`Move ${label} down`}
      >
        <MaterialIcon name="arrow_downward" className="text-[18px]" />
      </button>
      <button type="button" className={iconButton} onClick={onRemove} aria-label={`Remove ${label}`}>
        <MaterialIcon name="delete" className="text-[18px]" />
      </button>
    </div>
  );
}

function LinkList({
  name,
  links,
  max,
  onChange,
}: {
  name: string;
  links: FooterLink[];
  max: number;
  onChange: (links: FooterLink[]) => void;
}) {
  const id = useId();
  const patch = (index: number, change: Partial<FooterLink>) =>
    onChange(links.map((item, i) => (i === index ? { ...item, ...change } : item)));
  return (
    <div className="space-y-3">
      {links.length === 0 ? <p className="text-sm text-neutral-500">No links yet.</p> : null}
      {links.map((item, index) => {
        const label = `${name} link ${index + 1}`;
        return (
          <div key={index} className="grid gap-2 rounded-xl bg-neutral-50 p-3 ring-1 ring-neutral-200/70">
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <FieldLabel htmlFor={`${id}-l-${index}`}>Label</FieldLabel>
                <input
                  id={`${id}-l-${index}`}
                  className={adminFieldClass}
                  value={item.label}
                  maxLength={FOOTER_LIMITS.linkLabel}
                  onChange={(e) => patch(index, { label: e.target.value })}
                />
              </div>
              <div>
                <FieldLabel htmlFor={`${id}-h-${index}`}>Link</FieldLabel>
                <input
                  id={`${id}-h-${index}`}
                  className={adminFieldClass}
                  value={item.href}
                  maxLength={FOOTER_LIMITS.linkHref}
                  placeholder="/page, https://…, mailto:…, tel:…"
                  onChange={(e) => patch(index, { href: e.target.value })}
                />
              </div>
            </div>
            <RowTools
              label={label}
              index={index}
              count={links.length}
              enabled={item.enabled}
              onEnabled={(enabled) => patch(index, { enabled })}
              onMove={(to) => onChange(moveItem(links, index, to))}
              onRemove={() => onChange(links.filter((_, i) => i !== index))}
            />
          </div>
        );
      })}
      <button
        type="button"
        className={adminButtonClass.secondary}
        disabled={links.length >= max}
        onClick={() => onChange([...links, blankLink()])}
      >
        <MaterialIcon name="add" className="text-[18px]" />
        Add link
      </button>
    </div>
  );
}

function Card({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="grid min-w-0 gap-4 rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90 sm:p-5">
      <div>
        <h2 className="text-base font-semibold text-neutral-950">{title}</h2>
        {hint ? <p className="mt-0.5 text-sm text-neutral-500">{hint}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Toggle({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex min-h-11 items-center gap-2.5 text-sm text-neutral-800">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-4" />
      {children}
    </label>
  );
}

export function FooterEditor() {
  const [saved, setSaved] = useState<FooterAdmin | null>(null);
  const [draft, setDraft] = useState<FooterAdmin | null>(null);
  const [contact, setContact] = useState<ContactDetails>(FALLBACK_CONTACT_DETAILS);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [picking, setPicking] = useState(false);
  const id = useId();

  useEffect(() => {
    let cancelled = false;
    getAdminFooter()
      .then((next) => {
        if (cancelled) return;
        setSaved(next);
        setDraft(next);
      })
      .catch((e: unknown) => {
        if (!cancelled) setLoadError(e instanceof MartApiError ? e.message : "Could not load the footer.");
      });
    listPublicContactDetails()
      .then((next) => {
        if (!cancelled && next) setContact(next);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const header = (
    <AdminPageHeader
      title="Footer"
      description="Brand text, link columns, trust points and legal links shown at the bottom of every storefront page. Phone, email, WhatsApp and social links come from the Contact page."
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

  const dirty = !SAME(saved, draft);

  function change(patch: Partial<FooterAdmin>) {
    setDraft((current) => (current ? { ...current, ...patch } : current));
    setError("");
    setNotice("");
  }
  function changeSection(index: number, patch: Partial<FooterSection>) {
    if (!draft) return;
    change({ sections: draft.sections.map((s, i) => (i === index ? { ...s, ...patch } : s)) });
  }
  function changeTrust(index: number, patch: Partial<FooterTrustPoint>) {
    if (!draft) return;
    change({ trustPoints: draft.trustPoints.map((p, i) => (i === index ? { ...p, ...patch } : p)) });
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (busy || !dirty || !draft) return;
    const problem = footerDraftError(draft);
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const next = await saveFooter(draft);
      if (draft.logoSrc.startsWith("blob:")) URL.revokeObjectURL(draft.logoSrc);
      setSaved(next);
      setDraft(next);
      setNotice("Saved. The footer is live on the storefront.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the footer.");
    } finally {
      setBusy(false);
    }
  }

  async function onReset() {
    if (busy) return;
    if (!window.confirm("Restore the built-in footer? Your saved footer will be removed.")) return;
    setBusy(true);
    setError("");
    try {
      const next = await resetFooter();
      setSaved(next);
      setDraft(next);
      setNotice("Restored the built-in footer.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not restore the default footer.");
    } finally {
      setBusy(false);
    }
  }

  const previewConfig = previewFooter({ ...draft, logoSrc: adminCoverSrc(draft.logoSrc) });
  const problem = footerDraftError(draft);

  return (
    <div className="min-w-0 space-y-4">
      {header}
      {saved.isDefault ? (
        <AdminNotice tone="success">
          Showing the built-in footer. Make a change and save to start managing it here.
        </AdminNotice>
      ) : null}
      {saved.logoNeedsUpload ? (
        <AdminNotice tone="warning">
          The saved logo can no longer be shown on the site. Upload it again and save.
        </AdminNotice>
      ) : null}
      <form onSubmit={onSubmit} className="grid min-w-0 gap-4" aria-busy={busy}>
        <Card title="Brand" hint="Shown at the top left of the footer.">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel htmlFor={`${id}-brand`}>Brand name</FieldLabel>
              <input
                id={`${id}-brand`}
                className={adminFieldClass}
                value={draft.brandName}
                maxLength={FOOTER_LIMITS.brandName}
                onChange={(e) => change({ brandName: e.target.value })}
              />
            </div>
            <div>
              <FieldLabel htmlFor={`${id}-copy`}>Copyright text</FieldLabel>
              <input
                id={`${id}-copy`}
                className={adminFieldClass}
                value={draft.copyrightText}
                maxLength={FOOTER_LIMITS.copyrightText}
                onChange={(e) => change({ copyrightText: e.target.value })}
                aria-describedby={`${id}-copy-hint`}
              />
              <p id={`${id}-copy-hint`} className="mt-1 text-xs text-neutral-500">
                Use {"{year}"} for the current year.
              </p>
            </div>
            <div className="sm:col-span-2">
              <FieldLabel htmlFor={`${id}-desc`}>Description</FieldLabel>
              <textarea
                id={`${id}-desc`}
                rows={3}
                className={`${adminFieldClass} h-auto py-2.5`}
                value={draft.description}
                maxLength={FOOTER_LIMITS.description}
                onChange={(e) => change({ description: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <FieldLabel htmlFor={`${id}-address`}>Address or service area (optional)</FieldLabel>
              <textarea
                id={`${id}-address`}
                rows={2}
                className={`${adminFieldClass} h-auto py-2.5`}
                value={draft.address}
                maxLength={FOOTER_LIMITS.address}
                onChange={(e) => change({ address: e.target.value })}
              />
            </div>
          </div>
          <ImageField
            label="Logo (optional, replaces the built-in logo)"
            variant="thumb"
            value={adminCoverSrc(draft.logoSrc)}
            onChange={(logoSrc) => change({ logoSrc })}
            onBusy={setPicking}
          />
          {draft.logoSrc ? (
            <div>
              <FieldLabel htmlFor={`${id}-logo-alt`}>Logo description (alt text)</FieldLabel>
              <input
                id={`${id}-logo-alt`}
                className={adminFieldClass}
                value={draft.logoAlt}
                maxLength={FOOTER_LIMITS.logoAlt}
                onChange={(e) => change({ logoAlt: e.target.value })}
              />
            </div>
          ) : null}
        </Card>

        <Card
          title="Contact and social"
          hint="The numbers and links themselves are edited on the Contact page, so they are never out of sync."
        >
          <div className="grid gap-1 sm:grid-cols-3">
            <Toggle checked={draft.showContact} onChange={(showContact) => change({ showContact })}>
              Show phone and email
            </Toggle>
            <Toggle checked={draft.showSocial} onChange={(showSocial) => change({ showSocial })}>
              Show WhatsApp and social icons
            </Toggle>
            <Toggle
              checked={draft.showWhatsappCta}
              onChange={(showWhatsappCta) => change({ showWhatsappCta })}
            >
              Show the WhatsApp chat button
            </Toggle>
          </div>
        </Card>

        <Card
          title="Link columns"
          hint="Reorder with the arrows. Hidden columns and links stay saved but are not shown."
        >
          {draft.sections.length === 0 ? <p className="text-sm text-neutral-500">No columns.</p> : null}
          {draft.sections.map((section, index) => {
            const label = `column ${index + 1}`;
            return (
              <fieldset
                key={index}
                className={cn(
                  "grid min-w-0 gap-3 rounded-2xl border border-neutral-200/90 p-3 sm:p-4",
                  !section.enabled && "bg-neutral-50",
                )}
              >
                <legend className="px-1 text-sm font-semibold text-neutral-950">
                  Column {index + 1}
                  {section.enabled ? "" : " (hidden)"}
                </legend>
                <div>
                  <FieldLabel htmlFor={`${id}-s-${index}`}>Column title</FieldLabel>
                  <input
                    id={`${id}-s-${index}`}
                    className={adminFieldClass}
                    value={section.title}
                    maxLength={FOOTER_LIMITS.sectionTitle}
                    onChange={(e) => changeSection(index, { title: e.target.value })}
                  />
                </div>
                <LinkList
                  name={`Column ${index + 1}`}
                  links={section.links}
                  max={FOOTER_LIMITS.linksPerSection}
                  onChange={(links) => changeSection(index, { links })}
                />
                <RowTools
                  label={label}
                  index={index}
                  count={draft.sections.length}
                  enabled={section.enabled}
                  onEnabled={(enabled) => changeSection(index, { enabled })}
                  onMove={(to) => change({ sections: moveItem(draft.sections, index, to) })}
                  onRemove={() => change({ sections: draft.sections.filter((_, i) => i !== index) })}
                />
              </fieldset>
            );
          })}
          <div>
            <button
              type="button"
              className={adminButtonClass.secondary}
              disabled={draft.sections.length >= FOOTER_LIMITS.sections}
              onClick={() => change({ sections: [...draft.sections, blankSection()] })}
            >
              <MaterialIcon name="add" className="text-[18px]" />
              Add column
            </button>
          </div>
        </Card>

        <Card title="Trust points" hint="Short promises shown above the bottom bar. Only list what the shop really offers.">
          {draft.trustPoints.map((point, index) => (
            <div key={index} className="grid gap-2 rounded-xl bg-neutral-50 p-3 ring-1 ring-neutral-200/70">
              <div className="grid gap-2 sm:grid-cols-[12rem_1fr]">
                <div>
                  <FieldLabel htmlFor={`${id}-ti-${index}`}>Icon name</FieldLabel>
                  <input
                    id={`${id}-ti-${index}`}
                    className={adminFieldClass}
                    value={point.icon}
                    maxLength={FOOTER_LIMITS.trustIcon}
                    onChange={(e) => changeTrust(index, { icon: e.target.value })}
                  />
                </div>
                <div>
                  <FieldLabel htmlFor={`${id}-tl-${index}`}>Text</FieldLabel>
                  <input
                    id={`${id}-tl-${index}`}
                    className={adminFieldClass}
                    value={point.label}
                    maxLength={FOOTER_LIMITS.trustLabel}
                    onChange={(e) => changeTrust(index, { label: e.target.value })}
                  />
                </div>
              </div>
              <RowTools
                label={`trust point ${index + 1}`}
                index={index}
                count={draft.trustPoints.length}
                enabled={point.enabled}
                onEnabled={(enabled) => changeTrust(index, { enabled })}
                onMove={(to) => change({ trustPoints: moveItem(draft.trustPoints, index, to) })}
                onRemove={() => change({ trustPoints: draft.trustPoints.filter((_, i) => i !== index) })}
              />
            </div>
          ))}
          <div>
            <button
              type="button"
              className={adminButtonClass.secondary}
              disabled={draft.trustPoints.length >= FOOTER_LIMITS.trustPoints}
              onClick={() => change({ trustPoints: [...draft.trustPoints, blankTrustPoint()] })}
            >
              <MaterialIcon name="add" className="text-[18px]" />
              Add trust point
            </button>
          </div>
        </Card>

        <Card title="Legal and policy links" hint="Shown beside the copyright line.">
          <LinkList
            name="Legal"
            links={draft.legalLinks}
            max={FOOTER_LIMITS.legalLinks}
            onChange={(legalLinks) => change({ legalLinks })}
          />
        </Card>

        <section aria-labelledby={`${id}-preview`} className="min-w-0">
          <h2 id={`${id}-preview`} className="mb-1.5 text-base font-semibold text-neutral-950">
            Preview
          </h2>
          <p className="mb-2 text-sm text-neutral-500">What visitors will see once you save (unsaved changes included).</p>
          <div inert className="overflow-hidden rounded-2xl ring-1 ring-neutral-200/90">
            <Footer details={contact} config={previewConfig} />
          </div>
        </section>

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
            ) : dirty && problem ? (
              <p className="text-amber-800">{problem}</p>
            ) : dirty ? (
              <p className="text-neutral-600">You have unsaved changes.</p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={adminButtonClass.secondary}
              disabled={busy || saved.isDefault}
              onClick={onReset}
            >
              Restore built-in footer
            </button>
            <button type="submit" className={adminButtonClass.primary} disabled={!dirty || busy || picking}>
              {busy ? "Saving…" : "Save footer"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
