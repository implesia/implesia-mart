"use client";

import { useEffect, useId, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import {
  getAdminSiteContact,
  saveSiteContact,
  type SiteContactAdmin,
} from "@/lib/mart-api/site-contact";
import { MartApiError } from "@/lib/mart-api/products";
import { siteContactDraftError } from "@/lib/site-contact";

import {
  AdminLoading,
  AdminNotice,
  AdminPageHeader,
  FieldLabel,
  adminButtonClass,
  adminFieldClass,
} from "../../../_components/admin-ui";

type Draft = { phone: string; whatsapp: string; email: string };

const toDraft = (value: SiteContactAdmin): Draft => ({
  phone: value.phone,
  whatsapp: value.whatsapp,
  email: value.email,
});
const same = (a: Draft, b: Draft) => a.phone === b.phone && a.whatsapp === b.whatsapp && a.email === b.email;

export function ContactSettingsEditor() {
  const id = useId();
  const [saved, setSaved] = useState<SiteContactAdmin | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getAdminSiteContact()
      .then((next) => {
        if (cancelled) return;
        setSaved(next);
        setDraft(toDraft(next));
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setLoadError(e instanceof MartApiError ? e.message : "Could not load the contact settings.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const header = (
    <AdminPageHeader
      title="Contact settings"
      description="The phone number, WhatsApp number and email used everywhere on the storefront: header, footer, floating WhatsApp button, product WhatsApp button, Contact page and the About, FAQ, Shipping and Privacy call-outs."
      action={
        <a
          href="/contact-us"
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

  const dirty = !same(toDraft(saved), draft);
  const problem = siteContactDraftError(draft);

  function change(patch: Partial<Draft>) {
    setDraft((current) => (current ? { ...current, ...patch } : current));
    setError("");
    setNotice("");
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (busy || !dirty || !draft) return;
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const next = await saveSiteContact(draft);
      setSaved(next);
      setDraft(toDraft(next));
      setNotice("Saved. The new contact details are live on the storefront.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the contact settings.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-w-0 space-y-4">
      {header}
      {saved.isDefault ? (
        <AdminNotice tone="success">
          Showing the official defaults. Change a value and save to manage the contact details here.
        </AdminNotice>
      ) : null}
      <form onSubmit={onSubmit} className="grid min-w-0 gap-4" aria-busy={busy} noValidate>
        <div className="grid gap-4 rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90 sm:grid-cols-2 sm:p-5">
          <div>
            <FieldLabel htmlFor={`${id}-phone`}>Phone number</FieldLabel>
            <input
              id={`${id}-phone`}
              name="phone"
              className={adminFieldClass}
              inputMode="tel"
              autoComplete="off"
              value={draft.phone}
              onChange={(e) => change({ phone: e.target.value })}
              placeholder="01580569129"
              maxLength={20}
            />
            <p className="mt-1.5 text-xs text-neutral-500">Used for the call links (tel:) and the header.</p>
          </div>
          <div>
            <FieldLabel htmlFor={`${id}-whatsapp`}>WhatsApp number</FieldLabel>
            <input
              id={`${id}-whatsapp`}
              name="whatsapp"
              className={adminFieldClass}
              inputMode="tel"
              autoComplete="off"
              value={draft.whatsapp}
              onChange={(e) => change({ whatsapp: e.target.value })}
              placeholder="01580569129"
              maxLength={20}
            />
            <p className="mt-1.5 text-xs text-neutral-500">
              Used for every WhatsApp button. Bangladesh mobile such as 01580569129 (+880 and spaces are fine).
            </p>
          </div>
          <div className="sm:col-span-2">
            <FieldLabel htmlFor={`${id}-email`}>Email</FieldLabel>
            <input
              id={`${id}-email`}
              name="email"
              type="email"
              className={adminFieldClass}
              autoComplete="off"
              value={draft.email}
              onChange={(e) => change({ email: e.target.value })}
              placeholder="implesiamart@gmail.com"
              maxLength={254}
            />
            <p className="mt-1.5 text-xs text-neutral-500">Used for the email links (mailto:).</p>
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
            ) : dirty && problem ? (
              <p className="text-amber-800">{problem}</p>
            ) : dirty ? (
              <p className="text-neutral-600">You have unsaved changes.</p>
            ) : null}
          </div>
          <button type="submit" className={adminButtonClass.primary} disabled={!dirty || busy}>
            {busy ? "Saving…" : "Save contact settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
