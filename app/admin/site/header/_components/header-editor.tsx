"use client";

import { useEffect, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import {
  HEADER_LIMITS,
  headerDraftError,
  type HeaderAdmin,
  type HeaderItem,
} from "@/lib/header-view";
import { getAdminHeader, resetHeader, saveHeader } from "@/lib/mart-api/header";
import { MartApiError } from "@/lib/mart-api/products";

import {
  AdminLoading,
  AdminNotice,
  AdminPageHeader,
  adminButtonClass,
} from "../../../_components/admin-ui";
import { Card, LinkList } from "../../footer/_components/footer-editor";

const SAME = (a: HeaderAdmin, b: HeaderAdmin) => JSON.stringify(a) === JSON.stringify(b);

export function HeaderEditor() {
  const [saved, setSaved] = useState<HeaderAdmin | null>(null);
  const [draft, setDraft] = useState<HeaderAdmin | null>(null);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getAdminHeader()
      .then((next) => {
        if (cancelled) return;
        setSaved(next);
        setDraft(next);
      })
      .catch((e: unknown) => {
        if (!cancelled) setLoadError(e instanceof MartApiError ? e.message : "Could not load the menu.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const header = (
    <AdminPageHeader
      title="Header menu"
      description="The navigation links shown at the top of every storefront page (and in the mobile menu). The phone number, search, cart and category panel are managed elsewhere."
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
  const problem = headerDraftError(draft.items);

  function change(items: HeaderItem[]) {
    setDraft((current) => (current ? { ...current, items } : current));
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
      const next = await saveHeader(draft.items);
      setSaved(next);
      setDraft(next);
      setNotice("Saved. The menu is live on the storefront.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the menu.");
    } finally {
      setBusy(false);
    }
  }

  async function onReset() {
    if (busy) return;
    if (!window.confirm("Restore the built-in menu? Your saved menu will be removed.")) return;
    setBusy(true);
    setError("");
    try {
      const next = await resetHeader();
      setSaved(next);
      setDraft(next);
      setNotice("Restored the built-in menu.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not restore the default menu.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-w-0 space-y-4">
      {header}
      {saved.isDefault ? (
        <AdminNotice tone="success">
          Showing the built-in menu. Make a change and save to start managing it here. The footer is managed
          under Site → Footer.
        </AdminNotice>
      ) : null}
      <form onSubmit={onSubmit} className="grid min-w-0 gap-4" aria-busy={busy}>
        <Card
          title="Menu links"
          hint={`Up to ${HEADER_LIMITS.items} links, shown in this order. Use a page path such as /products, or a full https:// address. Hidden links stay saved but are not shown.`}
        >
          <LinkList name="Menu" links={draft.items} max={HEADER_LIMITS.items} onChange={change} />
        </Card>

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
              Restore built-in menu
            </button>
            <button type="submit" className={adminButtonClass.primary} disabled={!dirty || busy}>
              {busy ? "Saving…" : "Save menu"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

