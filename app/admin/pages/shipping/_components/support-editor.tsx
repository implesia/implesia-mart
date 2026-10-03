"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useId, useState } from "react";

import {
  getShippingSupport,
  saveShippingSupport,
  type ShippingSupport,
} from "@/lib/mart-api/shipping-support";

import { ActiveStatusField } from "../../../_components/admin-ui";
import { FormCloseGuard } from "../../../_components/form-close-guard";
import {
  FormError,
  Labeled,
  setShippingQuery,
  ShippingHeader,
  ShippingIconPicker,
  ShippingModal,
  ShippingPanel,
  useReturnFocus,
  useShippingNav,
} from "./shipping-shared";

type Draft = {
  isActive: boolean;
  icon: string;
  navLabel: string;
  title: string;
  subtitle: string;
  email: string;
  phone: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
};

function draftFrom(support: ShippingSupport): Draft {
  return {
    isActive: support.isActive !== false,
    icon: support.icon || "support_agent",
    navLabel: support.navLabel,
    title: support.title,
    subtitle: support.subtitle,
    email: support.email,
    phone: support.phone,
    primaryLabel: support.primaryLabel,
    primaryHref: support.primaryHref,
    secondaryLabel: support.secondaryLabel,
    secondaryHref: support.secondaryHref,
  };
}

export function ShippingSupportEditor() {
  const [support, setSupport] = useState<ShippingSupport | null>(null);
  const [loadError, setLoadError] = useState("");
  const params = useSearchParams();
  const { pathname, router } = useShippingNav();
  const editing = params.get("edit") === "support";
  const [notice, setNotice] = useState("");
  const { focusEdit, markReturn } = useReturnFocus(editing);

  useEffect(() => {
    let active = true;
    getShippingSupport()
      .then((next) => {
        if (active) setSupport(next);
      })
      .catch((error: unknown) => {
        if (active) {
          setLoadError(
            error instanceof Error ? error.message : "Could not load the support section.",
          );
        }
      });
    return () => {
      active = false;
    };
  }, []);

  function setEditing(open: boolean) {
    if (!open) markReturn();
    setShippingQuery(router, pathname, open, "support");
  }

  async function save(draft: Draft) {
    const saved = await saveShippingSupport({
      isActive: draft.isActive,
      icon: draft.icon,
      navLabel: draft.navLabel.trim(),
      title: draft.title.trim(),
      subtitle: draft.subtitle.trim(),
      email: draft.email.trim(),
      phone: draft.phone.trim(),
      primaryLabel: draft.primaryLabel.trim(),
      primaryHref: draft.primaryHref.trim(),
      secondaryLabel: draft.secondaryLabel.trim(),
      secondaryHref: draft.secondaryHref.trim(),
    });
    setSupport(saved);
    setNotice("Saved.");
    window.setTimeout(() => setNotice(""), 1600);
    setEditing(false);
  }

  if (!support) {
    return (
      <div className="min-w-0 space-y-4">
        <ShippingHeader
          sectionId="support"
          title="Support"
          description="Closing contact banner."
          editLabel="Edit support"
          onEdit={() => setEditing(true)}
          editRef={focusEdit}
        />
        <p className="text-sm text-neutral-600">{loadError || "Loading the support section…"}</p>
      </div>
    );
  }

  const empty =
    !support.title.trim() &&
    !support.subtitle.trim() &&
    !support.email.trim() &&
    !support.phone.trim() &&
    !support.primaryLabel.trim() &&
    !support.secondaryLabel.trim();

  return (
    <div className="min-w-0 space-y-4">
      <ShippingHeader
        sectionId="support"
        title="Support"
        description="Closing contact banner."
        editLabel="Edit support"
        onEdit={() => setEditing(true)}
        editRef={focusEdit}
      />
      {notice ? (
        <p role="status" className="text-sm font-medium text-emerald-800">
          {notice} This section is up to date.
        </p>
      ) : null}
      <ShippingPanel
        headingId="shipping-support-card"
        title="Support"
        description={
          support.isActive === false
            ? "Hidden on the shipping page."
            : "Shown after the refund steps."
        }
        active={support.isActive !== false}
      >
        {empty ? (
          <div className="rounded-2xl bg-white px-4 py-12 text-center ring-1 ring-neutral-200/90">
            <p className="text-sm font-semibold text-neutral-950">No support copy yet</p>
            <p className="mt-1 text-sm text-neutral-600">Add a title, contact details, and buttons.</p>
          </div>
        ) : (
          <div className="rounded-2xl bg-[linear-gradient(100deg,#071820_0%,#070c14_46%,#05060a_100%)] px-4 py-8 sm:px-8">
            <p className="text-lg font-semibold text-white">{support.title.trim() || "Title"}</p>
            <p className="mt-2 text-sm text-white/70">{support.subtitle}</p>
            <p className="mt-3 text-sm text-white/60">
              {[support.email, support.phone].filter(Boolean).join(" · ")}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {support.primaryLabel.trim() ? (
                <span className="inline-flex h-10 items-center rounded-full bg-primary px-5 text-sm font-semibold text-on-primary">
                  {support.primaryLabel}
                </span>
              ) : null}
              {support.secondaryLabel.trim() ? (
                <span className="inline-flex h-10 items-center rounded-full border border-white/20 px-5 text-sm font-semibold text-white">
                  {support.secondaryLabel}
                </span>
              ) : null}
            </div>
          </div>
        )}
      </ShippingPanel>
      {editing ? (
        <SupportForm support={support} onClose={() => setEditing(false)} onSave={save} />
      ) : null}
    </div>
  );
}

function SupportForm({
  support,
  onClose,
  onSave,
}: {
  support: ShippingSupport;
  onClose: () => void;
  onSave: (draft: Draft) => Promise<void>;
}) {
  const initial = draftFrom(support);
  const [draft, setDraft] = useState(initial);
  const [baseline] = useState(initial);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const formId = useId();

  async function save() {
    if (saving) return;
    if (!draft.title.trim()) {
      setError("Title is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave(draft);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save the support section.");
      setSaving(false);
    }
  }

  return (
    <FormCloseGuard baseline={baseline} value={draft} onClose={onClose}>
      <ShippingModal
        titleId="shipping-support-modal"
        title="Edit support"
        description="Leave a button label empty to hide that button."
        saving={saving}
        onClose={onClose}
        onSave={save}
      >
        <ActiveStatusField
          checked={draft.isActive}
          onChange={(isActive) => setDraft({ ...draft, isActive })}
        />
        <Labeled
          id={`${formId}-nav`}
          label="Sidebar label"
          value={draft.navLabel}
          onChange={(navLabel) => setDraft({ ...draft, navLabel })}
        />
        <ShippingIconPicker value={draft.icon} onChange={(icon) => setDraft({ ...draft, icon })} />
        <Labeled
          id={`${formId}-title`}
          label="Title"
          required
          value={draft.title}
          invalid={Boolean(error)}
          onChange={(title) => {
            setDraft({ ...draft, title });
            setError("");
          }}
        />
        <Labeled
          id={`${formId}-subtitle`}
          label="Subtitle"
          value={draft.subtitle}
          multiline
          onChange={(subtitle) => setDraft({ ...draft, subtitle })}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Labeled
            id={`${formId}-email`}
            label="Email"
            value={draft.email}
            onChange={(email) => setDraft({ ...draft, email })}
          />
          <Labeled
            id={`${formId}-phone`}
            label="Phone"
            value={draft.phone}
            onChange={(phone) => setDraft({ ...draft, phone })}
          />
          <Labeled
            id={`${formId}-primary`}
            label="Primary button label"
            value={draft.primaryLabel}
            onChange={(primaryLabel) => setDraft({ ...draft, primaryLabel })}
          />
          <Labeled
            id={`${formId}-primary-href`}
            label="Primary button link"
            value={draft.primaryHref}
            onChange={(primaryHref) => setDraft({ ...draft, primaryHref })}
          />
          <Labeled
            id={`${formId}-secondary`}
            label="WhatsApp label"
            value={draft.secondaryLabel}
            onChange={(secondaryLabel) => setDraft({ ...draft, secondaryLabel })}
          />
          <Labeled
            id={`${formId}-secondary-href`}
            label="WhatsApp link"
            value={draft.secondaryHref}
            onChange={(secondaryHref) => setDraft({ ...draft, secondaryHref })}
          />
        </div>
        <FormError message={error} />
      </ShippingModal>
    </FormCloseGuard>
  );
}
